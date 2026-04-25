import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import type { Database } from "@/integrations/supabase/types";

export interface Booking {
  id: string;
  guestId: string;
  companionProfileId: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  durationHours: number;
  serviceFee: number;
  platformFee: number;
  total: number;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  notes: string | null;
  createdAt: string;
  // Joined fields
  companionName?: string;
  companionImage?: string;
  companionLocation?: string;
}

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"] & {
  companion_profiles?: {
    profiles?: { display_name: string | null; location: string | null } | null;
    companion_images?: { image_url: string; position: number }[];
  } | null;
};

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    guestId: row.guest_id,
    companionProfileId: row.companion_profile_id,
    service: row.service,
    bookingDate: row.booking_date,
    bookingTime: row.booking_time,
    durationHours: row.duration_hours,
    serviceFee: Number(row.service_fee),
    platformFee: Number(row.platform_fee),
    total: Number(row.total),
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    companionName: row.companion_profiles?.profiles?.display_name || "Unknown",
    companionImage: row.companion_profiles?.companion_images?.[0]?.image_url,
    companionLocation: row.companion_profiles?.profiles?.location,
  };
}

export function useMyBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          companion_profiles (
            id,
            profiles!companion_profiles_user_id_fkey (display_name, location),
            companion_images (image_url, position)
          )
        `)
        .eq("guest_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapBooking);
    },
  });

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`bookings-realtime-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `guest_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bookings", user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}

export function useCreateBooking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: {
      companionProfileId: string;
      service: string;
      bookingDate: string;
      bookingTime: string;
      durationHours: number;
      serviceFee: number;
      platformFee: number;
      total: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          guest_id: user!.id,
          companion_profile_id: booking.companionProfileId,
          service: booking.service,
          booking_date: booking.bookingDate,
          booking_time: booking.bookingTime,
          duration_hours: booking.durationHours,
          service_fee: booking.serviceFee,
          platform_fee: booking.platformFee,
          total: booking.total,
          notes: booking.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", user?.id] });

      // Fire-and-forget notification to the companion (email + SMS if phone is verified)
      try {
        const { data: companionProfile } = await supabase
          .from("companion_profiles")
          .select("user_id")
          .eq("id", data.companion_profile_id)
          .single();

        const { data: guestProfile } = await supabase
          .from("profiles")
          .select("display_name, currency")
          .eq("user_id", user!.id)
          .single();

        if (companionProfile?.user_id) {
          await supabase.functions.invoke("notify-booking", {
            body: {
              companion_user_id: companionProfile.user_id,
              guest_name: guestProfile?.display_name || "A guest",
              service: data.service,
              booking_date: data.booking_date,
              booking_time: data.booking_time,
              total: data.total,
              currency_symbol: guestProfile?.currency || "GH₵",
            },
          });
        }
      } catch (err) {
        console.warn("[useCreateBooking] notify-booking failed:", err);
      }
    },
  });
}

export function useUpdateBookingStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: status as any })
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", user?.id] });
    },
    onError: (error: any) => {
      console.error("[useUpdateBookingStatus] Failed to update booking:", error);
    },
  });
}
