import { useState } from "react";
import AgeVerification from "@/components/AgeVerification";
import HomePage from "@/pages/HomePage";

const Index = () => {
  const [verified, setVerified] = useState(
    () => localStorage.getItem("vc_age_verified") === "true"
  );

  if (!verified) {
    return <AgeVerification onVerified={() => setVerified(true)} />;
  }

  return <HomePage />;
};

export default Index;
