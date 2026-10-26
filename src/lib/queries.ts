import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "./api";
import type { ApplicationInput, AssignmentInput, CvDocument, StageInput } from "./types";

export const keys = {
  applications: ["applications"] as const,
  documents: ["documents"] as const,
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
