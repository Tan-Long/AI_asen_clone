export type Locale = "vi" | "en";

export type LocalizedText = {
  vi: string;
  en: string;
};

export type NavItem = {
  href: string;
  label: LocalizedText;
};

export type FeatureCard = {
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
  alt: string;
};

export type DistrictStat = {
  name: string;
  emissions: string;
  area: string;
};

export type TextSection = {
  title: LocalizedText;
  body: LocalizedText[];
};

export type LogoCard = {
  name: string;
  tag: LocalizedText;
  image: string;
  description: LocalizedText;
  role: LocalizedText;
};

export type ExpertCard = {
  name: string;
  role: LocalizedText;
  organization: LocalizedText;
  description: LocalizedText;
  image: string;
};

export type FaqItem = {
  question: LocalizedText;
  answer: LocalizedText;
  source?: {
    label: LocalizedText;
    href: string;
  };
};

export type FeedbackField = {
  label: LocalizedText;
  type: "select" | "textarea" | "radio" | "checkbox" | "text";
  options?: LocalizedText[];
  required?: boolean;
};

export type FeedbackStep = {
  title: LocalizedText;
  description: LocalizedText;
  fields: FeedbackField[];
};
