import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const SavedCompanionsPage = () => {
  const navigate = useNavigate();

  // For now, saved companions is an empty state — will be wired to DB later
  const savedCompanions: any[] = [];

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-strong sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Saved Companions</h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 pt-6"
      >
        {savedCompanions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-5">
              <Heart className="w-9 h-9 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">No saved companions</h2>
            <p className="text-sm text-muted-foreground max-w-[260px] mb-6">
              Tap the heart icon on any companion profile to save them here for quick access.
            </p>
            <Button
              onClick={() => navigate("/discover")}
              className="gradient-gold text-primary-foreground font-semibold rounded-xl px-6"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Discover Companions
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {savedCompanions.map((companion: any) => (
              <motion.div
                key={companion.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/companion/${companion.id}`)}
                className="glass rounded-xl overflow-hidden cursor-pointer group"
              >
                <div className="relative aspect-[3/4]">
                  <img src={companion.images?.[0]} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm"
                  >
                    <Heart className="w-4 h-4 text-destructive fill-destructive" />
                  </button>
                </div>
                <div className="p-3 space-y-1">
                  <p className="font-display font-semibold text-sm text-foreground truncate">{companion.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {companion.location}
                  </div>
                  <p className="text-xs font-semibold text-primary">${companion.hourlyRate}/hr</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SavedCompanionsPage;
