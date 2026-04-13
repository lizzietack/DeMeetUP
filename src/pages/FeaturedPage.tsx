import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import CompanionCard from "@/components/CompanionCard";
import { useCompanions } from "@/hooks/use-companions";

const FeaturedPage = () => {
  const { data: companions = [], isLoading } = useCompanions();
  const featured = companions.filter((c) => c.featured);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 glass-strong">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" />
            <h1 className="font-display text-xl font-bold text-foreground">Featured</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Hand-picked premium companions</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden">
                <div className="aspect-[3/4] bg-secondary shimmer" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-secondary rounded shimmer w-2/3" />
                  <div className="h-3 bg-secondary rounded shimmer w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {featured.map((c, i) => (
              <CompanionCard key={c.id} companion={c} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No featured companions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedPage;
