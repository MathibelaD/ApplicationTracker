import type { Tier } from "./extract";

export const TIER_ORDER: Tier[] = ["required", "mentioned", "nice"];

export const TIER_LABEL: Record<Tier, string> = {
  required: "Required",
  mentioned: "Mentioned",
  nice: "Nice to have",
};

/** Ordinal one-hue ramp (validated for both themes in index.css). */
export const TIER_SWATCH: Record<Tier, string> = {
  required: "bg-tier-required",
  mentioned: "bg-tier-mentioned",
  nice: "bg-tier-nice",
};
