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
 * Backend (watermark function) only supports PNG/JPEG. Convert anything
 * else (webp, gif, avif, heic, heif, bmp, tiff…) to JPEG client-side.
 * Animated GIFs lose animation — only the first frame is kept.
 */
const SUPPORTED_MIMES = new Set(["image/png", "image/jpeg", "image/jpg"]);

export async function transcodeToJpeg(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || SUPPORTED_MIMES.has(file.type)) {
    return file;
  }

  let blob: Blob = file;

  // HEIC/HEIF: browsers can't decode via <img>/canvas — use heic2any.
  if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
    try {
      const heic2any = (await import("heic2any")).default;
      const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
      blob = Array.isArray(out) ? out[0] : out;
    } catch (e) {
      console.error("HEIC conversion failed:", e);
      throw new Error("Could not convert HEIC image. Please try a different photo.");
    }
  }

  // Decode -> draw on canvas -> re-encode as JPEG.
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not decode image"));
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0);
    const jpegBlob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("JPEG encode failed"))),
        "image/jpeg",
        0.9
      );
    });
    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([jpegBlob], newName, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
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
    // Accept all common formats; transcoding happens after pick.
    input.accept =
      opts.accept ||
      "image/*,.heic,.heif,.webp,.avif,.gif,.bmp,.tiff";
    if (opts.multiple) input.multiple = true;
    // `capture` hints mobile browsers to open the camera directly.
    if (opts.source === "camera") input.setAttribute("capture", "environment");

    const cleanup = () => {
      input.removeEventListener("change", onChange);
      input.remove();
    };

    const onChange = async () => {
      const files = Array.from(input.files || []);
      cleanup();
      if (files.length === 0) return resolve([]);
      const limit = (opts.maxSizeMB ?? 0) * 1024 * 1024;
      const tooBig = limit > 0 ? files.find((f) => f.size > limit) : null;
      if (tooBig) {
        return reject(new Error(`File "${tooBig.name}" exceeds ${opts.maxSizeMB}MB`));
      }
      try {
        const converted = await Promise.all(files.map((f) => transcodeToJpeg(f)));
        resolve(
          converted.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
        );
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Image conversion failed"));
      }
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