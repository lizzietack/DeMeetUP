import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, DollarSign, Check } from "lucide-react";
import { companions, SERVICE_OPTIONS } from "@/data/mock";
import { useState } from "react";

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const companion = companions.find((c) => c.id === id);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("2");
  const [confirmed, setConfirmed] = useState(false);

  if (!companion) return null;

  const price = Number(duration) * companion.hourlyRate;
  const platformFee = Math.round(price * 0.1);
  const total = price + platformFee;

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-strong rounded-2xl p-8 text-center max-w-sm w-full"
        >
          <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Booking Sent!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your request has been sent to {companion.name}. You'll be notified once they respond.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full gradient-gold text-primary-foreground font-display font-semibold py-3 rounded-xl"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 glass-strong">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Book {companion.name}</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Companion summary */}
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <img src={companion.images[0]} alt={companion.name} className="w-14 h-14 rounded-xl object-cover" />
          <div>
            <h3 className="font-display font-semibold text-foreground">{companion.name}</h3>
            <p className="text-xs text-muted-foreground">{companion.location} · ${companion.hourlyRate}/hr</p>
          </div>
        </div>

        {/* Service */}
        <div className="glass rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3">Select Service</h3>
          <div className="flex flex-wrap gap-2">
            {companion.services.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedService(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${selectedService === s ? "gradient-gold text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="glass rounded-xl p-4 space-y-3">
          <h3 className="font-display font-semibold text-foreground text-sm">Date & Time</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration (hours)</label>
            <div className="flex gap-2 mt-1">
              {["1", "2", "3", "4", "6"].map((h) => (
                <button
                  key={h}
                  onClick={() => setDuration(h)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                    ${duration === h ? "gradient-gold text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price summary */}
        <div className="glass rounded-xl p-4 space-y-2">
          <h3 className="font-display font-semibold text-foreground text-sm mb-2">Price Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service ({duration} hrs × ${companion.hourlyRate})</span>
            <span className="text-foreground">${price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform fee (10%)</span>
            <span className="text-foreground">${platformFee}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-display font-semibold text-foreground">Total</span>
            <span className="font-display font-bold text-gold text-lg">${total}</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/50 p-4 z-40">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setConfirmed(true)}
            disabled={!selectedService || !selectedDate || !selectedTime}
            className="w-full gradient-gold text-primary-foreground font-display font-semibold py-3.5 rounded-xl
                       hover:opacity-90 transition-all glow-gold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm Booking — ${total}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
