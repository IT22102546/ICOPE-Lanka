export type LanguageKey = "en" | "si";

export const SRI_LANKA_DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  Central: ["Kandy", "Matale", "Nuwara Eliya"],
  Eastern: ["Ampara", "Batticaloa", "Trincomalee"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  Northern: ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  "North Western": ["Kurunegala", "Puttalam"],
  Sabaragamuwa: ["Kegalle", "Ratnapura"],
  Southern: ["Galle", "Hambantota", "Matara"],
  Uva: ["Badulla", "Monaragala"],
  Western: ["Colombo", "Gampaha", "Kalutara"],
};

export const SRI_LANKA_PROVINCES = Object.keys(SRI_LANKA_DISTRICTS_BY_PROVINCE);

export const ICOPE_FIELD_LABELS: Record<
  string,
  { en: string; si: string; placeholderEn: string; placeholderSi: string }
> = {
  hearing: {
    en: "Hearing",
    si: "ශ‍්‍රවණය",
    placeholderEn: "Normal / Mild / Moderate / Severe",
    placeholderSi: "සාමාන්‍ය / අඩු / මධ්‍යම / දැඩි",
  },
  vision: {
    en: "Vision",
    si: "දෘෂ්ටිය",
    placeholderEn: "Normal / Corrected / Impaired",
    placeholderSi: "සාමාන්‍ය / නිවැරදි / බාධා ඇති",
  },
  cognition: {
    en: "Cognition",
    si: "බුද්ධි ක්‍රියාකාරිත්වය",
    placeholderEn: "Screening result",
    placeholderSi: "පරීක්ෂණ ප්‍රතිඵලය",
  },
  mood: {
    en: "Mood",
    si: "මානසික තත්ත්වය",
    placeholderEn: "Mood screening result",
    placeholderSi: "මානසික පරීක්ෂණ ප්‍රතිඵලය",
  },
  mobility: {
    en: "Mobility",
    si: "චලනය",
    placeholderEn: "Balance and movement status",
    placeholderSi: "සමතුලිතතාවය සහ චලන තත්ත්වය",
  },
  nutrition: {
    en: "Nutrition",
    si: "පෝෂණ තත්ත්වය",
    placeholderEn: "Nutrition and appetite notes",
    placeholderSi: "පෝෂණය සහ ආහාර රුචිය පිළිබඳ සටහන්",
  },
  notes: {
    en: "General Notes",
    si: "සාමාන්‍ය සටහන්",
    placeholderEn: "Additional observations",
    placeholderSi: "අතිරේක නිරීක්ෂණ",
  },
};
