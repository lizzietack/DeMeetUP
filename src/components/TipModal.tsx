import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Sparkles } from "lucide-react";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTip: (amount: number) => void;
  recipientName: string;
}

const TIP_OPTIONS = [5, 10, 20, 50];

const TipModal = ({ isOpen, onClose, onSendTip, recipientName }: TipModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSend = () => {
    const amount = selectedAmount || Number(customAmount);
    if (amount <= 0) return;
    setShowSuccess(true);
    setTimeout(() => {
      onSendTip(amount);
      setShowSuccess(false);
      setSelectedAmount(null);
      setCustomAmount("");
      onClose();
    }, 1500);
  };

  const amount = selectedAmount || Number(customAmount) || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-strong rounded-t-3xl p-6"
          >
            {showSuccess ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center py-8"
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mb-4 glow-gold"
                >
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                <h3 className="font-display text-xl font-bold text-foreground">Tip Sent!</h3>
                <p className="text-muted-foreground text-sm mt-1">${amount} sent to {recipientName}</p>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">Send a Tip</h3>
                    <p className="text-xs text-muted-foreground">Show {recipientName} some appreciation</p>
                  </div>
                  <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  {TIP_OPTIONS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                      className={`py-3 rounded-xl font-display font-semibold text-sm transition-all ${
                        selectedAmount === amt
                          ? "gradient-gold text-primary-foreground glow-gold scale-105"
                          : "glass hover:bg-secondary/80"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="relative mb-6">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    className="w-full bg-secondary rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={amount <= 0}
                  className="w-full py-3 rounded-xl gradient-gold text-primary-foreground font-display font-semibold glow-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {amount > 0 ? `Send $${amount} Tip` : "Select an amount"}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TipModal;
