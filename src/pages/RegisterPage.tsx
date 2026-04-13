import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password too short", description: "At least 6 characters required", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(email, password, displayName);
    setIsLoading(false);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/select-role");
      toast({ title: "Account created!", description: "Choose your role to get started." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-glow/10 via-transparent to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-8 max-w-sm w-full relative"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">Join the Circle</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your exclusive account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-secondary rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full gradient-gold text-primary-foreground font-display font-semibold py-3 rounded-xl
                       hover:opacity-90 transition-all glow-gold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? "Creating account..." : <>Create Account <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-gold font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
