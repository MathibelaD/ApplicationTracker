import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import type { ApplicationInput, AssignmentInput, CvDocument, GoalInput, Screenshot, StageInput, UserSkill } from "./types";

export const keys = {
  applications: ["applications"] as const,
  documents: ["documents"] as const,
  skills: ["user-skills"] as const,
  goals: ["goals"] as const,
};

export function useApplications() {
  return useQuery({ queryKey: keys.applications, queryFn: api.fetchApplications });
}

export function useApplication(id: string | undefined) {
  const query = useApplications();
  return { ...query, data: query.data?.find((a) => a.id === id) };
}

export function useDocuments() {
  return useQuery({ queryKey: keys.documents, queryFn: api.fetchDocuments });
}

function useInvalidate() {
  const qc = useQueryClient();
  return (...which: (keyof typeof keys)[]) =>
    Promise.all(which.map((k) => qc.invalidateQueries({ queryKey: keys[k] })));
}

export function useCreateApplication() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.createApplication,
    onSuccess: () => invalidate("applications"),
  });
}

export function useUpdateApplication() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ApplicationInput> }) =>
      api.updateApplication(id, patch),
    onSuccess: () => invalidate("applications"),
  });
}

export function useDeleteApplication() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.deleteApplication,
    onSuccess: () => invalidate("applications"),
  });
}

export function useSaveStage() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: StageInput }) =>
      id ? api.updateStage(id, input) : api.createStage(input),
    onSuccess: () => invalidate("applications"),
  });
}

export function useUpdateStage() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<StageInput> }) => api.updateStage(id, patch),
    onSuccess: () => invalidate("applications"),
  });
}

export function useDeleteStage() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.deleteStage,
    onSuccess: () => invalidate("applications"),
  });
}

export function useSaveAssignment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: AssignmentInput }) =>
      id ? api.updateAssignment(id, input) : api.createAssignment(input),
    onSuccess: () => invalidate("applications"),
  });
}

export function useUpdateAssignment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AssignmentInput> }) =>
      api.updateAssignment(id, patch),
    onSuccess: () => invalidate("applications"),
  });
}

export function useDeleteAssignment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.deleteAssignment,
    onSuccess: () => invalidate("applications"),
  });
}

export function useUploadCv() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ userId, file, name }: { userId: string; file: File; name: string }) =>
      api.uploadCv(userId, file, name),
    onSuccess: () => invalidate("documents"),
  });
}

export function useRenameDocument() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.renameDocument(id, name),
    onSuccess: () => invalidate("documents", "applications"),
  });
}

export function useDeleteDocument() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (doc: Pick<CvDocument, "id" | "file_path">) => api.deleteDocument(doc),
    onSuccess: () => invalidate("documents", "applications"),
  });
}

/**
 * Opens a private CV in a new tab. The tab is opened synchronously so popup
 * blockers allow it, then pointed at the signed URL once it's ready.
 */
export async function openCv(path: string) {
  const tab = window.open("", "_blank");
  try {
    const url = await api.getCvUrl(path);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.href = url;
    }
  } catch (err) {
    tab?.close();
    throw err;
  }
}

export async function downloadCv(path: string, fileName: string) {
  const url = await api.getCvUrl(path, fileName);
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function useScreenshotUrls(shots: Pick<Screenshot, "file_path">[]) {
  const paths = shots.map((s) => s.file_path);
  return useQuery({
    queryKey: ["screenshot-urls", paths],
    queryFn: () => api.getScreenshotUrls(paths),
    enabled: paths.length > 0,
    staleTime: 50 * 60 * 1000,
  });
}

/** Uploads several screenshots; resolves with how many failed instead of throwing. */
export function useUploadScreenshots() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ userId, applicationId, files }: { userId: string; applicationId: string; files: File[] }) => {
      const results = await Promise.allSettled(files.map((f) => api.uploadScreenshot(userId, applicationId, f)));
      const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
      return { uploaded: results.length - failed.length, failed: failed.length, firstError: failed[0]?.reason as Error | undefined };
    },
    onSettled: () => invalidate("applications"),
  });
}

export function useDeleteScreenshot() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (shot: Pick<Screenshot, "id" | "file_path">) => api.deleteScreenshot(shot),
    onSuccess: () => invalidate("applications"),
  });
}

export function useUserSkills() {
  return useQuery({ queryKey: keys.skills, queryFn: api.fetchUserSkills });
}

// Skill edits are optimistic so tapping "Add" feels instant; a failure rolls back.
export function useAddUserSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.addUserSkill(name),
    onMutate: async (name) => {
      await qc.cancelQueries({ queryKey: keys.skills });
      const previous = qc.getQueryData<UserSkill[]>(keys.skills);
      const temp: UserSkill = { id: `temp-${crypto.randomUUID()}`, user_id: "", name: name.trim(), created_at: new Date().toISOString() };
      qc.setQueryData<UserSkill[]>(keys.skills, (old = []) => [...old, temp]);
      return { previous };
    },
    onError: (_err, _name, ctx) => qc.setQueryData(keys.skills, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.skills }),
  });
}

export function useRemoveUserSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeUserSkill(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.skills });
      const previous = qc.getQueryData<UserSkill[]>(keys.skills);
      qc.setQueryData<UserSkill[]>(keys.skills, (old = []) => old.filter((s) => s.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => qc.setQueryData(keys.skills, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.skills }),
  });
}

export function useGoals() {
  return useQuery({ queryKey: keys.goals, queryFn: api.fetchGoals });
}

export function useSaveGoal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: GoalInput) => api.saveGoal(input),
    onSuccess: () => invalidate("goals"),
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.deleteGoal,
    onSuccess: () => invalidate("goals"),
  });
}
