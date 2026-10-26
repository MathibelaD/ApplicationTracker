export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const MAX_EDGE = 2400;
const SHRINK_ABOVE = 1.5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Please use a PNG, JPG, WebP or GIF image.";
  if (file.size > MAX_IMAGE_BYTES * 2) return "That image is over 20 MB.";
  return null;
}

export interface PreparedImage {
  file: File;
  width: number;
  height: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image."));
    };
    img.src = url;
  });
}

/**
 * Large retina screenshots are resized and re-encoded as WebP before upload,
 * which usually takes them from several MB to a few hundred KB.
 * GIFs and already-small images are left untouched.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const img = await loadImage(file);
  const { naturalWidth: w, naturalHeight: h } = img;
  const tooBig = file.size > SHRINK_ABOVE || Math.max(w, h) > MAX_EDGE;
  if (file.type === "image/gif" || !tooBig) return { file, width: w, height: h };

  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.86));
  if (!blob || blob.size >= file.size) return { file, width: w, height: h };

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return { file: new File([blob], name, { type: "image/webp" }), width, height };
}

/** Image files from a paste or drop event. */
export function imageFilesFrom(list: FileList | DataTransferItemList | null | undefined): File[] {
  if (!list) return [];
  const files: File[] = [];
  for (const item of Array.from(list as ArrayLike<File | DataTransferItem>)) {
    const file = item instanceof File ? item : item.kind === "file" ? item.getAsFile() : null;
    if (file && file.type.startsWith("image/")) {
      // Pasted screenshots are all called "image.png"; give them a useful name.
      files.push(
        file.name === "image.png"
          ? new File([file], `screenshot-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`, { type: file.type })
          : file,
      );
    }
  }
  return files;
}
