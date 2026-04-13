import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Companion } from "@/data/mock";

interface DbCompanionProfile {
  id: string;
  user_id: string;
  hourly_rate: number | null;
  overnight_rate: number | null;
  services: string[];
  gender: string | null;
  verified: boolean;
  availability: any;
  companion_images: { image_url: string; position: number }[];
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
  };
}

function mapToCompanion(row: DbCompanionProfile): Companion {
  const images = (row.companion_images || [])
    .sort((a, b) => a.position - b.position)
    .map((img) => img.image_url);

  return {
    id: row.id,
    name: row.profiles?.display_name || "Anonymous",
    age: 0, // not stored
    location: row.profiles?.location || "Unknown",
    bio: row.profiles?.bio || "",
    images: images.length > 0 ? images : ["/placeholder.svg"],
    services: row.services || [],
    hourlyRate: row.hourly_rate || 0,
    overnightRate: row.overnight_rate || 0,
    rating: 0,
    reviewCount: 0,
    verified: row.verified,
    featured: row.verified, // verified companions are featured for now
    gender: (row.gender as Companion["gender"]) || "female",
    online: false,
  };
}

export function useCompanions() {
  return useQuery({
    queryKey: ["companions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companion_profiles")
        .select(`
          *,
          companion_images (image_url, position),
          profiles!companion_profiles_user_id_fkey (display_name, avatar_url, bio, location)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as DbCompanionProfile[]).map(mapToCompanion);
    },
  });
}

export function useCompanion(id: string | undefined) {
  return useQuery({
    queryKey: ["companion", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companion_profiles")
        .select(`
          *,
          companion_images (image_url, position),
          profiles!companion_profiles_user_id_fkey (display_name, avatar_url, bio, location)
        `)
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapToCompanion(data as unknown as DbCompanionProfile);
    },
  });
}
