import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { callEdgeFunction } from "@/lib/edge-function";

export const useImageModeration = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["image-moderation", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("image_moderation")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useUploadAndModerate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      imageType,
      bucket = "companion-images",
    }: {
      file: File;
      imageType: "profile" | "gallery";
      bucket?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Ensure session is fresh before uploading
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error("Session refresh failed:", refreshError);
        throw new Error("Session expired. Please log in again.");
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      // 2. Create moderation record
      const { data: modRecord, error: modError } = await supabase
        .from("image_moderation")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          image_type: imageType,
          status: "pending_review" as any,
        })
        .select()
        .single();

      if (modError) throw modError;

      // 3. Call moderation edge function with retry
      try {
        const result = await callEdgeFunction<{
          status: string;
          analysis: any;
          rejection_reason: string | null;
        }>("moderate-image", {
          body: {
            image_url: imageUrl,
            image_type: imageType,
            moderation_id: modRecord.id,
          },
        });

        return {
          imageUrl,
          moderationId: modRecord.id,
          status: result.status,
          analysis: result.analysis,
          rejectionReason: result.rejection_reason,
        };
      } catch (e) {
        console.error("Moderation call failed:", e);
      }

      return {
        imageUrl,
        moderationId: modRecord.id,
        status: "pending_review",
        analysis: null,
        rejectionReason: null,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["image-moderation"] });
    },
  });
};

export const useAdminImages = (statusFilter?: string) => {
  return useQuery({
    queryKey: ["admin-images", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("image_moderation")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useAdminUpdateImage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      moderationId,
      status,
      rejectionReason,
    }: {
      moderationId: string;
      status: "approved" | "rejected";
      rejectionReason?: string;
    }) => {
      // Get the image record first for watermarking
      const { data: imageRecord } = await supabase
        .from("image_moderation")
        .select("image_url")
        .eq("id", moderationId)
        .single();

      const { error } = await supabase
        .from("image_moderation")
        .update({
          status: status as any,
          rejection_reason: rejectionReason || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", moderationId);

      if (error) throw error;

      // Apply watermark to approved images
      if (status === "approved" && imageRecord?.image_url) {
        try {
          await callEdgeFunction("watermark-image", {
            body: {
              image_url: imageRecord.image_url,
              moderation_id: moderationId,
            },
          });
        } catch (e) {
          console.error("Watermark call failed:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-images"] });
    },
  });
};
