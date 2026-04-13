import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Sparkles, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavedCompanions, useToggleSaveCompanion } from "@/hooks/use-saved-companions";
import { useCompanions } from "@/hooks/use-companions";
import { toast } from "sonner";

const SavedCompanionsPage = () => {
  const navigate = useNavigate();
  const { data: saved = [], isLoading: savedLoading } = useSavedCompanions();
  const { data: allCompanions = [], isLoading: companionsLoading } = useCompanions();
  const toggleSave = useToggleSaveCompanion();

  const isLoading = savedLoading || companionsLoading;

  // Match saved entries to companion data
  const savedCompanions = saved
    .map((s) => {
      const companion = allCompanions.find((c) => c.id === s.companion_profile_id);
      return companion ? { ...companion, savedId: s.id, savedAt: s.created_at } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const handleUnsave = (companionProfileId: string, name: string) => {
    toggleSave.mutate(
      { companionProfileId, isSaved: true },
      { onSuccess: () => toast.success(`${name} removed from saved`) }
    );
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-strong sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Saved Companions</h1>
          {savedCompanions.length > 0 && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full ml-auto">
              {savedCompanions.length}
            </span>
          )}
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 pt-6"
      >
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <Skeleton className="aspect-[3/4] w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : savedCompanions.length === 0 ? (
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
            {savedCompanions.map((companion) => (
              <motion.div
                key={companion.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/companion/${companion.id}`)}
                className="glass rounded-xl overflow-hidden cursor-pointer group"
              >
                <div className="relative aspect-[3/4]">
                  <img src={companion.images?.[0] || "/placeholder.svg"} alt={companion.name} className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnsave(companion.id, companion.name);
                    }}
                    disabled={toggleSave.isPending}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-destructive fill-destructive" />
                  </button>
                  {companion.verified && (
                    <div className="absolute top-2 left-2">
                      <BadgeCheck className="w-5 h-5 text-primary drop-shadow" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="font-display font-semibold text-sm text-foreground truncate">{companion.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {companion.location}
                  </div>
                  {companion.services?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {companion.services.slice(0, 2).map((s) => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  )}
                  {companion.hourlyRate > 0 && (
                    <p className="text-xs font-semibold text-primary">${companion.hourlyRate}/hr</p>
                  )}
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
