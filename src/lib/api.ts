import { prepareImage } from "./images";
import { CV_BUCKET, SCREENSHOT_BUCKET, supabase } from "./supabase";
import type {
  Application,
  ApplicationInput,
  ApplicationWithRelations,
  Assignment,
  AssignmentInput,
  CvDocument,
  Screenshot,
  Stage,
  StageInput,
  Goal,
  GoalInput,
  UserSkill,
} from "./types";

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

const APPLICATION_SELECT =
  "*, cv:documents(id, name, file_name, file_path), stages:application_stages(*), assignments(*), screenshots:job_screenshots(*)";

export async function fetchApplications(): Promise<ApplicationWithRelations[]> {
  const rows = unwrap(
    await supabase
      .from("applications")
      .select(APPLICATION_SELECT)
      .order("created_at", { ascending: false }),
  ) as ApplicationWithRelations[];

  return rows.map((row) => ({
    ...row,
    stages: [...row.stages].sort(byDate("scheduled_at")),
    assignments: [...row.assignments].sort(byDate("due_at")),
    screenshots: [...(row.screenshots ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }));
}

function byDate<K extends string>(key: K) {
  return (a: Record<K, string | null> & { created_at: string }, b: Record<K, string | null> & { created_at: string }) => {
    const av = a[key] ?? a.created_at;
    const bv = b[key] ?? b.created_at;
    return new Date(av).getTime() - new Date(bv).getTime();
  };
}

export async function createApplication(input: ApplicationInput): Promise<Application> {
  return unwrap(await supabase.from("applications").insert(input).select().single());
}

export async function updateApplication(id: string, patch: Partial<ApplicationInput>): Promise<Application> {
  return unwrap(await supabase.from("applications").update(patch).eq("id", id).select().single());
}

export async function deleteApplication(app: { id: string; screenshots: Pick<Screenshot, "file_path">[] }): Promise<void> {
  unwrap(await supabase.from("applications").delete().eq("id", app.id));
  // Screenshot rows cascade with the application; their files need removing too.
  if (app.screenshots.length) {
    await supabase.storage.from(SCREENSHOT_BUCKET).remove(app.screenshots.map((s) => s.file_path));
  }
}

// ---------------------------------------------------------------------------
// Stages
// ---------------------------------------------------------------------------

export async function createStage(input: StageInput): Promise<Stage> {
  return unwrap(await supabase.from("application_stages").insert(input).select().single());
}

export async function updateStage(id: string, patch: Partial<StageInput>): Promise<Stage> {
  return unwrap(await supabase.from("application_stages").update(patch).eq("id", id).select().single());
}

export async function deleteStage(id: string): Promise<void> {
  unwrap(await supabase.from("application_stages").delete().eq("id", id));
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export async function createAssignment(input: AssignmentInput): Promise<Assignment> {
  return unwrap(await supabase.from("assignments").insert(input).select().single());
}

export async function updateAssignment(id: string, patch: Partial<AssignmentInput>): Promise<Assignment> {
  return unwrap(await supabase.from("assignments").update(patch).eq("id", id).select().single());
}

export async function deleteAssignment(id: string): Promise<void> {
  unwrap(await supabase.from("assignments").delete().eq("id", id));
}

// ---------------------------------------------------------------------------
// CV library
// ---------------------------------------------------------------------------

export async function fetchDocuments(): Promise<CvDocument[]> {
  return unwrap(
    await supabase.from("documents").select("*").order("created_at", { ascending: false }),
  );
}

// Some browsers report an empty type for Word files.
function mimeFromName(name: string): string {
  if (/\.pdf$/i.test(name)) return "application/pdf";
  if (/\.docx$/i.test(name)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (/\.doc$/i.test(name)) return "application/msword";
  return "application/octet-stream";
}

export async function uploadCv(userId: string, file: File, name: string): Promise<CvDocument> {
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
  const contentType = file.type || mimeFromName(file.name);

  const { error: uploadError } = await supabase.storage
    .from(CV_BUCKET)
    .upload(path, file, { contentType, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      name: name.trim() || file.name,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      mime_type: contentType,
    })
    .select()
    .single();

  if (error) {
    // Don't leave an orphaned file behind if the row couldn't be created.
    await supabase.storage.from(CV_BUCKET).remove([path]);
    throw new Error(error.message);
  }
  return data as CvDocument;
}

export async function renameDocument(id: string, name: string): Promise<CvDocument> {
  return unwrap(await supabase.from("documents").update({ name }).eq("id", id).select().single());
}

export async function deleteDocument(doc: Pick<CvDocument, "id" | "file_path">): Promise<void> {
  unwrap(await supabase.from("documents").delete().eq("id", doc.id));
  await supabase.storage.from(CV_BUCKET).remove([doc.file_path]);
}

/** Short-lived link to view or download a private CV. */
export async function getCvUrl(path: string, download?: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(CV_BUCKET)
    .createSignedUrl(path, 60 * 5, download ? { download } : undefined);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// Job listing screenshots
// ---------------------------------------------------------------------------

export async function uploadScreenshot(userId: string, applicationId: string, original: File): Promise<Screenshot> {
  const { file, width, height } = await prepareImage(original);
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  const path = `${userId}/${applicationId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("job_screenshots")
    .insert({
      application_id: applicationId,
      file_path: path,
      file_name: original.name,
      file_size: file.size,
      mime_type: file.type,
      width,
      height,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(SCREENSHOT_BUCKET).remove([path]);
    throw new Error(error.message);
  }
  return data as Screenshot;
}

export async function deleteScreenshot(shot: Pick<Screenshot, "id" | "file_path">): Promise<void> {
  unwrap(await supabase.from("job_screenshots").delete().eq("id", shot.id));
  await supabase.storage.from(SCREENSHOT_BUCKET).remove([shot.file_path]);
}

/** Signed URLs keyed by file path, valid for an hour. */
export async function getScreenshotUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(SCREENSHOT_BUCKET).createSignedUrls(paths, 60 * 60);
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const item of data) if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  return map;
}

// ---------------------------------------------------------------------------
// My skills
// ---------------------------------------------------------------------------

export async function fetchUserSkills(): Promise<UserSkill[]> {
  return unwrap(await supabase.from("user_skills").select("*").order("created_at", { ascending: true }));
}

export async function addUserSkill(name: string): Promise<UserSkill> {
  return unwrap(await supabase.from("user_skills").insert({ name: name.trim() }).select().single());
}

export async function removeUserSkill(id: string): Promise<void> {
  unwrap(await supabase.from("user_skills").delete().eq("id", id));
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function fetchGoals(): Promise<Goal[]> {
  return unwrap(await supabase.from("application_goals").select("*").order("created_at", { ascending: true }));
}

/** One goal per period: saving a period that exists updates it. */
export async function saveGoal(input: GoalInput): Promise<Goal> {
  return unwrap(
    await supabase.from("application_goals").upsert(input, { onConflict: "user_id,period" }).select().single(),
  );
}

export async function deleteGoal(id: string): Promise<void> {
  unwrap(await supabase.from("application_goals").delete().eq("id", id));
}
