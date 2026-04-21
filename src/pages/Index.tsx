import { useState, useEffect } from "react";
import AgeVerification from "@/components/AgeVerification";
import HomePage from "@/pages/HomePage";
import { storage } from "@/platform/storage";
import { useAuth } from "@/contexts/AuthContext";

// Module-level flag — survives React re-mounts within the same app session.
// Once the user confirms their age, this stays true until the app process ends.
let sessionVerified = false;

const Index = () => {
  const { profile } = useAuth();

  // Initialise from the module flag or a sync localStorage read.
  const [verified, setVerified] = useState(
    () => sessionVerified || storage.getSync("vc_age_verified") === "true"
  );

  // Async fallback: on Android the sync read can miss a recently written value.
  // Read asynchronously on mount and flip the gate if the value is there.
  useEffect(() => {
    if (verified) return;
    storage.get("vc_age_verified").then((val) => {
      if (val === "true") {
        sessionVerified = true;
        setVerified(true);
      }
    });
  }, [verified]);

  // Also check server-side flag from the user's profile (set during onboarding).
  useEffect(() => {
    if (verified) return;
    if (profile?.age_verified) {
      sessionVerified = true;
      setVerified(true);
    }
  }, [profile, verified]);

  const handleVerified = () => {
    sessionVerified = true;
    setVerified(true);
  };

  if (!verified) {
    return <AgeVerification onVerified={handleVerified} />;
  }

  return <HomePage />;
};

export default Index;
