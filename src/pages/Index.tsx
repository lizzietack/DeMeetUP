import { useEffect, useState } from "react";
import AgeVerification from "@/components/AgeVerification";
import HomePage from "@/pages/HomePage";
import { storage } from "@/platform/storage";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user } = useAuth();
  // Sync read is fine here — it's the very first paint of the app.
  const [verified, setVerified] = useState(
    () => storage.getSync("vc_age_verified") === "true"
  );

  // For authenticated users, the source of truth is profiles.age_verified.
  // Clearing localStorage should NOT bypass the gate if the server flag is false.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("age_verified" as any)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const serverVerified = !!(data as any)?.age_verified;
      if (serverVerified) {
        void storage.set("vc_age_verified", "true");
        setVerified(true);
      } else {
        // Server says not verified — force the gate regardless of localStorage.
        setVerified(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!verified) {
    return <AgeVerification onVerified={() => setVerified(true)} />;
  }

  return <HomePage />;
};

export default Index;
