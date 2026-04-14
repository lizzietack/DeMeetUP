-- Create a function that sends push notification via edge function when a new message is inserted
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _recipient_id uuid;
  _sender_name text;
  _conv record;
BEGIN
  -- Get conversation to find recipient
  SELECT * INTO _conv FROM conversations WHERE id = NEW.conversation_id;
  
  IF _conv.participant_one = NEW.sender_id THEN
    _recipient_id := _conv.participant_two;
  ELSE
    _recipient_id := _conv.participant_one;
  END IF;

  -- Get sender name
  SELECT display_name INTO _sender_name FROM profiles WHERE user_id = NEW.sender_id;

  -- Call edge function via pg_net (fire and forget)
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'user_id', _recipient_id,
      'title', COALESCE(_sender_name, 'Someone') || ' sent you a message',
      'body', LEFT(NEW.content, 100),
      'url', '/chat/' || NEW.conversation_id,
      'type', 'message'
    )
  );

  RETURN NEW;
END;
$$;

-- Create a function for new booking notifications
CREATE OR REPLACE FUNCTION public.notify_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _companion_user_id uuid;
  _guest_name text;
BEGIN
  -- Get companion user_id
  SELECT user_id INTO _companion_user_id FROM companion_profiles WHERE id = NEW.companion_profile_id;
  
  -- Get guest name
  SELECT display_name INTO _guest_name FROM profiles WHERE user_id = NEW.guest_id;

  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'user_id', _companion_user_id,
      'title', 'New booking request',
      'body', COALESCE(_guest_name, 'A guest') || ' booked ' || NEW.service,
      'url', '/dashboard',
      'type', 'booking'
    )
  );

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_new_message_push
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

CREATE TRIGGER on_new_booking_push
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_booking();