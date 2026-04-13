import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface AgeVerificationProps {
  onVerified: () => void;
}

const AgeVerification = ({ onVerified }: AgeVerificationProps) => {
  const [exiting, setExiting] = useState(false);

  const handleConfirm = () => {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem("vc_age_verified", "true");
      onVerified();
    }, 600);
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-purple-glow/10 via-transparent to-transparent" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="glass-strong rounded-2xl p-8 md:p-12 max-w-md w-full mx-4 text-center relative"
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Velvet Circle
              </h1>
              <p className="text-gold text-sm tracking-widest uppercase mb-6">
                Exclusive Social Discovery
              </p>
              <div className="w-12 h-px bg-gold/30 mx-auto mb-6" />
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                This platform is exclusively for adults aged 18 and over.
                By entering, you confirm that you meet the age requirement
                and agree to our terms of service.
              </p>
              <button
                onClick={handleConfirm}
                className="w-full gradient-gold text-primary-foreground font-display font-semibold py-3.5 rounded-xl
                           hover:opacity-90 transition-all duration-300 glow-gold active:scale-[0.98]"
              >
                I am 18+ — Enter
              </button>
              <p className="text-muted-foreground/50 text-xs mt-4">
                By continuing you agree to our Privacy Policy & Terms
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgeVerification;
