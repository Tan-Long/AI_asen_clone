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
  Menu,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  architectureSteps,
  assets,
  brand,
  commonText,
  faqItems,
  feedbackSteps,
  heroStats,
  homeHero,
  navItems,
  predictorImportance,
  projectCards,
  requiredMetrics,
  riskRegions,
  scenarioResults,
  text,
} from "@/lib/greenfarming-data";
import { cn } from "@/lib/utils";
import type { FeedbackField, Locale, LocalizedText } from "@/types/greenfarming";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

type ScenarioId = (typeof scenarioResults)[number]["id"];

const LocaleContext = createContext<LocaleContextValue | null>(null);

const scenarioSeries = [
  { year: "2025", baseline: 0.21, rcp45: 0.21, rcp85: 0.21 },
  { year: "2030", baseline: 0.219, rcp45: 0.226, rcp85: 0.235 },
  { year: "2040", baseline: 0.235, rcp45: 0.249, rcp85: 0.275 },
  { year: "2050", baseline: 0.246, rcp45: 0.268, rcp85: 0.304 },
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

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

function t(value: LocalizedText, locale: Locale) {
  return text(value, locale);
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#fbfaf5] text-[#34403a]">
        <Header />
        {children}
        <Footer />
      </div>
    </LanguageProvider>
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
      <section className="grain-hero">
        <div className="grain-field-visual" aria-hidden="true">
          <div className="risk-map-shape risk-map-shape-hero">
            <span className="risk-dot dot-red" />
            <span className="risk-dot dot-orange" />
            <span className="risk-dot dot-yellow" />
            <span className="risk-dot dot-green" />
          </div>
        </div>
        <div className="site-container relative z-10 grid min-h-[720px] items-center gap-10 py-16 lg:grid-cols-[1fr_470px]">
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
              <Link href="/app" className="primary-cta">
                {t(commonText.dashboard, locale)} <ArrowRight size={20} />
              </Link>
              <Link href="/feedback" className="secondary-cta">
                {t(commonText.feedback, locale)}
              </Link>
            </div>
            <p className="mt-5 max-w-[720px] rounded-md border border-[#ead9a9] bg-[#fff8df] px-4 py-3 text-sm font-semibold text-[#735d13]">
              {t(brand.disclaimer, locale)}
            </p>
          </div>
          <HeroPanel />
        </div>
      </section>
      <OverviewSections />
    </main>
  );
}

function HeroPanel() {
  const { locale } = useLocale();

  return (
    <aside className="dashboard-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-[#7a6a42]">RCP8.5 2050</p>
          <h2 className="mt-1 text-3xl font-extrabold text-[#143d2a]">0.304 mg/kg</h2>
        </div>
        <AlertTriangle className="text-[#d8532b]" size={36} />
      </div>
      <ArsenicRiskMap compact />
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

function OverviewSections() {
  const { locale } = useLocale();

  return (
    <>
      <section className="bg-[#fffdf7] py-16">
        <div className="site-container">
          <div className="grid gap-4 lg:grid-cols-4">
            {requiredMetrics.map((metric) => (
              <article key={metric.value} className="metric-card">
                <p className="text-sm font-bold uppercase text-[#7a6a42]">{t(metric.label, locale)}</p>
                <p className="mt-3 text-2xl font-extrabold text-[#143d2a]">{metric.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="site-container grid gap-10 py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="eyebrow">{locale === "vi" ? "Dashboard cảnh báo" : "Early-warning dashboard"}</p>
          <h2 className="section-title mt-3">
            {locale === "vi"
              ? "Từ dữ liệu mẫu đến ưu tiên lấy mẫu thông minh"
              : "From sample data to smart sampling priority"}
          </h2>
          <p className="mt-5 text-lg font-medium leading-[1.65]">
            {locale === "vi"
              ? "Bản đồ dưới đây là minh họa dựa trên kết quả dự án, không phải bản đồ GIS chính thức. Màu sắc thể hiện vùng cần quan tâm khi so sánh kết quả 2025 với các kịch bản RCP4.5 và RCP8.5 đến năm 2050."
              : "The map below is an illustrative visualization based on project results, not an official GIS layer. Colors indicate areas that deserve attention when comparing 2025 results with RCP4.5 and RCP8.5 projections to 2050."}
          </p>
          <div className="mt-8">
            <ArsenicRiskMap />
          </div>
        </div>
        <div className="grid content-start gap-5">
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
          <p className="rounded-md bg-[#ecf7ef] p-4 text-sm font-semibold leading-[1.5] text-[#1f6f43]">
            {t(commonText.modelNotice, locale)}
          </p>
        </div>
      </section>

      <section className="bg-[#f3f7ea] py-20">
        <div className="site-container grid gap-10 lg:grid-cols-2">
          <LineChart />
          <PredictorChart />
        </div>
      </section>
    </>
  );
}

function ArsenicRiskMap({ compact = false }: { compact?: boolean }) {
  const { locale } = useLocale();

  return (
    <div className={cn("risk-map-card", compact && "risk-map-card-compact")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-[#143d2a]">
            {locale === "vi" ? "Bản đồ rủi ro minh họa Việt Nam" : "Illustrative Vietnam risk map"}
          </h3>
          <p className="mt-1 text-sm font-semibold text-[#7a6a42]">
            {locale === "vi"
              ? "Illustrative visualization based on project results"
              : "Illustrative visualization based on project results"}
          </p>
        </div>
        <Layers3 className="shrink-0 text-[#1f6f43]" />
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-[210px_1fr]">
        <div className="risk-map-shape">
          <span className="risk-dot dot-red" />
          <span className="risk-dot dot-orange" />
          <span className="risk-dot dot-yellow" />
          <span className="risk-dot dot-green" />
          <span className="risk-dot dot-amber" />
        </div>
        <div className="grid content-center gap-3">
          {riskRegions.map((region) => (
            <div key={region.name} className="region-row">
              <span>
                <span className="block font-extrabold text-[#26352b]">
                  {locale === "vi" ? region.viName : region.name}
                </span>
                <span className="text-xs font-semibold text-[#7a6a42]">
                  {t(region.priority, locale)}
                </span>
              </span>
              <span className="text-right font-extrabold text-[#143d2a]">{region.rcp85} mg/kg</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineChart() {
  const { locale } = useLocale();
  const points = scenarioSeries.map((item, index) => `${60 + index * 132},${250 - item.rcp85 * 520}`);
  const pointsRcp45 = scenarioSeries.map((item, index) => `${60 + index * 132},${250 - item.rcp45 * 520}`);

  return (
    <article className="science-card">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-2xl font-extrabold text-[#143d2a]">
          {locale === "vi" ? "Đường xu hướng arsenic 2025-2050" : "Arsenic trend 2025-2050"}
        </h3>
        <TrendingUp className="text-[#d9a21b]" />
      </div>
      <svg className="mt-6 h-[320px] w-full" viewBox="0 0 500 320" role="img">
        <title>{locale === "vi" ? "Biểu đồ kịch bản arsenic" : "Arsenic scenario chart"}</title>
        {[0, 1, 2, 3, 4].map((line) => (
          <line key={line} x1="50" x2="470" y1={50 + line * 52} y2={50 + line * 52} className="chart-grid-line" />
        ))}
        <polyline className="chart-line-rice" points={pointsRcp45.join(" ")} />
        <polyline className="chart-line-risk" points={points.join(" ")} />
        {scenarioSeries.map((item, index) => (
          <g key={item.year}>
            <circle cx={60 + index * 132} cy={250 - item.rcp85 * 520} r="5" className="chart-dot-risk" />
            <text x={42 + index * 132} y="292" className="chart-axis">
              {item.year}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-4 text-sm font-bold">
        <span className="legend-risk">{locale === "vi" ? "RCP8.5" : "RCP8.5"}</span>
        <span className="legend-rice">{locale === "vi" ? "RCP4.5" : "RCP4.5"}</span>
      </div>
    </article>
  );
}

function PredictorChart() {
  const { locale } = useLocale();

  return (
    <article className="science-card">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-2xl font-extrabold text-[#143d2a]">
          {locale === "vi" ? "Yếu tố ảnh hưởng dạng SHAP mock" : "Mock SHAP-style predictor influence"}
        </h3>
        <BarChart3 className="text-[#1f6f43]" />
      </div>
      <div className="mt-8 grid gap-4">
        {predictorImportance.map((item) => (
          <div key={item.score}>
            <div className="mb-2 flex justify-between text-sm font-bold">
              <span>{t(item.name, locale)}</span>
              <span>{item.score}%</span>
            </div>
            <div className="importance-track">
              <span className={cn("importance-fill", `importance-${item.score}`)} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm font-semibold leading-[1.55] text-[#5d6a62]">
        {locale === "vi"
          ? "Bảng này minh họa hướng giải thích mô hình. Khi triển khai thật, giá trị SHAP sẽ được tính theo version model và dữ liệu mới."
          : "This panel illustrates the model explanation direction. In production, SHAP values would be computed per model version and new data."}
      </p>
    </article>
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
  const [scenario, setScenario] = useState<ScenarioId>("rcp85");
  const [region, setRegion] = useState(riskRegions[0].name);
  const activeScenario = scenarioResults.find((item) => item.id === scenario) ?? scenarioResults[0];
  const activeRegion = riskRegions.find((item) => item.name === region) ?? riskRegions[0];
  const activeValue =
    scenario === "baseline" ? activeRegion.baseline : scenario === "rcp45" ? activeRegion.rcp45 : activeRegion.rcp85;

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
            <select className="dashboard-select" value={region} onChange={(event) => setRegion(event.target.value)}>
              {riskRegions.map((item) => (
                <option key={item.name} value={item.name}>
                  {locale === "vi" ? item.viName : item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            <article className="dashboard-panel">
              <div className="grid gap-5 md:grid-cols-3">
                <Metric title={t(activeScenario.label, locale)} value={`${activeValue} mg/kg`} icon={<AlertTriangle />} />
                <Metric title={locale === "vi" ? "Ưu tiên lấy mẫu" : "Sampling priority"} value={t(activeRegion.priority, locale)} icon={<FlaskConical />} />
                <Metric title={locale === "vi" ? "Validation" : "Validation"} value="CV R² ≈ 0.365" icon={<ShieldCheck />} />
              </div>
            </article>
            <ArsenicRiskMap />
          </div>

          <div className="grid gap-6">
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
            <ChatbotPanel />
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

function ChatbotPanel() {
  const { locale } = useLocale();
  const [message, setMessage] = useState("");
  const defaultQuestion =
    locale === "vi" ? "Vùng nào cần ưu tiên lấy mẫu?" : "Which area should be sampled first?";

  return (
    <article className="dashboard-panel">
      <div className="flex items-center gap-3">
        <Bot className="text-[#1f6f43]" />
        <h2 className="text-2xl font-extrabold text-[#143d2a]">RAG chatbot mock</h2>
      </div>
      <div className="mt-5 rounded-lg bg-[#eef7ed] p-4 text-sm font-semibold leading-[1.55]">
        {locale === "vi"
          ? "Dựa trên RCP8.5 2050, Đồng bằng sông Cửu Long nên được ưu tiên lấy mẫu sớm. Cần kiểm tra lab trước khi kết luận an toàn thực phẩm."
          : "Based on RCP8.5 2050, the Mekong Delta should be prioritized for earlier sampling. Lab testing is required before making food-safety conclusions."}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          className="feedback-input"
          value={message || defaultQuestion}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button className="icon-submit" aria-label="Send">
          <Send size={18} />
        </button>
      </div>
    </article>
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
                <p className="border-t border-[#e8dfc8] px-5 py-4 font-medium leading-[1.65]">
                  {t(item.answer, locale)}
                </p>
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
