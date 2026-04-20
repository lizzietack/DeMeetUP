import { motion } from "framer-motion";
import { ArrowRight, Crown, TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CompanionCard from "@/components/CompanionCard";
import { useCompanions } from "@/hooks/use-companions";
import { Skeleton } from "@/components/ui/skeleton";

const HomePage = () => {
  const navigate = useNavigate();
  const { data: companions = [], isLoading } = useCompanions();
  const featured = companions.filter((c) => c.featured);
  const online = companions.slice(0, 6);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-strong">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">DeMeetUP</h1>
            <p className="text-[10px] text-gold tracking-[0.2em] uppercase">Exclusive Connections</p>
          </div>
          <button className="w-9 h-9 glass rounded-full flex items-center justify-center">
            <Crown className="w-4 h-4 text-gold" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 space-y-8 pt-4">
        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div className="gradient-purple p-6 py-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/30" />
            <div className="relative">
              <Sparkles className="w-5 h-5 text-gold mb-2" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                Find Your Perfect
                <br />
                <span className="text-gold">Companion</span>
              </h2>
              <p className="text-foreground/70 text-sm mb-4 max-w-[200px]">
                Premium connections for extraordinary experiences
              </p>
              <button
                onClick={() => navigate("/discover")}
                className="gradient-gold text-primary-foreground font-display font-semibold text-sm px-5 py-2.5 rounded-xl
                           flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Explore Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Featured section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-gold" />
              <h2 className="font-display text-lg font-semibold text-foreground">Featured</h2>
            </div>
            <button onClick={() => navigate("/featured")} className="text-gold text-sm font-medium flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass rounded-2xl overflow-hidden">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
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
            <div className="glass rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">No featured companions yet. Check back soon!</p>
            </div>
          )}
        </section>

        {/* Trending */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <h2 className="font-display text-lg font-semibold text-foreground">Online Now</h2>
            </div>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="glass rounded-2xl overflow-hidden">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : online.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {online.map((c, i) => (
                <CompanionCard key={c.id} companion={c} index={i} />
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">No companions available right now.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
