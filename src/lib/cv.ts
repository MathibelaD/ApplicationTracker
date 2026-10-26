import { ACCEPTED_CV_TYPES, MAX_CV_BYTES } from "./constants";

/** Returns an error message, or null if the file is acceptable. */
export function validateCvFile(file: File): string | null {
  const okType = ACCEPTED_CV_TYPES.includes(file.type) || /\.(pdf|docx?)$/i.test(file.name);
  if (!okType) return "Please choose a PDF or Word document.";
  if (file.size > MAX_CV_BYTES) return "That file is over 10 MB.";
  return null;
}
