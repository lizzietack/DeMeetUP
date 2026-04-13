import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Grid3X3, Layers, X } from "lucide-react";
import CompanionCard from "@/components/CompanionCard";
import { companions, SERVICE_OPTIONS } from "@/data/mock";

const DiscoverPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedGender, setSelectedGender] = useState<string>("all");

  const filtered = companions.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !c.location.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedServices.length > 0 && !selectedServices.some((s) => c.services.includes(s))) return false;
    if (c.hourlyRate < priceRange[0] || c.hourlyRate > priceRange[1]) return false;
    if (selectedGender !== "all" && c.gender !== selectedGender) return false;
    return true;
  });

  const toggleService = (s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 glass-strong">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          <h1 className="font-display text-xl font-bold text-foreground">Discover</h1>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground
                           focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                ${showFilters ? "gradient-gold text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-3">
        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="glass rounded-xl p-4 space-y-4">
                {/* Gender filter */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Gender</p>
                  <div className="flex gap-2">
                    {["all", "female", "male"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setSelectedGender(g)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                          ${selectedGender === g ? "gradient-gold text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                      >
                        {g === "all" ? "All" : g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SERVICE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleService(s)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors
                          ${selectedServices.includes(s) ? "gradient-gold text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                    Price: ${priceRange[0]} — ${priceRange[1]}/hr
                  </p>
                  <input
                    type="range"
                    min={0} max={500} step={25}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-gold"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <p className="text-xs text-muted-foreground mb-3">{filtered.length} companions found</p>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((c, i) => (
            <CompanionCard key={c.id} companion={c} index={i} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No companions match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
