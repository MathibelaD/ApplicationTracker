import { SKILLS, type SkillCategory, type SkillDef } from "./catalog";

/** How strongly a job asks for a skill. */
export type Tier = "required" | "mentioned" | "nice";

const TIER_RANK: Record<Tier, number> = { required: 3, mentioned: 2, nice: 1 };

export interface SkillRef {
  id: string;
  label: string;
  category: SkillCategory | "custom";
}

interface CompiledSkill extends SkillRef {
  regexes: RegExp[];
}

// ---------------------------------------------------------------------------
// Compiling the catalog
// ---------------------------------------------------------------------------

const BOUNDARY_BEFORE = String.raw`(?<![\p{L}\p{N}+#])`;
const BOUNDARY_AFTER = String.raw`(?![\p{L}\p{N}+#])`;

function aliasSource(alias: string): string {
  return alias
    .toLowerCase()
    .trim()
    .replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")
    .replace(/-/g, "[\\s-]?")
    .replace(/\s+/g, "[\\s-]+");
}

function compile(def: SkillDef | (SkillRef & { aliases?: string[]; patterns?: RegExp[] })): CompiledSkill {
  // A skill with explicit patterns has an ambiguous label, so only its aliases match loosely.
  const loose = [...(def.patterns ? [] : [def.label]), ...(def.aliases ?? [])].filter(Boolean);
  const regexes: RegExp[] = [];
  if (loose.length) {
    const alts = [...new Set(loose.map(aliasSource))].sort((a, b) => b.length - a.length).join("|");
    regexes.push(new RegExp(`${BOUNDARY_BEFORE}(?:${alts})${BOUNDARY_AFTER}`, "giu"));
  }
  for (const p of def.patterns ?? []) regexes.push(new RegExp(p.source, p.flags.includes("g") ? p.flags : p.flags + "g"));
  return { id: def.id, label: def.label, category: def.category, regexes };
}

const COMPILED_CATALOG = SKILLS.map(compile);

const normalizeName = (v: string) => v.toLowerCase().trim().replace(/\s+/g, " ");

// Every label and alias → catalog id, for mapping "My skills" entries.
const NAME_INDEX = new Map<string, string>();
for (const def of SKILLS) {
  for (const name of [def.label, ...(def.aliases ?? [])]) {
    const key = normalizeName(name);
    if (!NAME_INDEX.has(key)) NAME_INDEX.set(key, def.id);
  }
}

const CATALOG_BY_ID = new Map(SKILLS.map((d) => [d.id, d]));

/** Maps a free-text skill name to a catalog skill, or a custom one. */
export function resolveSkill(name: string): SkillRef {
  const id = NAME_INDEX.get(normalizeName(name));
  if (id) {
    const def = CATALOG_BY_ID.get(id)!;
    return { id: def.id, label: def.label, category: def.category };
  }
  return { id: `custom:${normalizeName(name)}`, label: name.trim(), category: "custom" };
}

// ---------------------------------------------------------------------------
// Splitting a description into sections
// ---------------------------------------------------------------------------

const NICE_HEADING =
  /nice[\s-]to[\s-]have|bonus|preferred|desirable|good to have|\bplus\b|advantage|extra (credit|points)|ideally|would be (great|nice)|not required|optional/;
const REQUIRED_HEADING =
  /requirement|required|must[\s-]haves?|qualification|what you['’]?ll (need|bring)|what we['’]?re looking for|what you (need|bring|have)|\byou (have|bring|are|should have|will have)\b|about you|who you are|skills|experience|essential|minimum|competenc|ideal candidate|criteria|your profile/;
const NEUTRAL_HEADING =
  /responsibilit|what you['’]?ll do|the role|about (us|the)|duties|day[\s-]to[\s-]day|benefits|perks|we offer|why (join|us|you)|our (team|stack|tech)|tech stack|location|salary|compensation|how to apply|company|overview|description|summary|mission|what we do/;

const INLINE_NICE =
  /nice[\s-]to[\s-]have|\b(is|are|would be|will be) (a |an )?(big |huge |strong )?(plus|bonus|advantage|beneficial|advantageous)\b|\bpreferred\b|\bpreferably\b|\bdesirable\b|\bideally\b|\bbonus\b|\bnot (required|essential|mandatory)\b|\boptional\b/;
const INLINE_REQUIRED =
  /\b(must|required|requirement|essential|mandatory|minimum|at least|proven|solid|strong|expert|expertise|proficien\w*|fluent|fluency)\b|\d+\s*\+?\s*(years?|yrs)\b|\bexperience (with|in|using|of)\b|\bknowledge of\b|\bunderstanding of\b/;

function headingTier(text: string): Tier | undefined {
  const t = text.toLowerCase();
  if (NICE_HEADING.test(t)) return "nice";
  if (REQUIRED_HEADING.test(t)) return "required";
  if (NEUTRAL_HEADING.test(t)) return "mentioned";
  return undefined;
}

function lineTier(text: string, section: Tier): Tier {
  const t = text.toLowerCase();
  if (INLINE_NICE.test(t)) return "nice";
  // Outside a labelled section, wording like "3+ years of" or "must" still signals a requirement.
  if (section === "mentioned" && INLINE_REQUIRED.test(t)) return "required";
  return section;
}

interface Segment {
  text: string;
  tier: Tier;
}

/**
 * Splits a description into sentences tagged with the section they sit in.
 * `hasSkill` stops content lines ("Experience with Docker") being mistaken for headings.
 */
export function segment(description: string, hasSkill: (text: string) => boolean = () => false): Segment[] {
  const out: Segment[] = [];
  let section: Tier = "mentioned";

  for (const raw of description.split(/\r?\n/)) {
    const bulleted = /^\s*(?:[-–—•·▪●○◦✓✔→*]|\(?\d{1,2}[.)])\s+/.test(raw);
    const line = raw
      .trim()
      .replace(/^[#>*\-–—•·▪●○◦✓✔→]+\s*/, "")
      .replace(/^\(?\d{1,2}[.)]\s+/, "")
      .replace(/[*_]{1,3}/g, "")
      .trim();
    if (!line) continue;

    // "Requirements: React, TypeScript" — a heading with content on the same line.
    const inline = line.match(/^([^:.!?]{2,60}):\s*(.*)$/);
    if (inline && inline[1].split(/\s+/).length <= 6 && !hasSkill(inline[1])) {
      const tier = headingTier(inline[1]);
      if (tier) {
        section = tier;
        if (inline[2]) out.push({ text: inline[2], tier: lineTier(inline[2], section) });
        continue;
      }
    }

    // A short, unbulleted line without sentence punctuation or skills that names a section.
    const words = line.split(/\s+/).length;
    if (!bulleted && words <= 6 && !/[.!?,;]$/.test(line) && !/\d/.test(line) && !hasSkill(line)) {
      const tier = headingTier(line);
      if (tier) {
        section = tier;
        continue;
      }
    }

    // Pasted ads often lose their line breaks; judge each sentence or bullet separately.
    for (const part of line.split(/(?<=[.!?;])\s+|\s+[•·▪]\s+/)) {
      if (part.trim()) out.push({ text: part, tier: lineTier(part, section) });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

function matchSegment(text: string, candidates: CompiledSkill[]): string[] {
  const hits: { id: string; start: number; end: number }[] = [];
  for (const skill of candidates) {
    for (const re of skill.regexes) {
      re.lastIndex = 0;
      for (const m of text.matchAll(re)) hits.push({ id: skill.id, start: m.index, end: m.index + m[0].length });
    }
  }
  // Longest match wins where two overlap, so "React Native" isn't also "React".
  hits.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const taken: { start: number; end: number }[] = [];
  const ids = new Set<string>();
  for (const h of hits) {
    if (taken.some((t) => h.start < t.end && t.start < h.end)) continue;
    taken.push(h);
    ids.add(h.id);
  }
  return [...ids];
}

function quickTest(text: string, skill: CompiledSkill): boolean {
  return skill.regexes.some((re) => {
    re.lastIndex = 0;
    return re.test(text);
  });
}

/** Skills found in one job description, each with the strongest tier it appears at. */
export function extractSkills(description: string, skills: CompiledSkill[]): Map<string, Tier> {
  const found = new Map<string, Tier>();
  const candidates = skills.filter((s) => quickTest(description, s));
  if (candidates.length === 0) return found;

  const hasSkill = (text: string) => candidates.some((s) => quickTest(text, s));
  for (const seg of segment(description, hasSkill)) {
    for (const id of matchSegment(seg.text, candidates)) {
      const prev = found.get(id);
      if (!prev || TIER_RANK[seg.tier] > TIER_RANK[prev]) found.set(id, seg.tier);
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// Aggregating across applications
// ---------------------------------------------------------------------------

export interface SkillStat extends SkillRef {
  jobs: number;
  required: number;
  mentioned: number;
  nice: number;
  /** Application ids, strongest tier first. */
  applications: { id: string; tier: Tier }[];
}

export interface SkillAnalysis {
  /** Applications that had a description to read. */
  analysed: number;
  stats: SkillStat[];
  byApplication: Map<string, Map<string, Tier>>;
}

/** Custom "My skills" entries become extra searchable skills. */
export function buildMatcher(customNames: string[]): CompiledSkill[] {
  const extra = customNames
    .map(resolveSkill)
    .filter((r) => r.category === "custom")
    .map((r) => compile({ ...r, aliases: [] }));
  return [...COMPILED_CATALOG, ...extra];
}

const cache = new Map<string, Map<string, Tier>>();

export function analyseApplications(
  apps: { id: string; updated_at: string; job_description: string | null }[],
  customNames: string[] = [],
): SkillAnalysis {
  const matcher = buildMatcher(customNames);
  const matcherKey = customNames.map(normalizeName).sort().join("|");
  const refs = new Map<string, SkillRef>(matcher.map((m) => [m.id, { id: m.id, label: m.label, category: m.category }]));
  const totals = new Map<string, SkillStat>();
  const byApplication = new Map<string, Map<string, Tier>>();
  let analysed = 0;

  for (const app of apps) {
    const text = app.job_description?.trim();
    if (!text) continue;
    analysed++;

    const key = `${app.id}:${app.updated_at}:${matcherKey}`;
    let found = cache.get(key);
    if (!found) {
      found = extractSkills(text, matcher);
      cache.set(key, found);
    }
    byApplication.set(app.id, found);

    for (const [id, tier] of found) {
      const stat = totals.get(id) ?? { ...refs.get(id)!, jobs: 0, required: 0, mentioned: 0, nice: 0, applications: [] };
      stat.jobs++;
      stat[tier]++;
      stat.applications.push({ id: app.id, tier });
      totals.set(id, stat);
    }
  }

  const stats = [...totals.values()]
    .map((s) => ({ ...s, applications: s.applications.sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier]) }))
    .sort((a, b) => b.jobs - a.jobs || b.required - a.required || a.label.localeCompare(b.label));

  return { analysed, stats, byApplication };
}
