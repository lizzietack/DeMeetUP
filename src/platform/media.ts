/**
 * Media picker abstraction. Returns a File so existing upload code
 * keeps working. On native, Capacitor Camera will return a base64/URI
 * which we'll wrap into a File here later.
 */
import { isBrowser } from "./env";

export type MediaSource = "camera" | "gallery" | "any";

export interface PickMediaOptions {
  source?: MediaSource;
  accept?: string;        // mime filter for web fallback
  multiple?: boolean;
  maxSizeMB?: number;
}

export interface PickedMedia {
  file: File;
  previewUrl: string;     // object URL — caller must revoke when done
}

/**
 * Opens the native picker (or web file input). Resolves with picked files,
 * or empty array if cancelled. Validates size if maxSizeMB is provided.
 */
export function pickMedia(opts: PickMediaOptions = {}): Promise<PickedMedia[]> {
  return new Promise((resolve, reject) => {
    if (!isBrowser) return resolve([]);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = opts.accept || "image/*";
    if (opts.multiple) input.multiple = true;
    // `capture` hints mobile browsers to open the camera directly.
    if (opts.source === "camera") input.setAttribute("capture", "environment");

    const cleanup = () => {
      input.removeEventListener("change", onChange);
      input.remove();
    };

    const onChange = () => {
      const files = Array.from(input.files || []);
      cleanup();
      if (files.length === 0) return resolve([]);
      const limit = (opts.maxSizeMB ?? 0) * 1024 * 1024;
      const tooBig = limit > 0 ? files.find((f) => f.size > limit) : null;
      if (tooBig) {
        return reject(new Error(`File "${tooBig.name}" exceeds ${opts.maxSizeMB}MB`));
      }
      resolve(files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })));
    };

    input.addEventListener("change", onChange);
    input.style.display = "none";
    document.body.appendChild(input);
    input.click();
  });
}

/** Caller should call this when previewUrl is no longer needed. */
export function releasePreview(url: string): void {
  if (isBrowser) URL.revokeObjectURL(url);
}