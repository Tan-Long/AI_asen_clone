import type {
  FaqItem,
  FeedbackStep,
  LocalizedText,
  NavItem,
} from "@/types/greenfarming";
import { publicAsset } from "@/lib/public-path";

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
    vi: "Bản demo hỗ trợ ưu tiên lấy mẫu và phân tích kịch bản; không thay thế xét nghiệm phòng lab.",
    en: "This demo supports sampling priority and scenario analysis; it does not replace laboratory testing.",
  },
};

export const navItems: NavItem[] = [
  { href: "/", label: { vi: "Tổng quan", en: "Overview" } },
  { href: "/app", label: { vi: "Dashboard", en: "Dashboard" } },
  { href: "/architecture", label: { vi: "Kiến trúc AI", en: "AI Pipeline" } },
  { href: "/about-us", label: { vi: "Dự án", en: "Project" } },
  { href: "/frequently-asked-questions", label: { vi: "FAQ", en: "FAQ" } },
  { href: "/feedback", label: { vi: "Góp ý", en: "Feedback" } },
];

export const commonText = {
  dashboard: { vi: "Mở dashboard", en: "Open dashboard" },
  feedback: { vi: "Gửi góp ý", en: "Send feedback" },
  modelNotice: {
    vi: "Mô hình cảnh báo sớm, cần xác minh bằng xét nghiệm khi ra quyết định an toàn thực phẩm.",
    en: "Early-warning model; lab verification is required for food-safety decisions.",
  },
  next: { vi: "Tiếp theo", en: "Next" },
  back: { vi: "Quay lại", en: "Back" },
  submit: { vi: "Gửi đánh giá", en: "Submit feedback" },
};

export const homeHero = {
  eyebrow: { vi: "An toàn gạo trong khí hậu biến đổi", en: "Rice safety under climate change" },
  title: {
    vi: "HẠT GẠO NGÀY MAI",
    en: "THE GRAIN OF TOMORROW",
  },
  subtitle: brand.tagline,
  description: {
    vi: "Demo song ngữ mô phỏng cách AI cảnh báo sớm rủi ro arsenic trong gạo Việt Nam, so sánh kịch bản hiện tại với RCP4.5 và RCP8.5 đến năm 2050.",
    en: "A bilingual demo showing how AI can provide early warning for arsenic risk in Vietnamese rice, comparing current conditions with RCP4.5 and RCP8.5 projections to 2050.",
  },
};

export const heroStats = [
  {
    value: "1,327",
    label: { vi: "mẫu gạo", en: "rice samples" },
    detail: { vi: "Bộ dữ liệu 2017-2025", en: "Dataset from 2017-2025" },
  },
  {
    value: "946",
    label: { vi: "điểm mô hình loc.5", en: "model loc.5 points" },
    detail: { vi: "Cơ sở suy luận không gian", en: "Spatial inference basis" },
  },
  {
    value: "RCP8.5",
    label: { vi: "kịch bản 2050", en: "2050 scenario" },
    detail: { vi: "Dùng cho cảnh báo rủi ro cao", en: "Used for high-risk warning" },
  },
];

export const requiredMetrics = [
  { label: { vi: "Projection instances", en: "Projection instances" }, value: "18,920" },
  { label: { vi: "Mô hình", en: "Model" }, value: "Gaussian Process Regression" },
  { label: { vi: "Biến đầu vào", en: "Input predictors" }, value: "24" },
  { label: { vi: "Validation", en: "Validation" }, value: "CV R² ≈ 0.365" },
];

export const scenarioResults = [
  {
    id: "baseline",
    label: { vi: "Baseline 2025", en: "Baseline 2025" },
    value: "0.21",
    max: "0.34",
    co2: "424.32",
    increase: "0%",
    image: publicAsset("/images/grain/paddy-baseline-2025-preview.png"),
    unit: "mg/kg",
    level: { vi: "Mốc hiện tại", en: "Current baseline" },
    description: {
      vi: "Giá trị nền dùng để so sánh các kịch bản khí hậu.",
      en: "Baseline value used to compare climate scenarios.",
    },
  },
  {
    id: "rcp45",
    label: { vi: "RCP4.5 2050", en: "RCP4.5 2050" },
    value: "0.268",
    max: "0.383",
    co2: "526",
    increase: "+29.3%",
    image: publicAsset("/images/grain/paddy-rcp45-2050-preview.png"),
    unit: "mg/kg",
    level: { vi: "Tăng vừa", en: "Moderate increase" },
    description: {
      vi: "Kịch bản phát thải trung bình cho thấy rủi ro tăng đáng kể.",
      en: "The medium-emissions scenario indicates a meaningful risk increase.",
    },
  },
  {
    id: "rcp85",
    label: { vi: "RCP8.5 2050", en: "RCP8.5 2050" },
    value: "0.304",
    max: "0.427",
    co2: "628",
    increase: "+35.3%",
    image: publicAsset("/images/grain/paddy-rcp85-2050-preview.png"),
    unit: "mg/kg",
    level: { vi: "Ưu tiên cảnh báo", en: "Warning priority" },
    description: {
      vi: "Kịch bản khí hậu khắc nghiệt hơn, dùng để xác định vùng cần lấy mẫu sớm.",
      en: "The higher-warming scenario helps identify areas that need earlier sampling.",
    },
  },
];

export const riskRegions = [
  {
    name: "North",
    viName: "Miền Bắc",
    baseline: "0.224",
    rcp45: "0.283",
    rcp85: "0.329",
    priority: { vi: "Rất cao", en: "Very high" },
  },
  {
    name: "Central",
    viName: "Miền Trung",
    baseline: "0.205",
    rcp45: "0.269",
    rcp85: "0.316",
    priority: { vi: "Cao", en: "High" },
  },
  {
    name: "South",
    viName: "Miền Nam",
    baseline: "0.190",
    rcp45: "0.251",
    rcp85: "0.292",
    priority: { vi: "Trung bình", en: "Medium" },
  },
];

export const paddyMap = {
  basemap: publicAsset("/images/grain/vietnam-basemap.jpg"),
  boundaries: publicAsset("/images/grain/vietnam-boundaries.svg"),
  metadata: publicAsset("/images/grain/paddy-map-metadata.json"),
  mask: publicAsset("/images/grain/paddy-mask-vietnam.png"),
  bbox: "102.0-110.3E, 8.0-23.8N",
  cropWindow: "1848x3518+9326+6774",
  threshold: "0.20 mg/kg",
  seasons: [
    { id: "winter-spring", label: { vi: "Đông-Xuân", en: "Winter-Spring" } },
    { id: "summer-autumn", label: { vi: "Hè-Thu", en: "Summer-Autumn" } },
  ],
  legend: [
    { label: { vi: "An toàn", en: "Safe" }, range: "<0.15", color: "#5ea95a" },
    { label: { vi: "Trung bình", en: "Moderate" }, range: "0.15-0.20", color: "#e0c24a" },
    { label: { vi: "Cao", en: "High" }, range: "0.20-0.30", color: "#e0a72d" },
    { label: { vi: "Rất cao", en: "Very high" }, range: ">0.30", color: "#d8532b" },
  ],
};

export const modelFigures = {
  arsenicTrend: publicAsset("/images/grain/figure-5-arsenic-mean.png"),
  shapSummary: publicAsset("/images/grain/figure-4-shap-summary.jpeg"),
};

export const modelConfiguration = [
  { label: { vi: "Mẫu ban đầu", en: "Raw samples" }, value: "1,327" },
  { label: { vi: "Mẫu giữ lại", en: "Retained samples" }, value: "946" },
  { label: { vi: "Dataset sạch", en: "Cleaned model dataset" }, value: "881" },
  { label: { vi: "Biến dự báo", en: "Predictors" }, value: "24" },
  { label: { vi: "Mô hình", en: "Model" }, value: "Gaussian Process Regression" },
  { label: { vi: "Kernel", en: "Kernel" }, value: "Matérn nu=0.5 + RBF + white noise + dot product" },
  { label: { vi: "CO2 transform", en: "CO2 transform" }, value: "(CO2 - 424.32)" },
  { label: { vi: "Target / features", en: "Target / features" }, value: "log(1 + x), z-score, normalize_y=true" },
  { label: { vi: "Optuna", en: "Optuna" }, value: "30 trials, alpha/noise 0.01-1.0" },
  { label: { vi: "Validation", en: "Validation" }, value: "5-fold CV R2 = 0.365 +/- 0.071" },
  { label: { vi: "Test", en: "Test" }, value: "R2 = 0.3546, RMSE = 0.0743" },
  { label: { vi: "Train", en: "Train" }, value: "R2 = 0.9033, RMSE = 0.0292" },
  { label: { vi: "Projection", en: "Projection" }, value: "18,920 = 946 locations x 10 time steps x 2 scenarios" },
  { label: { vi: "Ensemble", en: "Ensemble" }, value: "50 bootstrap GPR runs, median, p10/p90" },
  { label: { vi: "Exceedance", en: "Exceedance" }, value: "50-run Random Forest classifier, P(Grain As > 0.2 mg/kg)" },
];

export const uncertaintyBands = [
  { scenario: "baseline", p10: "0.16", p50: "0.21", p90: "0.29", exceedance: "54%" },
  { scenario: "rcp45", p10: "0.21", p50: "0.268", p90: "0.35", exceedance: "72%" },
  { scenario: "rcp85", p10: "0.24", p50: "0.304", p90: "0.39", exceedance: "83%" },
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
      vi: "CV R² ≈ 0.365 được trình bày đúng như mô hình cảnh báo kịch bản, không phải công cụ thay thế phòng lab.",
      en: "CV R² ≈ 0.365 is framed as scenario early warning, not as a substitute for lab testing.",
    },
  },
];

export const faqItems: FaqItem[] = [
  {
    question: { vi: "Arsenic trong gạo là gì?", en: "What is arsenic in rice?" },
    answer: {
      vi: "Arsenic là nguyên tố có thể tích lũy trong lúa qua đất và nước. Rủi ro thay đổi theo môi trường, khí hậu, giống lúa và điều kiện canh tác.",
      en: "Arsenic can accumulate in rice through soil and water. Risk varies with environment, climate, rice variety and cultivation conditions.",
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
      vi: "Không. Đây là hệ thống cảnh báo sớm và hỗ trợ quyết định. Mọi quyết định an toàn thực phẩm cần xác minh bằng xét nghiệm phòng lab.",
      en: "No. This is an early-warning and decision-support system. Food-safety decisions require laboratory verification.",
    },
  },
  {
    question: { vi: "CV R² ≈ 0.365 nghĩa là gì?", en: "What does CV R² ≈ 0.365 mean?" },
    answer: {
      vi: "Đây là mức validation hiện tại của mô hình. Nó đủ để minh họa cảnh báo kịch bản và ưu tiên lấy mẫu, nhưng cần thêm dữ liệu để tăng độ chính xác.",
      en: "It is the current validation level. It can support scenario warning and sampling prioritization, but more data is needed to improve accuracy.",
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
