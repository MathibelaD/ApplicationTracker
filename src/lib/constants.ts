import type {
  ApplicationStatus,
  AssignmentStatus,
  EmploymentType,
  StageKind,
  StageOutcome,
  WorkMode,
} from "./types";

interface StatusMeta {
  label: string;
  description: string;
  /** Badge classes (background + text) */
  badge: string;
  /** Solid swatch used in the pipeline bar and dots */
  dot: string;
}

export const STATUS_ORDER: ApplicationStatus[] = [
  "wishlist",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
];

export const ACTIVE_STATUSES: ApplicationStatus[] = ["applied", "screening", "interviewing", "offer"];

export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  wishlist: {
    label: "Wishlist",
    description: "Saved, not applied yet",
    badge: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
    dot: "bg-stone-400",
  },
  applied: {
    label: "Applied",
    description: "Waiting to hear back",
    badge: "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  screening: {
    label: "Screening",
    description: "Recruiter or HR contact",
    badge: "bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  interviewing: {
    label: "Interviewing",
    description: "In interview rounds",
    badge: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  offer: {
    label: "Offer",
    description: "You got an offer",
    badge: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-600",
  },
  rejected: {
    label: "Rejected",
    description: "Not moving forward",
    badge: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  withdrawn: {
    label: "Withdrawn",
    description: "You stepped away",
    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    dot: "bg-zinc-400",
  },
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  graduate: "Graduate programme",
  freelance: "Freelance",
};

export const STAGE_KIND_LABEL: Record<StageKind, string> = {
  screening: "Screening call",
  interview: "Interview",
  technical: "Technical interview",
  assessment: "Assessment",
  final: "Final round",
  other: "Other",
};

export const STAGE_OUTCOME_META: Record<StageOutcome, { label: string; badge: string }> = {
  scheduled: {
    label: "Scheduled",
    badge: "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
  awaiting: {
    label: "Awaiting feedback",
    badge: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  passed: {
    label: "Passed",
    badge: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  unsuccessful: {
    label: "Unsuccessful",
    badge: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
};

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  submitted: "Submitted",
};

export const STAGE_PRESETS: { title: string; kind: StageKind }[] = [
  { title: "Recruiter call", kind: "screening" },
  { title: "HR interview", kind: "interview" },
  { title: "Technical interview", kind: "technical" },
  { title: "Panel interview", kind: "interview" },
  { title: "Assessment centre", kind: "assessment" },
  { title: "Final interview", kind: "final" },
];

export const SOURCE_SUGGESTIONS = [
  "LinkedIn",
  "Company website",
  "Indeed",
  "Glassdoor",
  "Referral",
  "Recruiter",
  "Job board",
  "Career fair",
];

export const ACCEPTED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_CV_BYTES = 10 * 1024 * 1024;
