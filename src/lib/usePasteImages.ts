import { useEffect, useRef } from "react";
import { imageFilesFrom } from "./images";

/**
 * Calls `onImages` when the user pastes images anywhere on the page
 * (⌘V / Ctrl+V after taking a screenshot). Text pastes are left alone,
 * and pastes inside an open dialog are ignored.
 */
export function usePasteImages(onImages: (files: File[]) => void, enabled = true) {
  const handler = useRef(onImages);
  useEffect(() => {
    handler.current = onImages;
  });

  useEffect(() => {
    if (!enabled) return;
    const onPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.("dialog")) return;
      const files = imageFilesFrom(e.clipboardData?.items);
      if (files.length === 0) return;
      e.preventDefault();
      handler.current(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [enabled]);
}
