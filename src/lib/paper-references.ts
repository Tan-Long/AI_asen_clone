import type { LocalizedText } from "@/types/greenfarming";

export type PaperReferenceChunk = {
  id: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  source: LocalizedText;
  keywords: string[];
};

const source: LocalizedText = {
  en: "References section, 1-2025-03683.docx",
  vi: "References section, 1-2025-03683.docx",
};

function reference(id: string, title: string, excerpt: string, keywords: string[]): PaperReferenceChunk {
  return {
    id,
    title: { en: title, vi: title },
    excerpt: { en: excerpt, vi: excerpt },
    source,
    keywords,
  };
}

export const paperReferenceChunks: PaperReferenceChunk[] = [
  reference(
    "R1",
    "Abedin et al. (2002), arsenic uptake kinetics in rice",
    "Abedin, M. J., Feldmann, J., & Meharg, A. A. (2002). Uptake kinetics of arsenic species in rice plants. Plant Physiol., 128, 1120.",
    ["abedin", "feldmann", "meharg", "uptake", "kinetics", "arsenic", "rice", "plants"],
  ),
  reference(
    "R2",
    "Addiscott (2024), modelling potential and limitations",
    "Addiscott, T. M. (2024). Modeling: Potential and limitations. Handbook of Processes and Modeling in the Soil-Plant System, 707-730. https://doi.org/10.1201/9781003578543-23",
    ["addiscott", "modeling", "modelling", "limitations", "soil", "plant", "system"],
  ),
  reference(
    "R3",
    "Cai et al. (2018), rice photosynthesis under elevated CO2 and temperature",
    "Cai, C., Li, G., Yang, H., Yang, J., Liu, H., Struik, P. C., Luo, W., Yin, X., Di, L., Guo, X., Jiang, W., Si, C., Pan, G., & Zhu, J. (2018). Do all leaf photosynthesis parameters of rice acclimate to elevated CO2, elevated temperature, and their combination, in FACE environments? Global Change Biology, 24(4), 1685-1707. https://doi.org/10.1111/gcb.13961",
    ["cai", "photosynthesis", "rice", "elevated", "co2", "temperature", "face", "climate"],
  ),
  reference(
    "R4",
    "Cao et al. (2020), water management and arsenic uptake in rice",
    "Cao, Z., Pan, J., Yang, Y., Cao, Z., Xu, P., Chen, M., & Guan, M. (2020). Water management affects arsenic uptake and translocation by regulating arsenic bioavailability, transporter expression and thiol metabolism in rice (Oryza sativa L.). Ecotoxicology and Environmental Safety, 206(12), 111208. https://doi.org/10.1016/j.ecoenv.2020.111208",
    ["cao", "water", "management", "arsenic", "uptake", "translocation", "bioavailability", "rice"],
  ),
  reference(
    "R5",
    "Dao et al. (2023), arsenic in the Mekong soil-rice system",
    "Dao, H. T., Dinh, V. M., Nguyen, A. T. Q., Dang, Q. T., Nguyen, H. T., Nguyen, M. T., Nguyen, D. T., Duong, L. H., Nguyen, A. Q., Pham, A. T. M., Le, T. Q., Hoang, T. T. T., Dao, T. T., Le, P. M., Nguyen, T. N., Nguyen, L. T., Tran, T. T. M., Tran, T. M., & Nguyen, M. N. (2023). Arsenic in the soil-rice system of the Mekong River delta. Human and Ecological Risk Assessment, 29(3-4), 801-816. https://doi.org/10.1080/10807039.2023.2192292",
    ["dao", "mekong", "delta", "soil", "rice", "arsenic", "vietnam", "risk"],
  ),
  reference(
    "R6",
    "Fischel et al. (2024), arsenic sorption and oxidation in manganese-oxide soils",
    "Fischel, M. H. H., Clarke, C. E., & Sparks, D. L. (2024). Arsenic sorption and oxidation by natural manganese-oxide-enriched soils: Reaction kinetics respond to varying environmental conditions. Geoderma, 441(1), 116715. https://doi.org/10.1016/j.geoderma.2023.116715",
    ["fischel", "clarke", "sparks", "arsenic", "sorption", "oxidation", "manganese", "soils"],
  ),
  reference(
    "R7",
    "Frommer et al. (2011), arsenic enrichment around rice roots",
    "Frommer, J., Voegelin, A., Dittmar, J., Marcus, M. A., & Kretzschmar, R. (2011). Biogeochemical processes and arsenic enrichment around rice roots in paddy soil: Results from micro-focused X-ray spectroscopy. European Journal of Soil Science, 62(2), 305-317. https://doi.org/10.1111/J.1365-2389.2010.01328.X",
    ["frommer", "biogeochemical", "arsenic", "rice", "roots", "paddy", "soil"],
  ),
  reference(
    "R8",
    "Hastie et al. (2009), statistical learning",
    "Hastie, T., Tibshirani, R., & Friedman, J. (2009). The Elements of Statistical Learning. Springer Series in Statistics. https://doi.org/10.1007/978-0-387-84858-7",
    ["hastie", "tibshirani", "friedman", "statistical", "learning", "machine", "model"],
  ),
  reference(
    "R9",
    "Hossain et al. (2021), arsenic dynamics in paddy soil",
    "Hossain, M., Mestrot, A., Norton, G. J., Deacon, C., Islam, M. R., & Meharg, A. A. (2021). Arsenic dynamics in paddy soil under traditional manuring practices in Bangladesh. Environmental Pollution, 268. https://doi.org/10.1016/j.envpol.2020.115821",
    ["hossain", "arsenic", "dynamics", "paddy", "soil", "manuring", "bangladesh"],
  ),
  reference(
    "R10",
    "Hu et al. (2022), meta-analysis of rice response to elevated CO2",
    "Hu, S., Chen, W., Tong, K., Wang, Y., Jing, L., Wang, Y., & Yang, L. (2022). Response of rice growth and leaf physiology to elevated CO2 concentrations: A meta-analysis of 20-year FACE studies. Science of The Total Environment, 807, 151017. https://doi.org/10.1016/J.SCITOTENV.2021.151017",
    ["hu", "rice", "growth", "leaf", "physiology", "elevated", "co2", "face"],
  ),
  reference(
    "R11",
    "Kuhn and Johnson (2013), applied predictive modeling",
    "Kuhn, M., & Johnson, K. (2013). Applied predictive modeling. Applied Predictive Modeling, 1-600. https://doi.org/10.1007/978-1-4614-6849-3",
    ["kuhn", "johnson", "predictive", "modeling", "machine", "learning"],
  ),
  reference(
    "R12",
    "Li et al. (2024), elevated CO2 and paddy soil redox potential",
    "Li, J., Zhang, H., Xie, W., Liu, C., Liu, X., Zhang, X., Li, L., & Pan, G. (2024). Elevated CO2 increases soil redox potential by promoting root radial oxygen loss in paddy field. Journal of Environmental Sciences (China), 136, 11-20. https://doi.org/10.1016/j.jes.2023.01.003",
    ["li", "elevated", "co2", "soil", "redox", "paddy", "root", "oxygen"],
  ),
  reference(
    "R13",
    "Limmer and Seyfferth (2022), localization and toxicity of arsenic in rice grain",
    "Limmer, M. A., & Seyfferth, A. L. (2022). Altering the localization and toxicity of arsenic in rice grain. Scientific Reports, 12(1), 1-11. https://doi.org/10.1038/S41598-022-09236-3",
    ["limmer", "seyfferth", "localization", "toxicity", "arsenic", "rice", "grain"],
  ),
  reference(
    "R14",
    "Lloyd and Winsberg (2018), climate modelling concepts",
    "Lloyd, E. A., & Winsberg, E. (2018). Climate Modelling: Philosophical and Conceptual Issues. Climate Modelling: Philosophical and Conceptual Issues, 1-497. https://doi.org/10.1007/978-3-319-65058-6",
    ["lloyd", "winsberg", "climate", "modelling", "modeling", "conceptual", "issues"],
  ),
  reference(
    "R15",
    "Ma et al. (2008), arsenite transporters in rice",
    "Ma, J. F., Yamaji, N., Mitani, N., Xu, X. Y., Su, Y. H., McGrath, S. P., & Zhao, F. J. (2008). Transporters of arsenite in rice and their role in arsenic accumulation in rice grain. PNAS, 105(29), 9931.",
    ["ma", "yamaji", "transporters", "arsenite", "rice", "arsenic", "accumulation", "grain"],
  ),
  reference(
    "R16",
    "Meharg and Zhao (2012), Arsenic and Rice",
    "Meharg, A. A., & Zhao, F. J. (2012). Arsenic & rice. Arsenic & Rice, 9789400729476, 1-171. https://doi.org/10.1007/978-94-007-2947-6",
    ["meharg", "zhao", "arsenic", "rice", "book"],
  ),
  reference(
    "R17",
    "Muehe et al. (n.d.), climate and soil arsenic stress",
    "Muehe, E. M., Wang, T., Kerl, C. F., Planer-Friedrich, B., & Fendorf, S. (n.d.). Rice production threatened by coupled stresses of climate and soil arsenic. https://doi.org/10.1038/s41467-019-12946-4",
    ["muehe", "wang", "climate", "soil", "arsenic", "rice", "production", "stress"],
  ),
  reference(
    "R18",
    "Muehe et al. (2019), rice production threatened by climate and arsenic",
    "Muehe, E. M., Wang, T., Kerl, C. F., Planer-Friedrich, B., & Fendorf, S. (2019). Rice production threatened by coupled stresses of climate and soil arsenic. Nature Communications, 10(1), 4985. https://doi.org/10.1038/s41467-019-12946-4",
    ["muehe", "nature", "communications", "climate", "soil", "arsenic", "rice", "production"],
  ),
  reference(
    "R19",
    "Nguyen et al. (2022), coastal paddies and Red River Delta arsenic",
    "Nguyen, M. N., Tran, T. M., Dang, Q. T., & Dinh, V. M. (2022). Applied Geochemistry Coastal paddies could emerge as hotspots of arsenic accumulation in rice: A perspective from the Red River Delta. Applied Geochemistry, 142(January), 105330. https://doi.org/10.1016/j.apgeochem.2022.105330",
    ["nguyen", "coastal", "paddies", "hotspots", "arsenic", "rice", "red", "river", "delta"],
  ),
  reference(
    "R20",
    "Nickson et al. (1998), Bangladesh groundwater arsenic",
    "Nickson, R., McArthur, J., Burgess, W., Matin Ahmed, K., Ravenscroft, P., & Rahman, M. (1998). Arsenic poisoning of Bangladesh groundwater [7]. Nature, 395(6700), 338. https://doi.org/10.1038/26387",
    ["nickson", "groundwater", "arsenic", "poisoning", "bangladesh", "nature"],
  ),
  reference(
    "R21",
    "Park et al. (2020), rice biomass under co-elevated CO2 and temperature",
    "Park, H.-J., Lim, Sang-Sun, Jin-Hyeob Kwak, Kwang-Seung Lee, Hye In Yang, H.-Y. K., Lee, S.-M., & Choi, W.-J. (2020). Biomass, chemical composition, and microbial decomposability of rice root and straw produced under co-elevated CO2 and temperature.",
    ["park", "biomass", "chemical", "composition", "rice", "root", "straw", "co2", "temperature"],
  ),
  reference(
    "R22",
    "Patley et al. (2017), seasonal arsenic variation in rice straw and grain",
    "Patley, S., Krishi Vishwavidyalaya, G., Sengar, I. S., Pragya Keshri, I., Baghel, N., Sahu, N., Sengar, S., & Keshri, P. (2017). Seasonal variation of arsenic and its accumulation in straw and grain of rice plant in Ambagarh Chowki block of Rajnandgaon district Chhattisgarh. International Journal of Chemical Studies, 5(4), 7-10.",
    ["patley", "seasonal", "variation", "arsenic", "straw", "grain", "rice"],
  ),
  reference(
    "R23",
    "Peng et al. (2004), rice yield and night temperature",
    "Peng, S., Huang, J., Sheehy, J. E., Laza, R. C., Visperas, R. M., Zhong, X., Centeno, G. S., Khush, G. S., & Cassman, K. G. (2004). Rice yields decline with higher night temperature from global warming. Proceedings of the National Academy of Sciences of the United States of America, 101(27), 9971-9975. https://doi.org/10.1073/pnas.0403720101",
    ["peng", "rice", "yield", "night", "temperature", "global", "warming", "climate"],
  ),
  reference(
    "R24",
    "Price et al. (2013), alternate wetting and drying irrigation",
    "Price, A. H., Norton, G. J., Salt, D. E., Ebenhoeh, O., Meharg, A. A., Meharg, C., Islam, M. R., Sarma, R. N., Dasgupta, T., Ismail, A. M., McNally, K. L., Zhang, H., Dodd, I. C., & Davies, W. J. (2013). Alternate wetting and drying irrigation for rice in Bangladesh: Is it sustainable and has plant breeding something to offer? Food and Energy Security, 2(2), 120-129. https://doi.org/10.1002/fes3.29",
    ["price", "alternate", "wetting", "drying", "irrigation", "rice", "bangladesh", "sustainable"],
  ),
  reference(
    "R25",
    "IPCC Sixth Assessment Report",
    "Sixth Assessment Report - IPCC. (n.d.). Retrieved February 25, 2026, from https://www.ipcc.ch/assessment-report/ar6/",
    ["ipcc", "sixth", "assessment", "report", "ar6", "climate", "scenario"],
  ),
  reference(
    "R26",
    "Tran et al. (2020), arsenic in Red River Basin rice",
    "Tran, C. T., Le, T. T., Duong, L. T., Dultz, S., & Nguyen, M. N. (2020). A comparative study of arsenic in rice in lowland and terraced paddies in the Red River Basin, Vietnam. Land Degradation and Development, 31(17), 2635-2647. https://doi.org/10.1002/LDR.3638",
    ["tran", "arsenic", "rice", "lowland", "terraced", "paddies", "red", "river", "vietnam"],
  ),
  reference(
    "R27",
    "Wang et al. (2025), climate change and arsenic health risks in Asian rice",
    "Wang, D., Kim, B. F., Nachman, K. E., Chiger, A. A., Herbstman, J., Loladze, I., Zhao, F. J., Chen, C., Gao, A., Zhu, Y., Li, F., Shen, R. F., Yan, X., Zhang, J., Cai, C., Song, L., Shen, M., Ma, C., Yang, X., et al. (2025). Impact of climate change on arsenic concentrations in paddy rice and the associated dietary health risks in Asia: an experimental and modelling study. The Lancet Planetary Health, 9(5), e397-e409. https://doi.org/10.1016/S2542-5196(25)00055-5",
    ["wang", "climate", "change", "arsenic", "paddy", "rice", "dietary", "health", "asia"],
  ),
  reference(
    "R28",
    "Wassmann et al. (2009), climate change and rice production",
    "Wassmann, R., Jagadish, S. V. K., Heuer, S., Ismail, A., Redona, E., Serraj, R., Singh, R. K., Howell, G., Pathak, H., & Sumfleth, K. (2009). Chapter 2 Climate Change Affecting Rice Production. The Physiological and Agronomic Basis for Possible Adaptation Strategies. Advances in Agronomy, 101, 59-122. https://doi.org/10.1016/S0065-2113(08)00802-X",
    ["wassmann", "climate", "change", "rice", "production", "adaptation", "agronomy"],
  ),
  reference(
    "R29",
    "Winkel et al. (2008), predicting groundwater arsenic in Southeast Asia",
    "Winkel, L., Berg, M., Amini, M., Hug, S. J., & Johnson, A. A. (2008). Predicting groundwater arsenic contamination in Southeast Asia from surface parameters. Nature Geoscience, 1(8), 536-542. https://doi.org/10.1038/ngeo254",
    ["winkel", "groundwater", "arsenic", "contamination", "southeast", "asia", "prediction"],
  ),
  reference(
    "R30",
    "Yang et al. (2023), elevated CO2 and arsenic uptake by rice",
    "Yang, X., Wang, D., Tao, Y., Shen, M., Ma, C., Cai, C., Song, L., Yin, B., & Zhu, C. (2023). Does elevated CO2 enhance the arsenic uptake by rice? Yes or maybe: Evidences from FACE experiments. Chemosphere, 327, 138543. https://doi.org/10.1016/J.CHEMOSPHERE.2023.138543",
    ["yang", "elevated", "co2", "arsenic", "uptake", "rice", "face", "experiments"],
  ),
  reference(
    "R31",
    "Zang et al. (2021), aging of exogenous arsenic in flooded paddy soils",
    "Zang, X., Zhou, Z., Zhang, T., Wang, X., & Ding, C. (2021). Aging of exogenous arsenic in flooded paddy soils: Characteristics and predictive models. Environmental Pollution, 274. https://doi.org/10.1016/j.envpol.2021.116561",
    ["zang", "aging", "exogenous", "arsenic", "flooded", "paddy", "soils", "models"],
  ),
  reference(
    "R32",
    "Zhao et al. (2009), arsenic uptake and metabolism in plants",
    "Zhao, F. J., Ma, J. F., Meharg, A. A., & McGrath, S. P. (2009). Arsenic uptake and metabolism in plants. New Phytologist, 181(4), 777-794. https://doi.org/10.1111/j.1469-8137.2008.02716.x",
    ["zhao", "ma", "meharg", "mcgrath", "arsenic", "uptake", "metabolism", "plants"],
  ),
];
