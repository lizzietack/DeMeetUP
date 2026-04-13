
-- Booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

-- Bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL,
  companion_profile_id UUID NOT NULL REFERENCES public.companion_profiles(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_hours INTEGER NOT NULL DEFAULT 2,
  service_fee NUMERIC NOT NULL DEFAULT 0,
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Guests can view their own bookings
CREATE POLICY "Guests can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = guest_id);

-- Companions can view bookings made to them
CREATE POLICY "Companions can view their bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companion_profiles
      WHERE companion_profiles.id = bookings.companion_profile_id
      AND companion_profiles.user_id = auth.uid()
    )
  );

-- Guests can create bookings
CREATE POLICY "Guests can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

-- Companions can update booking status
CREATE POLICY "Companions can update booking status"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.companion_profiles
      WHERE companion_profiles.id = bookings.companion_profile_id
      AND companion_profiles.user_id = auth.uid()
    )
  );

-- Guests can cancel their own bookings
CREATE POLICY "Guests can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = guest_id);

-- Indexes
CREATE INDEX idx_bookings_guest ON public.bookings(guest_id, status);
CREATE INDEX idx_bookings_companion ON public.bookings(companion_profile_id, status);

-- Trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
