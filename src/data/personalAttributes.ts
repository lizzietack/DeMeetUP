export const BODY_TYPES = [
  "Slim",
  "Petite",
  "Athletic",
  "Average",
  "Curvy",
  "Voluptuous",
  "BBW",
  "Plus Size",
  "Muscular",
] as const;

export const ETHNICITIES = [
  "African",
  "White / Caucasian",
  "Asian",
  "Latina / Hispanic",
  "Middle Eastern",
  "Mixed",
  "Other",
] as const;

export type BodyType = typeof BODY_TYPES[number];
export type Ethnicity = typeof ETHNICITIES[number];
