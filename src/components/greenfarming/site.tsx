"use client";

import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Database,
  FlaskConical,
  Layers3,
  LocateFixed,
  Menu,
  MousePointer2,
  MousePointerClick,
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
  navItems,
  onboardingTour,
  paddyMap,
  paddyMapProjection,
  paddyMapSamples,
  projectContact,
  projectCards,
  requiredMetrics,
  riskRegions,
  scenarioResults,
  scenarioTrendSeries,
  text,
  uncertaintyBands,
} from "@/lib/greenfarming-data";
import { basePath } from "@/lib/public-path";
import { cn } from "@/lib/utils";
import type { ActionLevel, AudienceRole } from "@/lib/chat-assistant";
import type { FeedbackField, Locale, LocalizedText } from "@/types/greenfarming";
import {
  createContext,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
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

type OnboardingTourAction = "scroll-dashboard" | "show-scenario-map" | "scroll-technical-chart" | "open-assistant";

type OnboardingTourStep = {
  id: string;
  target: string;
  fallbackTarget?: string;
  action?: OnboardingTourAction;
  title: LocalizedText;
  body: LocalizedText;
  mobileBody?: LocalizedText;
};

type OnboardingTourContextValue = {
  startTour: () => void;
  startRequestId: number;
};

type OnboardingTargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
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
  fullText?: string;
  isTyping?: boolean;
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

type PaddyMapSample = (typeof paddyMapSamples)[keyof typeof paddyMapSamples][number];

type ProjectedPaddySample = {
  x: number;
  y: number;
  value: number;
};

type PaddySampleGrid = {
  buckets: Map<string, ProjectedPaddySample[]>;
  cellSize: number;
  samples: ProjectedPaddySample[];
};

type PaddyMaskPixels = {
  indexes: Uint32Array;
  alphas: Uint8ClampedArray;
};

const paddyMaskPixelsCache = new Map<string, Promise<PaddyMaskPixels>>();
let paddyMaskImagePromise: Promise<HTMLImageElement> | null = null;

const paddyRasterColors = {
  green: [94, 169, 90] as const,
  yellow: [224, 194, 74] as const,
  red: [216, 83, 43] as const,
};

const paddyInterpolationNeighborCount = 120;
const paddyInterpolationMaxRing = 16;
const paddyMercatorTop = mercatorY(paddyMapProjection.bbox.latMax);
const paddyMercatorBottom = mercatorY(paddyMapProjection.bbox.latMin);

function mercatorY(latitude: number) {
  const radians = (Math.max(-85.05112878, Math.min(85.05112878, latitude)) * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

function inverseMercatorY(value: number) {
  return ((Math.atan(Math.exp(value)) * 2 - Math.PI / 2) * 180) / Math.PI;
}

function projectPaddySample(sample: PaddyMapSample, width: number, height: number): ProjectedPaddySample {
  return {
    x:
      ((sample.longitude - paddyMapProjection.bbox.lonMin) /
        (paddyMapProjection.bbox.lonMax - paddyMapProjection.bbox.lonMin)) *
      (width - 1),
    y:
      ((paddyMercatorTop - mercatorY(sample.latitude)) / (paddyMercatorTop - paddyMercatorBottom)) *
      (height - 1),
    value: sample.value,
  };
}

function loadPaddyMaskImage(src: string) {
  if (paddyMaskImagePromise) {
    return paddyMaskImagePromise;
  }

  paddyMaskImagePromise = new Promise((resolve, reject) => {
    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load paddy mask: ${src}`));
    image.src = src;
  });

  return paddyMaskImagePromise;
}

function getPaddyMaskPixels(src: string, width: number, height: number) {
  const cacheKey = `${src}:${width}x${height}`;
  const cached = paddyMaskPixelsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const promise = loadPaddyMaskImage(src).then((image) => {
    const maskWidth = image.naturalWidth || image.width;
    const maskHeight = image.naturalHeight || image.height;
    const maskCanvas = document.createElement("canvas");
    const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });

    if (!maskContext) {
      return { indexes: new Uint32Array(), alphas: new Uint8ClampedArray() };
    }

    maskCanvas.width = maskWidth;
    maskCanvas.height = maskHeight;
    maskContext.drawImage(image, 0, 0, maskWidth, maskHeight);

    const maskData = maskContext.getImageData(0, 0, maskWidth, maskHeight).data;
    const maskXByColumn = new Int32Array(width);
    const maskYByRow = new Int32Array(height);
    const indexes: number[] = [];
    const alphas: number[] = [];

    for (let x = 0; x < width; x += 1) {
      const longitude =
        paddyMapProjection.bbox.lonMin +
        (x / Math.max(1, width - 1)) * (paddyMapProjection.bbox.lonMax - paddyMapProjection.bbox.lonMin);
      maskXByColumn[x] = Math.max(
        0,
        Math.min(
          maskWidth - 1,
          Math.round(
            ((longitude - paddyMapProjection.bbox.lonMin) /
              (paddyMapProjection.bbox.lonMax - paddyMapProjection.bbox.lonMin)) *
              (maskWidth - 1),
          ),
        ),
      );
    }

    for (let y = 0; y < height; y += 1) {
      const projectedY =
        paddyMercatorTop -
        (y / Math.max(1, height - 1)) * (paddyMercatorTop - paddyMercatorBottom);
      const latitude = inverseMercatorY(projectedY);
      maskYByRow[y] = Math.max(
        0,
        Math.min(
          maskHeight - 1,
          Math.round(
            ((paddyMapProjection.bbox.latMax - latitude) /
              (paddyMapProjection.bbox.latMax - paddyMapProjection.bbox.latMin)) *
              (maskHeight - 1),
          ),
        ),
      );
    }

    for (let y = 0; y < height; y += 1) {
      const canvasRowOffset = y * width;
      const maskRowOffset = maskYByRow[y] * maskWidth * 4;

      for (let x = 0; x < width; x += 1) {
        const alpha = maskData[maskRowOffset + maskXByColumn[x] * 4 + 3];

        if (alpha === 0) {
          continue;
        }

        indexes.push(canvasRowOffset + x);
        alphas.push(alpha);
      }
    }

    return {
      indexes: Uint32Array.from(indexes),
      alphas: Uint8ClampedArray.from(alphas),
    };
  });

  paddyMaskPixelsCache.set(cacheKey, promise);
  return promise;
}

function buildPaddySampleGrid(samples: ProjectedPaddySample[], width: number): PaddySampleGrid {
  const cellSize = Math.max(64, Math.round(width / 15));
  const buckets = new Map<string, ProjectedPaddySample[]>();

  for (const sample of samples) {
    const key = `${Math.floor(sample.x / cellSize)},${Math.floor(sample.y / cellSize)}`;
    const bucket = buckets.get(key);

    if (bucket) {
      bucket.push(sample);
    } else {
      buckets.set(key, [sample]);
    }
  }

  return { buckets, cellSize, samples };
}

function nearbyPaddySamples(x: number, y: number, sampleGrid: PaddySampleGrid) {
  const gridX = Math.floor(x / sampleGrid.cellSize);
  const gridY = Math.floor(y / sampleGrid.cellSize);
  const candidates: ProjectedPaddySample[] = [];

  for (let ring = 0; ring <= paddyInterpolationMaxRing; ring += 1) {
    for (let cellY = gridY - ring; cellY <= gridY + ring; cellY += 1) {
      for (let cellX = gridX - ring; cellX <= gridX + ring; cellX += 1) {
        if (ring > 0 && gridX - ring < cellX && cellX < gridX + ring && gridY - ring < cellY && cellY < gridY + ring) {
          continue;
        }

        const bucket = sampleGrid.buckets.get(`${cellX},${cellY}`);

        if (bucket) {
          candidates.push(...bucket);
        }
      }
    }

    if (candidates.length >= paddyInterpolationNeighborCount) {
      break;
    }
  }

  const selected = candidates.length > 0 ? candidates : sampleGrid.samples;
  return [...selected]
    .sort((left, right) => (x - left.x) ** 2 + (y - left.y) ** 2 - ((x - right.x) ** 2 + (y - right.y) ** 2))
    .slice(0, paddyInterpolationNeighborCount);
}

function interpolatePaddyValue(x: number, y: number, sampleGrid: PaddySampleGrid) {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const sample of nearbyPaddySamples(x, y, sampleGrid)) {
    const distanceSq = (x - sample.x) ** 2 + (y - sample.y) ** 2;

    if (distanceSq < 0.0001) {
      return sample.value;
    }

    const weight = 1 / Math.max(1, distanceSq ** 0.65);
    weightedSum += weight * sample.value;
    weightTotal += weight;
  }

  return weightedSum / weightTotal;
}

function paddyColorForValue(value: number) {
  const mixColor = (from: readonly [number, number, number], to: readonly [number, number, number], ratio: number) => {
    const clampedRatio = Math.max(0, Math.min(1, ratio));

    return [
      Math.round(from[0] + (to[0] - from[0]) * clampedRatio),
      Math.round(from[1] + (to[1] - from[1]) * clampedRatio),
      Math.round(from[2] + (to[2] - from[2]) * clampedRatio),
    ] as const;
  };

  if (value <= 0.2) {
    return mixColor([69, 143, 82], paddyRasterColors.green, value / 0.2);
  }

  if (value <= 0.35) {
    return mixColor(paddyRasterColors.green, paddyRasterColors.yellow, (value - 0.2) / 0.15);
  }

  return mixColor(paddyRasterColors.yellow, paddyRasterColors.red, (value - 0.35) / 0.2);
}

function PaddyRasterCanvas({
  scenarioId,
  className,
  width = paddyMapProjection.width,
  height = paddyMapProjection.height,
}: {
  scenarioId: ScenarioId;
  className?: string;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    if (!canvas || !context) {
      return () => {
        cancelled = true;
      };
    }

    context.clearRect(0, 0, width, height);

    getPaddyMaskPixels(paddyMap.mask, width, height)
      .then((maskPixels) => {
        if (cancelled) {
          return;
        }

        const sampleSets: Record<string, PaddyMapSample[]> = paddyMapSamples;
        const rawSamples = sampleSets[scenarioId] ?? paddyMapSamples.baseline;
        const sampleGrid = buildPaddySampleGrid(
          rawSamples.map((sample) => projectPaddySample(sample, width, height)),
          width,
        );
        const imageData = context.createImageData(width, height);

        for (let index = 0; index < maskPixels.indexes.length; index += 1) {
          const pixelIndex = maskPixels.indexes[index];
          const x = pixelIndex % width;
          const y = Math.floor(pixelIndex / width);
          const value = interpolatePaddyValue(x, y, sampleGrid);
          const [red, green, blue] = paddyColorForValue(value);
          const offset = pixelIndex * 4;

          imageData.data[offset] = red;
          imageData.data[offset + 1] = green;
          imageData.data[offset + 2] = blue;
          imageData.data[offset + 3] = Math.min(214, Math.max(126, maskPixels.alphas[index]));
        }

        context.putImageData(imageData, 0, 0);
      })
      .catch(() => {
        if (!cancelled) {
          context.clearRect(0, 0, width, height);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [height, scenarioId, width]);

  return <canvas ref={canvasRef} width={width} height={height} className={className} aria-hidden="true" />;
}

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
const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(null);
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

function OnboardingTourProvider({ children }: { children: ReactNode }) {
  const [startRequestId, setStartRequestId] = useState(0);
  const startTour = useCallback(() => {
    setStartRequestId((value) => value + 1);
  }, []);
  const value = useMemo(() => ({ startTour, startRequestId }), [startTour, startRequestId]);

  return <OnboardingTourContext.Provider value={value}>{children}</OnboardingTourContext.Provider>;
}

function useOnboardingTour() {
  const context = useContext(OnboardingTourContext);
  if (!context) {
    throw new Error("useOnboardingTour must be used inside OnboardingTourProvider");
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

const onboardingSteps = onboardingTour.steps as readonly OnboardingTourStep[];

function focusableElements(container: HTMLElement) {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter((element) => {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}

function OnboardingTargetCue({
  stepId,
  locale,
  isMobile,
  targetRect,
  viewport,
}: {
  stepId: string;
  locale: Locale;
  isMobile: boolean;
  targetRect: OnboardingTargetRect | null;
  viewport: { width: number; height: number };
}) {
  if (!targetRect) {
    return null;
  }

  if (stepId === "scenario-chooser") {
    const cueStyle = {
      "--onboarding-cue-top": `${targetRect.top + Math.min(targetRect.height - 46, Math.max(48, targetRect.height * (isMobile ? 0.62 : 0.58)))}px`,
      "--onboarding-cue-left": `${targetRect.left + Math.min(targetRect.width - 132, Math.max(42, targetRect.width * 0.58))}px`,
    } as CSSProperties;

    return (
      <div className="onboarding-target-cue onboarding-target-cue-scenario" style={cueStyle} aria-hidden="true">
        <span className="onboarding-target-pointer onboarding-target-pointer-click">
          <MousePointerClick size={26} />
        </span>
        <span>{isMobile ? (locale === "vi" ? "Chạm kịch bản" : "Tap scenario") : locale === "vi" ? "Click kịch bản" : "Click scenario"}</span>
      </div>
    );
  }

  if (stepId === "province-values") {
    const cueStyle = {
      "--onboarding-cue-top": `${targetRect.top + Math.min(targetRect.height - 92, Math.max(64, targetRect.height * (isMobile ? 0.34 : 0.42)))}px`,
      "--onboarding-cue-left": `${targetRect.left + Math.min(targetRect.width - 120, Math.max(48, targetRect.width * 0.42))}px`,
    } as CSSProperties;

    return (
      <div className="onboarding-target-cue onboarding-target-cue-map" style={cueStyle} aria-hidden="true">
        <span className="onboarding-target-pointer onboarding-target-pointer-hover">
          <MousePointer2 size={28} />
        </span>
        <span>{isMobile ? (locale === "vi" ? "Chạm vào tỉnh" : "Tap province") : locale === "vi" ? "Rê chuột trên bản đồ" : "Hover the map"}</span>
        <strong>0.284 mg/kg</strong>
      </div>
    );
  }

  if (stepId === "technical-chart" || stepId === "scenario-values") {
    const maxLeft = Math.max(14, viewport.width - (isMobile ? 158 : 236));
    const cueStyle = {
      "--onboarding-cue-top": `${Math.max(14, targetRect.top - (isMobile ? 52 : 58))}px`,
      "--onboarding-cue-left": `${Math.min(maxLeft, Math.max(14, targetRect.left + 16))}px`,
    } as CSSProperties;

    return (
      <div className="onboarding-target-cue onboarding-target-cue-chart" style={cueStyle} aria-hidden="true">
        <span className="onboarding-target-pointer onboarding-target-pointer-hover">
          <MousePointer2 size={28} />
        </span>
        <span>{isMobile ? (locale === "vi" ? "Chạm điểm" : "Tap point") : locale === "vi" ? "Rê chuột điểm dữ liệu" : "Hover data point"}</span>
      </div>
    );
  }

  return null;
}

function OnboardingTour() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const { startRequestId } = useOnboardingTour();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<OnboardingTargetRect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const autoStartCheckedRef = useRef(false);
  const currentStep = onboardingSteps[stepIndex] ?? onboardingSteps[0];
  const isLastStep = stepIndex === onboardingSteps.length - 1;
  const isChartStep = currentStep.id === "technical-chart" || currentStep.id === "scenario-values";

  const beginTour = useCallback(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setStepIndex(0);
    setActive(true);
  }, []);

  const completeTour = useCallback(() => {
    try {
      window.localStorage.setItem(onboardingTour.storageKey, "true");
    } catch {
      // Browsers can deny storage; closing the active guide is still useful.
    }

    setActive(false);
    setStepIndex(0);
    window.setTimeout(() => previousFocusRef.current?.focus({ preventScroll: true }), 0);
  }, []);

  const updateViewport = useCallback(() => {
    const nextViewport = { width: window.innerWidth, height: window.innerHeight };
    setViewport((current) =>
      current.width === nextViewport.width && current.height === nextViewport.height ? current : nextViewport,
    );
    setIsMobile(window.matchMedia("(max-width: 639px)").matches);
  }, []);

  const findTarget = useCallback((step: OnboardingTourStep) => {
    const target = document.querySelector<Element>(`[data-onboarding-target="${step.target}"]`);
    if (target && target.getClientRects().length > 0) {
      return target;
    }

    if (step.fallbackTarget) {
      const fallback = document.querySelector<Element>(`[data-onboarding-target="${step.fallbackTarget}"]`);
      if (fallback && fallback.getClientRects().length > 0) {
        return fallback;
      }
    }

    return null;
  }, []);

  const measureTarget = useCallback(() => {
    updateViewport();
    const target = findTarget(currentStep);

    if (!target) {
      setTargetRect(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const padding = window.matchMedia("(max-width: 639px)").matches ? 6 : 8;
    const top = Math.max(6, rect.top - padding);
    const left = Math.max(6, rect.left - padding);
    setTargetRect({
      top,
      left,
      width: Math.min(window.innerWidth - left - 6, rect.width + padding * 2),
      height: Math.min(window.innerHeight - top - 6, rect.height + padding * 2),
    });
  }, [currentStep, findTarget, updateViewport]);

  useEffect(() => {
    if (startRequestId > 0) {
      const timer = window.setTimeout(beginTour, 0);
      return () => window.clearTimeout(timer);
    }
  }, [beginTour, startRequestId]);

  useEffect(() => {
    if (pathname !== "/" || autoStartCheckedRef.current) {
      return;
    }

    autoStartCheckedRef.current = true;

    try {
      const manualStartPending = window.sessionStorage.getItem(onboardingTour.pendingManualStartKey) === "true";
      if (manualStartPending) {
        window.sessionStorage.removeItem(onboardingTour.pendingManualStartKey);
      }

      const shouldStart = manualStartPending || window.localStorage.getItem(onboardingTour.storageKey) !== "true";
      if (!shouldStart) {
        return;
      }
    } catch {
      // Treat storage failures like a first visit.
    }

    const timer = window.setTimeout(beginTour, 0);
    return () => window.clearTimeout(timer);
  }, [beginTour, pathname]);

  useEffect(() => {
    if (!active) {
      return;
    }

    if (currentStep.action === "open-assistant") {
      window.dispatchEvent(new Event(onboardingTour.openAssistantEvent));
    }

    const target = findTarget(currentStep);
    const scrollTarget =
      currentStep.action === "scroll-dashboard"
        ? document.getElementById("dashboard")
        : currentStep.action === "show-scenario-map"
          ? document.querySelector<HTMLElement>('[data-onboarding-target="risk-map"]') ?? target
        : currentStep.action === "scroll-technical-chart"
          ? findTarget(currentStep)
          : target;

    if (currentStep.action === "scroll-dashboard" && window.location.hash !== "#dashboard") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#dashboard`);
    }

    const scrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

    if (isChartStep) {
      const chartCard = document.querySelector<Element>('[data-onboarding-target="technical-chart"]');
      const desiredTop = window.matchMedia("(max-width: 639px)").matches ? 54 : 310;
      const chartTop = chartCard?.getBoundingClientRect().top ?? scrollTarget?.getBoundingClientRect().top;

      if (typeof chartTop === "number") {
        window.scrollTo({
          top: Math.max(0, window.scrollY + chartTop - desiredTop),
          behavior: scrollBehavior,
        });
      }
    } else {
      scrollTarget?.scrollIntoView({
        behavior: scrollBehavior,
        block: currentStep.action === "scroll-dashboard" || currentStep.action === "show-scenario-map" ? "start" : "center",
        inline: "nearest",
      });
    }

    const timers = [40, 220, 520, 900].map((delay) => window.setTimeout(measureTarget, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [active, currentStep, findTarget, isChartStep, measureTarget]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const isInsideTourPanel = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(".onboarding-panel"));
    const preventBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      if (isInsideTourPanel(event.target)) {
        return;
      }

      event.preventDefault();
    };
    const preventScrollKeys = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA", "BUTTON", "A"].includes(target.tagName));
      const scrollKeys = new Set(["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "]);

      if (!scrollKeys.has(event.key) || isEditableTarget || isInsideTourPanel(target)) {
        return;
      }

      event.preventDefault();
    };

    document.documentElement.classList.add("onboarding-scroll-lock");
    document.body.classList.add("onboarding-scroll-lock");
    document.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
    document.addEventListener("keydown", preventScrollKeys, true);

    return () => {
      document.documentElement.classList.remove("onboarding-scroll-lock");
      document.body.classList.remove("onboarding-scroll-lock");
      document.removeEventListener("wheel", preventBackgroundScroll);
      document.removeEventListener("touchmove", preventBackgroundScroll);
      document.removeEventListener("keydown", preventScrollKeys, true);
    };
  }, [active]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const handleViewportChange = () => measureTarget();
    const initialMeasureTimer = window.setTimeout(measureTarget, 0);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.clearTimeout(initialMeasureTimer);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [active, measureTarget]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const focusTimer = window.setTimeout(() => panelRef.current?.focus({ preventScroll: true }), 80);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        completeTour();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = focusableElements(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, completeTour]);

  const panelStyle = useMemo(() => {
    if (!targetRect || isMobile || viewport.width === 0 || viewport.height === 0) {
      return undefined;
    }

    const panelWidth = 390;
    const estimatedPanelHeight = 280;
    const gap = 18;
    const margin = 16;

    if (isChartStep) {
      const left = Math.min(
        Math.max(margin, targetRect.left - panelWidth - gap),
        viewport.width - panelWidth - margin,
      );

      return {
        "--onboarding-panel-left": `${left}px`,
        "--onboarding-panel-top": `${margin}px`,
      } as CSSProperties;
    }

    const canPlaceRight = targetRect.left + targetRect.width + gap + panelWidth <= viewport.width - margin;
    const canPlaceLeft = targetRect.left - gap - panelWidth >= margin;
    const left = canPlaceRight
      ? targetRect.left + targetRect.width + gap
      : canPlaceLeft
        ? targetRect.left - gap - panelWidth
        : Math.min(
            Math.max(margin, targetRect.left + targetRect.width / 2 - panelWidth / 2),
            viewport.width - panelWidth - margin,
          );
    const below = targetRect.top + targetRect.height + gap;
    const above = targetRect.top - gap - estimatedPanelHeight;
    const top =
      below + estimatedPanelHeight <= viewport.height - margin
        ? below
        : above >= margin
          ? above
          : Math.min(
              Math.max(margin, targetRect.top + targetRect.height / 2 - estimatedPanelHeight / 2),
              viewport.height - estimatedPanelHeight - margin,
            );

    return {
      "--onboarding-panel-left": `${left}px`,
      "--onboarding-panel-top": `${top}px`,
    } as CSSProperties;
  }, [isChartStep, isMobile, targetRect, viewport]);

  const spotlightStyle = targetRect
    ? ({
        "--onboarding-target-top": `${targetRect.top}px`,
        "--onboarding-target-left": `${targetRect.left}px`,
        "--onboarding-target-width": `${targetRect.width}px`,
        "--onboarding-target-height": `${targetRect.height}px`,
      } as CSSProperties)
    : undefined;

  if (!active) {
    return null;
  }

  const body = isMobile && currentStep.mobileBody ? currentStep.mobileBody : currentStep.body;

  return (
    <section className="onboarding-tour-layer" aria-live="polite">
      {targetRect ? (
        <div className="onboarding-spotlight" style={spotlightStyle} aria-hidden="true" />
      ) : (
        <div className="onboarding-scrim" aria-hidden="true" />
      )}
      <OnboardingTargetCue
        stepId={currentStep.id}
        locale={locale}
        isMobile={isMobile}
        targetRect={targetRect}
        viewport={viewport}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
        aria-describedby="onboarding-tour-body"
        className={cn("onboarding-panel", !targetRect && "onboarding-panel-centered")}
        style={panelStyle}
        tabIndex={-1}
      >
        <div className="onboarding-panel-header">
          <span className="onboarding-step-count">
            {t(onboardingTour.controls.progress, locale)} {stepIndex + 1}/{onboardingSteps.length}
          </span>
          <button
            type="button"
            className="onboarding-close-button"
            onClick={completeTour}
            aria-label={t(onboardingTour.controls.close, locale)}
          >
            <X size={16} />
          </button>
        </div>
        <h2 id="onboarding-tour-title">{t(currentStep.title, locale)}</h2>
        <p id="onboarding-tour-body">{t(body, locale)}</p>
        <div className="onboarding-progress-dots" aria-hidden="true">
          {onboardingSteps.map((step, index) => (
            <span key={step.id} className={cn(index <= stepIndex && "onboarding-progress-dot-active")} />
          ))}
        </div>
        <div className="onboarding-actions">
          <button
            type="button"
            className="onboarding-link-button"
            onClick={completeTour}
            aria-label={t(onboardingTour.controls.skip, locale)}
          >
            {t(onboardingTour.controls.skip, locale)}
          </button>
          <div>
            <button
              type="button"
              className="onboarding-secondary-button"
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              disabled={stepIndex === 0}
              aria-label={t(onboardingTour.controls.back, locale)}
            >
              {t(onboardingTour.controls.back, locale)}
            </button>
            <button
              type="button"
              className="onboarding-primary-button"
              onClick={() => {
                if (isLastStep) {
                  completeTour();
                } else {
                  setStepIndex((index) => Math.min(onboardingSteps.length - 1, index + 1));
                }
              }}
              aria-label={t(isLastStep ? onboardingTour.controls.finish : onboardingTour.controls.next, locale)}
            >
              {t(isLastStep ? onboardingTour.controls.finish : onboardingTour.controls.next, locale)}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AssistantGroundingProvider>
        <OnboardingTourProvider>
          <div className="min-h-screen bg-[#fbfaf5] text-[#34403a]">
            <Header />
            {children}
            <Footer />
            <GlobalAIAssistant />
            <OnboardingTour />
          </div>
        </OnboardingTourProvider>
      </AssistantGroundingProvider>
    </LanguageProvider>
  );
}

function GlobalAIAssistant() {
  const { locale } = useLocale();

  return (
    <AIAssistantPopup
      locale={locale}
      scenarioId={defaultAssistantGrounding.scenarioId}
      regionName={defaultAssistantGrounding.regionName}
    />
  );
}

function Header() {
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const { startTour } = useOnboardingTour();
  const [open, setOpen] = useState(false);
  const resolveNavHref = (href: string) => (href.startsWith("#") && pathname !== "/" ? `/${href}` : href);
  const handleOpenGuide = () => {
    setOpen(false);

    if (pathname !== "/") {
      try {
        window.sessionStorage.setItem(onboardingTour.pendingManualStartKey, "true");
      } catch {
        // If session storage is unavailable, navigating home is still the useful fallback.
      }
      window.location.href = `${basePath}/#dashboard`;
      return;
    }

    startTour();
  };

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
          {navItems.map((item) => {
            const href = resolveNavHref(item.href);
            return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "transition-colors hover:text-[#1f6f43]",
                pathname === href && "text-[#1f6f43]",
              )}
            >
              {t(item.label, locale)}
            </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2 xl:ml-4 xl:flex">
          <button
            type="button"
            className="guide-button"
            onClick={handleOpenGuide}
            aria-label={t(onboardingTour.controls.reopen, locale)}
          >
            <Sparkles size={16} />
            <span>{t(onboardingTour.controls.reopen, locale)}</span>
          </button>
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
            {navItems.map((item) => {
              const href = resolveNavHref(item.href);
              return (
              <Link
                key={item.href}
                href={href}
                className="text-base font-bold text-[#34403a]"
                onClick={() => setOpen(false)}
              >
                {t(item.label, locale)}
              </Link>
              );
            })}
            <button
              type="button"
              className="guide-button guide-button-mobile"
              onClick={handleOpenGuide}
              aria-label={t(onboardingTour.controls.reopen, locale)}
            >
              <Sparkles size={16} />
              <span>{t(onboardingTour.controls.reopen, locale)}</span>
            </button>
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
      <section className="grain-hero landing-hero" data-onboarding-target="project-intro">
        <div className="grain-field-visual" aria-hidden="true">
          <PaddyRasterCanvas scenarioId="rcp85" className="hero-paddy-raster" />
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
              <Link href="/#why-it-matters" className="secondary-cta">
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
        <PaddyRasterCanvas scenarioId="rcp85" className="landing-mini-map-layer landing-mini-raster-layer" />
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
          <div key={`${stat.value}-${t(stat.label, locale)}`} className="stat-card">
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
            <article key={`${metric.value}-${t(metric.label, locale)}`} className="metric-card">
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
    <section id="dashboard" className="landing-dashboard-section scroll-mt-24 bg-[#f3f7ea] py-20" data-onboarding-target="dashboard">
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
        </div>
        <div className="grid content-start gap-5">
          {/* Dashboard view tabs removed for compact landing layout */}
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
                  <div className="scenario-mini-metrics">
                    <span>Max {result.max} mg/kg</span>
                    <span>{result.increase}</span>
                  </div>
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

function scenarioUncertainty(scenarioId: ScenarioId) {
  return uncertaintyBands.find((item) => item.scenario === scenarioId) ?? uncertaintyBands[0];
}

function regionValue(region: (typeof riskRegions)[number], scenario: ScenarioId) {
  return scenario === "baseline" ? region.baseline : scenario === "rcp45" ? region.rcp45 : region.rcp85;
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function shortScenarioLabel(scenarioId: ScenarioId) {
  if (scenarioId === "baseline") {
    return "Baseline";
  }

  if (scenarioId === "rcp45") {
    return "RCP4.5";
  }

  return "RCP8.5";
}

function ScenarioChooser({
  activeScenarioId,
  onScenarioChange,
  locale,
  className,
}: {
  activeScenarioId: ScenarioId;
  onScenarioChange: (scenario: ScenarioId) => void;
  locale: Locale;
  className?: string;
}) {
  return (
    <div
      className={cn("scenario-choice-panel", className)}
      role="radiogroup"
      aria-label={locale === "vi" ? "Chọn kịch bản khí hậu" : "Choose climate scenario"}
      data-onboarding-target="scenario-chooser"
    >
      <div className="scenario-choice-heading">
        <span>{locale === "vi" ? "Kịch bản" : "Scenario"}</span>
        <strong>{locale === "vi" ? "Chọn 1 trong 3 kịch bản" : "Choose 1 of 3 scenarios"}</strong>
      </div>
      <div className="scenario-choice-grid">
        {scenarioResults.map((result) => {
          const active = result.id === activeScenarioId;

          return (
            <button
              key={result.id}
              type="button"
              className={cn("scenario-choice-card", active && "scenario-choice-card-active")}
              aria-pressed={active}
              onClick={() => onScenarioChange(result.id)}
            >
              <span className="scenario-choice-label">{t(result.label, locale)}</span>
              <span className="scenario-choice-short-label">{shortScenarioLabel(result.id)}</span>
              <span className="scenario-choice-co2">
                CO2 <strong>{result.co2}</strong> ppm
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScenarioComparison({
  activeScenarioId,
  selectedRegionName,
  locale,
}: {
  activeScenarioId: ScenarioId;
  selectedRegionName?: string;
  locale: Locale;
}) {
  const selectedRegion = selectedRegionName ? riskRegions.find((item) => item.name === selectedRegionName) : undefined;
  const regionLabel = selectedRegion ? (locale === "vi" ? selectedRegion.viName : selectedRegion.name) : undefined;

  return (
    <article className="dashboard-panel scenario-comparison-card">
      <div className="scenario-comparison-header">
        <div>
          <p className="eyebrow">{locale === "vi" ? "So sánh kịch bản" : "Scenario comparison"}</p>
          <h2>{locale === "vi" ? "Nhìn nhanh khác biệt giữa 3 kịch bản" : "Quick comparison across 3 scenarios"}</h2>
        </div>
        {regionLabel ? (
          <span>{locale === "vi" ? `Vùng đang xem: ${regionLabel}` : `Selected region: ${regionLabel}`}</span>
        ) : null}
      </div>
      <div className="scenario-comparison-grid">
        {scenarioResults.map((result) => {
          const uncertainty = scenarioUncertainty(result.id);
          const active = result.id === activeScenarioId;

          return (
            <div key={result.id} className={cn("scenario-comparison-item", active && "scenario-comparison-item-active")}>
              <div className="scenario-comparison-title">
                <strong>{t(result.label, locale)}</strong>
                <span>{t(result.level, locale)}</span>
              </div>
              <dl>
                <div>
                  <dt>{locale === "vi" ? "TB quốc gia" : "National mean"}</dt>
                  <dd>{result.value} mg/kg</dd>
                </div>
                {selectedRegion ? (
                  <div>
                    <dt>{regionLabel}</dt>
                    <dd>{regionValue(selectedRegion, result.id)} mg/kg</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Max</dt>
                  <dd>{result.max} mg/kg</dd>
                </div>
                <div>
                  <dt>{locale === "vi" ? "Dải p10-p90" : "p10-p90 band"}</dt>
                  <dd>{uncertainty.p10}-{uncertainty.p90} mg/kg</dd>
                </div>
                <div>
                  <dt>{locale === "vi" ? "Vượt ngưỡng" : "Exceedance"}</dt>
                  <dd>{uncertainty.exceedance}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function ArsenicScenarioChart({ locale }: { locale: Locale }) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    seriesId: string;
    label: LocalizedText;
    year: number;
    mean: number;
    min: number;
    max: number;
    x: number;
    y: number;
  } | null>(null);
  const threshold = Number.parseFloat(paddyMap.threshold);
  const actualSeries = scenarioTrendSeries.find((series) => series.id === "baseline") ?? scenarioTrendSeries[0];
  const rcp45Series = scenarioTrendSeries.find((series) => series.id === "rcp45") ?? scenarioTrendSeries[1];
  const rcp85Series = scenarioTrendSeries.find((series) => series.id === "rcp85") ?? scenarioTrendSeries[2];
  const allSeries = [actualSeries, rcp45Series, rcp85Series];
  const allPoints = allSeries.flatMap((series) => series.points);
  const minYear = Math.min(2017, ...allPoints.map((point) => point.year));
  const maxYear = Math.max(2050, ...allPoints.map((point) => point.year));
  const yMax = Math.max(0.46, ...allPoints.flatMap((point) => [point.mean, point.p10, point.p90]), threshold) * 1.12;
  const chart = { x0: 76, x1: 816, y0: 46, y1: 330 };
  const xScale = (year: number) => chart.x0 + ((year - minYear) / (maxYear - minYear)) * (chart.x1 - chart.x0);
  const yScale = (value: number) => chart.y1 - (value / yMax) * (chart.y1 - chart.y0);
  const xTicks = [2017, 2020, 2025, 2030, 2035, 2040, 2045, 2050].filter((year) => year >= minYear && year <= maxYear);
  const yTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].filter((tick) => tick <= yMax);
  const linePoints = (points: typeof actualSeries.points) =>
    points.map((point) => `${xScale(point.year)},${yScale(point.mean)}`).join(" ");
  const tooltipX = hoveredPoint ? Math.min(Math.max(hoveredPoint.x - 92, chart.x0 + 8), chart.x1 - 184) : 0;
  const tooltipY = hoveredPoint ? Math.max(hoveredPoint.y - 104, chart.y0 + 8) : 0;
  const formatMgKg = (value: number) => value.toFixed(3).replace(/\.?0+$/, "");
  const showTooltip = (series: typeof actualSeries, point: typeof actualSeries.points[number]) => {
    setHoveredPoint({
      seriesId: series.id,
      label: series.label,
      year: point.year,
      mean: point.mean,
      min: point.min,
      max: point.max,
      x: xScale(point.year),
      y: yScale(point.mean),
    });
  };
  const ribbonPoints = (points: typeof actualSeries.points) => {
    if (points.length < 2) {
      return "";
    }

    const upper = points.map((point) => `${xScale(point.year)},${yScale(point.p90)}`).join(" ");
    const lower = [...points]
      .reverse()
      .map((point) => `${xScale(point.year)},${yScale(point.p10)}`)
      .join(" ");

    return `${upper} ${lower}`;
  };
  const summarySeries = allSeries.map((series) => ({
    series,
    point: series.points.at(-1) ?? series.points[0],
  }));

  return (
    <div
      className="tech-scenario-chart-card"
      aria-label={locale === "vi" ? "Biểu đồ Actual Data và hai kịch bản RCP" : "Actual data and RCP scenario chart"}
      data-onboarding-target="technical-chart"
    >
      <div className="tech-scenario-chart-header">
        <div>
          <p className="eyebrow">{locale === "vi" ? "Technical evidence" : "Technical evidence"}</p>
          <h3>{locale === "vi" ? "Actual Data và dự báo kịch bản khí hậu" : "Actual Data and climate-scenario projections"}</h3>
        </div>
        <span>{locale === "vi" ? "Ngưỡng WHO/FAO" : "WHO/FAO threshold"}: {paddyMap.threshold}</span>
      </div>
      <svg className="tech-scenario-chart" viewBox="0 0 880 410" role="img">
        <title>{locale === "vi" ? "Actual Data, RCP 4.5 và RCP 8.5 theo năm" : "Actual Data, RCP 4.5 and RCP 8.5 by year"}</title>
        <defs>
          <linearGradient id="actualLineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#5ea95a" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="rcp45LineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#d7a52f" />
            <stop offset="100%" stopColor="#f3c84b" />
          </linearGradient>
          <linearGradient id="rcp85LineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#d8532b" />
            <stop offset="100%" stopColor="#ff7a45" />
          </linearGradient>
        </defs>
        <rect className="tech-scenario-plot-bg" x={chart.x0} y={chart.y0} width={chart.x1 - chart.x0} height={chart.y1 - chart.y0} rx="18" />
        {yTicks.map((tick) => (
          <g key={`scenario-y-${tick}`} className="tech-scenario-gridline">
            <line x1={chart.x0} x2={chart.x1} y1={yScale(tick)} y2={yScale(tick)} />
            <text x={chart.x0 - 14} y={yScale(tick) + 5}>{tick.toFixed(2).replace(/0$/, "")}</text>
          </g>
        ))}
        {xTicks.map((year) => (
          <g key={`scenario-x-${year}`} className="tech-scenario-x-tick">
            <line x1={xScale(year)} x2={xScale(year)} y1={chart.y0} y2={chart.y1} />
            <text x={xScale(year)} y={chart.y1 + 30}>{year}</text>
          </g>
        ))}
        <line className="tech-scenario-threshold" x1={chart.x0} x2={chart.x1} y1={yScale(threshold)} y2={yScale(threshold)} />
        <line className="tech-scenario-now" x1={xScale(2025)} x2={xScale(2025)} y1={chart.y0} y2={chart.y1} />
        <text className="tech-scenario-now-label" x={xScale(2025) + 10} y={chart.y0 + 22}>2025</text>
        <text className="tech-scenario-axis-title" x={(chart.x0 + chart.x1) / 2} y="392">Year</text>
        <text className="tech-scenario-axis-title" transform={`translate(22 ${(chart.y0 + chart.y1) / 2}) rotate(-90)`}>Mean Grain As (mg kg⁻¹)</text>
        <text className="tech-scenario-threshold-label" x={chart.x1 - 152} y={yScale(threshold) - 10}>{paddyMap.threshold}</text>

        {actualSeries.points.length > 1 ? (
          <polygon className="tech-scenario-ribbon tech-scenario-ribbon-actual" points={ribbonPoints(actualSeries.points)} />
        ) : null}
        <polygon className="tech-scenario-ribbon tech-scenario-ribbon-rcp45" points={ribbonPoints(rcp45Series.points)} />
        <polygon className="tech-scenario-ribbon tech-scenario-ribbon-rcp85" points={ribbonPoints(rcp85Series.points)} />

        <polyline className="tech-scenario-line tech-scenario-line-actual" points={linePoints(actualSeries.points)} />
        {actualSeries.points.map((point) => (
          <circle
            key={`actual-${point.year}`}
            className="tech-scenario-marker tech-scenario-marker-actual tech-scenario-marker-hover"
            cx={xScale(point.year)}
            cy={yScale(point.mean)}
            r="7"
            onMouseEnter={() => showTooltip(actualSeries, point)}
            onFocus={() => showTooltip(actualSeries, point)}
            onMouseLeave={() => setHoveredPoint(null)}
            onBlur={() => setHoveredPoint(null)}
            tabIndex={0}
          />
        ))}
        <polyline className="tech-scenario-line tech-scenario-line-rcp45" points={linePoints(rcp45Series.points)} />
        {rcp45Series.points.map((point) => (
          <rect
            key={`rcp45-${point.year}`}
            className="tech-scenario-marker-rect tech-scenario-marker-rcp45 tech-scenario-marker-hover"
            x={xScale(point.year) - 6.5}
            y={yScale(point.mean) - 6.5}
            width="13"
            height="13"
            rx="2.5"
            onMouseEnter={() => showTooltip(rcp45Series, point)}
            onFocus={() => showTooltip(rcp45Series, point)}
            onMouseLeave={() => setHoveredPoint(null)}
            onBlur={() => setHoveredPoint(null)}
            tabIndex={0}
          />
        ))}
        <polyline className="tech-scenario-line tech-scenario-line-rcp85" points={linePoints(rcp85Series.points)} />
        {rcp85Series.points.map((point) => (
          <circle
            key={`rcp85-${point.year}`}
            className="tech-scenario-marker tech-scenario-marker-rcp85 tech-scenario-marker-hover"
            cx={xScale(point.year)}
            cy={yScale(point.mean)}
            r="7"
            onMouseEnter={() => showTooltip(rcp85Series, point)}
            onFocus={() => showTooltip(rcp85Series, point)}
            onMouseLeave={() => setHoveredPoint(null)}
            onBlur={() => setHoveredPoint(null)}
            tabIndex={0}
          />
        ))}
        {allSeries.flatMap((series) =>
          series.points.map((point) => (
            <circle
              key={`hit-${series.id}-${point.year}`}
              className="tech-scenario-hit-target"
              data-onboarding-target={series.id === "baseline" && point.year === 2025 ? "technical-chart-hover" : undefined}
              cx={xScale(point.year)}
              cy={yScale(point.mean)}
              r="15"
              onMouseEnter={() => showTooltip(series, point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          )),
        )}
        {hoveredPoint ? (
          <g className="tech-scenario-tooltip" transform={`translate(${tooltipX} ${tooltipY})`} pointerEvents="none">
            <rect width="184" height="90" rx="14" />
            <text className="tech-scenario-tooltip-title" x="14" y="24">
              {t(hoveredPoint.label, locale)}
            </text>
            <text x="14" y="44">Year {hoveredPoint.year}</text>
            <text x="14" y="62">Mean {formatMgKg(hoveredPoint.mean)} mg/kg</text>
            <text x="14" y="80">Min {formatMgKg(hoveredPoint.min)} · Max {formatMgKg(hoveredPoint.max)}</text>
            <circle className={`tech-scenario-tooltip-dot tech-scenario-tooltip-dot-${hoveredPoint.seriesId}`} cx="166" cy="22" r="6" />
          </g>
        ) : null}
      </svg>
      <div className="tech-scenario-legend">
        <span><i className="tech-scenario-legend-actual" />Actual Data (2017-2025)</span>
        <span><i className="tech-scenario-legend-rcp45" />RCP 4.5 Scenario</span>
        <span><i className="tech-scenario-legend-rcp85" />RCP 8.5 Scenario</span>
        <span><i className="tech-scenario-legend-threshold" />WHO/FAO Standard</span>
      </div>
      <div className="tech-chart-summary-grid">
        {summarySeries.map(({ series, point }) => (
          <div key={series.id}>
            <span>{t(series.label, locale)}</span>
            <strong>{point.year}: {point.mean.toFixed(3).replace(/\.?0+$/, "")} mg/kg</strong>
            <em>
              p10-p90 {point.p10.toFixed(3).replace(/\.?0+$/, "")}-{point.p90.toFixed(3).replace(/\.?0+$/, "")} · {locale === "vi" ? "Vượt ngưỡng" : "Exceedance"} {Math.round(point.exceedancePercent)}%
            </em>
          </div>
        ))}
      </div>
    </div>
  );
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
  hideScenarioChooser = false,
}: {
  compact?: boolean;
  scenario?: ScenarioId;
  onScenarioChange?: (scenario: ScenarioId) => void;
  selectedRegion?: string;
  onRegionChange?: (region: string) => void;
  viewMode?: "rice" | "warning";
  onViewModeChange?: (mode: "rice" | "warning") => void;
  hideScenarioChooser?: boolean;
}) {
  const { locale } = useLocale();
  const [localScenario, setLocalScenario] = useState<ScenarioId>("rcp85");
  const [localRegion, setLocalRegion] = useState(riskRegions[0].name);
  const activeScenarioId = scenario ?? localScenario;
  const activeRegionName = selectedRegion ?? localRegion;
  const activeScenario = scenarioResults.find((item) => item.id === activeScenarioId) ?? scenarioResults[0];
  const [layersOpen, setLayersOpen] = useState(false);
  const layersMenuRef = useRef<HTMLDivElement | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<"rice" | "warning">("rice");
  const effectiveViewMode = viewMode ?? activeViewMode;

  const selectViewMode = (nextViewMode: "rice" | "warning") => {
    if (onViewModeChange) {
      onViewModeChange(nextViewMode);
    } else {
      setActiveViewMode(nextViewMode);
    }

    setLayersOpen(false);
  };

  useEffect(() => {
    const onDocClick = (e: Event) => {
      if (!layersMenuRef.current) return;
      if (layersMenuRef.current.contains(e.target as Node)) return;
      setLayersOpen(false);
    };

    document.addEventListener("pointerdown", onDocClick as EventListener);
    return () => document.removeEventListener("pointerdown", onDocClick as EventListener);
  }, []);

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

  // Map interaction state
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const [zoomIndex, setZoomIndex] = useState(0);
  const zoomLevels = ["100%", "175%", "250%", "325%", "400%"];
  const zoomScales = [1, 1.75, 2.5, 3.25, 4];
  const activeZoomScale = zoomScales[zoomIndex] ?? 1;
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const clampPan = (nextPan: { x: number; y: number }, scale = activeZoomScale) => {
    if (scale <= 1) return { x: 0, y: 0 };

    const rect = mapShellRef.current?.getBoundingClientRect();
    const maxX = rect ? (rect.width * (scale - 1)) / 2 : 180;
    const maxY = rect ? (rect.height * (scale - 1)) / 2 : 220;

    return {
      x: Math.max(-maxX, Math.min(maxX, nextPan.x)),
      y: Math.max(-maxY, Math.min(maxY, nextPan.y)),
    };
  };

  const updateZoom = (direction: "in" | "out") => {
    setZoomIndex((current) => {
      const nextZoomIndex = direction === "in" ? Math.min(current + 1, zoomLevels.length - 1) : Math.max(current - 1, 0);

      if (nextZoomIndex === 0) setPanOffset({ x: 0, y: 0 });
      else setPanOffset((currentPan) => clampPan(currentPan, zoomScales[nextZoomIndex] ?? 1));

      return nextZoomIndex;
    });
  };

  const handleMapPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (zoomIndex === 0 || (event.target as HTMLElement).closest("button, input, select")) return;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    setDragStart({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: panOffset.x,
      originY: panOffset.y,
    });
  };

  const handleMapPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    setPanOffset(
      clampPan({ x: dragStart.originX + event.clientX - dragStart.startX, y: dragStart.originY + event.clientY - dragStart.startY }),
    );
  };

  const handleMapPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStart?.pointerId === event.pointerId) setDragStart(null);
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
            aria-pressed={effectiveViewMode === "warning"}
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
                aria-checked={effectiveViewMode === "rice"}
                className={cn("map-layer-option", effectiveViewMode === "rice" && "map-layer-option-active")}
                onClick={() => selectViewMode("rice")}
              >
                <span>
                  <strong>{locale === "vi" ? "Khu vực trồng lúa" : "Rice growing area"}</strong>
                </span>
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={effectiveViewMode === "warning"}
                className={cn("map-layer-option", effectiveViewMode === "warning" && "map-layer-option-active")}
                onClick={() => selectViewMode("warning")}
              >
                <span>
                  <strong>{locale === "vi" ? "Vùng cảnh báo" : "Warning zone"}</strong>
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div
          ref={mapShellRef}
          className={cn(
            "leaflet-map-shell",
            zoomIndex > 0 && "leaflet-map-shell-zoomed",
            dragStart && "leaflet-map-shell-dragging",
          )}
          onPointerDown={handleMapPointerDown}
          onPointerMove={handleMapPointerMove}
          onPointerUp={handleMapPointerEnd}
          onPointerCancel={handleMapPointerEnd}
          onDragStart={(event) => event.preventDefault()}
          data-onboarding-target="risk-map-canvas"
        >
          <div className="leaflet-label">Leaflet</div>
          <div className="leaflet-controls">
            <button
              type="button"
              aria-label={locale === "vi" ? "Phóng to bản đồ" : "Zoom map in"}
              disabled={zoomIndex === zoomLevels.length - 1}
              onClick={() => updateZoom("in")}
            >
              +
            </button>
            <button
              type="button"
              aria-label={locale === "vi" ? "Thu nhỏ bản đồ" : "Zoom map out"}
              disabled={zoomIndex === 0}
              onClick={() => updateZoom("out")}
            >
              -
            </button>
          </div>
          <div
            className="vietnam-map-canvas"
            style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${activeZoomScale})` }}
          >
            <Image
              src={paddyMap.basemap}
              alt={locale === "vi" ? "Nền bản đồ Việt Nam" : "Vietnam basemap"}
              width={900}
              height={1177}
              className="vietnam-basemap-layer"
            />
            {effectiveViewMode === "warning" ? (
              <ProvinceBoundaryOverlay activeScenarioId={activeScenarioId} showPalette />
            ) : null}
            {effectiveViewMode === "rice" ? (
              <>
                <PaddyRasterCanvas scenarioId={activeScenarioId} width={900} height={1177} className="paddy-raster-layer" />
                <ProvinceBoundaryOverlay activeScenarioId={activeScenarioId} showPalette={false} />
              </>
            ) : null}
          </div>
          <div className="map-zoom-indicator">{zoomLevels[zoomIndex]}</div>
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
            {effectiveViewMode === "warning"
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
                ? "Phần này giữ lại biểu đồ xu hướng Actual Data và các kịch bản khí hậu để thẩm định nhanh đến năm 2050."
                : "This section keeps the Actual Data trend chart and climate scenarios for a quick review through 2050."}
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
        <ArsenicScenarioChart locale={locale} />
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
          <Link href="#dashboard" className="primary-cta">
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
  const activeUncertainty = scenarioUncertainty(scenario);

  useEffect(() => {
    setGrounding({ scenarioId: scenario, regionName: region });
  }, [region, scenario, setGrounding]);

  return (
    <main className="bg-[#f5f8ed] py-10">
      <section className="site-container">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{locale === "vi" ? "Product demo" : "Product demo"}</p>
            <h1 className="mt-2 text-4xl font-extrabold text-[#143d2a]">
              {locale === "vi" ? "Dashboard ưu tiên lấy mẫu arsenic" : "Arsenic sampling-priority dashboard"}
            </h1>
          </div>
        </div>
        <ScenarioChooser activeScenarioId={scenario} onScenarioChange={setScenario} locale={locale} className="mb-6" />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid content-start gap-6">
            <article className="dashboard-panel">
              <div className="grid gap-5 md:grid-cols-3">
                <Metric title={t(activeScenario.label, locale)} value={`${activeValue} mg/kg`} icon={<AlertTriangle />} />
                <Metric title={locale === "vi" ? "Ưu tiên lấy mẫu" : "Sampling priority"} value={t(activeRegion.priority, locale)} icon={<FlaskConical />} />
                <Metric title={locale === "vi" ? "Ngưỡng tham chiếu" : "Reference threshold"} value={paddyMap.threshold} icon={<ShieldCheck />} />
              </div>
            </article>
            <ScenarioComparison activeScenarioId={scenario} selectedRegionName={region} locale={locale} />
            <ArsenicRiskMap
              scenario={scenario}
              onScenarioChange={setScenario}
              selectedRegion={region}
              onRegionChange={setRegion}
              hideScenarioChooser
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

  useEffect(() => {
    const handleOpenAssistant = () => setIsOpen(true);
    window.addEventListener(onboardingTour.openAssistantEvent, handleOpenAssistant);

    return () => window.removeEventListener(onboardingTour.openAssistantEvent, handleOpenAssistant);
  }, []);

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
    const typingEntry = messages.find(
      (entry) =>
        entry.from === "assistant" &&
        entry.isTyping &&
        typeof entry.fullText === "string" &&
        entry.text.length < entry.fullText.length,
    );

    if (!typingEntry || typeof typingEntry.fullText !== "string") {
      return;
    }

    const remaining = typingEntry.fullText.slice(typingEntry.text.length);
    const nextChunk = remaining.match(/^\S+\s*/)?.[0] ?? remaining.slice(0, 1);
    const delay = Math.min(70, 22 + nextChunk.length * 2);
    const timer = window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((entry) => {
          if (entry.id !== typingEntry.id || typeof entry.fullText !== "string") {
            return entry;
          }

          const nextText = entry.fullText.slice(0, Math.min(entry.fullText.length, entry.text.length + nextChunk.length));
          return {
            ...entry,
            text: nextText,
            isTyping: nextText.length < entry.fullText.length,
          };
        }),
      );
    }, delay);

    return () => window.clearTimeout(timer);
  }, [messages]);

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
      const suggested = (payload.suggestedQuestions ?? fallbackQuestions).slice(0, 3);
      const nextSteps = (payload.nextSteps ?? []).slice(0, 4);

      setDefaultGroundTruth(groundTruth);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          from: "assistant",
          text: "",
          fullText: payload.answer,
          isTyping: true,
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

  const handleAudienceRoleChange = (nextRole: AudienceRole) => {
    if (isSubmitting || nextRole === audienceRole) {
      return;
    }

    setAudienceRole(nextRole);
    setMessages([]);
    setQuestion("");
    setWaitStage("thinking");
  };

  const openCitation = (messageId: string, citationId: string) => {
    const target = document.getElementById(`citation-${messageId}-${citationId.toUpperCase()}`);
    if (!target) {
      return;
    }

    if (target instanceof HTMLDetailsElement) {
      target.open = true;
    }

    const citationList = target.closest(".ai-assistant-citation-list");
    if (citationList instanceof HTMLDetailsElement) {
      citationList.open = true;
    }

    window.requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "nearest" }));
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
          data-onboarding-target="assistant-trigger"
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
        <article className="ai-assistant-panel" data-onboarding-target="assistant-panel">
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

          <div
            className="ai-assistant-role-selector"
            aria-label={locale === "vi" ? "Vai trò trả lời" : "Answer role"}
            data-onboarding-target="assistant-roles"
          >
            {assistantRoles.map((role) => (
              <button
                key={role}
                type="button"
                className={cn("ai-assistant-role-button", audienceRole === role && "ai-assistant-role-active")}
                onClick={() => handleAudienceRoleChange(role)}
                aria-pressed={audienceRole === role}
                disabled={isSubmitting}
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
                  <div className="ai-assistant-intro-card">
                    <div className="ai-assistant-intro-heading">
                      <span className="ai-assistant-intro-role-icon">
                        <AssistantRoleIcon role={audienceRole} />
                      </span>
                      <div>
                        <strong>
                          {locale === "vi"
                            ? `Vai trò hiện tại: ${activeRoleLabel}`
                            : `Current role: ${activeRoleLabel}`}
                        </strong>
                        <p>
                          {locale === "vi"
                            ? "Tôi sẽ trả lời dựa trên dữ liệu dự án, citation nội bộ và tài liệu khoa học liên quan."
                            : "I will answer from project data, local citations, and relevant scientific references."}
                        </p>
                      </div>
                    </div>
                  </div>
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
                    {entry.from === "assistant" && entry.isTyping ? (
                      <span className="ai-assistant-type-cursor" aria-hidden="true" />
                    ) : null}
                    {entry.from === "assistant" && !entry.isTyping && (entry.roleLabel || entry.actionLevel) ? (
                      <div className="ai-assistant-response-meta">
                        {entry.roleLabel ? <span>{entry.roleLabel}</span> : null}
                        {entry.actionLevel ? <span>{t(actionLevelLabels[entry.actionLevel], locale)}</span> : null}
                      </div>
                    ) : null}
                    {!entry.isTyping && entry.nextSteps.length > 0 ? (
                      <div className="ai-assistant-next-steps">
                        <strong>{locale === "vi" ? "Bước tiếp theo" : "Next steps"}</strong>
                        <ul>
                          {entry.nextSteps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {!entry.isTyping && entry.limitations ? <p className="ai-assistant-limitations">{entry.limitations}</p> : null}
                    {!entry.isTyping && entry.citations.length > 0 ? (
                      <details className="ai-assistant-citation-list mt-3">
                        <summary>
                          {locale === "vi"
                            ? `Xem nguồn trích dẫn (${entry.citations.length})`
                            : `View citations (${entry.citations.length})`}
                        </summary>
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
                      </details>
                    ) : null}
                    {!entry.isTyping && entry.from === "assistant" && entry.suggestedQuestions.length > 0 ? (
                      <div className="ai-assistant-related-questions">
                        <strong>{locale === "vi" ? "Câu hỏi liên quan" : "Related questions"}</strong>
                        <div>
                          {entry.suggestedQuestions.slice(0, 3).map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => sendPresetQuestion(suggestion)}
                              disabled={isSubmitting}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
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

          {messages.length === 0 ? (
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
          ) : null}

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
        <article className="dashboard-panel mt-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="eyebrow">{locale === "vi" ? "Đơn vị phụ trách" : "Lab ownership"}</p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#143d2a]">
                {t(projectContact.lab, locale)}
              </h2>
              <p className="mt-3 font-semibold leading-[1.6] text-[#4c5a50]">
                {t(projectContact.institution, locale)}
              </p>
              <p className="mt-3 font-medium leading-[1.65] text-[#4c5a50]">
                {t(projectContact.dataNotice, locale)}
              </p>
            </div>
            <div className="rounded-3xl border border-[#e8dfc8] bg-[#fffdf7] p-6">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#d9a21b]">
                {locale === "vi" ? "Liên hệ dự án" : "Project contact"}
              </p>
              <h3 className="mt-3 text-2xl font-extrabold text-[#143d2a]">{projectContact.name}</h3>
              <p className="mt-1 font-semibold text-[#1f6f43]">
                {t(projectContact.role, locale)}, {t(projectContact.lab, locale)}
              </p>
              <p className="mt-4 font-medium leading-[1.6] text-[#4c5a50]">
                {t(projectContact.contactPurpose, locale)}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a className="source-link" href={`mailto:${projectContact.email}`}>
                  {projectContact.email}
                </a>
                <a className="source-link" href={projectContact.github} target="_blank" rel="noreferrer">
                  {projectContact.githubLabel}
                </a>
              </div>
            </div>
          </div>
        </article>
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
        <div className="mt-5 rounded-2xl border border-[#d9e8d6] bg-white p-4 text-sm font-semibold leading-[1.6] text-[#4c5a50]">
          <p>
            {locale === "vi"
              ? `Dự án demo thuộc ${projectContact.lab.vi}. Liên hệ: ${projectContact.name} - ${projectContact.email}.`
              : `This demo is under ${projectContact.lab.en}. Contact: ${projectContact.name} - ${projectContact.email}.`}
          </p>
          <p className="mt-2 text-[#6f5a2e]">{t(projectContact.dataNotice, locale)}</p>
        </div>
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
      <div className="site-container grid gap-6 md:grid-cols-[1fr_1.1fr_0.9fr] md:items-start">
        <div>
          <p className="text-xl font-extrabold">{t(brand.name, locale)}</p>
          <p className="mt-1 text-sm font-medium text-[#dce8d9]">{t(brand.tagline, locale)}</p>
          <p className="mt-3 text-sm font-semibold text-[#dce8d9]">
            {t(projectContact.lab, locale)}
          </p>
          <p className="mt-1 text-xs font-medium leading-[1.45] text-[#b8d2c0]">
            {t(projectContact.institution, locale)}
          </p>
        </div>
        <p className="max-w-[520px] text-sm font-medium leading-[1.5] text-[#dce8d9]">
          {t(brand.disclaimer, locale)}
        </p>
        <div className="text-sm font-medium leading-[1.55] text-[#dce8d9]">
          <p className="font-extrabold text-white">{locale === "vi" ? "Liên hệ dự án" : "Project contact"}</p>
          <p className="mt-1">{projectContact.name}</p>
          <a className="mt-2 block font-bold text-[#f6d77a]" href={`mailto:${projectContact.email}`}>
            {projectContact.email}
          </a>
          <a className="mt-1 block font-bold text-[#f6d77a]" href={projectContact.github} target="_blank" rel="noreferrer">
            {projectContact.githubLabel}
          </a>
        </div>
      </div>
    </footer>
  );
}
