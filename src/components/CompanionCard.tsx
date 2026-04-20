import { motion } from "framer-motion";
import { MapPin, Star, BadgeCheck, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Companion } from "@/data/mock";
import { useSavedCompanionIds, useToggleSaveCompanion } from "@/hooks/use-saved-companions";
import { useAuth } from "@/contexts/AuthContext";

interface CompanionCardProps {
  companion: Companion & { bodyType?: string; ethnicity?: string };
  index?: number;
}

const CompanionCard = ({ companion, index = 0 }: CompanionCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const savedIds = useSavedCompanionIds();
  const toggleSave = useToggleSaveCompanion();
  const isSaved = savedIds.has(companion.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/companion/${companion.id}`)}
      className="group cursor-pointer relative"
    >
      <div className="glass rounded-2xl overflow-hidden">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={companion.images[0]}
            alt={companion.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          {/* Online indicator */}
          {companion.online && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 glass rounded-full px-2.5 py-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-foreground">Online</span>
            </div>
          )}

          {/* Like button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!user) { navigate("/login"); return; }
              toggleSave.mutate({ companionProfileId: companion.id, isSaved });
            }}
            disabled={toggleSave.isPending}
            className="absolute top-3 right-3 w-9 h-9 glass rounded-full flex items-center justify-center
                       hover:bg-destructive/20 transition-colors disabled:opacity-50"
          >
            <Heart className={`w-4 h-4 transition-colors ${isSaved ? "fill-destructive text-destructive" : "text-foreground/70"}`} />
          </button>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {companion.name}, {companion.age}
              </h3>
              {companion.verified && (
                <BadgeCheck className="w-4 h-4 text-gold" />
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
              <MapPin className="w-3 h-3" />
              <span>{companion.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                <span className="text-sm text-foreground font-medium">{companion.rating}</span>
                <span className="text-xs text-muted-foreground">({companion.reviewCount})</span>
              </div>
              <span className="text-gold font-display font-semibold text-sm">
                {companion.currencySymbol || "$"}{companion.hourlyRate}/hr
              </span>
            </div>
          </div>
        </div>

        {/* Attribute & service tags */}
        <div className="p-3 pt-2 flex flex-wrap gap-1.5">
          {companion.age > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-medium">
              {companion.age}y
            </span>
          )}
          {companion.bodyType && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
              {companion.bodyType}
            </span>
          )}
          {companion.ethnicity && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
              {companion.ethnicity}
            </span>
          )}
          {companion.services.slice(0, 2).map((service) => (
            <span key={service} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {service}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CompanionCard;
