import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Clock, DollarSign, Check, MessageCircle, Sparkles } from "lucide-react";
import { useCompanion } from "@/hooks/use-companions";
import { useCreateBooking } from "@/hooks/use-bookings";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];

const DURATION_OPTIONS = [
  { value: 1, label: "1 hr" },
  { value: 2, label: "2 hrs" },
  { value: 3, label: "3 hrs" },
  { value: 4, label: "4 hrs" },
  { value: 6, label: "6 hrs" },
  { value: 0, label: "Overnight" },
];

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: companion, isLoading } = useCompanion(id);
  const createBooking = useCreateBooking();

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(2);
  const [isOvernight, setIsOvernight] = useState(false);
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Generate next 14 days for date selection
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push({
        value: d.toISOString().split("T")[0],
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.getDate(),
        month: d.toLocaleDateString("en-US", { month: "short" }),
      });
    }
    return dates;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!companion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Companion not found</p>
      </div>
    );
  }

  const serviceFee = isOvernight
    ? companion.overnightRate
    : duration * companion.hourlyRate;
  const platformFee = Math.round(serviceFee * 0.1);
  const total = serviceFee + platformFee;

  const canProceedStep1 = !!selectedService;
  const canProceedStep2 = !!selectedDate && !!selectedTime;
  const canConfirm = canProceedStep1 && canProceedStep2;

  const handleConfirm = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      await createBooking.mutateAsync({
        companionProfileId: companion.id,
        service: selectedService,
        bookingDate: selectedDate,
        bookingTime: selectedTime,
        durationHours: isOvernight ? 12 : duration,
        serviceFee,
        platformFee,
        total,
        notes: notes || undefined,
      });
      setConfirmed(true);
    } catch (e) {
      toast.error("Failed to create booking. Please try again.");
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-strong rounded-2xl p-8 text-center max-w-sm w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center mx-auto mb-5 glow-gold"
          >
            <Check className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Booking Sent!</h2>
          <p className="text-muted-foreground text-sm mb-2">
            Your request has been sent to {companion.name}.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            You'll be notified once they respond. Average response time is under 1 hour.
          </p>

          <div className="glass rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span className="text-foreground font-medium">{selectedService}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="text-foreground font-medium">
                {new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="text-gold font-display font-bold">{companion.currencySymbol || "$"}{total}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate(`/chat/${companion.id}`)}
              className="w-full bg-secondary text-foreground font-display font-semibold py-3 rounded-xl
                         flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Message {companion.name}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full gradient-gold text-primary-foreground font-display font-semibold py-3 rounded-xl glow-gold"
            >
              Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 glass-strong">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-foreground">Book {companion.name}</h1>
            <p className="text-[10px] text-muted-foreground">Step {step} of 3</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-secondary">
          <motion.div
            className="h-full gradient-gold"
            initial={{ width: "33%" }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Companion summary */}
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <img src={companion.images[0]} alt={companion.name} className="w-14 h-14 rounded-xl object-cover" />
          <div className="flex-1">
            <h3 className="font-display font-semibold text-foreground">{companion.name}</h3>
            <p className="text-xs text-muted-foreground">{companion.location} · {companion.currencySymbol || "$"}{companion.hourlyRate}/hr</p>
          </div>
          {companion.overnightRate > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Overnight</p>
              <p className="text-xs font-display font-semibold text-gold">{companion.currencySymbol || "$"}{companion.overnightRate}</p>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="glass rounded-xl p-4">
                <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" /> Select Service
                </h3>
                <div className="space-y-2">
                  {companion.services.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedService(s)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between
                        ${selectedService === s
                          ? "gradient-gold text-primary-foreground glow-gold"
                          : "bg-secondary text-foreground hover:bg-secondary/80"}`}
                    >
                      <span>{s}</span>
                      {selectedService === s && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="glass rounded-xl p-4">
                <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold" /> Duration
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_OPTIONS.map((opt) => {
                    const isSelected = opt.value === 0 ? isOvernight : (!isOvernight && duration === opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          if (opt.value === 0) {
                            setIsOvernight(true);
                          } else {
                            setIsOvernight(false);
                            setDuration(opt.value);
                          }
                        }}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all
                          ${isSelected
                            ? "gradient-gold text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="glass rounded-xl p-4">
                <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold" /> Select Date
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                  {availableDates.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDate(d.value)}
                      className={`flex-shrink-0 w-16 py-3 rounded-xl text-center transition-all
                        ${selectedDate === d.value
                          ? "gradient-gold text-primary-foreground glow-gold"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                    >
                      <p className="text-[10px] uppercase font-medium">{d.day}</p>
                      <p className="text-lg font-display font-bold">{d.date}</p>
                      <p className="text-[10px]">{d.month}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold" /> Select Time
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all
                        ${selectedTime === t
                          ? "gradient-gold text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional notes */}
              <div className="glass rounded-xl p-4">
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">
                  Special Requests <span className="text-muted-foreground font-normal">(optional)</span>
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any preferences or details to share..."
                  rows={3}
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="glass rounded-xl p-4 space-y-3">
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">Booking Summary</h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service</span>
                    <span className="text-foreground font-medium">{selectedService}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-foreground font-medium">
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric"
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="text-foreground font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-foreground font-medium">
                      {isOvernight ? "Overnight" : `${duration} hour${duration > 1 ? "s" : ""}`}
                    </span>
                  </div>
                  {notes && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm text-foreground">{notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass rounded-xl p-4 space-y-2">
                <h3 className="font-display font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gold" /> Price Breakdown
                </h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {isOvernight
                      ? "Overnight rate"
                      : `Service (${duration} hr${duration > 1 ? "s" : ""} × ${companion.currencySymbol || "$"}${companion.hourlyRate})`}
                  </span>
                  <span className="text-foreground">{companion.currencySymbol || "$"}{serviceFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform fee (10%)</span>
                  <span className="text-foreground">{companion.currencySymbol || "$"}{platformFee}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-display font-semibold text-foreground">Total</span>
                  <span className="font-display font-bold text-gold text-xl">{companion.currencySymbol || "$"}{total}</span>
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By confirming, you agree to the platform's terms. Payment will be collected once
                  {" "}{companion.name} accepts the booking. You can cancel anytime before acceptance.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/50 p-4 z-40">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 bg-secondary text-foreground font-display font-semibold py-3.5 rounded-xl
                         hover:bg-secondary/80 transition-colors"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="flex-1 gradient-gold text-primary-foreground font-display font-semibold py-3.5 rounded-xl
                         hover:opacity-90 transition-all glow-gold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || createBooking.isPending}
              className="flex-1 gradient-gold text-primary-foreground font-display font-semibold py-3.5 rounded-xl
                         hover:opacity-90 transition-all glow-gold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createBooking.isPending ? "Submitting..." : `Confirm Booking — ${companion.currencySymbol || "$"}${total}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
