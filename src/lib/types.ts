export type ApplicationStatus =
  | "wishlist"
  | "applied"
  | "screening"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn";

export type WorkMode = "onsite" | "hybrid" | "remote";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "graduate"
  | "freelance";

export type StageKind =
  | "screening"
  | "interview"
  | "technical"
  | "assessment"
  | "final"
  | "other";

export type StageOutcome = "scheduled" | "awaiting" | "passed" | "unsuccessful";

export type AssignmentStatus = "todo" | "in_progress" | "submitted";

export interface CvDocument {
  id: string;
  user_id: string;
  name: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface Stage {
  id: string;
  application_id: string;
  user_id: string;
  title: string;
  kind: StageKind;
  /** ISO timestamp */
  scheduled_at: string | null;
  outcome: StageOutcome;
  meeting_link: string | null;
  notes: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  application_id: string;
  user_id: string;
  title: string;
  link: string | null;
  /** ISO timestamp */
  due_at: string | null;
  status: AssignmentStatus;
  notes: string | null;
  created_at: string;
}

export interface Screenshot {
  id: string;
  application_id: string;
  user_id: string;
  file_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  /** Optional for quick-added applications (link and/or screenshot only). */
  company: string | null;
  role: string | null;
  location: string | null;
  work_mode: WorkMode | null;
  employment_type: EmploymentType | null;
  job_url: string | null;
  source: string | null;
  salary: string | null;
  job_description: string | null;
  status: ApplicationStatus;
  /** YYYY-MM-DD */
  applied_on: string | null;
  /** YYYY-MM-DD */
  closing_date: string | null;
  cv_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithRelations extends Application {
  cv: Pick<CvDocument, "id" | "name" | "file_name" | "file_path"> | null;
  stages: Stage[];
  assignments: Assignment[];
  screenshots: Screenshot[];
}

export type ApplicationInput = Omit<
  Application,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type StageInput = Omit<Stage, "id" | "user_id" | "created_at">;

export type AssignmentInput = Omit<Assignment, "id" | "user_id" | "created_at">;
