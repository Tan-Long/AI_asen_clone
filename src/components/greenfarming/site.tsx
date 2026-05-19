"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronDown,
  Database,
  FlaskConical,
  Layers3,
  LocateFixed,
  Menu,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Loader2,
  MessageSquarePlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import provinceMap from "../../../public/images/grain/vietnam-provinces-map.json";
import {
  architectureSteps,
  assets,
  brand,
  commonText,
  faqItems,
  feedbackSteps,
  heroStats,
  homeHero,
  modelConfiguration,
  modelFigures,
  navItems,
  paddyMap,
  projectCards,
  requiredMetrics,
  riskRegions,
  scenarioResults,
  text,
  uncertaintyBands,
} from "@/lib/greenfarming-data";
import { cn } from "@/lib/utils";
import type { ActionLevel, AudienceRole } from "@/lib/chat-assistant";
import type { FeedbackField, Locale, LocalizedText } from "@/types/greenfarming";
import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

type AssistantGrounding = {
  scenarioId: ScenarioId;
  regionName: string;
};

type AssistantGroundingContextValue = {
  grounding: AssistantGrounding;
  setGrounding: (grounding: AssistantGrounding) => void;
};

type ChatCitation = {
  id: string;
  title: string;
  excerpt: string;
  source: string;
};

type GroundTruthCard = {
  scenarioId: string;
  scenarioLabel: string;
  nationalMean: string;
  max: string;
  threshold: string;
  region: string;
  regionValue: string;
  disclaimer: string;
};

type ChatMessage = {
  id: string;
  from: "user" | "assistant";
  text: string;
  citations: ChatCitation[];
  suggestedQuestions: string[];
  nextSteps: string[];
  audienceRole: AudienceRole;
  roleLabel?: string;
  actionLevel?: ActionLevel;
  limitations?: string;
  isError?: boolean;
};

type ApiChatResponse = {
  answer: string;
  citations: {
    id: string;
    title: { vi: string; en: string };
    excerpt: { vi: string; en: string };
    source: { vi: string; en: string };
  }[];
  groundTruth: GroundTruthCard;
  suggestedQuestions: string[];
  nextSteps: string[];
  roleLabel: string;
  actionLevel: ActionLevel;
  limitations: string;
};

type ApiChatHistoryMessage = {
  role: "user" | "assistant";
  text: string;
};

type ScenarioId = (typeof scenarioResults)[number]["id"];
type ProvinceMapFeature = (typeof provinceMap.provinces)[number];

type HoveredProvince = {
  province: ProvinceMapFeature;
  x: number;
  y: number;
};

const assistantRoles: AudienceRole[] = ["scientist", "policymaker", "farmer", "local"];

const assistantRoleLabels: Record<AudienceRole, LocalizedText> = {
  scientist: { vi: "Nhà khoa học", en: "Scientist" },
  policymaker: { vi: "Chính sách", en: "Policy" },
  farmer: { vi: "Nông dân", en: "Farmer" },
  local: { vi: "Địa phương/HTX", en: "Local/Co-op" },
};

const assistantFallbackQuestions: Record<AudienceRole, Record<Locale, string[]>> = {
  scientist: {
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
  policymaker: {
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
  farmer: {
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
  local: {
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
};

const actionLevelLabels: Record<ActionLevel, LocalizedText> = {
  explain: { vi: "Giải thích", en: "Explain" },
  prioritize: { vi: "Ưu tiên", en: "Prioritize" },
  coordinate: { vi: "Phối hợp", en: "Coordinate" },
  verify: { vi: "Xác minh", en: "Verify" },
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const defaultAssistantGrounding: AssistantGrounding = {
  scenarioId: "baseline",
  regionName: riskRegions[0].name,
};
const AssistantGroundingContext = createContext<AssistantGroundingContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
  };

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside LanguageProvider");
  }
  return context;
}

function AssistantGroundingProvider({ children }: { children: ReactNode }) {
  const [grounding, setGrounding] = useState<AssistantGrounding>(defaultAssistantGrounding);
  const value = useMemo(() => ({ grounding, setGrounding }), [grounding]);

  return <AssistantGroundingContext.Provider value={value}>{children}</AssistantGroundingContext.Provider>;
}

function useAssistantGrounding() {
  const context = useContext(AssistantGroundingContext);
  if (!context) {
    throw new Error("useAssistantGrounding must be used inside AssistantGroundingProvider");
  }
  return context;
}

function t(value: LocalizedText, locale: Locale) {
  return text(value, locale);
}

type CitationClickHandler = (citationId: string) => void;

function renderInlineMarkdown(value: string, keyPrefix: string, onCitationClick?: CitationClickHandler): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(\*\*[^*]+?\*\*|`[^`]+?`|\[[A-Z]\d+\])/g;
  let cursor = 0;
  let tokenIndex = 0;

  for (const match of value.matchAll(tokenPattern)) {
    const token = match[0];
    const start = match.index ?? 0;

    if (start > cursor) {
      nodes.push(value.slice(cursor, start));
    }

    const key = `${keyPrefix}-${tokenIndex}`;
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      const citationId = token.slice(1, -1).toUpperCase();
      if (onCitationClick) {
        nodes.push(
          <button
            key={key}
            type="button"
            className="ai-assistant-citation-marker"
            onClick={() => onCitationClick(citationId)}
            aria-label={`Open citation ${citationId}`}
          >
            {token}
          </button>,
        );
      } else {
        nodes.push(
          <span key={key} className="ai-assistant-citation-marker">
            {token}
          </span>,
        );
      }
    }

    cursor = start + token.length;
    tokenIndex += 1;
  }

  if (cursor < value.length) {
    nodes.push(value.slice(cursor));
  }

  return nodes;
}

function MarkdownText({
  text: markdownText,
  onCitationClick,
}: {
  text: string;
  onCitationClick?: CitationClickHandler;
}) {
  const blocks = markdownText
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="ai-assistant-markdown">
      {blocks.map((block, blockIndex) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        const isUnorderedList = lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line));
        const isOrderedList = lines.length > 0 && lines.every((line) => /^\d+[.)]\s+/.test(line));
        const headingMatch = lines.length === 1 ? /^(#{1,3})\s+(.+)$/.exec(lines[0]) : null;

        if (headingMatch) {
          return (
            <h3 key={`block-${blockIndex}`}>
              {renderInlineMarkdown(headingMatch[2], `heading-${blockIndex}`, onCitationClick)}
            </h3>
          );
        }

        if (isUnorderedList) {
          return (
            <ul key={`block-${blockIndex}`}>
              {lines.map((line, lineIndex) => (
                <li key={`block-${blockIndex}-${lineIndex}`}>
                  {renderInlineMarkdown(line.replace(/^[-*]\s+/, ""), `ul-${blockIndex}-${lineIndex}`, onCitationClick)}
                </li>
              ))}
            </ul>
          );
        }

        if (isOrderedList) {
          return (
            <ol key={`block-${blockIndex}`}>
              {lines.map((line, lineIndex) => (
                <li key={`block-${blockIndex}-${lineIndex}`}>
                  {renderInlineMarkdown(line.replace(/^\d+[.)]\s+/, ""), `ol-${blockIndex}-${lineIndex}`, onCitationClick)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`block-${blockIndex}`}>
            {lines.map((line, lineIndex) => (
              <span key={`block-${blockIndex}-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {renderInlineMarkdown(line, `p-${blockIndex}-${lineIndex}`, onCitationClick)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function AssistantRoleIcon({ role }: { role: AudienceRole }) {
  if (role === "scientist") {
    return <FlaskConical size={15} />;
  }

  if (role === "policymaker") {
    return <ShieldCheck size={15} />;
  }

  if (role === "farmer") {
    return <Users size={15} />;
  }

  return <LocateFixed size={15} />;
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AssistantGroundingProvider>
        <div className="min-h-screen bg-[#fbfaf5] text-[#34403a]">
          <Header />
          {children}
          <Footer />
          <GlobalAIAssistant />
        </div>
      </AssistantGroundingProvider>
    </LanguageProvider>
  );
}

function GlobalAIAssistant() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const { grounding } = useAssistantGrounding();
  const effectiveGrounding = pathname === "/app" ? grounding : defaultAssistantGrounding;

  return (
    <AIAssistantPopup
      locale={locale}
      scenarioId={effectiveGrounding.scenarioId}
      regionName={effectiveGrounding.regionName}
    />
  );
}

function Header() {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8dfc8] bg-[#fffdf7]/95 backdrop-blur">
      <div className="site-container flex min-h-20 items-center gap-5 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grain-logo">
            <Image src={assets.logo} width={44} height={44} alt="" className="h-8 w-8" priority />
          </span>
          <span className="min-w-0">
            <span className="brand-wordmark block text-lg leading-tight text-[#1f6f43] md:text-xl">
              {t(brand.name, locale)}
            </span>
            <span className="hidden text-xs font-semibold text-[#7a6a42] md:block">
              {t(brand.tagline, locale)}
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-5 text-sm font-bold text-[#4a514b] xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-[#1f6f43]",
                pathname === item.href && "text-[#1f6f43]",
              )}
            >
              {t(item.label, locale)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 xl:ml-4 xl:flex">
          <button
            className={cn("lang-button", locale === "vi" && "lang-button-active")}
            onClick={() => setLocale("vi")}
          >
            VI
          </button>
          <button
            className={cn("lang-button", locale === "en" && "lang-button-active")}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
        </div>

        <button
          aria-label={open ? "Close menu" : "Open menu"}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-md border border-[#e8dfc8] text-[#1f6f43] xl:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#e8dfc8] bg-[#fffdf7] xl:hidden">
          <nav className="site-container grid gap-4 py-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base font-bold text-[#34403a]"
                onClick={() => setOpen(false)}
              >
                {t(item.label, locale)}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                className={cn("lang-button", locale === "vi" && "lang-button-active")}
                onClick={() => setLocale("vi")}
              >
                VI
              </button>
              <button
                className={cn("lang-button", locale === "en" && "lang-button-active")}
                onClick={() => setLocale("en")}
              >
                EN
              </button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function HomePage() {
  const { locale } = useLocale();

  return (
    <main>
      <section className="grain-hero landing-hero">
        <div className="grain-field-visual" aria-hidden="true">
          <Image src={scenarioResults[2].image} alt="" width={900} height={1177} className="hero-paddy-raster" />
        </div>
        <div className="site-container relative z-10 grid min-h-[660px] items-center gap-10 py-16 lg:grid-cols-[1fr_430px]">
          <div>
            <p className="eyebrow">{t(homeHero.eyebrow, locale)}</p>
            <h1 className="mt-4 max-w-[820px] text-[48px] font-extrabold leading-[1.05] text-[#143d2a] md:text-[72px]">
              {t(homeHero.title, locale)}
            </h1>
            <p className="mt-5 max-w-[760px] text-2xl font-bold text-[#1f6f43]">
              {t(homeHero.subtitle, locale)}
            </p>
            <p className="mt-6 max-w-[720px] text-lg font-medium leading-[1.65] text-[#4c5a50]">
              {t(homeHero.description, locale)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#dashboard" className="primary-cta">
                {locale === "vi" ? "Xem dashboard" : "Explore the dashboard"} <ArrowRight size={20} />
              </Link>
              <Link href="#why-it-matters" className="secondary-cta">
                {locale === "vi" ? "Vì sao quan trọng" : "Why it matters"}
              </Link>
            </div>
            <p className="mt-5 max-w-[720px] rounded-md border border-[#ead9a9] bg-[#fff8df] px-4 py-3 text-sm font-semibold text-[#735d13]">
              {t(brand.disclaimer, locale)}
            </p>
          </div>
          <HeroPanel />
        </div>
      </section>
      <LandingMetricsStrip />
      <HealthRiskSection />
      <LandingDashboardSection />
      <StakeholderImpactSection />
      <TechnicalDetailsSection />
      <LandingFinalCta />
    </main>
  );
}

function HeroPanel() {
  const { locale } = useLocale();

  return (
    <aside className="dashboard-panel landing-signal-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-[#7a6a42]">
            {locale === "vi" ? "Tín hiệu kịch bản" : "Scenario signal"}
          </p>
          <h2 className="mt-1 text-3xl font-extrabold text-[#143d2a]">RCP8.5 2050</h2>
        </div>
        <AlertTriangle className="text-[#d8532b]" size={36} />
      </div>
      <div className="landing-mini-map mt-5">
        <Image
          src={paddyMap.basemap}
          alt={locale === "vi" ? "Bản đồ Việt Nam" : "Vietnam map"}
          width={900}
          height={1177}
          className="landing-mini-map-layer"
          priority
        />
        <Image
          src={scenarioResults[2].image}
          alt={locale === "vi" ? "Lớp pixel lúa RCP8.5" : "RCP8.5 paddy pixel layer"}
          width={900}
          height={1177}
          className="landing-mini-map-layer landing-mini-raster-layer"
          priority
        />
        <Image
          src={paddyMap.boundaries}
          alt=""
          width={900}
          height={1177}
          className="landing-mini-map-layer landing-mini-boundary-layer"
          priority
        />
      </div>
      <div className="landing-signal-row mt-5">
        <span>
          <strong>0.304 mg/kg</strong>
          {locale === "vi" ? "Trung bình quốc gia" : "National mean"}
        </span>
        <span>
          <strong>{paddyMap.threshold}</strong>
          {locale === "vi" ? "Ngưỡng tham chiếu" : "Reference threshold"}
        </span>
      </div>
      <div className="mt-6 grid gap-3">
        {heroStats.map((stat) => (
          <div key={stat.value} className="stat-card">
            <span className="text-3xl font-extrabold text-[#1f6f43]">{stat.value}</span>
            <span>
              <span className="block font-extrabold text-[#26352b]">{t(stat.label, locale)}</span>
              <span className="text-sm font-medium text-[#647067]">{t(stat.detail, locale)}</span>
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function LandingMetricsStrip() {
  const { locale } = useLocale();

  return (
    <section className="landing-metrics-band">
      <div className="site-container grid gap-4 lg:grid-cols-[0.8fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow">{locale === "vi" ? "Tóm tắt" : "At a glance"}</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[#143d2a]">
            {locale === "vi"
              ? "Một bản demo tương tác cho câu chuyện cảnh báo sớm arsenic trong gạo."
              : "An interactive demo for the arsenic early-warning story."}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {requiredMetrics.map((metric) => (
            <article key={metric.value} className="metric-card">
              <p className="text-sm font-bold uppercase text-[#7a6a42]">{t(metric.label, locale)}</p>
              <p className="mt-3 text-2xl font-extrabold text-[#143d2a]">{metric.value}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HealthRiskSection() {
  const { locale } = useLocale();
  const cards = [
    {
      icon: <AlertTriangle size={24} />,
      title: { vi: "Không chỉ ngộ độc cấp tính", en: "Not only acute poisoning" },
      body: {
        vi: "Rủi ro đáng lo hơn là phơi nhiễm lặp lại trong thời gian dài, khi arsenic đi vào bữa ăn qua nước và thực phẩm.",
        en: "The deeper concern is repeated long-term exposure as arsenic enters meals through water and food.",
      },
    },
    {
      icon: <ShieldCheck size={24} />,
      title: { vi: "Tổn thương tích lũy", en: "Cumulative harm" },
      body: {
        vi: "WHO ghi nhận phơi nhiễm dài hạn có liên quan đến tổn thương da và nguy cơ ung thư; tác động có thể xuất hiện âm thầm qua nhiều năm.",
        en: "WHO links long-term exposure with skin lesions and cancer risk; effects can emerge silently over years.",
      },
    },
    {
      icon: <Database size={24} />,
      title: { vi: "Bài toán dữ liệu", en: "A data problem" },
      body: {
        vi: "Trong ruộng lúa, đất, nước, khí hậu, mùa vụ và CO2 tương tác với nhau, khiến rủi ro khó nhìn thấy bằng trực giác.",
        en: "In rice systems, soil, water, climate, season and CO2 interact, making risk hard to read by intuition alone.",
      },
    },
  ];

  return (
    <section id="why-it-matters" className="scroll-mt-24 bg-[#fffdf7] py-20">
      <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.65fr)]">
        <div>
          <p className="eyebrow">{locale === "vi" ? "Vì sao quan trọng" : "Why it matters"}</p>
          <h2 className="section-title mt-3">
            {locale === "vi" ? "Vì sao arsenic nguy hiểm?" : "Why is arsenic dangerous?"}
          </h2>
          <p className="mt-5 text-lg font-medium leading-[1.65] text-[#4c5a50]">
            {locale === "vi"
              ? "Arsenic trong gạo không phải là rủi ro có thể nhận biết bằng mắt thường. Vấn đề chính của dự án là phơi nhiễm dài hạn qua nước và thực phẩm, khi hạt gạo được ăn đều đặn trong bữa cơm hằng ngày."
              : "Arsenic in rice is not a risk people can see by eye. This project focuses on long-term exposure through water and food, as rice is eaten repeatedly in everyday meals."}
          </p>
          <p className="mt-4 text-lg font-medium leading-[1.65] text-[#4c5a50]">
            {locale === "vi"
              ? "Vì vậy dashboard được định vị như lớp cảnh báo sớm: phát hiện khu vực có tín hiệu rủi ro để ưu tiên lấy mẫu, thay vì kết luận một lô gạo là an toàn hay không an toàn."
              : "That is why the dashboard is framed as an early-warning layer: it identifies areas with risk signals for sampling priority, rather than declaring whether a rice lot is safe or unsafe."}
          </p>
          <div className="why-proof-grid mt-7">
            {[
              {
                value: locale === "vi" ? "Dài hạn" : "Long-term",
                label: locale === "vi" ? "Phơi nhiễm lặp lại qua bữa ăn" : "Repeated exposure through meals",
              },
              {
                value: locale === "vi" ? "Âm thầm" : "Silent",
                label: locale === "vi" ? "Không nhìn thấy bằng mắt thường" : "Not visible by eye",
              },
              {
                value: locale === "vi" ? "Sớm hơn" : "Earlier",
                label: locale === "vi" ? "Biết nơi nào nên lấy mẫu trước" : "Know where to sample first",
              },
            ].map((item) => (
              <div key={item.value} className="why-proof-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <a
            className="source-link mt-6"
            href="https://www.who.int/news-room/fact-sheets/detail/arsenic"
            target="_blank"
            rel="noreferrer"
          >
            {locale === "vi" ? "Nguồn sức khỏe: WHO arsenic fact sheet" : "Health source: WHO arsenic fact sheet"}
          </a>
        </div>
        <div className="impact-panel">
          {cards.map((card) => (
            <article key={t(card.title, locale)} className="impact-row">
              <span className="impact-icon">{card.icon}</span>
              <span>
                <strong>{t(card.title, locale)}</strong>
                <span>{t(card.body, locale)}</span>
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StakeholderImpactSection() {
  const { locale } = useLocale();
  const groups = [
    {
      icon: <Database size={24} />,
      title: { vi: "Nhà khoa học", en: "Scientists" },
      body: {
        vi: "Xác định nơi cần lấy mẫu trước và yếu tố cần theo dõi trong bài toán nhiều biến.",
        en: "Identify where to sample first and which drivers to monitor in a multi-variable problem.",
      },
    },
    {
      icon: <ShieldCheck size={24} />,
      title: { vi: "Nhà hoạch định chính sách", en: "Policymakers" },
      body: {
        vi: "Ưu tiên nguồn lực giám sát, truyền thông rủi ro và kế hoạch thích ứng khí hậu.",
        en: "Prioritize monitoring resources, risk communication and climate-adaptation planning.",
      },
    },
    {
      icon: <LocateFixed size={24} />,
      title: { vi: "Địa phương và HTX", en: "Local authorities and cooperatives" },
      body: {
        vi: "Theo dõi vùng rủi ro, phối hợp lấy mẫu và cập nhật dữ liệu theo mùa vụ.",
        en: "Track risk areas, coordinate sampling and update seasonal field data.",
      },
    },
    {
      icon: <Sparkles size={24} />,
      title: { vi: "Nông dân", en: "Farmers" },
      body: {
        vi: "Nhận tín hiệu rủi ro sớm để trao đổi với cán bộ kỹ thuật và điều chỉnh canh tác kịp thời hơn.",
        en: "Receive early risk signals to work with advisors and adjust cultivation decisions sooner.",
      },
    },
  ];

  return (
    <section id="impact" className="scroll-mt-24 bg-[#fffdf7] py-20">
      <div className="site-container">
        <div className="max-w-[760px]">
          <p className="eyebrow">{locale === "vi" ? "Tác động" : "Impact"}</p>
          <h2 className="section-title mt-3">
            {locale === "vi" ? "Tác động: ai được hỗ trợ?" : "Impact: who does this support?"}
          </h2>
          <p className="mt-5 text-lg font-medium leading-[1.65] text-[#4c5a50]">
            {locale === "vi"
              ? "Demo biến kết quả mô hình thành tín hiệu hành động cho những nhóm cần ra quyết định trước khi rủi ro trở thành vấn đề sau thu hoạch."
              : "The demo turns model outputs into action signals for groups that need to decide before risk becomes a post-harvest problem."}
          </p>
        </div>
        <div className="stakeholder-grid mt-8">
          {groups.map((group) => (
            <article key={t(group.title, locale)} className="stakeholder-card">
              <span className="impact-icon">{group.icon}</span>
              <h3>{t(group.title, locale)}</h3>
              <p>{t(group.body, locale)}</p>
            </article>
          ))}
        </div>
        <div className="impact-outcome-strip mt-6">
          {[
            locale === "vi" ? "Lấy mẫu đúng nơi hơn" : "Better targeted sampling",
            locale === "vi" ? "Giám sát rủi ro theo mùa vụ" : "Seasonal risk monitoring",
            locale === "vi" ? "Hành động sớm trước thu hoạch" : "Earlier pre-harvest action",
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingDashboardSection() {
  const { locale } = useLocale();
  const [viewMode, setViewMode] = useState<"rice" | "warning">("rice");

  return (
    <section id="dashboard" className="landing-dashboard-section scroll-mt-24 bg-[#f3f7ea] py-20">
      <div className="site-container grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="landing-dashboard-copy">
          <p className="eyebrow">{locale === "vi" ? "Dashboard" : "Dashboard"}</p>
          <h2 className="section-title mt-3">
            {locale === "vi"
              ? "Dashboard cảnh báo sớm và ưu tiên lấy mẫu"
              : "Early-warning and sampling-priority dashboard"}
          </h2>
          <p className="mt-5 text-lg font-medium leading-[1.65]">
            {locale === "vi"
              ? "Bản đồ dưới đây là minh họa dựa trên kết quả dự án, không phải bản đồ GIS chính thức. Màu sắc thể hiện vùng cần quan tâm khi so sánh kết quả 2025 với các kịch bản RCP4.5 và RCP8.5 đến năm 2050; ngưỡng 0.20 mg/kg chỉ là ngưỡng tham chiếu cảnh báo."
              : "The map below is an illustrative visualization based on project results, not an official GIS layer. Colors indicate areas that deserve attention when comparing 2025 results with RCP4.5 and RCP8.5 projections to 2050; the 0.20 mg/kg value is only a reference warning threshold."}
          </p>
          <div className="dashboard-flow mt-7">
            {[
              locale === "vi" ? "Chọn kịch bản khí hậu" : "Choose climate scenario",
              locale === "vi" ? "Xem lớp pixel lúa và tỉnh/thành" : "View paddy pixels and provinces",
              locale === "vi" ? "Ưu tiên nơi cần xét nghiệm trước" : "Prioritize where to test first",
            ].map((item, index) => (
              <div key={item} className="dashboard-flow-step">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
          <div className="dashboard-section-actions mt-6">
            <Link href="/app" className="secondary-cta">
              {locale === "vi" ? "Mở dashboard đầy đủ" : "Open full dashboard"}
            </Link>
          </div>
        </div>
        <div className="grid content-start gap-5">
          <div className="dashboard-view-tabs" role="tablist" aria-label={locale === "vi" ? "Chế độ bản đồ" : "Map view mode"}>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "rice"}
              className={cn("dashboard-view-tab", viewMode === "rice" && "dashboard-view-tab-active")}
              onClick={() => setViewMode("rice")}
            >
              {locale === "vi" ? "Khu vực trồng lúa" : "Rice growing area"}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "warning"}
              className={cn("dashboard-view-tab", viewMode === "warning" && "dashboard-view-tab-active")}
              onClick={() => setViewMode("warning")}
            >
              {locale === "vi" ? "Vùng cảnh báo" : "Warning zone"}
            </button>
          </div>
          <ArsenicRiskMap compact viewMode={viewMode} onViewModeChange={setViewMode} />
          <div className="landing-scenario-stack">
            {scenarioResults.map((result) => (
              <article key={result.id} className="result-card">
                <div>
                  <p className="font-extrabold text-[#1f6f43]">{t(result.label, locale)}</p>
                  <p className="mt-2 text-4xl font-extrabold text-[#143d2a]">
                    {result.value} <span className="text-base">{result.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="font-bold text-[#d8532b]">{t(result.level, locale)}</p>
                  <p className="mt-2 text-sm font-medium leading-[1.5] text-[#5d6a62]">
                    {t(result.description, locale)}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className="rounded-md bg-[#ecf7ef] p-4 text-sm font-semibold leading-[1.5] text-[#1f6f43]">
            {t(commonText.modelNotice, locale)}
          </p>
        </div>
      </div>
    </section>
  );
}

function regionValue(region: (typeof riskRegions)[number], scenario: ScenarioId) {
  return scenario === "baseline" ? region.baseline : scenario === "rcp45" ? region.rcp45 : region.rcp85;
}

function ProvinceBoundaryOverlay({
  activeScenarioId,
  showPalette,
}: {
  activeScenarioId: ScenarioId;
  showPalette: boolean;
}) {
  const { locale } = useLocale();
  const [hoveredProvince, setHoveredProvince] = useState<HoveredProvince | null>(null);

  const updateHoverPosition = (event: MouseEvent<SVGPathElement>, province: ProvinceMapFeature) => {
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    setHoveredProvince({
      province,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <>
      <svg
        className="province-boundary-overlay"
        viewBox={`0 0 ${provinceMap.width} ${provinceMap.height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label={locale === "vi" ? "Ranh giới tỉnh Việt Nam" : "Vietnam provincial boundaries"}
      >
        <g className="country-shadow-layer">
          <path d={provinceMap.countryPath} />
        </g>
        {showPalette ? (
          <g className="province-fill-layer" aria-hidden>
            {provinceMap.provinces.map((province) => {
              const val = (province.metrics as any)[activeScenarioId] as number | undefined;
              const numeric = typeof val === "number" ? val : Number(val ?? NaN);
              const legend = paddyMap.legend;
              const getIndex = (v: number) => {
                if (isNaN(v)) return -1;
                if (v < 0.2) return 0;
                if (v < 0.23) return 1;
                if (v < 0.26) return 2;
                if (v < 0.29) return 3;
                return 4;
              };

              const idx = getIndex(numeric);
              const fill = idx >= 0 ? legend[idx].color : "transparent";

              return <path key={`${province.id}-fill`} d={province.path} style={{ fill, fillOpacity: 1, pointerEvents: "none" }} />;
            })}
          </g>
        ) : null}
        <g className="province-hit-layer">
          {provinceMap.provinces.map((province) => (
            <path
              key={province.id}
              d={province.path}
              className={cn("province-hit-area", hoveredProvince?.province.id === province.id && "province-hit-area-active")}
              tabIndex={0}
              onMouseEnter={(event) => updateHoverPosition(event, province)}
              onMouseMove={(event) => updateHoverPosition(event, province)}
              onMouseLeave={() => setHoveredProvince(null)}
              onFocus={() => {
                setHoveredProvince({
                  province,
                  x: province.center.x,
                  y: province.center.y,
                });
              }}
              onBlur={() => setHoveredProvince(null)}
            />
          ))}
        </g>
        <g className="province-line-layer">
          {provinceMap.provinces.map((province) => (
            <path key={`${province.id}-line`} d={province.boundaryPath} />
          ))}
        </g>
        <g className="country-line-layer">
          <path d={provinceMap.countryPath} />
        </g>
        <g className="archipelago-marker-layer">
          {provinceMap.archipelagoMarkers.map((marker) => (
            <g key={marker.id} transform={`translate(${marker.center.x} ${marker.center.y})`}>
              <circle r="7" />
              <line x1="-14" y1="0" x2="14" y2="0" />
              <line x1="0" y1="-14" x2="0" y2="14" />
              <text className="archipelago-label-halo" x="14" y="-10">
                {marker.name}
              </text>
              <text x="14" y="-10">
                {marker.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
      {hoveredProvince ? (
        <div
          className="province-hover-popup"
          style={{
            left: `min(${hoveredProvince.x + 14}px, calc(100% - 210px))`,
            top: `min(${hoveredProvince.y + 14}px, calc(100% - 150px))`,
          }}
        >
          <p>{hoveredProvince.province.name}</p>
          <div className={cn("province-popup-row", activeScenarioId === "baseline" && "province-popup-row-active")}> 
            <span>Baseline 2025</span>
            <strong>{hoveredProvince.province.metrics.baseline.toFixed(3)} mg/kg</strong>
          </div>
          <div className={cn("province-popup-row", activeScenarioId === "rcp45" && "province-popup-row-active")}> 
            <span>RCP4.5 2050</span>
            <strong>{hoveredProvince.province.metrics.rcp45.toFixed(3)} mg/kg</strong>
          </div>
          <div className={cn("province-popup-row", activeScenarioId === "rcp85" && "province-popup-row-active")}> 
            <span>RCP8.5 2050</span>
            <strong>{hoveredProvince.province.metrics.rcp85.toFixed(3)} mg/kg</strong>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ArsenicRiskMap({
  compact = false,
  scenario,
  onScenarioChange,
  selectedRegion,
  onRegionChange,
  viewMode,
  onViewModeChange,
}: {
  compact?: boolean;
  scenario?: ScenarioId;
  onScenarioChange?: (scenario: ScenarioId) => void;
  selectedRegion?: string;
  onRegionChange?: (region: string) => void;
  viewMode?: "rice" | "warning";
  onViewModeChange?: (nextViewMode: "rice" | "warning") => void;
}) {
  const { locale } = useLocale();
  const [localScenario, setLocalScenario] = useState<ScenarioId>("rcp85");
  const [localRegion, setLocalRegion] = useState(riskRegions[0].name);
  const [localViewMode, setLocalViewMode] = useState<"rice" | "warning">("warning");
  const [layersOpen, setLayersOpen] = useState(false);
  const layersMenuRef = useRef<HTMLDivElement>(null);
  const activeScenarioId = scenario ?? localScenario;
  const activeRegionName = selectedRegion ?? localRegion;
  const activeScenario = scenarioResults.find((item) => item.id === activeScenarioId) ?? scenarioResults[0];
  const activeViewMode = viewMode ?? localViewMode;

  useEffect(() => {
    if (!layersOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (layersMenuRef.current && !layersMenuRef.current.contains(event.target as Node)) {
        setLayersOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [layersOpen]);

  const updateScenario = (nextScenario: ScenarioId) => {
    if (onScenarioChange) {
      onScenarioChange(nextScenario);
    } else {
      setLocalScenario(nextScenario);
    }
  };

  const updateRegion = (nextRegion: string) => {
    if (onRegionChange) {
      onRegionChange(nextRegion);
    } else {
      setLocalRegion(nextRegion);
    }
  };

  const selectViewMode = (nextViewMode: "rice" | "warning") => {
    if (onViewModeChange) {
      onViewModeChange(nextViewMode);
    } else {
      setLocalViewMode(nextViewMode);
    }

    setLayersOpen(false);
  };

  return (
    <div className={cn("risk-map-card paddy-map-card", compact && "risk-map-card-compact")}>
      <div className="map-toolbar">
        <label>
          <span>{locale === "vi" ? "Kịch bản" : "Scenario"}</span>
          <select value={activeScenarioId} onChange={(event) => updateScenario(event.target.value as ScenarioId)}>
            {scenarioResults.map((item) => (
              <option key={item.id} value={item.id}>
                {t(item.label, locale)}
              </option>
            ))}
          </select>
        </label>
        <div className="map-layer-menu" ref={layersMenuRef}>
          <button
            type="button"
            className="map-layer-button"
            onClick={() => setLayersOpen((value) => !value)}
            aria-pressed={activeViewMode === "warning"}
            aria-expanded={layersOpen}
            aria-haspopup="menu"
          >
            <Layers3 size={17} />
            {locale === "vi" ? "Lớp" : "Layers"}
          </button>
          {layersOpen ? (
            <div className="map-layer-dropdown" role="menu" aria-label={locale === "vi" ? "Chọn lớp hiển thị" : "Choose layer view"}>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={activeViewMode === "rice"}
                className={cn("map-layer-option", activeViewMode === "rice" && "map-layer-option-active")}
                onClick={() => selectViewMode("rice")}
              >
                <span>
                  <strong>{locale === "vi" ? "Khu vực trồng lúa" : "Rice growing area"}</strong>
                  <small>{locale === "vi" ? "Chỉ hiển thị ảnh PNG" : "Show PNG only"}</small>
                </span>
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={activeViewMode === "warning"}
                className={cn("map-layer-option", activeViewMode === "warning" && "map-layer-option-active")}
                onClick={() => selectViewMode("warning")}
              >
                <span>
                  <strong>{locale === "vi" ? "Vùng cảnh báo" : "Warning zone"}</strong>
                  <small>{locale === "vi" ? "Hiển thị palette" : "Show palette"}</small>
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="leaflet-map-shell">
          <div className="leaflet-label">Leaflet</div>
          <div className="leaflet-controls" aria-hidden="true">
            <button type="button">+</button>
            <button type="button">-</button>
          </div>
          <button type="button" className="leaflet-locate" aria-label="Locate">
            <LocateFixed size={16} />
          </button>
          <div className="vietnam-map-canvas">
            <Image
              src={paddyMap.basemap}
              alt={locale === "vi" ? "Nền bản đồ Việt Nam" : "Vietnam basemap"}
              width={900}
              height={1177}
              className="vietnam-basemap-layer"
            />
            {activeViewMode === "warning" ? (
              <ProvinceBoundaryOverlay activeScenarioId={activeScenarioId} showPalette />
            ) : null}
            {activeViewMode === "rice" ? (
              <Image
                src={activeScenario.image}
                alt={locale === "vi" ? "Lớp pixel lúa Việt Nam" : "Vietnam paddy pixel layer"}
                width={900}
                height={1177}
                className="paddy-raster-layer"
                style={{ pointerEvents: "none" }}
              />
            ) : null}
            {activeViewMode === "rice" ? <ProvinceBoundaryOverlay activeScenarioId={activeScenarioId} showPalette={false} /> : null}
          </div>
          <div className="map-scale">500 km</div>
        </div>

        <aside className="map-sidebar">
          <div>
            <p className="text-xs font-black uppercase text-[#7a6a42]">
              {locale === "vi" ? "Trung bình quốc gia" : "National mean"}
            </p>
            <p className="mt-1 text-3xl font-extrabold text-[#143d2a]">
              {activeScenario.value} <span className="text-sm">{activeScenario.unit}</span>
            </p>
            <p className="mt-1 text-sm font-bold text-[#d8532b]">
              CO2 {activeScenario.co2} ppm · max {activeScenario.max} mg/kg · {activeScenario.increase}
            </p>
          </div>
          <div className="grid gap-2">
            {riskRegions.map((region) => (
              <button
                type="button"
                key={region.name}
                className={cn("region-row map-region-button", activeRegionName === region.name && "map-region-button-active")}
                onClick={() => updateRegion(region.name)}
              >
                <span>
                  <span className="block font-extrabold text-[#26352b]">
                    {locale === "vi" ? region.viName : region.name}
                  </span>
                  <span className="text-xs font-semibold text-[#7a6a42]">
                    {t(region.priority, locale)}
                  </span>
                </span>
                <span className="text-right font-extrabold text-[#143d2a]">
                  {regionValue(region, activeScenarioId)}
                </span>
              </button>
            ))}
          </div>
          <div className="map-legend">
            <p className="text-xs font-black uppercase text-[#7a6a42]">
              {locale === "vi" ? "Legend mg/kg" : "Legend mg/kg"}
            </p>
            {activeViewMode === "warning"
              ? paddyMap.legend.map((item, index) => (
                  <div key={item.range} className="legend-row">
                    <span className={cn("legend-swatch", `legend-swatch-${index}`)} style={{ background: item.color }} />
                    <span>{t(item.label, locale)}</span>
                    <span>{item.range}</span>
                  </div>
                ))
              : null}
            <p className="mt-2 text-xs font-bold text-[#735d13]">
              {locale === "vi" ? "Ngưỡng tham chiếu cảnh báo" : "Reference warning threshold"}: {paddyMap.threshold}
            </p>
          </div>
        </aside>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-[#5d6a62]">
        <span className="inline-flex items-center gap-2"><SlidersHorizontal size={15} /> {t(activeScenario.label, locale)}</span>
        <span>{t(brand.disclaimer, locale)}</span>
      </div>
    </div>
  );
}

function TechnicalDetailsSection() {
  const { locale } = useLocale();

  return (
    <section id="technical" className="scroll-mt-24 bg-[#f3f7ea] py-20">
      <div className="site-container grid gap-8">
        <div className="technical-section-header">
          <div>
            <p className="eyebrow">{locale === "vi" ? "Kỹ thuật" : "Technical"}</p>
            <h2 className="section-title mt-3">
              {locale === "vi" ? "Kỹ thuật và bằng chứng mô hình" : "Technical evidence and model details"}
            </h2>
            <p className="mt-5 max-w-[760px] text-lg font-medium leading-[1.65] text-[#4c5a50]">
              {locale === "vi"
                ? "Phần này giữ lại biểu đồ xu hướng, SHAP và cấu hình mô hình để thẩm định. Các thuật ngữ kỹ thuật được đặt sau lớp cảnh báo sớm để không lấn át thông điệp sức khỏe và hành động."
                : "This section keeps the trend chart, SHAP and model configuration for review. Technical terms sit behind the early-warning story so they do not dominate the health and action message."}
            </p>
          </div>
          <div className="technical-fact-grid">
            {[
              ["24", locale === "vi" ? "biến dự báo" : "predictors"],
              ["50", locale === "vi" ? "bootstrap runs" : "bootstrap runs"],
              ["p10/p90", locale === "vi" ? "bất định" : "uncertainty"],
            ].map(([value, label]) => (
              <div key={value} className="technical-fact">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <LineChart />
        <details className="technical-accordion">
          <summary>
            <span>
              <span className="eyebrow">
                {locale === "vi" ? "Technical details" : "Technical details"}
              </span>
              <strong>
                {locale === "vi"
                  ? "Chi tiết mô hình, SHAP và validation"
                  : "Model, SHAP and validation details"}
              </strong>
            </span>
            <ChevronDown className="technical-chevron" />
          </summary>
          <div className="technical-accordion-body">
            <PredictorChart />
            <article className="science-card">
              <h3 className="text-2xl font-extrabold text-[#143d2a]">
                {locale === "vi" ? "Model configuration" : "Model configuration"}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-[1.55] text-[#5d6a62]">
                {locale === "vi"
                  ? "Các tham số kỹ thuật được giữ lại để thẩm định, nhưng không phải thông điệp chính của demo cảnh báo sớm."
                  : "Technical parameters are retained for review, but they are not the main message of the early-warning demo."}
              </p>
              <ModelConfigurationRows />
            </article>
          </div>
        </details>
      </div>
    </section>
  );
}

function LineChart() {
  const { locale } = useLocale();

  return (
    <article className="science-card">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-2xl font-extrabold text-[#143d2a]">
          {locale === "vi"
            ? "Figure 5. Xu hướng arsenic 2017-2050"
            : "Figure 5. Arsenic trend 2017-2050"}
        </h3>
        <TrendingUp className="text-[#d9a21b]" />
      </div>
      <div className="doc-figure-frame mt-6">
        <Image
          src={modelFigures.arsenicTrend}
          alt={
            locale === "vi"
            ? "Panel mean grain arsenic trong tài liệu: nồng độ arsenic lịch sử và dự báo theo RCP4.5, RCP8.5"
            : "Mean grain arsenic panel from the paper: historical and projected arsenic concentrations under RCP4.5 and RCP8.5"
          }
          width={1035}
          height={805}
          className="doc-figure-image"
        />
      </div>
      <div className="doc-trend-legend">
        <span className="legend-actual">{locale === "vi" ? "Actual Data (2017-2025)" : "Actual Data (2017-2025)"}</span>
        <span className="legend-rcp45">RCP 4.5 Scenario</span>
        <span className="legend-rcp85">RCP 8.5 Scenario</span>
        <span className="legend-standard">{locale === "vi" ? "Ngưỡng tham chiếu 0.20" : "Reference threshold 0.20"}</span>
      </div>
      <p className="mt-4 text-sm font-semibold leading-[1.55] text-[#5d6a62]">
        {locale === "vi"
          ? "Chỉ hiển thị panel nồng độ trung bình từ tài liệu; đường 0.20 mg kg-1 được dùng như ngưỡng tham chiếu cảnh báo, không phải chứng nhận an toàn."
          : "Only the mean-concentration panel from the document is shown; the 0.20 mg kg-1 line is used as a reference warning threshold, not a safety certification."}
      </p>
    </article>
  );
}

function PredictorChart() {
  const { locale } = useLocale();

  return (
    <article className="science-card">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-2xl font-extrabold text-[#143d2a]">
          {locale === "vi"
            ? "Figure 4. SHAP model interpretation"
            : "Figure 4. SHAP model interpretation"}
        </h3>
        <BarChart3 className="text-[#1f6f43]" />
      </div>
      <div className="doc-figure-frame doc-figure-frame-shap mt-6">
        <Image
          src={modelFigures.shapSummary}
          alt={
            locale === "vi"
              ? "Figure 4 trong tài liệu: biểu đồ SHAP summary cho các biến ảnh hưởng đến arsenic trong gạo"
              : "Figure 4 from the paper: SHAP summary plot for drivers of grain arsenic"
          }
          width={614}
          height={709}
          className="doc-figure-image"
        />
      </div>
      <p className="mt-4 text-sm font-semibold leading-[1.55] text-[#5d6a62]">
        {locale === "vi"
          ? "Hình giữ nguyên từ tài liệu: Straw.As, Soil.Al, CO2_sqrt, Soil.S và Soil.Mn là các biến nổi bật trong SHAP summary."
          : "Figure reproduced from the document: Straw.As, Soil.Al, CO2_sqrt, Soil.S and Soil.Mn stand out in the SHAP summary."}
      </p>
    </article>
  );
}

function LandingFinalCta() {
  const { locale } = useLocale();

  return (
    <section className="landing-final-cta">
      <div className="site-container">
        <p className="eyebrow">{locale === "vi" ? "Bắt đầu" : "Next step"}</p>
        <h2>
          {locale === "vi"
            ? "Mở dashboard để xem bản đồ, kịch bản và popup tỉnh/thành."
            : "Open the dashboard to inspect the map, scenarios and province-level popups."}
        </h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/app" className="primary-cta">
            {t(commonText.dashboard, locale)} <ArrowRight size={20} />
          </Link>
          <Link href="/frequently-asked-questions" className="secondary-cta">
            FAQ
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ArchitecturePage() {
  const { locale } = useLocale();

  return (
    <main>
      <PageHero
        icon={<Database />}
        title={{ vi: "Kiến trúc AI cảnh báo arsenic", en: "AI Architecture for Arsenic Early Warning" }}
        subtitle={{
          vi: "Pipeline từ dữ liệu mẫu gạo đến GPR, SHAP, bất định, retraining và RAG chatbot.",
          en: "A pipeline from rice sample data to GPR, SHAP, uncertainty, retraining and RAG chatbot.",
        }}
      />
      <section className="site-container py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {architectureSteps.map((step, index) => (
            <article key={t(step.title, locale)} className="pipeline-card">
              <span className="pipeline-index">{String(index + 1).padStart(2, "0")}</span>
              <h2 className="mt-5 text-2xl font-extrabold text-[#143d2a]">{t(step.title, locale)}</h2>
              <p className="mt-4 font-medium leading-[1.6]">{t(step.body, locale)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function AppDashboardPage() {
  const { locale } = useLocale();
  const { setGrounding } = useAssistantGrounding();
  const [scenario, setScenario] = useState<ScenarioId>("rcp85");
  const [region, setRegion] = useState(riskRegions[0].name);
  const activeScenario = scenarioResults.find((item) => item.id === scenario) ?? scenarioResults[0];
  const activeRegion = riskRegions.find((item) => item.name === region) ?? riskRegions[0];
  const activeValue = regionValue(activeRegion, scenario);
  const activeUncertainty = uncertaintyBands.find((item) => item.scenario === scenario) ?? uncertaintyBands[0];

  useEffect(() => {
    setGrounding({ scenarioId: scenario, regionName: region });
  }, [region, scenario, setGrounding]);

  return (
    <main className="bg-[#f5f8ed] py-10">
      <section className="site-container">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{locale === "vi" ? "Product demo" : "Product demo"}</p>
            <h1 className="mt-2 text-4xl font-extrabold text-[#143d2a]">
              {locale === "vi" ? "Dashboard ưu tiên lấy mẫu arsenic" : "Arsenic sampling-priority dashboard"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <select className="dashboard-select" value={scenario} onChange={(event) => setScenario(event.target.value as ScenarioId)}>
              {scenarioResults.map((item) => (
                <option key={item.id} value={item.id}>
                  {t(item.label, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid content-start gap-6">
            <article className="dashboard-panel">
              <div className="grid gap-5 md:grid-cols-3">
                <Metric title={t(activeScenario.label, locale)} value={`${activeValue} mg/kg`} icon={<AlertTriangle />} />
                <Metric title={locale === "vi" ? "Ưu tiên lấy mẫu" : "Sampling priority"} value={t(activeRegion.priority, locale)} icon={<FlaskConical />} />
                <Metric title={locale === "vi" ? "Ngưỡng tham chiếu" : "Reference threshold"} value={paddyMap.threshold} icon={<ShieldCheck />} />
              </div>
            </article>
            <ArsenicRiskMap
              scenario={scenario}
              onScenarioChange={setScenario}
              selectedRegion={region}
              onRegionChange={setRegion}
            />
          </div>

          <div className="grid gap-6">
            <article className="dashboard-panel">
              <h2 className="text-2xl font-extrabold text-[#143d2a]">
                {locale === "vi" ? "Bất định p10/p90" : "p10/p90 uncertainty"}
              </h2>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ["p10", activeUncertainty.p10],
                  ["p50", activeUncertainty.p50],
                  ["p90", activeUncertainty.p90],
                ].map(([label, value]) => (
                  <div key={label} className="uncertainty-stat">
                    <span>{label}</span>
                    <strong>{value} mg/kg</strong>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-md bg-[#fff8df] p-3 text-sm font-semibold leading-[1.5] text-[#735d13]">
                {locale === "vi"
                  ? `Xác suất ước tính vượt ngưỡng tham chiếu 0.20 mg/kg: ${activeUncertainty.exceedance}. Đây là cảnh báo sớm, không thay thế xét nghiệm phòng lab hoặc quyết định an toàn thực phẩm chính thức.`
                  : `Estimated probability above the 0.20 mg/kg reference threshold: ${activeUncertainty.exceedance}. This is early warning, not a substitute for laboratory testing or official food-safety decisions.`}
              </p>
            </article>
            <ModelConfigurationCard />
            <article className="dashboard-panel">
              <h2 className="text-2xl font-extrabold text-[#143d2a]">
                {locale === "vi" ? "Khuyến nghị demo" : "Demo recommendation"}
              </h2>
              <div className="mt-5 grid gap-3">
                {[
                  locale === "vi" ? "Ưu tiên lấy mẫu tại vùng có giá trị dự báo cao và độ bất định lớn." : "Prioritize sampling in areas with high predicted values and high uncertainty.",
                  locale === "vi" ? "So sánh RCP4.5 và RCP8.5 trước khi truyền thông rủi ro dài hạn." : "Compare RCP4.5 and RCP8.5 before communicating long-term risk.",
                  locale === "vi" ? "Ghi nhận dữ liệu mới để retrain model theo version." : "Capture new data to retrain the model by version.",
                ].map((item) => (
                  <p key={item} className="flex gap-3 rounded-md bg-[#f6f0d9] p-3 font-semibold leading-[1.45]">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-[#1f6f43]" size={18} />
                    {item}
                  </p>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return (
    <div className="metric-card">
      <div className="mb-4 text-[#1f6f43]">{icon}</div>
      <p className="text-sm font-bold uppercase text-[#7a6a42]">{title}</p>
      <p className="mt-2 text-2xl font-extrabold text-[#143d2a]">{value}</p>
    </div>
  );
}

function ModelConfigurationCard() {
  const { locale } = useLocale();

  return (
    <details className="dashboard-panel technical-details-card">
      <summary>
        <span>
          <span className="eyebrow">{locale === "vi" ? "Technical details" : "Technical details"}</span>
          <strong>{locale === "vi" ? "Model configuration" : "Model configuration"}</strong>
        </span>
        <ChevronDown className="technical-chevron" />
      </summary>
      <p className="mt-4 text-sm font-semibold leading-[1.55] text-[#5d6a62]">
        {locale === "vi"
          ? "GPR, SHAP và CV R² được giữ trong lớp kỹ thuật để minh bạch mô hình, không phải thông điệp chính cho người dùng phổ thông."
          : "GPR, SHAP and CV R² are kept in the technical layer for model transparency, not as the main message for general users."}
      </p>
      <ModelConfigurationRows />
    </details>
  );
}

function ModelConfigurationRows() {
  const { locale } = useLocale();

  return (
    <div className="mt-5 grid gap-2">
      {modelConfiguration.map((item) => (
        <div key={t(item.label, locale)} className="model-config-row">
          <span>{t(item.label, locale)}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function AIAssistantPopup({
  locale,
  scenarioId,
  regionName,
}: {
  locale: Locale;
  scenarioId: ScenarioId;
  regionName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [audienceRole, setAudienceRole] = useState<AudienceRole>("scientist");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitStage, setWaitStage] = useState<"thinking" | "slow" | "waiting">("thinking");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeScenario = scenarioResults.find((item) => item.id === scenarioId) ?? scenarioResults[0];
  const activeRegion = riskRegions.find((item) => item.name === regionName) ?? riskRegions[0];
  const [defaultGroundTruth, setDefaultGroundTruth] = useState<GroundTruthCard>(() => ({
    scenarioId: activeScenario.id,
    scenarioLabel: t(activeScenario.label, locale),
    nationalMean: `${activeScenario.value} mg/kg`,
    max: `${activeScenario.max} mg/kg`,
    threshold: paddyMap.threshold,
    region: locale === "vi" ? activeRegion.viName : activeRegion.name,
    regionValue: `${regionValue(activeRegion, activeScenario.id)} mg/kg`,
    disclaimer: t(commonText.modelNotice, locale),
  }));

  useEffect(() => {
    const nextScenario = scenarioResults.find((item) => item.id === scenarioId) ?? scenarioResults[0];
    const nextRegion = riskRegions.find((item) => item.name === regionName) ?? riskRegions[0];
    setDefaultGroundTruth({
      scenarioId: nextScenario.id,
      scenarioLabel: t(nextScenario.label, locale),
      nationalMean: `${nextScenario.value} mg/kg`,
      max: `${nextScenario.max} mg/kg`,
      threshold: paddyMap.threshold,
      region: locale === "vi" ? nextRegion.viName : nextRegion.name,
      regionValue: `${regionValue(nextRegion, nextScenario.id)} mg/kg`,
      disclaimer: t(commonText.modelNotice, locale),
    });
  }, [locale, scenarioId, regionName]);

  const fallbackQuestions = useMemo(
    () => assistantFallbackQuestions[audienceRole][locale],
    [audienceRole, locale],
  );

  const activeGroundTruth = useMemo(() => defaultGroundTruth, [defaultGroundTruth]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isSubmitting]);

  useEffect(() => {
    if (!isSubmitting) {
      setWaitStage("thinking");
      return;
    }

    const slowTimer = window.setTimeout(() => setWaitStage("slow"), 8000);
    const waitingTimer = window.setTimeout(() => setWaitStage("waiting"), 20000);

    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(waitingTimer);
    };
  }, [isSubmitting]);

  const suggestedQuestions = useMemo(
    () => {
      let latestAssistantSuggestions: string[] = [];
      for (let index = messages.length - 1; index >= 0; index -= 1) {
        const entry = messages[index];
        if (entry.from === "assistant" && entry.audienceRole === audienceRole) {
          latestAssistantSuggestions = entry.suggestedQuestions.slice(0, 4);
          break;
        }
      }

      return latestAssistantSuggestions.length > 0 ? latestAssistantSuggestions : fallbackQuestions;
    },
    [messages, fallbackQuestions, audienceRole],
  );

  const handleAsk = async (presetQuestion?: string) => {
    const nextQuestion = (presetQuestion ?? question).trim();
    if (!nextQuestion || isSubmitting) {
      return;
    }

    const history: ApiChatHistoryMessage[] = messages.slice(-8).map((entry) => ({
      role: entry.from,
      text: entry.text,
    }));

    setQuestion("");
    setIsSubmitting(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        from: "user",
        text: nextQuestion,
        citations: [],
        suggestedQuestions: [],
        nextSteps: [],
        audienceRole,
      },
    ]);

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 65000);
      const response = await (async () => {
        try {
          return await fetch("/api/chat/", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
              message: nextQuestion,
              locale,
              audienceRole,
              scenarioId,
              region: regionName,
              history,
            }),
          });
        } finally {
          window.clearTimeout(timeout);
        }
      })();

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error("Assistant response was not JSON.");
      }

      const payload = (await response.json()) as ApiChatResponse;
      const citations = (payload.citations ?? []).map((item) => ({
        id: item.id,
        title: locale === "vi" ? item.title.vi : item.title.en,
        excerpt: locale === "vi" ? item.excerpt.vi : item.excerpt.en,
        source: locale === "vi" ? item.source.vi : item.source.en,
      }));
      const groundTruth = payload.groundTruth ?? activeGroundTruth;
      const suggested = (payload.suggestedQuestions ?? fallbackQuestions).slice(0, 4);
      const nextSteps = (payload.nextSteps ?? []).slice(0, 4);

      setDefaultGroundTruth(groundTruth);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          from: "assistant",
          text: payload.answer,
          citations,
          suggestedQuestions: suggested,
          nextSteps,
          audienceRole,
          roleLabel: payload.roleLabel,
          actionLevel: payload.actionLevel,
          limitations: payload.limitations,
          isError: response.status === 503,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          from: "assistant",
          text:
            locale === "vi"
              ? "Không nhận được phản hồi từ trợ lý trong thời gian chờ. Hãy thử hỏi ngắn hơn hoặc dùng dashboard để ưu tiên lấy mẫu và xác minh bằng xét nghiệm/speciation phòng lab."
              : "The assistant did not respond within the wait window. Try a narrower question, and use the dashboard for sampling priority with lab testing/speciation before conclusions.",
          citations: [],
          suggestedQuestions: fallbackQuestions,
          nextSteps: [],
          audienceRole,
          isError: true,
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPresetQuestion = (preset: string) => {
    if (isSubmitting) {
      return;
    }
    void handleAsk(preset);
  };

  const openCitation = (messageId: string, citationId: string) => {
    const target = document.getElementById(`citation-${messageId}-${citationId.toUpperCase()}`);
    if (!target) {
      return;
    }

    if (target instanceof HTMLDetailsElement) {
      target.open = true;
    }

    target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const summary = target.querySelector("summary");
    if (summary instanceof HTMLElement) {
      summary.focus({ preventScroll: true });
    }
  };

  const activeRoleLabel = t(assistantRoleLabels[audienceRole], locale);
  const loadingText =
    waitStage === "waiting"
      ? locale === "vi"
        ? "AI live model đang tìm kết quả; tôi sẽ gửi ngay khi model trả về."
        : "The live AI model is still finding the result; I will send it as soon as the model returns."
      : waitStage === "slow"
        ? locale === "vi"
          ? "Đang tổng hợp bằng chứng, có thể mất thêm vài giây..."
          : "Still gathering evidence; this may take a few more seconds..."
        : locale === "vi"
          ? "Đang tổng hợp câu trả lời..."
          : "Drafting the answer...";

  return (
    <section className={cn("ai-assistant-shell", isOpen && "ai-assistant-shell-open")}>
      {!isOpen ? (
        <button
          type="button"
          className="ai-assistant-trigger"
          onClick={() => setIsOpen(true)}
          aria-label={locale === "vi" ? "Mở trợ lý AI" : "Open AI assistant"}
        >
          <span className="ai-assistant-trigger-icon">
            <Bot size={20} />
          </span>
          <span className="ai-assistant-trigger-copy">
            <strong>{locale === "vi" ? "Trợ lý AI" : "AI Assistant"}</strong>
            <small>Preview</small>
          </span>
        </button>
      ) : null}

      {isOpen ? (
        <article className="ai-assistant-panel">
          <header className="ai-assistant-header">
            <div className="ai-assistant-title-row">
              <span className="ai-assistant-panel-icon">
                <MessageSquarePlus size={18} />
              </span>
              <div>
                <h2>{locale === "vi" ? "Trợ lý AI" : "AI Assistant"}</h2>
                <p>
                  {locale === "vi"
                    ? "Hỏi tự nhiên về arsenic, ngưỡng và ưu tiên lấy mẫu."
                    : "Ask naturally about arsenic, thresholds, and sampling priority."}
                </p>
              </div>
            </div>
            <div className="ai-assistant-header-actions">
              <button className="icon-submit" onClick={() => setIsOpen(false)} aria-label={locale === "vi" ? "Đóng" : "Close"} type="button">
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="ai-assistant-role-selector" aria-label={locale === "vi" ? "Vai trò trả lời" : "Answer role"}>
            {assistantRoles.map((role) => (
              <button
                key={role}
                type="button"
                className={cn("ai-assistant-role-button", audienceRole === role && "ai-assistant-role-active")}
                onClick={() => setAudienceRole(role)}
                aria-pressed={audienceRole === role}
              >
                <AssistantRoleIcon role={role} />
                <span>{t(assistantRoleLabels[role], locale)}</span>
              </button>
            ))}
          </div>

          <div className="ai-assistant-messages" aria-live="polite">
            {messages.length === 0 ? (
              <article className="ai-assistant-message ai-assistant-message-assistant">
                <span className="ai-assistant-message-author">{locale === "vi" ? "Trợ lý" : "Assistant"}</span>
                <div className="ai-assistant-bubble">
                  <MarkdownText
                    text={
                      locale === "vi"
                        ? `Vai trò hiện tại: ${activeRoleLabel}. Tôi sẽ trả lời dựa trên dữ liệu dự án và nói rõ khi cần xét nghiệm lab hoặc chuyên gia địa phương.`
                        : `Current role: ${activeRoleLabel}. I will answer from the project data and flag where lab testing or local expert confirmation is needed.`
                    }
                  />
                </div>
              </article>
            ) : (
              messages.map((entry) => (
                <article key={entry.id} className={`ai-assistant-message ai-assistant-message-${entry.from}`}>
                  <span className="ai-assistant-message-author">
                    {entry.from === "assistant" ? (locale === "vi" ? "Trợ lý" : "Assistant") : locale === "vi" ? "Bạn" : "You"}
                  </span>
                  <div className="ai-assistant-bubble">
                    <MarkdownText
                      text={entry.text}
                      onCitationClick={
                        entry.from === "assistant"
                          ? (citationId) => openCitation(entry.id, citationId)
                          : undefined
                      }
                    />
                    {entry.from === "assistant" && (entry.roleLabel || entry.actionLevel) ? (
                      <div className="ai-assistant-response-meta">
                        {entry.roleLabel ? <span>{entry.roleLabel}</span> : null}
                        {entry.actionLevel ? <span>{t(actionLevelLabels[entry.actionLevel], locale)}</span> : null}
                      </div>
                    ) : null}
                    {entry.nextSteps.length > 0 ? (
                      <div className="ai-assistant-next-steps">
                        <strong>{locale === "vi" ? "Bước tiếp theo" : "Next steps"}</strong>
                        <ul>
                          {entry.nextSteps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {entry.limitations ? <p className="ai-assistant-limitations">{entry.limitations}</p> : null}
                    {entry.citations.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {entry.citations.map((citation) => (
                          <details
                            key={citation.id}
                            id={`citation-${entry.id}-${citation.id.toUpperCase()}`}
                            className="ai-assistant-citation"
                          >
                            <summary tabIndex={0}>{`[${citation.id}] ${citation.title}`}</summary>
                            <p className="mt-2 text-xs text-[#1f2937]">{citation.excerpt}</p>
                            <p className="mt-1 text-xs text-[#6b7280]">{citation.source}</p>
                          </details>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))
            )}
            {isSubmitting ? (
              <article className="ai-assistant-message ai-assistant-message-assistant">
                <span className="ai-assistant-message-author">{locale === "vi" ? "Trợ lý" : "Assistant"}</span>
                <div className="ai-assistant-bubble ai-assistant-thinking">
                  <Loader2 size={15} className="ai-assistant-spinner" />
                  <span>{loadingText}</span>
                </div>
              </article>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-assistant-suggestions">
            {suggestedQuestions.map((preset) => (
              <button
                key={preset}
                type="button"
                className="ai-assistant-suggestion"
                onClick={() => sendPresetQuestion(preset)}
                disabled={isSubmitting}
              >
                {preset}
              </button>
            ))}
          </div>

          <form
            className="ai-assistant-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              void handleAsk();
            }}
          >
            <textarea
              className="feedback-input ai-assistant-input"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleAsk();
                }
              }}
              placeholder={locale === "vi" ? "Hỏi bất cứ điều gì về dữ liệu arsenic..." : "Ask anything about the arsenic data..."}
              rows={1}
            />
            <button
              className="icon-submit"
              aria-label={locale === "vi" ? "Gửi câu hỏi" : "Send question"}
              disabled={isSubmitting || question.trim().length === 0}
              type="submit"
            >
              {isSubmitting ? <Loader2 size={18} className="ai-assistant-spinner" /> : <Send size={18} />}
            </button>
          </form>
        </article>
      ) : null}
    </section>
  );
}

export function AboutPage() {
  const { locale } = useLocale();

  return (
    <main>
      <PageHero
        icon={<Users />}
        title={{ vi: "Dự án Hạt Gạo Ngày Mai", en: "The Grain of Tomorrow Project" }}
        subtitle={{
          vi: "Demo chuyển kết quả nghiên cứu arsenic trong gạo thành công cụ truyền thông, cảnh báo sớm và ưu tiên lấy mẫu.",
          en: "A demo translating arsenic-in-rice research into communication, early-warning and sampling-priority tools.",
        }}
      />
      <section className="site-container py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {projectCards.map((card) => (
            <article key={t(card.title, locale)} className="science-card">
              <Sparkles className="text-[#d9a21b]" />
              <h2 className="mt-5 text-2xl font-extrabold text-[#143d2a]">{t(card.title, locale)}</h2>
              <p className="mt-4 font-medium leading-[1.65]">{t(card.body, locale)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function FaqPage() {
  const { locale } = useLocale();
  const [open, setOpen] = useState(0);

  return (
    <main>
      <PageHero
        icon={<Search />}
        title={{ vi: "Câu hỏi thường gặp", en: "Frequently Asked Questions" }}
        subtitle={{
          vi: "Giải thích arsenic, AI, dashboard, chatbot và giới hạn mô hình.",
          en: "Explaining arsenic, AI, the dashboard, chatbot and model limitations.",
        }}
      />
      <section className="site-container py-16">
        <div className="mx-auto max-w-[920px] space-y-4">
          {faqItems.map((item, index) => (
            <div key={t(item.question, locale)} className="faq-item">
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-lg font-extrabold text-[#143d2a]"
                onClick={() => setOpen(open === index ? -1 : index)}
              >
                {t(item.question, locale)}
                <ChevronDown className={cn("shrink-0 transition-transform", open === index && "rotate-180")} />
              </button>
              {open === index ? (
                <div className="border-t border-[#e8dfc8] px-5 py-4 font-medium leading-[1.65]">
                  <p>{t(item.answer, locale)}</p>
                  {item.source ? (
                    <a className="source-link mt-4" href={item.source.href} target="_blank" rel="noreferrer">
                      {t(item.source.label, locale)}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function FeedbackPage() {
  const { locale } = useLocale();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const active = feedbackSteps[step];

  return (
    <main className="bg-[#f5f8ed] py-12">
      <section className="mx-auto max-w-[780px] px-4">
        <p className="eyebrow">{locale === "vi" ? "Demo feedback" : "Demo feedback"}</p>
        <h1 className="mt-2 text-4xl font-extrabold text-[#143d2a]">
          {locale === "vi" ? "Góp ý cho hệ thống cảnh báo arsenic" : "Feedback for the arsenic early-warning system"}
        </h1>
        <div className="mt-6 rounded-lg border border-[#e8dfc8] bg-white p-5">
          <div className="stepper">
            {feedbackSteps.map((item, index) => (
              <button key={t(item.title, locale)} className="step-button" onClick={() => setStep(index)}>
                <span className={cn("step-dot", index <= step && "step-dot-active")}>{index + 1}</span>
                <span>{t(item.title, locale)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-panel mt-6">
          {submitted ? (
            <div className="py-14 text-center">
              <CheckCircle2 className="mx-auto text-[#1f6f43]" size={56} />
              <h2 className="mt-5 text-2xl font-extrabold text-[#143d2a]">
                {locale === "vi" ? "Cảm ơn bạn đã góp ý" : "Thank you for your feedback"}
              </h2>
              <p className="mt-3 font-medium">
                {locale === "vi"
                  ? "Thông tin đã được ghi nhận trong bản mô phỏng."
                  : "Your input has been recorded in this mock flow."}
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold text-[#143d2a]">{t(active.title, locale)}</h2>
              <p className="mt-2 font-medium">{t(active.description, locale)}</p>
              <div className="mt-6 space-y-5">
                {active.fields.map((field) => (
                  <FeedbackControl key={t(field.label, locale)} field={field} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <button
            className="feedback-secondary"
            disabled={step === 0 || submitted}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
          >
            {t(commonText.back, locale)}
          </button>
          <button
            className="feedback-primary"
            onClick={() => {
              if (step === feedbackSteps.length - 1) {
                setSubmitted(true);
              } else {
                setStep((value) => Math.min(feedbackSteps.length - 1, value + 1));
              }
            }}
          >
            {step === feedbackSteps.length - 1 ? t(commonText.submit, locale) : t(commonText.next, locale)}
          </button>
        </div>
      </section>
    </main>
  );
}

function FeedbackControl({ field }: { field: FeedbackField }) {
  const { locale } = useLocale();
  const label = t(field.label, locale);

  return (
    <label className="block">
      <span className="font-extrabold text-[#143d2a]">
        {label} {field.required ? <span className="text-[#d8532b]">*</span> : null}
      </span>
      {field.type === "select" ? (
        <select className="feedback-input mt-2">
          <option>{locale === "vi" ? "Chọn một mục" : "Select one"}</option>
          {field.options?.map((option) => (
            <option key={t(option, locale)}>{t(option, locale)}</option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea className="feedback-input mt-2 min-h-28 resize-y" />
      ) : field.type === "radio" || field.type === "checkbox" ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {field.options?.map((option) => (
            <span key={t(option, locale)} className="option-pill">
              <input type={field.type} name={label} /> {t(option, locale)}
            </span>
          ))}
        </div>
      ) : (
        <input className="feedback-input mt-2" />
      )}
    </label>
  );
}

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  return (
    <LanguageProvider>
      <AuthContent mode={mode} />
    </LanguageProvider>
  );
}

function AuthContent({ mode }: { mode: "login" | "signup" }) {
  const { locale } = useLocale();
  const isLogin = mode === "login";

  return (
    <main className="auth-page">
      <Link href="/" className="flex flex-col items-center text-[#1f6f43]">
        <span className="grain-logo h-16 w-16">
          <Image src={assets.logo} width={64} height={64} alt="" className="h-12 w-12" priority />
        </span>
        <span className="brand-wordmark mt-3 text-2xl">{t(brand.name, locale)}</span>
      </Link>
      <form className="auth-card">
        <h1 className="text-center text-3xl font-extrabold text-[#143d2a]">
          {isLogin
            ? locale === "vi"
              ? "Đăng nhập demo"
              : "Demo login"
            : locale === "vi"
              ? "Tạo tài khoản demo"
              : "Create demo account"}
        </h1>
        <div className="mt-8 space-y-5">
          <input className="feedback-input" placeholder={locale === "vi" ? "Email hoặc tên người dùng" : "Email or username"} />
          <input className="feedback-input" placeholder="Password" type="password" />
          {!isLogin ? <input className="feedback-input" placeholder={locale === "vi" ? "Tổ chức" : "Organization"} /> : null}
        </div>
        <button type="button" className="feedback-primary mt-8 w-full">
          {isLogin ? (locale === "vi" ? "Đăng nhập" : "Login") : locale === "vi" ? "Tạo tài khoản" : "Create account"}
        </button>
        <p className="mt-5 text-center font-medium">
          <Link className="font-extrabold text-[#1f6f43]" href={isLogin ? "/signup" : "/login"}>
            {isLogin
              ? locale === "vi"
                ? "Chưa có tài khoản demo?"
                : "Need a demo account?"
              : locale === "vi"
                ? "Đã có tài khoản?"
                : "Already have an account?"}
          </Link>
        </p>
      </form>
    </main>
  );
}

function PageHero({ icon, title, subtitle }: { icon: ReactNode; title: LocalizedText; subtitle: LocalizedText }) {
  const { locale } = useLocale();

  return (
    <section className="page-hero">
      <div className="page-hero-gradient" />
      <div className="site-container relative z-10 py-20">
        <div className="hero-icon">{icon}</div>
        <h1 className="mt-6 max-w-[920px] text-[46px] font-extrabold leading-tight text-[#143d2a]">
          {t(title, locale)}
        </h1>
        <p className="mt-5 max-w-[760px] text-xl font-semibold leading-[1.55] text-[#4c5a50]">
          {t(subtitle, locale)}
        </p>
      </div>
    </section>
  );
}

function Footer() {
  const { locale } = useLocale();

  return (
    <footer className="border-t border-[#e8dfc8] bg-[#143d2a] py-10 text-white">
      <div className="site-container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xl font-extrabold">{t(brand.name, locale)}</p>
          <p className="mt-1 text-sm font-medium text-[#dce8d9]">{t(brand.tagline, locale)}</p>
        </div>
        <p className="max-w-[520px] text-sm font-medium leading-[1.5] text-[#dce8d9]">
          {t(brand.disclaimer, locale)}
        </p>
      </div>
    </footer>
  );
}
