import type {
  FaqItem,
  FeedbackStep,
  LocalizedText,
  NavItem,
} from "@/types/greenfarming";
import { publicAsset } from "@/lib/public-path";
import dashboardData from "@/lib/dashboard-data.generated.json";
import paddyMapMetadata from "../../public/images/grain/paddy-map-metadata.json";

export const assets = {
  logo: publicAsset("/images/greenfarming/logo.svg"),
  flagVi: publicAsset("/images/greenfarming/assets-flags-vi.png"),
  flagEn: publicAsset("/images/greenfarming/assets-flags-en.png"),
};

export const brand = {
  name: { vi: "Hạt Gạo Ngày Mai", en: "The Grain of Tomorrow" },
  shortName: { vi: "Hạt Gạo", en: "Grain Tomorrow" },
  tagline: {
    vi: "Hệ thống cảnh báo sớm AI cho rủi ro arsenic trong gạo",
    en: "AI early-warning system for arsenic risk in rice",
  },
  disclaimer: {
    vi: "Dashboard là demo cảnh báo sớm và ưu tiên lấy mẫu; không thay thế xét nghiệm phòng lab hoặc quyết định an toàn thực phẩm chính thức.",
    en: "This dashboard is an early-warning and sampling-priority demo; it does not replace laboratory testing or official food-safety decisions.",
  },
};

export const navItems: NavItem[] = [
  { href: "/", label: { vi: "Trang chủ", en: "Home" } },
  { href: "/#why-it-matters", label: { vi: "Vì sao quan trọng", en: "Why it matters" } },
  { href: "/#dashboard", label: { vi: "Dashboard", en: "Dashboard" } },
  { href: "/#impact", label: { vi: "Tác động", en: "Impact" } },
  { href: "/#technical", label: { vi: "Kỹ thuật", en: "Technical" } },
  { href: "/frequently-asked-questions", label: { vi: "FAQ", en: "FAQ" } },
];

export const commonText = {
  dashboard: { vi: "Mở dashboard", en: "Open dashboard" },
  feedback: { vi: "Gửi góp ý", en: "Send feedback" },
  modelNotice: {
    vi: "Ngưỡng 0.20 mg/kg là ngưỡng tham chiếu cảnh báo, không phải chứng nhận an toàn. Mọi quyết định an toàn thực phẩm cần xét nghiệm phòng lab.",
    en: "The 0.20 mg/kg value is a reference warning threshold, not a safety certification. Food-safety decisions require laboratory testing.",
  },
  next: { vi: "Tiếp theo", en: "Next" },
  back: { vi: "Quay lại", en: "Back" },
  submit: { vi: "Gửi đánh giá", en: "Submit feedback" },
};

export const homeHero = {
  eyebrow: { vi: "Landing demo cảnh báo arsenic", en: "Arsenic early-warning landing demo" },
  title: {
    vi: "HẠT GẠO NGÀY MAI",
    en: "THE GRAIN OF TOMORROW",
  },
  subtitle: brand.tagline,
  description: {
    vi: "Một bản demo dự án tương tác trình bày câu chuyện sức khỏe, bản đồ rủi ro, tác động người dùng và bằng chứng kỹ thuật của hệ thống cảnh báo sớm arsenic trong gạo Việt Nam.",
    en: "An interactive project demo showing the health story, risk map, user impact, and technical evidence behind an AI early-warning system for arsenic in Vietnamese rice.",
  },
};

export const heroStats = [
  {
    value: dashboardData.modelCounts.actualRows.toLocaleString("en-US"),
    label: { vi: "mẫu gạo", en: "rice samples" },
    detail: { vi: "Bộ dữ liệu 2017-2025", en: "Dataset from 2017-2025" },
  },
  {
    value: "946",
    label: { vi: "vị trí mô hình", en: "model locations" },
    detail: { vi: "Cơ sở suy luận không gian", en: "Spatial inference basis" },
  },
  {
    value: dashboardData.modelCounts.futureRows.toLocaleString("en-US"),
    label: { vi: "điểm dự báo", en: "projections" },
    detail: { vi: "RCP4.5/RCP8.5 đến 2050", en: "RCP4.5/RCP8.5 to 2050" },
  },
];

export const requiredMetrics = [
  { label: { vi: "Mẫu gạo 2017-2025", en: "Rice samples 2017-2025" }, value: dashboardData.modelCounts.actualRows.toLocaleString("en-US") },
  { label: { vi: "Vị trí mô hình", en: "Model locations" }, value: dashboardData.modelCounts.locations.toLocaleString("en-US") },
  { label: { vi: "Điểm dự báo", en: "Projection instances" }, value: dashboardData.modelCounts.futureRows.toLocaleString("en-US") },
  { label: { vi: "Kịch bản đến", en: "Scenario horizon" }, value: "2050" },
];

const formatNumber = (value: number, fractionDigits = 3) => value.toFixed(fractionDigits).replace(/\.?0+$/, "");

const scenarioText: Record<string, { level: LocalizedText; description: LocalizedText }> = {
  baseline: {
    level: { vi: "Mốc hiện tại", en: "Current baseline" },
    description: {
      vi: "Dữ liệu thực tế 2017-2025 từ data/baseline.xlsx.",
      en: "Actual 2017-2025 data from data/baseline.xlsx.",
    },
  },
  rcp45: {
    level: { vi: "Tăng vừa", en: "Moderate increase" },
    description: {
      vi: "Kịch bản RCP4.5 lấy từ data/future.xlsx tại năm 2050.",
      en: "RCP4.5 scenario from data/future.xlsx at year 2050.",
    },
  },
  rcp85: {
    level: { vi: "Ưu tiên cảnh báo", en: "Warning priority" },
    description: {
      vi: "Kịch bản RCP8.5 lấy từ data/future.xlsx tại năm 2050.",
      en: "RCP8.5 scenario from data/future.xlsx at year 2050.",
    },
  },
};

const scenarioMetadataById = (scenarioId: string) =>
  paddyMapMetadata.scenarios.find((scenario) => scenario.id === scenarioId) ?? paddyMapMetadata.scenarios[0];

const actualScenario = {
  id: "baseline",
  label: dashboardData.actual.label,
  targetYear: dashboardData.actual.displayYear,
  stats: dashboardData.actual,
};

const futureScenarioList = [
  dashboardData.future.scenarios.rcp45,
  dashboardData.future.scenarios.rcp85,
] as const;

const scenarioDataList = [
  actualScenario,
  ...futureScenarioList.map((scenario) => ({
    id: scenario.id,
    label: scenario.label,
    targetYear: scenario.targetYear,
    stats: scenario.target,
  })),
] as const;

export const scenarioResults = scenarioDataList.map((scenario) => {
  const localizedText = scenarioText[scenario.id] ?? scenarioText.baseline;
  const metadata = scenarioMetadataById(scenario.id);
  const increasePercent =
    scenario.id === "baseline"
      ? 0
      : ((scenario.stats.mean - dashboardData.actual.mean) / dashboardData.actual.mean) * 100;

  return {
    id: scenario.id,
    label: { vi: scenario.label, en: scenario.label },
    value: formatNumber(scenario.stats.mean),
    max: formatNumber(scenario.stats.max),
    co2: formatNumber(metadata.co2Ppm, 2),
    increase: `${increasePercent > 0 ? "+" : ""}${formatNumber(increasePercent, 1)}%`,
    unit: "mg/kg",
    level: localizedText.level,
    description: localizedText.description,
  };
});

export const paddyMapSamples = dashboardData.mapSamples;

export const paddyMapProjection = {
  bbox: paddyMapMetadata.bbox,
  width: paddyMapMetadata.displayRasterDimensions.width,
  height: paddyMapMetadata.displayRasterDimensions.height,
};

export const riskRegions = dashboardData.regions.map((region) => ({
  name: region.name,
  viName: region.viName,
  baseline: formatNumber(region.baseline.mean),
  rcp45: formatNumber(region.rcp45.mean),
  rcp85: formatNumber(region.rcp85.mean),
  priority: region.priority,
}));

export const paddyMap = {
  basemap: publicAsset("/images/grain/vietnam-basemap.jpg"),
  boundaries: publicAsset("/images/grain/vietnam-boundaries.svg"),
  metadata: publicAsset("/images/grain/paddy-map-metadata.json"),
  mask: publicAsset("/images/grain/paddy-mask-vietnam.png"),
  bbox: `${formatNumber(paddyMapMetadata.bbox.lonMin, 1)}-${formatNumber(paddyMapMetadata.bbox.lonMax, 1)}E, ${formatNumber(paddyMapMetadata.bbox.latMin, 1)}-${formatNumber(paddyMapMetadata.bbox.latMax, 1)}N`,
  cropWindow: `${paddyMapMetadata.cropWindow.width}x${paddyMapMetadata.cropWindow.height}+${paddyMapMetadata.cropWindow.x}+${paddyMapMetadata.cropWindow.y}`,
  threshold: `${dashboardData.thresholdMgKg.toFixed(2)} mg/kg`,
  legend: [
    { label: { vi: "Trong ngưỡng", en: "Within threshold" }, range: "0-0.20", color: "#5ea95a" },
    { label: { vi: "Cảnh báo", en: "Warning band" }, range: "0.20-0.35", color: "#e0c24a" },
    { label: { vi: "Vượt khung", en: "Above range" }, range: ">0.35", color: "#d8532b" },
  ],
};

export const modelFigures = {
  arsenicTrend: publicAsset("/images/grain/figure-5-arsenic-mean.png"),
  shapSummary: publicAsset("/images/grain/figure-4-shap-summary.jpeg"),
};

const modelSampleCounts = {
  raw: dashboardData.modelCounts.actualRows,
  retained: dashboardData.modelCounts.locations,
  cleaned: dashboardData.modelCounts.actualRows,
  predictors: 24,
  timeSteps: dashboardData.modelCounts.timeSteps,
};

const projectedScenarioCount = dashboardData.modelCounts.futureScenarios;
const projectionInstanceCount = dashboardData.modelCounts.projectionInstances;
const scenarioCo2Values = paddyMapMetadata.scenarios.map((scenario) => scenario.co2Ppm);
const scenarioMeanValues = scenarioDataList.map((scenario) => scenario.stats.mean);
const scenarioMaxValues = scenarioDataList.map((scenario) => scenario.stats.max);
const scenarioLabels = scenarioDataList.map((scenario) => scenario.label).join(", ");

export const modelConfiguration = [
  { label: { vi: "Mẫu ban đầu", en: "Raw samples" }, value: modelSampleCounts.raw.toLocaleString("en-US") },
  { label: { vi: "Mẫu giữ lại", en: "Retained samples" }, value: modelSampleCounts.retained.toLocaleString("en-US") },
  { label: { vi: "Dataset sạch", en: "Cleaned model dataset" }, value: modelSampleCounts.cleaned.toLocaleString("en-US") },
  { label: { vi: "Biến dự báo", en: "Predictors" }, value: String(modelSampleCounts.predictors) },
  { label: { vi: "Mô hình", en: "Model" }, value: "Gaussian Process Regression" },
  { label: { vi: "Kernel", en: "Kernel" }, value: "Matérn nu=0.5 + RBF + white noise + dot product" },
  { label: { vi: "Nguồn kịch bản", en: "Scenario source" }, value: scenarioLabels },
  {
    label: { vi: "Dải CO2", en: "CO2 range" },
    value: `${formatNumber(Math.min(...scenarioCo2Values), 2)}-${formatNumber(Math.max(...scenarioCo2Values), 2)} ppm`,
  },
  {
    label: { vi: "Dải trung bình quốc gia", en: "National mean range" },
    value: `${formatNumber(Math.min(...scenarioMeanValues))}-${formatNumber(Math.max(...scenarioMeanValues))} mg/kg`,
  },
  {
    label: { vi: "Dải giá trị max", en: "Maximum range" },
    value: `${formatNumber(Math.min(...scenarioMaxValues))}-${formatNumber(Math.max(...scenarioMaxValues))} mg/kg`,
  },
  { label: { vi: "Ngưỡng cảnh báo", en: "Warning threshold" }, value: paddyMap.threshold },
  { label: { vi: "Nguồn baseline", en: "Baseline source" }, value: dashboardData.sources.baseline },
  { label: { vi: "Nguồn future", en: "Future source" }, value: dashboardData.sources.future },
  { label: { vi: "CO2 transform", en: "CO2 transform" }, value: `(CO2 - ${formatNumber(scenarioMetadataById("baseline").co2Ppm, 2)})` },
  { label: { vi: "Target / features", en: "Target / features" }, value: "log(1 + x), z-score, normalize_y=true" },
  { label: { vi: "Optuna", en: "Optuna" }, value: "30 trials, alpha/noise 0.01-1.0" },
  { label: { vi: "Validation", en: "Validation" }, value: "5-fold CV R2 = 0.365 +/- 0.071" },
  { label: { vi: "Test", en: "Test" }, value: "R2 = 0.3546, RMSE = 0.0743" },
  { label: { vi: "Train", en: "Train" }, value: "R2 = 0.9033, RMSE = 0.0292" },
  {
    label: { vi: "Projection", en: "Projection" },
    value: `${projectionInstanceCount.toLocaleString("en-US")} = ${modelSampleCounts.retained.toLocaleString("en-US")} locations x ${modelSampleCounts.timeSteps} time steps x ${projectedScenarioCount} scenarios`,
  },
  {
    label: { vi: "Tổng hợp vùng", en: "Regional aggregation" },
    value: "North/Central/South means are aggregated directly from Excel rows by latitude band.",
  },
  { label: { vi: "Ensemble", en: "Ensemble" }, value: "50 bootstrap GPR runs, median, p10/p90" },
  {
    label: { vi: "Exceedance", en: "Exceedance" },
    value: `Estimated from p10/p50/p90 against ${paddyMap.threshold}`,
  },
];

const interpolatePercentile = (value: number, p10: number, p50: number, p90: number) => {
  if (value <= p10) {
    return 10;
  }

  if (value >= p90) {
    return 90;
  }

  if (value <= p50) {
    return 10 + ((value - p10) / (p50 - p10)) * 40;
  }

  return 50 + ((value - p50) / (p90 - p50)) * 40;
};

export const uncertaintyBands = scenarioDataList.map((scenario) => ({
  scenario: scenario.id,
  p10: formatNumber(scenario.stats.p10),
  p50: formatNumber(scenario.stats.median),
  p90: formatNumber(scenario.stats.p90),
  exceedance: `${Math.round(scenario.stats.exceedancePercent)}%`,
}));

export const scenarioTrendSeries = [
  {
    id: "baseline",
    label: { vi: dashboardData.actual.label, en: dashboardData.actual.label },
    color: "#5ea95a",
    points: dashboardData.actual.years.map((point) => ({
      year: point.year,
      mean: point.mean,
      min: point.min,
      max: point.max,
      p10: point.p10,
      p90: point.p90,
      exceedancePercent: point.exceedancePercent,
    })),
  },
  ...futureScenarioList.map((scenario) => ({
    id: scenario.id,
    label: { vi: scenario.label, en: scenario.label },
    color: scenario.id === "rcp45" ? "#e0a72d" : "#d8532b",
    points: scenario.years.map((point) => ({
      year: point.year,
      mean: point.mean,
      min: point.min,
      max: point.max,
      p10: point.p10,
      p90: point.p90,
      ciLower: point.ciLowerMean,
      ciUpper: point.ciUpperMean,
      exceedancePercent: point.exceedancePercent,
    })),
  })),
];

export const predictorImportance = [
  { name: { vi: "Nhiệt độ", en: "Temperature" }, score: 92 },
  { name: { vi: "Lượng mưa", en: "Precipitation" }, score: 78 },
  { name: { vi: "pH đất", en: "Soil pH" }, score: 65 },
  { name: { vi: "Độ mặn", en: "Salinity" }, score: 54 },
  { name: { vi: "Địa hình", en: "Topography" }, score: 43 },
];

export const architectureSteps = [
  {
    title: { vi: "Nạp dữ liệu", en: "Data ingestion" },
    body: {
      vi: "Tập hợp mẫu gạo 2017-2025, dữ liệu khí hậu, đất, nước, địa hình và metadata theo địa điểm.",
      en: "Combines 2017-2025 rice samples with climate, soil, water, terrain and location metadata.",
    },
  },
  {
    title: { vi: "Làm sạch & chuẩn hóa", en: "Cleaning & harmonization" },
    body: {
      vi: "Chuẩn hóa đơn vị mg/kg, kiểm tra ngoại lệ, đồng bộ tọa độ và tạo 24 biến dự báo.",
      en: "Normalizes mg/kg units, checks outliers, aligns coordinates and derives 24 predictors.",
    },
  },
  {
    title: { vi: "Mô hình GPR", en: "GPR model" },
    body: {
      vi: "Gaussian Process Regression tạo dự báo arsenic và phân bố bất định theo không gian, thời gian.",
      en: "Gaussian Process Regression estimates arsenic values and uncertainty over space and time.",
    },
  },
  {
    title: { vi: "SHAP & bất định", en: "SHAP & uncertainty" },
    body: {
      vi: "Giải thích yếu tố ảnh hưởng và đánh dấu vùng có độ chắc chắn thấp để ưu tiên lấy mẫu.",
      en: "Explains predictor influence and flags low-confidence areas for sampling priority.",
    },
  },
  {
    title: { vi: "RAG chatbot", en: "RAG chatbot" },
    body: {
      vi: "Trợ lý truy vấn kết quả, giới hạn mô hình và khuyến nghị lấy mẫu bằng ngôn ngữ tự nhiên.",
      en: "Assistant for querying results, model limits and sampling recommendations in natural language.",
    },
  },
  {
    title: { vi: "Retraining", en: "Retraining" },
    body: {
      vi: "Khi có dữ liệu mới, hệ thống version model, retrain và theo dõi độ chính xác qua thời gian.",
      en: "As new data arrives, the system versions models, retrains and tracks accuracy over time.",
    },
  },
];

export const projectCards = [
  {
    title: { vi: "Nguồn dữ liệu", en: "Data foundation" },
    body: {
      vi: "1,327 mẫu gạo giai đoạn 2017-2025 được dùng làm nền cho mô hình cảnh báo sớm.",
      en: "1,327 rice samples from 2017-2025 provide the foundation for the early-warning model.",
    },
  },
  {
    title: { vi: "Mục tiêu GIC", en: "GIC objective" },
    body: {
      vi: "Biến kết quả nghiên cứu thành demo có thể hỗ trợ nhà khoa học, quản lý và cộng đồng.",
      en: "Translate research outputs into a demo for scientists, decision-makers and communities.",
    },
  },
  {
    title: { vi: "Giới hạn minh bạch", en: "Transparent limits" },
    body: {
      vi: "Kết quả được trình bày như cảnh báo sớm và ưu tiên lấy mẫu, không phải công cụ thay thế phòng lab.",
      en: "Results are framed as early warning and sampling priority, not as a substitute for lab testing.",
    },
  },
];

export const faqItems: FaqItem[] = [
  {
    question: { vi: "Arsenic trong gạo là gì?", en: "What is arsenic in rice?" },
    answer: {
      vi: "Arsenic là nguyên tố có thể tích lũy trong lúa qua đất và nước. Rủi ro chính không chỉ là ngộ độc cấp tính, mà là phơi nhiễm lâu dài qua nước và thực phẩm, có liên quan đến tổn thương da và nguy cơ ung thư.",
      en: "Arsenic can accumulate in rice through soil and water. The main concern is not only acute poisoning, but long-term exposure through water and food, which is linked to skin lesions and cancer risk.",
    },
    source: {
      label: { vi: "Nguồn: WHO arsenic fact sheet", en: "Source: WHO arsenic fact sheet" },
      href: "https://www.who.int/news-room/fact-sheets/detail/arsenic",
    },
  },
  {
    question: { vi: "AI trong demo này làm gì?", en: "What does the AI do in this demo?" },
    answer: {
      vi: "AI dùng Gaussian Process Regression để phân tích dữ liệu mẫu, 24 biến dự báo và kịch bản khí hậu nhằm cảnh báo vùng cần ưu tiên lấy mẫu.",
      en: "The AI uses Gaussian Process Regression to analyze samples, 24 predictors and climate scenarios to warn where sampling should be prioritized.",
    },
  },
  {
    question: { vi: "Kết quả có thay thế xét nghiệm lab không?", en: "Does this replace lab testing?" },
    answer: {
      vi: "Không. Đây là hệ thống cảnh báo sớm và hỗ trợ ưu tiên lấy mẫu. AI giúp biết nơi nào cần kiểm tra trước; mọi quyết định an toàn thực phẩm chính thức cần xác minh bằng xét nghiệm phòng lab.",
      en: "No. This is an early-warning and sampling-priority system. AI helps identify where to test first; official food-safety decisions require laboratory verification.",
    },
  },
  {
    question: { vi: "Mô hình đáng tin cậy đến đâu?", en: "How reliable is the model?" },
    answer: {
      vi: "Mô hình nên được đọc như lớp cảnh báo sớm, không phải phép đo thay thế phòng lab. Validation hiện tại đạt 5-fold CV R² ≈ 0.365 và test R² = 0.3546, đủ để hỗ trợ ưu tiên lấy mẫu theo kịch bản nhưng cần xác minh lab và thêm dữ liệu để tăng độ chính xác.",
      en: "The model should be read as an early-warning layer, not a lab replacement. Current validation is 5-fold CV R² ≈ 0.365 with test R² = 0.3546, enough to support scenario-based sampling priority while still requiring lab confirmation and more data to improve accuracy.",
    },
  },
  {
    question: { vi: "RAG chatbot sẽ dùng để làm gì?", en: "What will the RAG chatbot do?" },
    answer: {
      vi: "Chatbot tương lai sẽ trả lời câu hỏi dựa trên tài liệu dự án, kết quả mô hình, độ bất định và khuyến nghị lấy mẫu.",
      en: "The future chatbot will answer questions grounded in project documents, model outputs, uncertainty and sampling recommendations.",
    },
  },
];

export const feedbackSteps: FeedbackStep[] = [
  {
    title: { vi: "Vai trò", en: "Role" },
    description: {
      vi: "Cho biết góc nhìn của bạn để nhóm hiểu nhu cầu sử dụng demo.",
      en: "Tell us your perspective so the team can understand demo needs.",
    },
    fields: [
      {
        label: { vi: "Bạn là ai?", en: "Who are you?" },
        type: "radio",
        required: true,
        options: [
          { vi: "Nhà khoa học", en: "Scientist" },
          { vi: "Cơ quan quản lý", en: "Government agency" },
          { vi: "Doanh nghiệp / HTX", en: "Business / cooperative" },
          { vi: "Người quan tâm", en: "Interested user" },
        ],
      },
    ],
  },
  {
    title: { vi: "Tính hữu ích", en: "Usefulness" },
    description: {
      vi: "Đánh giá liệu dashboard có giúp ưu tiên lấy mẫu và truyền thông rủi ro hay không.",
      en: "Evaluate whether the dashboard helps sampling priority and risk communication.",
    },
    fields: [
      {
        label: { vi: "Phần hữu ích nhất", en: "Most useful section" },
        type: "select",
        options: [
          { vi: "Bản đồ rủi ro", en: "Risk map" },
          { vi: "So sánh kịch bản", en: "Scenario comparison" },
          { vi: "Chatbot", en: "Chatbot" },
          { vi: "Ưu tiên lấy mẫu", en: "Sampling priority" },
        ],
      },
      { label: { vi: "Góp ý chi tiết", en: "Detailed feedback" }, type: "textarea" },
    ],
  },
  {
    title: { vi: "Niềm tin", en: "Trust" },
    description: {
      vi: "Cho biết thông tin nào cần bổ sung để bạn tin tưởng kết quả hơn.",
      en: "Tell us what information would make the results more trustworthy.",
    },
    fields: [
      {
        label: { vi: "Thông tin cần thêm", en: "Information needed" },
        type: "checkbox",
        options: [
          { vi: "Độ bất định", en: "Uncertainty" },
          { vi: "Nguồn dữ liệu", en: "Data sources" },
          { vi: "Phiên bản mô hình", en: "Model version" },
          { vi: "Hướng dẫn lấy mẫu", en: "Sampling guidance" },
        ],
      },
    ],
  },
  {
    title: { vi: "Liên hệ", en: "Contact" },
    description: {
      vi: "Không bắt buộc. Dùng nếu bạn muốn nhóm dự án liên hệ lại.",
      en: "Optional. Use this if you want the project team to follow up.",
    },
    fields: [
      { label: { vi: "Tên / tổ chức", en: "Name / organization" }, type: "text" },
      { label: { vi: "Email", en: "Email" }, type: "text" },
    ],
  },
];

export function text(value: LocalizedText, locale: "vi" | "en") {
  return value[locale];
}
