import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
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
    body_type: string | null;
    ethnicity: string | null;
    date_of_birth: string | null;
  };
}

function calculateAge(dob: string | null): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export interface CompanionWithVerification extends Companion {
  photoVerified?: boolean;
  selfieVerified?: boolean;
  trustScore?: number;
  bodyType?: string;
  ethnicity?: string;
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
    age: calculateAge(row.profiles?.date_of_birth),
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
    bodyType: row.profiles?.body_type || undefined,
    ethnicity: row.profiles?.ethnicity || undefined,
  };
}

const PROFILE_SELECT = `
  *,
  companion_images (image_url, position),
  profiles!companion_profiles_user_id_fkey (display_name, avatar_url, bio, location, country, currency, photo_verified, selfie_verified, trust_score, body_type, ethnicity, date_of_birth)
`;

export const COMPANIONS_PAGE_SIZE = 24;

/**
 * Server-side paginated companion list. Returns flattened companions across
 * all loaded pages plus `hasMore` and `fetchNextPage` from react-query.
 */
export function useCompanions() {
  const query = useInfiniteQuery({
    queryKey: ["companions", "infinite"],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * COMPANIONS_PAGE_SIZE;
      const to = from + COMPANIONS_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("companion_profiles")
        .select(PROFILE_SELECT)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return (data as unknown as DbCompanionProfile[]).map(mapToCompanion);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < COMPANIONS_PAGE_SIZE ? undefined : allPages.length,
  });

  const companions = (query.data?.pages.flat() ?? []) as CompanionWithVerification[];
  return {
    ...query,
    data: companions,
  };
}

/** Legacy single-shot fetch — kept for any caller that wants the raw query shape. */
export function useCompanionsAll() {
  return useQuery({
    queryKey: ["companions", "all"],
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
