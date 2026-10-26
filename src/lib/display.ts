import { hostname } from "./format";
import type { Application } from "./types";

type Named = Pick<Application, "company" | "role" | "job_url">;

/** Company name, falling back to the job site for quick-added applications. */
export function companyName(app: Named): string {
  if (app.company) return app.company;
  if (app.job_url) return hostname(app.job_url);
  return "Unknown company";
}

export function roleTitle(app: Named): string {
  return app.role || "Job listing";
}

/** Quick-added applications that still need a company or job title. */
export function needsDetails(app: Named): boolean {
  return !app.company || !app.role;
}
