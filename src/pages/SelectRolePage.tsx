import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Sparkles } from "lucide-react";
import { useState } from "react";

const SelectRolePage = () => {
  const { updateRole, profile } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"guest" | "companion" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setIsLoading(true);
    await updateRole(selected);
    setIsLoading(false);
    navigate("/onboarding", { replace: true });
  };

  const roles = [
    {
      id: "guest" as const,
      title: "Guest",
      description: "Browse profiles, book experiences, and connect with companions",
      icon: Search,
      gradient: "gradient-purple",
    },
    {
      id: "companion" as const,
      title: "Companion",
      description: "Create your profile, offer services, and meet amazing people",
      icon: Sparkles,
      gradient: "gradient-gold",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-glow/10 via-transparent to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full relative"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">Choose Your Role</h1>
          <p className="text-muted-foreground text-sm mt-1">How would you like to use DeMeetUP?</p>
        </div>

        <div className="space-y-3 mb-6">
          {roles.map((role) => (
            <motion.button
              key={role.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(role.id)}
              className={`w-full glass rounded-2xl p-5 text-left transition-all ${
                selected === role.id ? "ring-2 ring-gold glow-gold" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${role.gradient} flex items-center justify-center flex-shrink-0`}>
                  <role.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground text-lg">{role.title}</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">{role.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || isLoading}
          className="w-full gradient-gold text-primary-foreground font-display font-semibold py-3.5 rounded-xl
                     hover:opacity-90 transition-all glow-gold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? "Setting up..." : "Continue"}
        </button>
      </motion.div>
    </div>
  );
};

export default SelectRolePage;
