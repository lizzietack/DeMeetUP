import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Star, MapPin, Heart, Share2, MessageCircle, Calendar, DollarSign } from "lucide-react";
import { companions } from "@/data/mock";
import { useState } from "react";

const CompanionProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const companion = companions.find((c) => c.id === id);
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);

  if (!companion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Companion not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Image gallery */}
      <div className="relative h-[65vh] overflow-hidden">
        <motion.img
          key={activeImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={companion.images[activeImage]}
          alt={companion.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-12">
          <button onClick={() => navigate(-1)} className="w-10 h-10 glass rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex gap-2">
            <button onClick={() => setLiked(!liked)} className="w-10 h-10 glass rounded-full flex items-center justify-center">
              <Heart className={`w-5 h-5 ${liked ? "fill-destructive text-destructive" : "text-foreground"}`} />
            </button>
            <button className="w-10 h-10 glass rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Image dots */}
        {companion.images.length > 1 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
            {companion.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeImage ? "bg-gold w-6" : "bg-foreground/40"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="max-w-lg mx-auto px-4 -mt-16 relative z-10 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-foreground">{companion.name}, {companion.age}</h1>
                {companion.verified && <BadgeCheck className="w-5 h-5 text-gold" />}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{companion.location}</span>
                {companion.online && (
                  <>
                    <span className="mx-1">·</span>
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-green-400 text-xs">Online</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-gold fill-gold" />
              <span className="font-display font-semibold text-foreground">{companion.rating}</span>
              <span className="text-xs text-muted-foreground">({companion.reviewCount})</span>
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">{companion.bio}</p>

          {/* Services */}
          <div className="flex flex-wrap gap-1.5">
            {companion.services.map((s) => (
              <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border">
                {s}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-gold" />
            <h2 className="font-display font-semibold text-foreground">Pricing</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Hourly</p>
              <p className="font-display text-xl font-bold text-gold">${companion.hourlyRate}</p>
            </div>
            <div className="bg-secondary rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Overnight</p>
              <p className="font-display text-xl font-bold text-gold">${companion.overnightRate}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/50 p-4 z-40">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={() => navigate(`/chat/${companion.id}`)}
            className="flex-1 bg-secondary text-foreground font-display font-semibold py-3 rounded-xl
                       flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Message
          </button>
          <button
            onClick={() => navigate(`/book/${companion.id}`)}
            className="flex-1 gradient-gold text-primary-foreground font-display font-semibold py-3 rounded-xl
                       flex items-center justify-center gap-2 hover:opacity-90 transition-opacity glow-gold"
          >
            <Calendar className="w-4 h-4" /> Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanionProfilePage;
