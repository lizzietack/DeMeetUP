import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

      // 1. Upload to storage
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

      // 3. Call moderation edge function (fire and forget for UX, but await for result)
      try {
        const { data: session } = await supabase.auth.getSession();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-image`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.session?.access_token}`,
            },
            body: JSON.stringify({
              image_url: imageUrl,
              image_type: imageType,
              moderation_id: modRecord.id,
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          return {
            imageUrl,
            moderationId: modRecord.id,
            status: result.status,
            analysis: result.analysis,
            rejectionReason: result.rejection_reason,
          };
        }
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
          const { data: session } = await supabase.auth.getSession();
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watermark-image`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.session?.access_token}`,
              },
              body: JSON.stringify({
                image_url: imageRecord.image_url,
                moderation_id: moderationId,
              }),
            }
          );
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
