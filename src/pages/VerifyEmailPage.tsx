import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VerifyEmailPage = () => {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const { toast } = useToast();

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResending(false);
    if (error) {
      toast({ title: "Couldn't resend", description: error.message, variant: "destructive" });
    } else {
      setResent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-glow/10 via-transparent to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-8 max-w-sm w-full relative text-center"
      >
        <div className="w-14 h-14 gradient-gold rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Check your inbox
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          We sent a confirmation link to{" "}
          {email && <span className="text-foreground font-medium">{email}</span>}.
          Click it to activate your account.
        </p>
        {resent ? (
          <p className="text-green-400 text-sm mb-6">Email resent — check your spam folder too.</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={!email || resending}
            className="text-sm text-gold hover:underline disabled:opacity-50 mb-6 block mx-auto"
          >
            {resending ? "Resending..." : "Didn't get it? Resend"}
          </button>
        )}
        <Link
          to="/login"
          className="text-sm text-muted-foreground hover:text-gold transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;