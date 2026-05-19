import { NextRequest, NextResponse } from "next/server";
import {
  ActionLevel,
  AudienceMode,
  AudienceRole,
  CitationRecord,
  GroundTruth,
  buildContext,
  getGroundTruth,
  selectCorpusChunks,
} from "@/lib/chat-assistant";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "https://ollama.com";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "deepseek-v4-flash:cloud";
const PROVIDER_TIMEOUT_MS = 55_000;

export const maxDuration = 60;

type ChatProvider = "gemini" | "ollama";

type ChatRequest = {
  message: string;
  locale?: "en" | "vi";
  audienceRole?: AudienceRole;
  audienceMode?: AudienceMode;
  scenarioId?: string;
  region?: string;
  history?: ChatHistoryMessage[];
};

type ChatHistoryMessage = {
  role: "user" | "assistant";
  text: string;
};

type GeminiResponseJson = {
  answer: string;
  usedCitationIds?: string[];
  suggestedQuestions?: string[];
  nextSteps?: string[];
};

type ChatResponse = {
  answer: string;
  citations: CitationRecord[];
  groundTruth: GroundTruth;
  suggestedQuestions: string[];
  nextSteps: string[];
  roleLabel: string;
  actionLevel: ActionLevel;
  limitations: string;
};

type RoleProfile = {
  label: Record<"en" | "vi", string>;
  actionLevel: ActionLevel;
  limitations: Record<"en" | "vi", string>;
  promptInstruction: Record<"en" | "vi", string>;
  fallbackQuestions: Record<"en" | "vi", string[]>;
  fallbackNextSteps: Record<"en" | "vi", string[]>;
};

const ROLE_PROFILES: Record<AudienceRole, RoleProfile> = {
  scientist: {
    label: { en: "Scientist", vi: "Nhà khoa học" },
    actionLevel: "explain",
    limitations: {
      en: "Use as model evidence and sampling-priority context; not a substitute for new measurements or official decisions.",
      vi: "Dùng như bằng chứng mô hình và bối cảnh ưu tiên lấy mẫu; không thay thế đo đạc mới hoặc quyết định chính thức.",
    },
    promptInstruction: {
      en: "Answer with methods, uncertainty, model limits, citation IDs, and one research or validation question when useful.",
      vi: "Trả lời theo hướng phương pháp, bất định, giới hạn mô hình, mã trích dẫn và một câu hỏi nghiên cứu/kiểm định tiếp theo khi hữu ích.",
    },
    fallbackQuestions: {
      en: [
        "How does uncertainty affect sampling priority?",
        "Which model limits matter most for interpreting RCP8.5?",
        "What validation question should be tested next?",
        "How should p10/p50/p90 be read for this map?",
      ],
      vi: [
        "Độ bất định ảnh hưởng thế nào đến ưu tiên lấy mẫu?",
        "Giới hạn mô hình nào quan trọng nhất khi đọc RCP8.5?",
        "Câu hỏi kiểm định tiếp theo nên là gì?",
        "Nên đọc p10/p50/p90 trên bản đồ này thế nào?",
      ],
    },
    fallbackNextSteps: {
      en: ["Compare scenario bands.", "Identify high-uncertainty regions.", "Plan targeted lab validation."],
      vi: ["So sánh dải kịch bản.", "Xác định vùng bất định cao.", "Lập kế hoạch kiểm định lab có mục tiêu."],
    },
  },
  policymaker: {
    label: { en: "Policy", vi: "Chính sách" },
    actionLevel: "prioritize",
    limitations: {
      en: "Use for surveillance priority and risk communication; final resource and safety decisions remain with competent authorities.",
      vi: "Dùng để ưu tiên giám sát và truyền thông rủi ro; quyết định nguồn lực và an toàn cuối cùng thuộc cơ quan có thẩm quyền.",
    },
    promptInstruction: {
      en: "Answer as a short risk brief: what matters, which areas to prioritize, what to communicate, and what resource tradeoff is implied.",
      vi: "Trả lời như bản tóm tắt rủi ro: điểm chính, khu vực ưu tiên, thông điệp truyền thông và hàm ý phân bổ nguồn lực.",
    },
    fallbackQuestions: {
      en: [
        "If resources are limited, which area should be prioritized first?",
        "How should this risk be communicated without overstating certainty?",
        "What surveillance action fits the dashboard evidence?",
        "What does 0.20 mg/kg mean for policy screening?",
      ],
      vi: [
        "Nếu nguồn lực hạn chế thì ưu tiên vùng nào trước?",
        "Truyền thông rủi ro thế nào để không nói quá chắc chắn?",
        "Hành động giám sát nào phù hợp với bằng chứng dashboard?",
        "0.20 mg/kg có ý nghĩa gì trong sàng lọc chính sách?",
      ],
    },
    fallbackNextSteps: {
      en: ["Rank areas by risk and uncertainty.", "Allocate confirmatory sampling.", "Prepare cautious public messaging."],
      vi: ["Xếp hạng vùng theo rủi ro và bất định.", "Phân bổ lấy mẫu xác nhận.", "Chuẩn bị thông điệp công khai thận trọng."],
    },
  },
  farmer: {
    label: { en: "Farmer", vi: "Nông dân" },
    actionLevel: "verify",
    limitations: {
      en: "Use as a plain-language warning signal; do not self-diagnose field safety or change inputs without local technical advice and lab checks.",
      vi: "Dùng như tín hiệu cảnh báo dễ hiểu; không tự kết luận an toàn ruộng hoặc đổi vật tư khi chưa có tư vấn kỹ thuật địa phương và xét nghiệm lab.",
    },
    promptInstruction: {
      en: "Use simple language. Keep answers short and practical. Recommend asking local technical staff, collecting/confirming samples, and not making food-safety conclusions alone.",
      vi: "Dùng ngôn ngữ đơn giản. Trả lời ngắn và thực tế. Khuyến nghị hỏi cán bộ kỹ thuật địa phương, lấy/xác nhận mẫu và không tự kết luận an toàn thực phẩm.",
    },
    fallbackQuestions: {
      en: [
        "What should I do if my area shows a high-risk signal?",
        "Does this map replace a lab test?",
        "Who should I ask before making a decision?",
        "What does 0.20 mg/kg mean in simple words?",
      ],
      vi: [
        "Tôi nên làm gì nếu vùng của tôi có tín hiệu rủi ro cao?",
        "Bản đồ này có thay xét nghiệm lab không?",
        "Tôi nên hỏi ai trước khi quyết định?",
        "0.20 mg/kg hiểu đơn giản là gì?",
      ],
    },
    fallbackNextSteps: {
      en: ["Contact local technical staff.", "Ask about proper sampling.", "Wait for lab confirmation before concluding safety."],
      vi: ["Liên hệ cán bộ kỹ thuật địa phương.", "Hỏi cách lấy mẫu đúng.", "Chờ xác nhận lab trước khi kết luận an toàn."],
    },
  },
  local: {
    label: { en: "Local/Co-op", vi: "Địa phương/HTX" },
    actionLevel: "coordinate",
    limitations: {
      en: "Use for coordination, records and reporting; it does not prescribe official sampling protocols or field-specific farm operations.",
      vi: "Dùng cho phối hợp, ghi nhận và báo cáo; không thay quy trình lấy mẫu chính thức hoặc chỉ định canh tác cụ thể cho từng ruộng.",
    },
    promptInstruction: {
      en: "Answer as a coordination checklist: where to start, what data to record, who to involve, and how to escalate for laboratory verification.",
      vi: "Trả lời như checklist phối hợp: bắt đầu ở đâu, ghi dữ liệu gì, mời ai tham gia và chuyển bước xác minh lab thế nào.",
    },
    fallbackQuestions: {
      en: [
        "Where should a district or commune sampling plan start?",
        "What records should a cooperative collect with each sample?",
        "How should local teams report high-risk signals?",
        "How do we coordinate lab verification without overclaiming?",
      ],
      vi: [
        "Lập kế hoạch lấy mẫu cấp huyện/xã nên bắt đầu từ đâu?",
        "HTX nên ghi nhận gì kèm mỗi mẫu?",
        "Đội địa phương nên báo cáo tín hiệu rủi ro cao thế nào?",
        "Phối hợp xác minh lab ra sao để không nói quá mức?",
      ],
    },
    fallbackNextSteps: {
      en: ["Define priority locations.", "Record crop-season and field metadata.", "Send samples through the responsible technical channel."],
      vi: ["Xác định điểm ưu tiên.", "Ghi metadata mùa vụ và ruộng.", "Gửi mẫu qua kênh kỹ thuật phụ trách."],
    },
  },
};

const UNSUPPORTED_TOPICS = [
  "fertilizer",
  "fertilizers",
  "fertiliser",
  "fertilisers",
  "fertilizer recommendation",
  "product recommendation",
  "which product",
  "weather forecast",
  "forecast weather",
  "water withdrawal",
  "drain water",
  "drainage schedule",
  "irrigation schedule",
  "transplant",
  "transplanting",
  "thuốc",
  "phân bón",
  "khuyến nghị sản phẩm",
  "sản phẩm nào",
  "dự báo thời tiết",
  "thời tiết",
  "rút nước",
  "lịch tưới",
  "lịch gieo",
  "gieo cấy",
  "lịch cấy",
];

function isAudienceMode(value: unknown): value is AudienceMode {
  return value === "expert" || value === "farmer";
}

function isAudienceRole(value: unknown): value is AudienceRole {
  return value === "scientist" || value === "policymaker" || value === "farmer" || value === "local";
}

function parseAudienceRole(audienceRole: unknown, audienceMode: unknown): AudienceRole {
  if (isAudienceRole(audienceRole)) {
    return audienceRole;
  }

  if (isAudienceMode(audienceMode)) {
    return audienceMode === "farmer" ? "farmer" : "scientist";
  }

  return "scientist";
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry): entry is string => entry.length > 0 && entry.length < 200);
}

function extractCitationIds(value: string): string[] {
  return Array.from(value.matchAll(/\[([A-Z]\d+)\]/g), (match) => match[1].toUpperCase());
}

function normalizeHistory(value: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const candidate = entry as { role?: unknown; text?: unknown };
      const role = candidate.role === "assistant" ? "assistant" : candidate.role === "user" ? "user" : null;
      const text = typeof candidate.text === "string" ? candidate.text.trim() : "";

      if (!role || text.length === 0) {
        return null;
      }

      return {
        role,
        text: text.slice(0, 700),
      };
    })
    .filter((entry): entry is ChatHistoryMessage => entry !== null)
    .slice(-8);
}

function formatHistory(history: ChatHistoryMessage[]) {
  if (history.length === 0) {
    return "No previous turns.";
  }

  return history
    .map((entry) => `${entry.role === "user" ? "User" : "Assistant"}: ${entry.text}`)
    .join("\n");
}

function formatCitationMap(records: CitationRecord[]) {
  const map = new Map<string, CitationRecord>();
  for (const record of records) {
    map.set(record.id.toLowerCase(), record);
  }
  return map;
}

function clampQuestions(locale: "en" | "vi", audienceRole: AudienceRole, questions: string[]) {
  const fallback = ROLE_PROFILES[audienceRole].fallbackQuestions[locale];
  const cleaned = normalizeList(questions);
  const unique = new Set<string>();
  for (const item of [...cleaned, ...fallback]) {
    if (!item) {
      continue;
    }
    unique.add(item);
  }
  return [...unique].slice(0, 4);
}

function parseLocale(value: unknown): "en" | "vi" {
  return value === "vi" ? "vi" : "en";
}

function parseBody(raw: unknown): ChatRequest | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const candidate = raw as ChatRequest;
  if (typeof candidate.message !== "string") {
    return null;
  }
  return candidate;
}

function isUnavailableMessage(message: string): boolean {
  const lowered = message.toLowerCase();
  return UNSUPPORTED_TOPICS.some((topic) => lowered.includes(topic));
}

function getFallbackQuestions(locale: "en" | "vi", audienceRole: AudienceRole) {
  return ROLE_PROFILES[audienceRole].fallbackQuestions[locale];
}

function getFallbackNextSteps(locale: "en" | "vi", audienceRole: AudienceRole) {
  return ROLE_PROFILES[audienceRole].fallbackNextSteps[locale];
}

function getRoleMetadata(locale: "en" | "vi", audienceRole: AudienceRole) {
  const profile = ROLE_PROFILES[audienceRole];
  return {
    roleLabel: profile.label[locale],
    actionLevel: profile.actionLevel,
    limitations: profile.limitations[locale],
  };
}

function mergeCitationRecords(...groups: CitationRecord[][]) {
  const merged = new Map<string, CitationRecord>();
  for (const group of groups) {
    for (const record of group) {
      if (!merged.has(record.id)) {
        merged.set(record.id, record);
      }
    }
  }
  return Array.from(merged.values());
}

function makeUnavailableResponse({
  locale,
  selectedChunks,
  groundTruth,
  audienceRole,
  metadata,
  timedOut,
}: {
  locale: "en" | "vi";
  selectedChunks: CitationRecord[];
  groundTruth: GroundTruth;
  audienceRole: AudienceRole;
  metadata: ReturnType<typeof getRoleMetadata>;
  timedOut?: boolean;
}) {
  const timeoutEvidence = timedOut
    ? selectCorpusChunks(
        locale,
        "0.20 mg/kg reference warning threshold Codex laboratory lab speciation verification food safety",
        audienceRole,
      )
    : [];
  const citations = mergeCitationRecords(timeoutEvidence, selectedChunks).slice(0, 10);
  const answer = timedOut
    ? locale === "en"
      ? "The live AI model has not returned within this request window. Please retry with a narrower question. For the demo, keep using the dashboard as an early-warning layer: the 0.20 mg/kg value is a reference warning threshold [S6][S11], and official conclusions still require laboratory testing/speciation [S12]."
      : "AI live model chưa trả về trong giới hạn chờ của request này. Bạn vui lòng hỏi lại ngắn hơn. Với bản demo, hãy tiếp tục xem dashboard như lớp cảnh báo sớm: 0.20 mg/kg là ngưỡng tham chiếu cảnh báo [S6][S11], còn kết luận chính thức vẫn cần xét nghiệm/speciation phòng lab [S12]."
    : locale === "en"
      ? "The assistant is temporarily unavailable. Try again shortly."
      : "Trợ lý đang tạm thời không khả dụng, vui lòng thử lại.";

  return NextResponse.json(
    {
      answer,
      citations,
      groundTruth,
      suggestedQuestions: getFallbackQuestions(locale, audienceRole),
      nextSteps: getFallbackNextSteps(locale, audienceRole),
      ...metadata,
    },
    { status: 200 },
  );
}

function makePrompt({
  locale,
  audienceRole,
  question,
  history,
  context,
  scenarioLabel,
  region,
}: {
  locale: "en" | "vi";
  audienceRole: AudienceRole;
  question: string;
  history: ChatHistoryMessage[];
  context: string;
  scenarioLabel: string;
  region: string;
}) {
  const profile = ROLE_PROFILES[audienceRole];
  const heading =
    locale === "en"
      ? "You are a strict assistant for this dashboard. Respond only using the provided local context."
      : "Bạn là trợ lý nghiêm ngặt cho dashboard này. Chỉ trả lời dựa trên thông tin ngữ cảnh cục bộ đã cung cấp.";
  const unsupported =
    locale === "en"
      ? "If the user asks for fertilizer/product recommendations, weather forecasts, water-withdrawal planning, irrigation schedules, or transplanting plans, state exact recommendations are not supported in v1. You may still answer at a high level that literature suggests water management can affect arsenic uptake and that users should discuss alternate wetting/drying or local irrigation practice with extension staff."
      : "Nếu người dùng hỏi khuyến nghị phân bón/sản phẩm, dự báo thời tiết, kế hoạch rút nước, lịch tưới hoặc lịch gieo cấy, nói rõ phiên bản v1 chưa hỗ trợ khuyến nghị cụ thể. Vẫn có thể trả lời ở mức nguyên tắc rằng tài liệu cho thấy quản lý nước có thể ảnh hưởng hấp thu arsenic và người dùng nên trao đổi về alternate wetting/drying hoặc thực hành tưới tiêu địa phương với cán bộ khuyến nông/kỹ thuật.";

  return `${heading}
You must use the exact JSON schema in your reply:
{
  "answer": "string",
  "usedCitationIds": ["S1", "S2", ...],
  "suggestedQuestions": ["string", "..."],
  "nextSteps": ["string", "..."]
}
Scenario context: ${scenarioLabel}
Region context: ${region}
Audience role: ${audienceRole} (${profile.label[locale]})
Action level: ${profile.actionLevel}
Role-specific format: ${profile.promptInstruction[locale]}
Role limitation: ${profile.limitations[locale]}
${unsupported}
Available references:
${context}
Recent conversation:
${formatHistory(history)}
Latest user question:
${question}
Guidelines:
- Do not invent numbers or claims beyond context.
- Treat scenario and region as optional background context; do not force every answer into a scenario comparison.
- If the user asks a follow-up like "why" or "what about that", use the recent conversation to resolve the reference.
- Include citation markers in the answer text using only IDs from the context (for example [S1], [S2]).
- Use S* citations for dashboard/project facts and R* citations for scientific literature from the DOCX references section.
- Always describe 0.20 mg/kg as a reference warning threshold in this dashboard. Do not imply model outputs are official Codex compliance results or confirmed inorganic-arsenic measurements; say laboratory speciation/verification is needed for that.
- If no reference matches a claim, skip that claim rather than guessing.
- You may suggest prioritizing samples, laboratory verification, local expert coordination, and risk communication.
- Do not prescribe fertilizer, products, weather-dependent actions, water-withdrawal, irrigation, transplanting, planting schedules, or official food-safety decisions.
- If user asks unsupported topics, provide a short high-level boundary answer and ask them to confirm with lab testing / local experts.`;
}

function parseResponseText(raw: string): GeminiResponseJson | null {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(trimmed) as GeminiResponseJson;
  } catch {
    return null;
  }
}

function enforceThresholdLanguage(answer: string, locale: "en" | "vi") {
  const normalized = answer
    .replace(/Codex reference threshold of 0\.20 mg\/kg for inorganic arsenic in polished rice/gi, "0.20 mg/kg reference warning threshold for this dashboard")
    .replace(/Codex reference threshold of 0\.2 mg\/kg for inorganic arsenic in polished rice/gi, "0.20 mg/kg reference warning threshold for this dashboard")
    .replace(/Codex reference threshold/gi, "reference warning threshold")
    .replace(/Codex threshold/gi, "reference warning threshold");

  const mentionsThreshold = /\b0\.20\b|\b0\.2\b|reference warning threshold/i.test(normalized);
  const mentionsVerification = /lab|laborator|speciation|xét nghiệm|phòng lab|xác minh/i.test(normalized);
  if (!mentionsThreshold || mentionsVerification) {
    return normalized;
  }

  const verificationNote =
    locale === "en"
      ? " This dashboard uses that value as a reference warning threshold; laboratory speciation/verification is required before treating a result as confirmed inorganic arsenic or an official food-safety conclusion."
      : " Dashboard dùng giá trị này như ngưỡng tham chiếu cảnh báo; cần xét nghiệm/speciation phòng lab trước khi xem kết quả là arsenic vô cơ đã xác nhận hoặc kết luận an toàn thực phẩm chính thức.";
  return `${normalized}${verificationNote}`;
}

function toGroundTruth(locale: "en" | "vi", scenarioId: string | undefined, region: string | undefined): GroundTruth {
  return getGroundTruth(locale, scenarioId, region);
}

async function callGemini(apiKey: string, prompt: string, signal?: AbortSignal) {
  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    signal,
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  return { response, payload };
}

async function callOllama(apiKey: string, prompt: string, signal?: AbortSignal) {
  const host = OLLAMA_HOST.replace(/\/+$/, "");
  const response = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
      format: "json",
      options: {
        temperature: 0.2,
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function getChatProvider(): ChatProvider {
  const requested = process.env.AI_CHAT_PROVIDER?.trim().toLowerCase();
  if (requested === "ollama" || requested === "gemini") {
    return requested;
  }

  return process.env.OLLAMA_API_KEY ? "ollama" : "gemini";
}

function getProviderKey(provider: ChatProvider): string | undefined {
  return provider === "ollama" ? process.env.OLLAMA_API_KEY : process.env.GEMINI_API_KEY;
}

async function callChatProvider(provider: ChatProvider, apiKey: string, prompt: string, signal?: AbortSignal) {
  if (provider === "ollama") {
    const { response, payload } = await callOllama(apiKey, prompt, signal);
    const text =
      payload && typeof payload === "object" && "message" in payload
        ? (payload as { message?: { content?: string } }).message?.content
        : undefined;
    return { response, text: typeof text === "string" ? text : "" };
  }

  const { response, payload } = await callGemini(apiKey, prompt, signal);
  const candidate =
    payload && typeof payload === "object" && "candidates" in payload
      ? (payload as { candidates: { content?: { parts?: { text?: string }[] } }[] })
      : null;
  const text = candidate?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";
  return { response, text };
}

async function buildChatResponse(
  payload: GeminiResponseJson | null,
  locale: "en" | "vi",
  groundTruth: GroundTruth,
  audienceRole: AudienceRole,
  available: CitationRecord[],
): Promise<ChatResponse> {
  const metadata = getRoleMetadata(locale, audienceRole);
  if (!payload || typeof payload.answer !== "string" || payload.answer.trim().length === 0) {
    const fallback =
      locale === "en"
        ? "I could not parse a structured answer from the model for this question. Please try rephrasing or ask about sampling priority, thresholds, or scenarios."
        : "Tôi không thể phân tích phản hồi có cấu trúc từ mô hình cho câu hỏi này. Hãy thử diễn đạt lại, ưu tiên hỏi về ưu tiên lấy mẫu, ngưỡng hoặc kịch bản.";
    return {
      answer: fallback,
      citations: available,
      groundTruth,
      suggestedQuestions: getFallbackQuestions(locale, audienceRole),
      nextSteps: getFallbackNextSteps(locale, audienceRole),
      ...metadata,
    };
  }

  const answer = enforceThresholdLanguage(payload.answer, locale);
  const citationById = formatCitationMap(available);
  const requested = [
    ...normalizeList(payload.usedCitationIds).map((entry) => entry.toUpperCase()),
    ...extractCitationIds(answer),
  ];
  const uniqueRequested = Array.from(new Set(requested));
  const citations = (uniqueRequested.length > 0 ? uniqueRequested : available.map((item) => item.id))
    .map((id) => citationById.get(id.toLowerCase()))
    .filter((item): item is CitationRecord => item !== undefined)
    .slice(0, 6);
  const citationsWithPaperReferences =
    citations.some((item) => item.id.startsWith("R"))
      ? citations
      : [
          ...citations,
          ...available.filter((item) => item.id.startsWith("R") && !citations.some((citation) => citation.id === item.id)),
        ].slice(0, 10);

  const nextSteps = normalizeList(payload.nextSteps);

  return {
    answer,
    citations: citationsWithPaperReferences,
    groundTruth,
    suggestedQuestions: clampQuestions(locale, audienceRole, payload.suggestedQuestions ?? []),
    nextSteps: (nextSteps.length > 0 ? nextSteps : getFallbackNextSteps(locale, audienceRole)).slice(0, 4),
    ...metadata,
  };
}

export async function POST(request: NextRequest) {
  const body = parseBody(await request.json().catch(() => null));
  if (!body) {
    return NextResponse.json(
      { message: "Invalid request payload" },
      {
        status: 400,
      },
    );
  }

  const message = body.message.trim();
  if (!message) {
    return NextResponse.json({ message: "Message cannot be empty" }, { status: 400 });
  }

  const locale = parseLocale(body.locale);
  const audienceRole = parseAudienceRole(body.audienceRole, body.audienceMode);
  const history = normalizeHistory(body.history);
  const retrievalText = [audienceRole, ...history.map((entry) => entry.text), message].join("\n");
  const selectedChunks = selectCorpusChunks(locale, retrievalText, audienceRole);
  const context = buildContext(locale, selectedChunks);
  const groundTruth = toGroundTruth(locale, body.scenarioId, body.region);
  const metadata = getRoleMetadata(locale, audienceRole);

  if (isUnavailableMessage(message)) {
    const refusal =
      locale === "en"
        ? "I cannot recommend exact fertilizer products, weather-dependent actions, water-withdrawal schedules, irrigation schedules, or transplanting plans in this v1 demo. At a high level, research suggests water management can affect arsenic uptake, so discuss alternate wetting/drying or local irrigation practice with extension staff. Use this chat for scenario interpretation and sampling priority, then verify actions with local experts and lab testing/speciation."
        : "Trong phiên bản v1 này, tôi không khuyến nghị cụ thể sản phẩm phân bón, hành động phụ thuộc thời tiết, lịch rút nước, lịch tưới hay lịch gieo cấy. Ở mức nguyên tắc, tài liệu cho thấy quản lý nước có thể ảnh hưởng hấp thu arsenic, vì vậy nên trao đổi về alternate wetting/drying hoặc thực hành tưới tiêu địa phương với cán bộ khuyến nông/kỹ thuật. Hãy dùng chat để diễn giải kịch bản và ưu tiên lấy mẫu, rồi xác minh hành động với chuyên gia địa phương và xét nghiệm/speciation phòng lab.";
    return NextResponse.json(
      {
        answer: refusal,
        citations: selectedChunks.slice(0, 3),
        groundTruth,
        suggestedQuestions: getFallbackQuestions(locale, audienceRole),
        nextSteps: getFallbackNextSteps(locale, audienceRole),
        ...metadata,
      },
      { status: 200 },
    );
  }

  const provider = getChatProvider();
  const apiKey = getProviderKey(provider);
  if (!apiKey) {
    const unavailable =
      locale === "en"
        ? `The ${provider === "ollama" ? "Ollama Cloud" : "Gemini"} assistant is currently unavailable because the server key is not configured. The dashboard remains usable for viewing values, but this chat answer path is paused until the environment key is added.`
        : `Trợ lý ${provider === "ollama" ? "Ollama Cloud" : "Gemini"} hiện chưa sẵn sàng vì chưa cấu hình khóa máy chủ. Dashboard vẫn hiển thị số liệu, nhưng phần trò chuyện tạm thời chưa hoạt động.`;

    return NextResponse.json(
      {
        answer: unavailable,
        citations: selectedChunks.slice(0, 2),
        groundTruth,
        suggestedQuestions: getFallbackQuestions(locale, audienceRole),
        nextSteps: getFallbackNextSteps(locale, audienceRole),
        ...metadata,
      },
      { status: 503 },
    );
  }

  const prompt = makePrompt({
    locale,
    audienceRole,
    question: message,
    history,
    context,
    scenarioLabel: groundTruth.scenarioLabel,
    region: groundTruth.region,
  });

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, PROVIDER_TIMEOUT_MS);
  const providerResult = await callChatProvider(provider, apiKey, prompt, controller.signal)
    .catch(() => null)
    .finally(() => clearTimeout(timeout));
  if (!providerResult) {
    return makeUnavailableResponse({
      locale,
      selectedChunks,
      groundTruth,
      audienceRole,
      metadata,
      timedOut,
    });
  }

  const { response, text } = providerResult;
  const parsed = parseResponseText(text);
  if (!response.ok) {
    return makeUnavailableResponse({
      locale,
      selectedChunks,
      groundTruth,
      audienceRole,
      metadata,
    });
  }

  const chatResponse = await buildChatResponse(parsed, locale, groundTruth, audienceRole, selectedChunks);
  return NextResponse.json(chatResponse, { status: 200 });
}
