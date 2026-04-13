import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitReport } from "@/hooks/use-reports";
import { toast } from "sonner";

const REASONS = [
  { value: "harassment" as const, label: "Harassment", emoji: "🚫" },
  { value: "spam" as const, label: "Spam", emoji: "📧" },
  { value: "inappropriate" as const, label: "Inappropriate", emoji: "⚠️" },
  { value: "scam" as const, label: "Scam / Fraud", emoji: "🕵️" },
  { value: "other" as const, label: "Other", emoji: "📋" },
];

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedName: string;
}

const ReportUserModal = ({ isOpen, onClose, reportedUserId, reportedName }: ReportUserModalProps) => {
  const [reason, setReason] = useState<typeof REASONS[number]["value"] | null>(null);
  const [details, setDetails] = useState("");
  const submitReport = useSubmitReport();

  const handleSubmit = async () => {
    if (!reason) { toast.error("Please select a reason"); return; }
    try {
      await submitReport.mutateAsync({ reported_user_id: reportedUserId, reason, details: details || undefined });
      toast.success("Report submitted successfully");
      setReason(null);
      setDetails("");
      onClose();
    } catch {
      toast.error("Failed to submit report");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm px-4 pb-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Report User</h2>
                <p className="text-xs text-muted-foreground">Reporting {reportedName}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</label>
              <div className="grid grid-cols-2 gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-xs font-medium transition-colors ${
                      reason === r.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/30 bg-secondary/30 text-foreground hover:bg-secondary/60"
                    }`}
                  >
                    <span>{r.emoji}</span> {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details (optional)</label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what happened…"
                className="bg-secondary border-border/50 min-h-[80px] text-sm resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-right">{details.length}/500</p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitReport.isPending || !reason}
              className="w-full gradient-gold text-primary-foreground font-semibold rounded-xl h-11"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitReport.isPending ? "Submitting…" : "Submit Report"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportUserModal;
