import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AgeVerification from "@/components/AgeVerification";
import HomePage from "@/pages/HomePage";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [verified, setVerified] = useState(
    () => localStorage.getItem("vc_age_verified") === "true"
  );

  if (!verified) {
    return <AgeVerification onVerified={() => setVerified(true)} />;
  }

  // After Google OAuth redirect back to /, navigate authenticated users
  if (!loading && user) {
    if (!profile?.role || profile.role === "guest") {
      return <Navigate to="/discover" replace />;
    }
    return <Navigate to="/discover" replace />;
  }

  return <HomePage />;
};

export default Index;
