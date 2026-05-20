import type { Locale, LocalizedText } from "@/types/greenfarming";
import { commonText, paddyMap, riskRegions, scenarioResults, faqItems } from "@/lib/greenfarming-data";
import { paperReferenceChunks } from "@/lib/paper-references";
import provinceMap from "../../public/images/grain/vietnam-provinces-map.json";

type ScenarioId = (typeof scenarioResults)[number]["id"];

type StopWords = Set<string>;

export type AudienceRole = "scientist" | "policymaker" | "farmer" | "local";
export type AudienceMode = "expert" | "farmer";
export type ActionLevel = "explain" | "prioritize" | "coordinate" | "verify";

export type CitationRecord = {
  id: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  source: LocalizedText;
};

export type GroundTruth = {
  scenarioId: ScenarioId;
  scenarioLabel: string;
  nationalMean: string;
  max: string;
  threshold: string;
  region: string;
  regionValue: string;
  disclaimer: string;
};

type CorpusChunk = {
  id: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  source: LocalizedText;
  keywords: string[];
};

type ProvinceMapFeature = (typeof provinceMap.provinces)[number];

const stopWords: StopWords = new Set(
  [
    "the",
    "and",
    "or",
    "for",
    "are",
    "can",
    "may",
    "might",
    "should",
    "this",
    "that",
    "with",
    "without",
    "where",
    "when",
    "what",
    "how",
    "why",
    "which",
    "about",
    "than",
    "have",
    "that",
    "from",
    "not",
    "does",
    "doesn",
    "were",
    "what",
    "who",
    "là",
    "của",
    "và",
    "hoặc",
    "có",
    "không",
    "cũng",
    "này",
    "đây",
    "trên",
    "về",
    "sau",
    "trước",
    "một",
    "nhiều",
  ],
);

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

function formatMetric(value: number) {
  return value.toFixed(3).replace(/\.?0+$/, "");
}

function provinceDelta(province: ProvinceMapFeature, scenario: "rcp45" | "rcp85") {
  const delta = province.metrics[scenario] - province.metrics.baseline;
  const percent = province.metrics.baseline === 0 ? 0 : (delta / province.metrics.baseline) * 100;
  return {
    delta,
    percent,
    label: `${delta >= 0 ? "+" : ""}${formatMetric(delta)} mg/kg (${delta >= 0 ? "+" : ""}${formatMetric(percent)}%)`,
  };
}

function provinceAliases(province: ProvinceMapFeature) {
  return [province.name, ...province.mergedFrom].map((value) => normalizeSearchText(value));
}

function provinceKeywordTokens(province: ProvinceMapFeature) {
  const tokenSource = [province.name, ...province.mergedFrom, ...provinceAliases(province)].join(" ");
  return Array.from(new Set(tokenSource.split(/[^a-z0-9À-ỹ]+/i).filter((token) => token.length > 1)));
}

function provinceSummaryText(scenario: "rcp45" | "rcp85", mode: "absolute" | "percent" = "absolute") {
  return [...provinceMap.provinces]
    .sort((left, right) => {
      const leftDelta = provinceDelta(left, scenario);
      const rightDelta = provinceDelta(right, scenario);
      return mode === "percent" ? rightDelta.percent - leftDelta.percent : rightDelta.delta - leftDelta.delta;
    })
    .slice(0, 5)
    .map((province) => `${province.name}: ${formatMetric(province.metrics[scenario])} mg/kg (${provinceDelta(province, scenario).label})`)
    .join("; ");
}

function provinceRegion(province: ProvinceMapFeature) {
  const y = province.center.y;
  if (y <= 400) {
    return {
      en: "North",
      vi: "Miền Bắc",
      keyword: "north",
    };
  }
  if (y <= 760) {
    return {
      en: "Central",
      vi: "Miền Trung",
      keyword: "central",
    };
  }
  return {
    en: "South",
    vi: "Miền Nam",
    keyword: "south",
  };
}

function provinceForecastSummaryText(regionKeyword: "north" | "central" | "south", scenario: "rcp45" | "rcp85") {
  return provinceMap.provinces
    .filter((province) => provinceRegion(province).keyword === regionKeyword)
    .sort((left, right) => right.metrics[scenario] - left.metrics[scenario])
    .slice(0, 5)
    .map((province) => `${province.name}: ${formatMetric(province.metrics[scenario])} mg/kg (${provinceDelta(province, scenario).label} vs baseline)`)
    .join("; ");
}

function provinceValueSummaryText(
  regionKeyword: "north" | "central" | "south" | "national",
  scenario: "baseline" | "rcp45" | "rcp85",
  locale: Locale,
) {
  const provinces =
    regionKeyword === "national"
      ? provinceMap.provinces
      : provinceMap.provinces.filter((province) => provinceRegion(province).keyword === regionKeyword);
  const highest = [...provinces].sort((left, right) => right.metrics[scenario] - left.metrics[scenario])[0];
  const lowest = [...provinces].sort((left, right) => left.metrics[scenario] - right.metrics[scenario])[0];
  const average = provinces.reduce((sum, province) => sum + province.metrics[scenario], 0) / provinces.length;

  return locale === "vi"
    ? `cao nhất ${highest.name}: ${formatMetric(highest.metrics[scenario])} mg/kg; thấp nhất ${lowest.name}: ${formatMetric(lowest.metrics[scenario])} mg/kg; trung bình ${formatMetric(average)} mg/kg trên ${provinces.length} đơn vị tỉnh`
    : `highest ${highest.name}: ${formatMetric(highest.metrics[scenario])} mg/kg; lowest ${lowest.name}: ${formatMetric(lowest.metrics[scenario])} mg/kg; average ${formatMetric(average)} mg/kg across ${provinces.length} province units`;
}

function provinceScenarioSummaryText(scenario: "baseline" | "rcp45" | "rcp85", locale: Locale) {
  const regionLabels =
    locale === "vi"
      ? { national: "Cả nước", north: "Miền Bắc", central: "Miền Trung", south: "Miền Nam" }
      : { national: "National", north: "North", central: "Central", south: "South" };

  return [
    `${regionLabels.national}: ${provinceValueSummaryText("national", scenario, locale)}`,
    `${regionLabels.north}: ${provinceValueSummaryText("north", scenario, locale)}`,
    `${regionLabels.central}: ${provinceValueSummaryText("central", scenario, locale)}`,
    `${regionLabels.south}: ${provinceValueSummaryText("south", scenario, locale)}`,
  ].join(". ");
}

type ProvinceScenario = "baseline" | "rcp45" | "rcp85";

type ProvinceScope = "national" | "north" | "central" | "south";

function provinceScenarioLabel(scenario: ProvinceScenario, locale: Locale) {
  if (scenario === "baseline") {
    return locale === "vi" ? "Baseline/hiện tại" : "Baseline/current";
  }
  return scenario === "rcp45" ? "RCP4.5 2050" : "RCP8.5 2050";
}

function provinceScopeLabel(scope: ProvinceScope, locale: Locale) {
  const labels: Record<ProvinceScope, LocalizedText> = {
    national: { en: "National", vi: "Cả nước" },
    north: { en: "North", vi: "Miền Bắc" },
    central: { en: "Central", vi: "Miền Trung" },
    south: { en: "South", vi: "Miền Nam" },
  };
  return labels[scope][locale];
}

function getProvinceScopeItems(scope: ProvinceScope) {
  if (scope === "national") {
    return provinceMap.provinces;
  }
  return provinceMap.provinces.filter((province) => provinceRegion(province).keyword === scope);
}

function summarizeProvinceDashboard(scope: ProvinceScope, scenario: ProvinceScenario, locale: Locale) {
  const provinces = getProvinceScopeItems(scope);
  const highest = [...provinces].sort((left, right) => right.metrics[scenario] - left.metrics[scenario])[0];
  const lowest = [...provinces].sort((left, right) => left.metrics[scenario] - right.metrics[scenario])[0];
  const average = provinces.reduce((sum, province) => sum + province.metrics[scenario], 0) / provinces.length;

  return locale === "vi"
    ? `${provinceScenarioLabel(scenario, locale)} - ${provinceScopeLabel(scope, locale)}: cao nhất ${highest.name} ${formatMetric(highest.metrics[scenario])} mg/kg; thấp nhất ${lowest.name} ${formatMetric(lowest.metrics[scenario])} mg/kg; trung bình ${formatMetric(average)} mg/kg (${provinces.length} đơn vị tỉnh).`
    : `${provinceScenarioLabel(scenario, locale)} - ${provinceScopeLabel(scope, locale)}: highest ${highest.name} ${formatMetric(highest.metrics[scenario])} mg/kg; lowest ${lowest.name} ${formatMetric(lowest.metrics[scenario])} mg/kg; average ${formatMetric(average)} mg/kg (${provinces.length} province units).`;
}

function detectProvinceScenarios(normalizedMessage: string): ProvinceScenario[] {
  const scenarios: ProvinceScenario[] = [];
  if (/baseline|current|hien tai|hiện tại/.test(normalizedMessage)) {
    scenarios.push("baseline");
  }
  if (/rcp\s*4\.?5|rcp45|4\.5/.test(normalizedMessage)) {
    scenarios.push("rcp45");
  }
  if (/rcp\s*8\.?5|rcp85|8\.5/.test(normalizedMessage)) {
    scenarios.push("rcp85");
  }
  if (/\brcp\b/.test(normalizedMessage) && scenarios.length === 0) {
    scenarios.push("rcp45", "rcp85");
  }
  return scenarios.length > 0 ? scenarios : ["baseline", "rcp45", "rcp85"];
}

function detectProvinceScopes(normalizedMessage: string): ProvinceScope[] {
  const scopes: ProvinceScope[] = [];
  if (/ca nuoc|toan quoc|viet nam|vietnam|national|country/.test(normalizedMessage)) {
    scopes.push("national");
  }
  if (/mien bac|north/.test(normalizedMessage)) {
    scopes.push("north");
  }
  if (/mien trung|central/.test(normalizedMessage)) {
    scopes.push("central");
  }
  if (/mien nam|south/.test(normalizedMessage)) {
    scopes.push("south");
  }
  if (/3 mien|ba mien|three regions/.test(normalizedMessage)) {
    scopes.push("north", "central", "south");
  }
  return scopes.length > 0 ? Array.from(new Set(scopes)) : ["national"];
}

function buildProvinceQueryChunk(message: string, locale: Locale): CitationRecord | null {
  const normalizedMessage = normalizeSearchText(message);
  const mentionsProvinceMetric = /province|province-level|popup|map|dashboard|tinh|thanh pho|mien|ca nuoc|toan quoc|national|north|central|south|highest|lowest|average|mean|cao nhat|thap nhat|trung binh|nong do|du bao|baseline|rcp/.test(normalizedMessage);
  if (!mentionsProvinceMetric) {
    return null;
  }

  const scenarios = detectProvinceScenarios(normalizedMessage);
  const scopes = detectProvinceScopes(normalizedMessage);
  const lines = scenarios.flatMap((scenario) => scopes.map((scope) => summarizeProvinceDashboard(scope, scenario, locale)));

  return {
    id: "P1",
    title: {
      en: "Dashboard map query result",
      vi: "Kết quả truy vấn từ dashboard",
    },
    excerpt: {
      en: `Dynamic dashboard query result from values visible in the dashboard map: ${lines.join(" ")}`,
      vi: `Kết quả truy vấn động từ các giá trị hiển thị trên bản đồ dashboard: ${lines.join(" ")}`,
    },
    source: {
      en: "Dashboard map values",
      vi: "Dữ liệu hiển thị trên dashboard",
    },
  };
}

const PROVINCE_CORPUS_CHUNKS: CorpusChunk[] = provinceMap.provinces.map((province, index) => {
  const rcp45Delta = provinceDelta(province, "rcp45");
  const rcp85Delta = provinceDelta(province, "rcp85");
  const mergedNote =
    province.mergedFrom.length > 1
      ? ` Merged unit includes: ${province.mergedFrom.join(", ")}.`
      : "";

  return {
    id: `P${index + 1}`,
    title: {
      en: `${province.name} province-level map values`,
      vi: `Giá trị bản đồ cấp tỉnh của ${province.name}`,
    },
    excerpt: {
      en: `${province.name} has dashboard map estimates visible to users: Baseline ${formatMetric(province.metrics.baseline)} mg/kg, RCP4.5 2050 ${formatMetric(province.metrics.rcp45)} mg/kg (${rcp45Delta.label} vs baseline), and RCP8.5 2050 ${formatMetric(province.metrics.rcp85)} mg/kg (${rcp85Delta.label} vs baseline).${mergedNote} These are model/map estimates for warning and sampling priority, not laboratory confirmation.`,
      vi: `${province.name} có ước tính hiển thị trên bản đồ dashboard: Baseline ${formatMetric(province.metrics.baseline)} mg/kg, RCP4.5 2050 ${formatMetric(province.metrics.rcp45)} mg/kg (${rcp45Delta.label} so với baseline), và RCP8.5 2050 ${formatMetric(province.metrics.rcp85)} mg/kg (${rcp85Delta.label} so với baseline).${mergedNote} Đây là ước tính mô hình/bản đồ để cảnh báo và ưu tiên lấy mẫu, không phải xác nhận phòng thí nghiệm.`,
    },
    source: {
      en: "Dashboard map values",
      vi: "Dữ liệu hiển thị trên dashboard",
    },
    keywords: [
      province.name,
      ...province.mergedFrom,
      ...provinceAliases(province),
      ...provinceKeywordTokens(province),
      "province",
      "province-level",
      "tỉnh",
      "popup",
      "map",
      "dashboard",
      "baseline",
      "rcp45",
      "rcp85",
      "2050",
      "increase",
      "change",
      "tăng",
      "thay đổi",
      "nồng độ",
      "asen",
      "arsenic",
    ],
  };
});

const PROVINCE_SEARCH_RECORDS = provinceMap.provinces.map((province, index) => ({
  aliases: provinceAliases(province),
  chunk: PROVINCE_CORPUS_CHUNKS[index],
}));

const PROJECT_CORPUS_CHUNKS: CorpusChunk[] = [
  {
    id: "S1",
    title: {
      en: "Scenario summary and projection values",
      vi: "Tổng quan kịch bản và giá trị dự báo",
    },
    excerpt: {
      en: "Scenarios compare Baseline 2025, RCP4.5 2050 and RCP8.5 2050. The reference threshold used for dashboard interpretation is 0.20 mg/kg. Baseline national mean is around 0.21 mg/kg (max 0.34); RCP4.5 is around 0.268 mg/kg (max 0.383); RCP8.5 is around 0.304 mg/kg (max 0.427).",
      vi: "Kịch bản so sánh Baseline 2025, RCP4.5 2050 và RCP8.5 2050. Ngưỡng tham chiếu dùng trong diễn giải dashboard là 0.20 mg/kg. Baseline có trung bình khoảng 0.21 mg/kg (đỉnh 0.34), RCP4.5 khoảng 0.268 mg/kg (đỉnh 0.383), và RCP8.5 khoảng 0.304 mg/kg (đỉnh 0.427).",
    },
    source: {
      en: "Project scenario metadata and dashboard configuration",
      vi: "Siêu dữ liệu kịch bản dự án và cấu hình dashboard",
    },
    keywords: [
      "baseline",
      "rcp45",
      "rcp8.5",
      "threshold",
      "0.20",
      "0.2",
      "mean",
      "max",
      "national",
      "scenario",
      "scenario",
      "0.21",
      "0.268",
      "0.304",
      "0.34",
      "0.383",
      "0.427",
      "miền bắc",
      "miền trung",
      "miền nam",
      "Baseline",
      "trung bình",
      "nồng độ",
      "mg/kg",
      "ngưỡng",
    ],
  },
  {
    id: "S2",
    title: {
      en: "Uncertainty and exceedance banding",
      vi: "Bất định và dải vượt ngưỡng",
    },
    excerpt: {
      en: "Uncertainty is shown with p10/p50/p90 for each scenario. Estimated probability of exceeding 0.2 mg/kg is 54% for baseline, 72% for RCP4.5, and 83% for RCP8.5, indicating a stronger early-warning signal under the high-emission pathway.",
      vi: "Bất định được biểu diễn bởi dải p10/p50/p90 cho từng kịch bản. Xác suất vượt ngưỡng 0.2 mg/kg là 54% cho baseline, 72% cho RCP4.5 và 83% cho RCP8.5, cho thấy tín hiệu cảnh báo cao hơn rõ rệt trong kịch bản phát thải cao.",
    },
    source: {
      en: "Dashboard uncertainty bands",
      vi: "Bảng dải bất định trên dashboard",
    },
    keywords: [
      "uncertainty",
      "uncertainty bands",
      "p10",
      "p50",
      "p90",
      "probability",
      "exceed",
      "exceedance",
      "bất định",
      "dải",
      "xác suất",
      "vượt",
      "khả năng",
    ],
  },
  {
    id: "S3",
    title: {
      en: "Province-level region summaries",
      vi: "Tóm tắt theo vùng",
    },
    excerpt: {
      en: "The demo uses three macro regions for regional context: North (very high priority), Central (high priority), South (medium priority). Example values for the RCP8.5 scenario are North 0.329 mg/kg, Central 0.316 mg/kg, South 0.292 mg/kg.",
      vi: "Mô hình minh họa dùng ba vùng: Miền Bắc (ưu tiên rất cao), Miền Trung (ưu tiên cao), Miền Nam (ưu tiên trung bình). Dữ liệu minh họa cho RCP8.5 là Miền Bắc 0.329 mg/kg, Miền Trung 0.316 mg/kg, Miền Nam 0.292 mg/kg.",
    },
    source: {
      en: "Risk region panel and sample region map data",
      vi: "Panel vùng rủi ro và dữ liệu bản đồ",
    },
    keywords: [
      "region",
      "regions",
      "north",
      "central",
      "south",
      "miền bắc",
      "miền trung",
      "miền nam",
      "priority",
      "ưu tiên",
      "0.329",
      "0.316",
      "0.292",
      "province",
      "region",
    ],
  },
  {
    id: "S4",
    title: {
      en: "Model configuration and validation",
      vi: "Cấu hình mô hình và độ tin cậy",
    },
    excerpt: {
      en: "The model uses Gaussian Process Regression with 24 predictors, 1,327 collected rice samples, 881 cleaned-model rows, and cross-validated R² around 0.365. It is meant as an early-warning and sampling-priority layer, not a direct replacement for official food-safety decisions.",
      vi: "Mô hình dùng Gaussian Process Regression với 24 biến đầu vào, 1,327 mẫu gạo, 881 mẫu đã lọc cho lớp mô hình, và CV R² khoảng 0.365. Đây là lớp cảnh báo sớm và ưu tiên lấy mẫu, không phải thay thế quyết định an toàn thực phẩm chính thức.",
    },
    source: {
      en: "Model card and architecture description",
      vi: "Thẻ mô hình và mô tả kiến trúc",
    },
    keywords: [
      "gpr",
      "gaussian",
      "process",
      "regression",
      "cross",
      "validation",
      "cv",
      "predictors",
      "1,327",
      "sample",
      "mẫu",
      "mô hình",
      "shap",
      "ensemble",
    ],
  },
  {
    id: "S5",
    title: {
      en: "Data and climate-scenario methodology",
      vi: "Phương pháp dữ liệu và kịch bản khí hậu",
    },
    excerpt: {
      en: "The project pipeline ingests rice-sample, climate, soil, water, terrain and predictor features, then projects arsenic risk under climate forcing for 2050. The study abstract highlights a non-linear increase and spatial expansion of higher-risk areas under future climate conditions.",
      vi: "Pipeline của dự án xử lý dữ liệu mẫu gạo, khí hậu, đất, nước, địa hình và các biến dự báo, sau đó suy diễn rủi ro arsenic cho khí hậu tương lai đến 2050. Tóm tắt nghiên cứu cho thấy xu hướng tăng không tuyến tính và mở rộng khu vực rủi ro cao hơn khi khí hậu thay đổi.",
    },
    source: {
      en: "Paper and pipeline documentation",
      vi: "Tài liệu phương pháp nghiên cứu và pipeline",
    },
    keywords: [
      "climate",
      "method",
      "pipeline",
      "projection",
      "co2",
      "scenario",
      "non-linear",
      "2050",
      "khí hậu",
      "phương pháp",
      "dự báo",
      "tiêu chuẩn",
      "rủi ro",
    ],
  },
  {
    id: "S6",
    title: {
      en: "Interpretation limits and disclaimer",
      vi: "Giới hạn diễn giải và cảnh báo",
    },
    excerpt: {
      en: commonText.modelNotice.en,
      vi: commonText.modelNotice.vi,
    },
    source: {
      en: "Dashboard and FAQ wording",
      vi: "Văn bản dashboard và FAQ",
    },
    keywords: [
      "disclaimer",
      "lab",
      "laboratory",
      "warning",
      "không thay thế",
      "không thay thế phòng",
      "xét nghiệm",
      "an toàn",
      "thử nghiệm",
      "thế",
      "giới hạn",
    ],
  },
  {
    id: "S7",
    title: {
      en: "WHO arsenic exposure context",
      vi: "Bối cảnh phơi nhiễm theo WHO",
    },
    excerpt: {
      en: "WHO describes inorganic arsenic as highly toxic and identifies long-term exposure through drinking water and food as a pathway linked to skin lesions, cancer and other chronic health risks. Rice can be part of exposure where crops or cooking water are affected.",
      vi: "WHO mô tả arsenic vô cơ là dạng có độc tính cao; phơi nhiễm lâu dài qua nước uống và thực phẩm có liên quan đến tổn thương da, ung thư và các rủi ro sức khỏe mạn tính khác. Gạo có thể là một phần của phơi nhiễm khi cây trồng hoặc nước nấu bị ảnh hưởng.",
    },
    source: {
      en: faqItems[0].source?.label.en ?? "WHO arsenic fact sheet",
      vi: faqItems[0].source?.label.vi ?? "Nguồn WHO",
    },
    keywords: [
      "who",
      "arsenic",
      "health",
      "exposure",
      "long-term",
      "skin",
      "lesions",
      "cancer",
      "ung thư",
      "phơi nhiễm",
      "sức khỏe",
    ],
  },
  {
    id: "S8",
    title: {
      en: "Model outputs and map interpretation",
      vi: "Kết quả mô hình và diễn giải bản đồ",
    },
    excerpt: {
      en: "The risk map in this demo is an illustrative layer based on project outputs; it is not an official GIS product. Interpretation should focus on trends, uncertainty, and sampling prioritization, with explicit caution for official decisions.",
      vi: "Bản đồ trong demo là lớp minh họa từ kết quả dự án, không phải lớp GIS chính thức. Diễn giải nên tập trung vào xu hướng, độ bất định và ưu tiên lấy mẫu, kèm cảnh báo cho quyết định chính thức.",
    },
    source: {
      en: "Project dashboard map note and technical write-up",
      vi: "Ghi chú bản đồ dự án và mô tả kỹ thuật",
    },
    keywords: [
      "map",
      "visualization",
      "illustrative",
      "trend",
      "uncertainty",
      "risk map",
      "bản đồ",
      "mô phỏng",
      "ưu tiên lấy mẫu",
      "không chính thức",
    ],
  },
  {
    id: "S9",
    title: {
      en: "FAQ: support boundaries",
      vi: "FAQ: phạm vi hỗ trợ",
    },
    excerpt: {
      en: faqItems[2].answer.en,
      vi: faqItems[2].answer.vi,
    },
    source: {
      en: "FAQ safety boundary",
      vi: "FAQ về phạm vi an toàn",
    },
    keywords: [
      "replace",
      "lab",
      "testing",
      "safety",
      "official",
      "does this replace",
      "thay thế",
      "xét nghiệm",
      "quyết định",
      "an toàn thực phẩm",
      "an toàn",
    ],
  },
  {
    id: "S10",
    title: {
      en: "Stakeholder workflows by role",
      vi: "Quy trình theo nhóm người dùng",
    },
    excerpt: {
      en: "Scientists should focus on methods, uncertainty, validation limits and research questions. Policymakers should use the dashboard for surveillance priority, public communication and resource allocation. Farmers should use it as a signal to ask extension staff and verify through sampling, not as a diagnosis. Local authorities or cooperatives should coordinate sample collection, crop-season records and reporting.",
      vi: "Nhà khoa học nên tập trung vào phương pháp, bất định, giới hạn kiểm định và câu hỏi nghiên cứu tiếp theo. Nhà hoạch định chính sách nên dùng dashboard cho ưu tiên giám sát, truyền thông rủi ro và phân bổ nguồn lực. Nông dân chỉ nên xem đây là tín hiệu để hỏi cán bộ kỹ thuật và xác minh bằng lấy mẫu, không tự kết luận. Địa phương hoặc HTX nên phối hợp lấy mẫu, ghi nhận mùa vụ và báo cáo.",
    },
    source: {
      en: "Project stakeholder workflow note",
      vi: "Ghi chú quy trình người dùng của dự án",
    },
    keywords: [
      "role",
      "stakeholder",
      "workflow",
      "scientist",
      "policymaker",
      "policy",
      "farmer",
      "local",
      "cooperative",
      "extension",
      "nhà khoa học",
      "chính sách",
      "nông dân",
      "địa phương",
      "htx",
      "cán bộ",
      "quy trình",
    ],
  },
  {
    id: "S11",
    title: {
      en: "Codex polished rice arsenic context",
      vi: "Bối cảnh Codex cho arsenic trong gạo trắng",
    },
    excerpt: {
      en: "Codex CXS 193-1995 lists a maximum level of 0.2 mg/kg for inorganic arsenic in polished rice. The dashboard uses 0.20 mg/kg only as a reference warning threshold for prioritizing interpretation and sampling. Model outputs should not be described as inorganic-arsenic compliance results unless laboratory speciation and verification confirm that basis.",
      vi: "Codex CXS 193-1995 nêu mức tối đa 0.2 mg/kg cho arsenic vô cơ trong gạo trắng. Dashboard chỉ dùng 0.20 mg/kg như ngưỡng tham chiếu cảnh báo để ưu tiên diễn giải và lấy mẫu. Không nên mô tả kết quả mô hình như kết quả tuân thủ arsenic vô cơ nếu chưa có xác định dạng chất và xác minh phòng lab.",
    },
    source: {
      en: "Codex Alimentarius CXS 193-1995, General Standard for Contaminants and Toxins in Food and Feed",
      vi: "Codex Alimentarius CXS 193-1995, tiêu chuẩn chung về chất nhiễm bẩn và độc tố trong thực phẩm/thức ăn chăn nuôi",
    },
    keywords: [
      "codex",
      "cxs",
      "193",
      "1995",
      "polished",
      "rice",
      "inorganic",
      "arsenic",
      "0.2",
      "0.20",
      "mg/kg",
      "maximum",
      "level",
      "threshold",
      "gạo trắng",
      "arsenic vô cơ",
      "ngưỡng",
      "mức tối đa",
    ],
  },
  {
    id: "S12",
    title: {
      en: "Laboratory verification boundary",
      vi: "Ranh giới xác minh phòng lab",
    },
    excerpt: {
      en: "Model outputs are screening and early-warning evidence. They can prioritize where to collect samples and what uncertainty to check, but they cannot replace accredited sampling, laboratory measurement, chain-of-custody practice or official food-safety decisions.",
      vi: "Kết quả mô hình là bằng chứng sàng lọc và cảnh báo sớm. Kết quả có thể ưu tiên nơi cần lấy mẫu và phần bất định cần kiểm tra, nhưng không thay thế lấy mẫu chuẩn, đo đạc phòng lab, quy trình bàn giao mẫu hoặc quyết định an toàn thực phẩm chính thức.",
    },
    source: {
      en: "Project guardrail and model-use boundary",
      vi: "Guardrail dự án và ranh giới sử dụng mô hình",
    },
    keywords: [
      "lab",
      "laboratory",
      "verification",
      "verify",
      "sampling",
      "sample",
      "chain",
      "custody",
      "official",
      "food",
      "safety",
      "xét nghiệm",
      "phòng lab",
      "lấy mẫu",
      "xác minh",
      "an toàn thực phẩm",
      "chính thức",
    ],
  },
  {
    id: "S13",
    title: {
      en: "Local sampling coordination",
      vi: "Phối hợp lấy mẫu tại địa phương",
    },
    excerpt: {
      en: "A local sampling plan should start from risk-priority areas, then record province/district/commune, field location, crop season, rice variety where available, water or soil context, sampling date, collector, and laboratory destination. Results should be shared with the responsible local authority, cooperative or technical unit.",
      vi: "Kế hoạch lấy mẫu địa phương nên bắt đầu từ vùng ưu tiên rủi ro, sau đó ghi tỉnh/huyện/xã, vị trí ruộng, mùa vụ, giống lúa nếu có, bối cảnh nước hoặc đất, ngày lấy mẫu, người lấy mẫu và nơi gửi lab. Kết quả cần được chia sẻ với cơ quan địa phương, HTX hoặc đơn vị kỹ thuật phụ trách.",
    },
    source: {
      en: "Project local coordination checklist",
      vi: "Checklist phối hợp địa phương của dự án",
    },
    keywords: [
      "local",
      "district",
      "commune",
      "cooperative",
      "sampling",
      "crop",
      "season",
      "record",
      "report",
      "province",
      "địa phương",
      "huyện",
      "xã",
      "htx",
      "lấy mẫu",
      "mùa vụ",
      "ghi nhận",
      "báo cáo",
    ],
  },
  {
    id: "S14",
    title: {
      en: "FAO participatory water-management context",
      vi: "Bối cảnh FAO về quản lý nước có sự tham gia",
    },
    excerpt: {
      en: "FAO water-management materials emphasize institutional capacity, advisory services and participatory farmer water-management support. For this v1 assistant, that context supports coordination and training discussion only; it does not enable weather forecasts, water-withdrawal schedules or field-specific irrigation prescriptions.",
      vi: "Tài liệu quản lý nước của FAO nhấn mạnh năng lực thể chế, dịch vụ tư vấn và hỗ trợ quản lý nước có sự tham gia của nông dân. Với trợ lý v1, bối cảnh này chỉ hỗ trợ thảo luận về phối hợp và tập huấn; không cung cấp dự báo thời tiết, lịch rút nước hoặc chỉ định tưới tiêu cụ thể cho từng ruộng.",
    },
    source: {
      en: "FAO Land & Water: Water Management",
      vi: "FAO Land & Water: Quản lý nước",
    },
    keywords: [
      "fao",
      "water",
      "management",
      "participatory",
      "farmer",
      "training",
      "extension",
      "irrigation",
      "coordination",
      "quản lý nước",
      "nông dân",
      "tập huấn",
      "tưới",
      "phối hợp",
    ],
  },
];

function splitTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !stopWords.has(token) && token.length < 24);
}

function regionValue(region: (typeof riskRegions)[number], scenarioId: ScenarioId): string {
  if (scenarioId === "baseline") {
    return `${region.baseline} mg/kg`;
  }
  if (scenarioId === "rcp45") {
    return `${region.rcp45} mg/kg`;
  }
  return `${region.rcp85} mg/kg`;
}

function toLocalizedText(value: LocalizedText, locale: Locale): string {
  return value[locale];
}

export function getScenario(scenarioId?: string) {
  return scenarioResults.find((item) => item.id === scenarioId) ?? scenarioResults[0];
}

export function getRegion(regionName?: string) {
  if (!regionName) {
    return riskRegions[0];
  }
  const normalized = regionName.trim().toLowerCase();
  return (
    riskRegions.find((region) => region.name.toLowerCase() === normalized || region.viName.toLowerCase() === normalized) ??
    riskRegions[0]
  );
}

export function getGroundTruth(locale: Locale, scenarioId?: string, regionName?: string): GroundTruth {
  const scenario = getScenario(scenarioId);
  const region = getRegion(regionName);
  return {
    scenarioId: scenario.id,
    scenarioLabel: toLocalizedText(scenario.label, locale),
    nationalMean: `${scenario.value} mg/kg`,
    max: `${scenario.max} mg/kg`,
    threshold: paddyMap.threshold,
    region: locale === "vi" ? region.viName : region.name,
    regionValue: regionValue(region, scenario.id),
    disclaimer: toLocalizedText(commonText.modelNotice, locale),
  };
}

function toCitationRecord({ id, title, excerpt, source }: CorpusChunk): CitationRecord {
  return {
    id,
    title,
    excerpt,
    source,
  };
}

function uniqueCitationRecords(records: CitationRecord[]) {
  const seen = new Set<string>();
  const unique: CitationRecord[] = [];
  for (const record of records) {
    if (seen.has(record.id)) {
      continue;
    }
    seen.add(record.id);
    unique.push(record);
  }
  return unique;
}

function selectProvinceChunks(message: string, locale: Locale): CitationRecord[] {
  const normalizedMessage = normalizeSearchText(message);
  const exactProvinceChunks = PROVINCE_SEARCH_RECORDS.filter((record) =>
    record.aliases.some((alias) => alias.length > 2 && normalizedMessage.includes(alias)),
  ).map((record) => toCitationRecord(record.chunk));
  const queryChunk = buildProvinceQueryChunk(message, locale);

  if (!queryChunk && exactProvinceChunks.length === 0) {
    return [];
  }

  return uniqueCitationRecords([...(queryChunk ? [queryChunk] : []), ...exactProvinceChunks]).slice(0, 5);
}

export function selectCorpusChunks(locale: Locale, message: string, audienceRole?: AudienceRole): CitationRecord[] {
  const roleBoostTerms: Record<AudienceRole, string> = {
    scientist: "scientist model uncertainty validation climate arsenic rice sampling",
    policymaker: "policy risk surveillance sampling climate arsenic rice resources",
    farmer: "farmer arsenic rice lab sampling verification extension",
    local: "local cooperative district commune sampling records arsenic rice lab",
  };
  const roleBoost = audienceRole ? ` ${roleBoostTerms[audienceRole]}` : "";
  const tokens = splitTokens(`${message}${roleBoost}`);
  const scoreChunks = (chunks: CorpusChunk[]) =>
    chunks.map((chunk) => {
      const haystack = normalizeSearchText(`${chunk.title[locale]} ${chunk.excerpt[locale]} ${chunk.source[locale]} ${chunk.keywords.join(" ")}`);
      const keywordSet = new Set(chunk.keywords.map((keyword) => normalizeSearchText(keyword)));
      let score = 0;
      for (const token of tokens.map((entry) => normalizeSearchText(entry))) {
        if (keywordSet.has(token)) {
          score += 3;
        }
        if (haystack.includes(token)) {
          score += 1;
        }
      }
      return { ...chunk, score };
    });

  const selected = scoreChunks(PROJECT_CORPUS_CHUNKS)
    .sort((left, right) => {
      if (left.score === right.score) {
        return left.id.localeCompare(right.id);
      }
      return right.score - left.score;
    })
    .filter((entry) => entry.score > 0)
    .slice(0, 8)
    .map(toCitationRecord);

  const provinceChunks = selectProvinceChunks(message, locale);

  const projectChunks =
    selected.length >= 3
      ? uniqueCitationRecords([...provinceChunks, ...selected]).slice(0, 12)
      : uniqueCitationRecords([...provinceChunks, ...PROJECT_CORPUS_CHUNKS.slice(0, 8).map(toCitationRecord)]).slice(0, 12);

  const scoredPaperReferences = scoreChunks(paperReferenceChunks).sort((left, right) => {
    if (left.score === right.score) {
      return left.id.localeCompare(right.id, undefined, { numeric: true });
    }
    return right.score - left.score;
  });
  const orderedPaperReferences = [
    ...scoredPaperReferences.filter((entry) => entry.score > 0),
    ...scoredPaperReferences.filter((entry) => entry.score === 0),
  ].map(toCitationRecord);

  return [...projectChunks, ...orderedPaperReferences];
}

export function buildContext(locale: Locale, chunks: CitationRecord[]): string {
  if (chunks.length === 0) {
    return "";
  }
  return chunks
    .slice(0, 18)
    .map((chunk) => `[${chunk.id}] ${toLocalizedText(chunk.title, locale)}: ${toLocalizedText(chunk.excerpt, locale)} (Source: ${toLocalizedText(chunk.source, locale)})`)
    .join("\n\n");
}
