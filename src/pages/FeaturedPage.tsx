import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import CompanionCard from "@/components/CompanionCard";
import { companions } from "@/data/mock";

const FeaturedPage = () => {
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
        <div className="grid grid-cols-2 gap-3">
          {featured.map((c, i) => (
            <CompanionCard key={c.id} companion={c} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedPage;
