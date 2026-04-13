import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Companion } from "@/data/mock";
import { getCountryCurrency } from "@/data/countries";

interface DbCompanionProfile {
  id: string;
  user_id: string;
  created_at: string;
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
    country: string | null;
    currency: string | null;
    photo_verified: boolean;
    selfie_verified: boolean;
    trust_score: number;
  };
}

export interface CompanionWithVerification extends Companion {
  photoVerified?: boolean;
  selfieVerified?: boolean;
  trustScore?: number;
}

function mapToCompanion(row: DbCompanionProfile): CompanionWithVerification {
  const images = (row.companion_images || [])
    .sort((a, b) => a.position - b.position)
    .map((img) => img.image_url);

  const countryCurrency = row.profiles?.country
    ? getCountryCurrency(row.profiles.country)
    : undefined;

  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    name: row.profiles?.display_name || "Anonymous",
    age: 0,
    location: row.profiles?.location || "Unknown",
    country: row.profiles?.country || undefined,
    currency: row.profiles?.currency || countryCurrency?.currency || undefined,
    currencySymbol: countryCurrency?.currencySymbol || "$",
    bio: row.profiles?.bio || "",
    images: images.length > 0 ? images : ["/placeholder.svg"],
    services: row.services || [],
    hourlyRate: row.hourly_rate || 0,
    overnightRate: row.overnight_rate || 0,
    rating: 0,
    reviewCount: 0,
    verified: row.verified,
    featured: row.verified,
    gender: (row.gender as Companion["gender"]) || "female",
    online: false,
    photoVerified: row.profiles?.photo_verified || false,
    selfieVerified: row.profiles?.selfie_verified || false,
    trustScore: row.profiles?.trust_score || 0,
  };
}

const PROFILE_SELECT = `
  *,
  companion_images (image_url, position),
  profiles!companion_profiles_user_id_fkey (display_name, avatar_url, bio, location, country, currency, photo_verified, selfie_verified, trust_score)
`;

export function useCompanions() {
  return useQuery({
    queryKey: ["companions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companion_profiles")
        .select(PROFILE_SELECT)
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
        .select(PROFILE_SELECT)
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapToCompanion(data as unknown as DbCompanionProfile);
    },
  });
}
