import { useState } from "react";
import AgeVerification from "@/components/AgeVerification";
import HomePage from "@/pages/HomePage";
import { storage } from "@/platform/storage";

const Index = () => {
  // Sync read is fine here — it's the very first paint of the app.
  const [verified, setVerified] = useState(
    () => storage.getSync("vc_age_verified") === "true"
  );

  if (!verified) {
    return <AgeVerification onVerified={() => setVerified(true)} />;
  }

  return <HomePage />;
};

export default Index;
