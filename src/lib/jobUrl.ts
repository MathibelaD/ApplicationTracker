import { normalizeUrl } from "./format";

export interface UrlGuess {
  company?: string;
  source?: string;
}

const BOARDS: [RegExp, string][] = [
  [/(^|\.)linkedin\.com$/, "LinkedIn"],
  [/(^|\.)indeed\.[a-z.]+$/, "Indeed"],
  [/(^|\.)glassdoor\.[a-z.]+$/, "Glassdoor"],
  [/(^|\.)wellfound\.com$|(^|\.)angel\.co$/, "Wellfound"],
  [/(^|\.)stepstone\.[a-z.]+$/, "StepStone"],
  [/(^|\.)seek\.com(\.au)?$/, "SEEK"],
  [/(^|\.)reed\.co\.uk$/, "Reed"],
  [/(^|\.)pnet\.co\.za$/, "PNet"],
  [/(^|\.)careers24\.com$/, "Careers24"],
  [/(^|\.)naukri\.com$/, "Naukri"],
  [/(^|\.)xing\.com$/, "XING"],
  [/(^|\.)monster\.[a-z.]+$/, "Monster"],
  [/(^|\.)ziprecruiter\.com$/, "ZipRecruiter"],
  [/(^|\.)weworkremotely\.com$/, "We Work Remotely"],
  [/(^|\.)remoteok\.com$/, "Remote OK"],
];

// Applicant tracking systems put the company in the path or subdomain.
const ATS_PATH: [RegExp, string][] = [
  [/^(boards|job-boards)(\.eu)?\.greenhouse\.io$/, "Greenhouse"],
  [/^jobs(\.eu)?\.lever\.co$/, "Lever"],
  [/^apply\.workable\.com$/, "Workable"],
  [/^jobs\.ashbyhq\.com$/, "Ashby"],
  [/^jobs\.smartrecruiters\.com$/, "SmartRecruiters"],
];

const ATS_SUBDOMAIN: [RegExp, string][] = [
  [/^([^.]+)\.bamboohr\.com$/, "BambooHR"],
  [/^([^.]+)\.wd\d+\.myworkdayjobs\.com$/, "Workday"],
  [/^([^.]+)\.recruitee\.com$/, "Recruitee"],
  [/^([^.]+)\.teamtailor\.com$/, "Teamtailor"],
  [/^([^.]+)\.breezy\.hr$/, "Breezy HR"],
  [/^([^.]+)\.workable\.com$/, "Workable"],
  [/^([^.]+)\.personio\.(de|com)$/, "Personio"],
];

function prettify(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Best-effort company and source from a job link. Returns {} when unsure. */
export function guessFromUrl(raw: string): UrlGuess {
  const normalized = normalizeUrl(raw);
  if (!normalized) return {};
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    return {};
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  for (const [re, source] of BOARDS) if (re.test(host)) return { source };

  for (const [re, source] of ATS_PATH) {
    if (re.test(host)) {
      const slug = url.pathname.split("/").filter(Boolean)[0];
      return slug && slug !== "embed" ? { company: prettify(slug), source } : { source };
    }
  }

  for (const [re, source] of ATS_SUBDOMAIN) {
    const m = host.match(re);
    if (m) return { company: prettify(m[1]), source };
  }

  return {};
}
