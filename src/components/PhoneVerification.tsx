import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Check, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface PhoneVerificationProps {
  /** The currently saved phone (E.164-ish 233XXXXXXXXX or empty) */
  currentPhone?: string | null;
  /** ISO timestamp of when the current phone was last verified */
  verifiedAt?: string | null;
  /** Called after a successful verification with the saved phone */
  onVerified?: (phone: string, verifiedAt: string) => void;
  /** Compact (no big header) — used inside other forms like CompanionSetupPage */
  compact?: boolean;
}

type Step = "enter" | "code";

/** Visually format 233XXXXXXXXX as +233 XX XXX XXXX */
const prettyPhone = (p?: string | null) => {
  if (!p) return "";
  const m = p.match(/^233(\d{2})(\d{3})(\d{4})$/);
  return m ? `+233 ${m[1]} ${m[2]} ${m[3]}` : p;
};

/** Friendly relative timestamp: "just now", "5 min ago", "Apr 25, 2026" */
const formatVerifiedAt = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export const PhoneVerification = ({
  currentPhone,
  verifiedAt,
  onVerified,
  compact = false,
}: PhoneVerificationProps) => {
  const [step, setStep] = useState<Step>("enter");
  const [phone, setPhone] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleSendCode = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      toast.error("Enter a phone number");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-phone-otp", {
        body: { phone: trimmed },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to send code");
      setNormalizedPhone(data.phone);
      setStep("code");
      setResendIn(60);
      toast.success(`Code sent to ${prettyPhone(data.phone)}`);
    } catch (err: any) {
      const msg = err?.context?.body
        ? (await err.context.json().catch(() => ({})))?.error
        : err?.message;
      toast.error(msg || "Failed to send verification code");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-phone-otp", {
        body: { code },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Verification failed");
      toast.success("Phone number verified!");
      onVerified?.(data.phone, data.verified_at || new Date().toISOString());
      // Reset for next change
      setStep("enter");
      setPhone("");
      setCode("");
      setNormalizedPhone("");
    } catch (err: any) {
      const msg = err?.context?.body
        ? (await err.context.json().catch(() => ({})))?.error
        : err?.message;
      toast.error(msg || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setPhone(normalizedPhone || phone);
    await handleSendCode();
  };

  const verifiedAtLabel = formatVerifiedAt(verifiedAt);

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Phone Number</p>
            <p className="text-xs text-muted-foreground">
              {currentPhone
                ? `Verified: ${prettyPhone(currentPhone)}`
                : "Verify your number to receive SMS booking alerts"}
            </p>
            {currentPhone && verifiedAtLabel && (
              <p className="text-[11px] text-muted-foreground/80 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-green-400" />
                Last verified {verifiedAtLabel}
              </p>
            )}
          </div>
          {currentPhone && (
            <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
      )}

      {compact && currentPhone && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-green-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {prettyPhone(currentPhone)}
              {verifiedAtLabel && <span> · {verifiedAtLabel}</span>}
            </p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "enter" ? (
          <motion.div
            key="enter"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            <Input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0241234567 or +233241234567"
              maxLength={20}
              className="bg-secondary border-border/50"
              autoComplete="tel"
              disabled={sending}
            />
            <Button
              onClick={handleSendCode}
              disabled={sending || !phone.trim()}
              className="w-full gradient-gold text-primary-foreground font-semibold rounded-xl h-10"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
              ) : currentPhone ? (
                "Send Code to Change Number"
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            <div className="text-xs text-muted-foreground">
              We sent a 6-digit code to <span className="text-foreground font-medium">{prettyPhone(normalizedPhone)}</span>.
            </div>
            <Input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              autoComplete="one-time-code"
              className="bg-secondary border-border/50 text-center text-lg tracking-[0.4em] font-mono"
              disabled={verifying}
            />
            <Button
              onClick={handleVerify}
              disabled={verifying || code.length !== 6}
              className="w-full gradient-gold text-primary-foreground font-semibold rounded-xl h-10"
            >
              {verifying ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>
              ) : (
                <><Check className="w-4 h-4 mr-2" /> Verify & Save</>
              )}
            </Button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("enter");
                  setCode("");
                }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Change number
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0 || sending}
                className="text-gold disabled:text-muted-foreground"
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhoneVerification;