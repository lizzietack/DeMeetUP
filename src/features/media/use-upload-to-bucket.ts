import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
  publicUrl: string;
  path: string;
  fileName: string;
  fileSize: number;
}

/**
 * Generic Supabase Storage uploader. Used by chat image, voice notes,
 * avatar, gallery photos, etc. Keeps the bucket-specific path logic
 * out of screen components.
 */
export function useUploadToBucket() {
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (
      bucket: string,
      userId: string,
      file: Blob,
      opts: { extension?: string; fileName?: string } = {}
    ): Promise<UploadResult> => {
      setIsUploading(true);
      try {
        const ext =
          opts.extension ??
          (file instanceof File ? file.name.split(".").pop() : undefined) ??
          "bin";
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        return {
          publicUrl: urlData.publicUrl,
          path,
          fileName: opts.fileName ?? (file instanceof File ? file.name : path),
          fileSize: file.size,
        };
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return { upload, isUploading };
}