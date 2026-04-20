import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles all Supabase redirect flows:
 *   - Email confirmation links
 *   - OAuth redirects
 *   - Password recovery (re-routed to /reset-password)
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          navigate("/reset-password", { replace: true });
          return;
        }
        if (session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("profile_completed")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!profile || !profile.profile_completed) {
            navigate("/onboarding", { replace: true });
          } else {
            navigate("/discover", { replace: true });
          }
        }
      }
    );

    // Safety net: bail to login if no token is found within 3 seconds.
    const timeout = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm mt-4">Signing you in…</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;