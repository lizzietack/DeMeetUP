import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Sparkles, Eye, MapPin, TrendingUp, Clock } from "lucide-react";
import CompanionCard from "@/components/CompanionCard";
import { useCompanions } from "@/hooks/use-companions";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useAuth } from "@/contexts/AuthContext";
import type { Companion } from "@/data/mock";

const SERVICE_OPTIONS = [
  "Dinner Date", "Travel Companion", "Party Partner", "Social Events",
  "City Tour", "Fitness Partner", "Concert Buddy", "Art Gallery",
  "Wine Tasting", "Weekend Getaway", "Business Event", "Photography",
];

/** Extract city name from a location string like "Miami, FL" */
function extractCity(location: string | null | undefined): string {
  if (!location) return "";
  return location.split(",")[0].trim().toLowerCase();
}

const HorizontalSection = ({
  title,
  subtitle,
  icon,
  companions,
  reasons,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  companions: Companion[];
  reasons?: Record<string, string>;
  badge?: string;
}) => {
  if (companions.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold text-foreground text-sm">{title}</h2>
            {badge && (
              <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full gradient-gold text-primary-foreground">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {companions.map((c, i) => (
          <div key={c.id} className="flex-shrink-0 w-[160px]">
            <CompanionCard companion={c} index={i} />
            {reasons?.[c.id] && (
              <p className="text-[10px] text-muted-foreground mt-1 px-1 line-clamp-2 italic">
                {reasons[c.id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const DiscoverPage = () => {
  const { data: companions = [], isLoading } = useCompanions();
  const { user, profile } = useAuth();
  const { data: recommendations, isLoading: recsLoading } = useRecommendations();
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

  // ── AI Recommendations ──
  const recommendedCompanions = (recommendations?.recommended || [])
    .map((id) => companions.find((c) => c.id === id))
    .filter(Boolean) as Companion[];

  const becauseYouViewedSections = (recommendations?.becauseYouViewed || [])
    .map((byv) => ({
      ...byv,
      suggested: byv.suggestedIds
        .map((id) => companions.find((c) => c.id === id))
        .filter(Boolean) as Companion[],
    }))
    .filter((s) => s.suggested.length > 0)
    .slice(0, 2);

  const hasRecommendations = user && (recommendedCompanions.length > 0 || becauseYouViewedSections.length > 0);

  // ── Location-aware sections ──
  const userCity = extractCity(profile?.location);

  const nearYou = useMemo(() => {
    if (!userCity) return [];
    return companions
      .filter((c) => extractCity(c.location) === userCity)
      .slice(0, 8);
  }, [companions, userCity]);

  const trendingInCity = useMemo(() => {
    if (!userCity) return [];
    // Trending = verified companions in user's city, sorted by rate (proxy for popularity)
    return companions
      .filter((c) => extractCity(c.location) === userCity && c.verified)
      .sort((a, b) => b.hourlyRate - a.hourlyRate)
      .slice(0, 6);
  }, [companions, userCity]);

  const newArrivals = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recent = companions
      .filter((c) => c.createdAt && c.createdAt >= sevenDaysAgo)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, 8);
    // If no truly new profiles, show the most recently created ones
    if (recent.length === 0) {
      return [...companions]
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        .slice(0, 6);
    }
    return recent;
  }, [companions]);

  const isSearching = searchQuery || selectedServices.length > 0 || selectedGender !== "all" || priceRange[1] < 500;
  const hasLocationSections = !isSearching && (nearYou.length > 0 || newArrivals.length > 0);
  const cityDisplayName = profile?.location?.split(",")[0]?.trim();

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 glass-strong">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-bold text-foreground">Discover</h1>
            {userCity && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 text-gold" />
                <span>{cityDisplayName}</span>
              </div>
            )}
          </div>
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
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="glass rounded-xl p-4 space-y-4">
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

        {/* AI Recommendations - only show when not searching */}
        {!isSearching && hasRecommendations && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2"
          >
            {recommendedCompanions.length > 0 && (
              <HorizontalSection
                title="Recommended for You"
                subtitle="Curated by AI based on your preferences"
                icon={<Sparkles className="w-4 h-4 text-gold" />}
                companions={recommendedCompanions}
                reasons={recommendations?.reasons}
              />
            )}

            {becauseYouViewedSections.map((section) => (
              <HorizontalSection
                key={section.viewedId}
                title={`Because you viewed ${section.viewedName}`}
                icon={<Eye className="w-4 h-4 text-accent" />}
                companions={section.suggested}
                reasons={recommendations?.reasons}
              />
            ))}
          </motion.div>
        )}

        {/* Loading skeleton for recommendations */}
        {!isSearching && user && recsLoading && !isLoading && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-secondary rounded shimmer" />
              <div className="h-4 w-36 bg-secondary rounded shimmer" />
            </div>
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-[160px] glass rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] bg-secondary shimmer" />
                  <div className="p-2 space-y-1">
                    <div className="h-3 bg-secondary rounded shimmer w-2/3" />
                    <div className="h-2 bg-secondary rounded shimmer w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location-aware sections */}
        {!isSearching && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {nearYou.length > 0 && (
              <HorizontalSection
                title={`Near You${cityDisplayName ? ` in ${cityDisplayName}` : ""}`}
                subtitle="Companions in your area"
                icon={<MapPin className="w-4 h-4 text-gold" />}
                companions={nearYou}
                badge="Local"
              />
            )}

            {trendingInCity.length > 0 && (
              <HorizontalSection
                title={`Trending in ${cityDisplayName || "Your City"}`}
                subtitle="Most popular verified companions"
                icon={<TrendingUp className="w-4 h-4 text-accent" />}
                companions={trendingInCity}
                badge="Hot"
              />
            )}

            {newArrivals.length > 0 && (
              <HorizontalSection
                title="New Arrivals"
                subtitle="Recently joined the platform"
                icon={<Clock className="w-4 h-4 text-gold-light" />}
                companions={newArrivals}
                badge="New"
              />
            )}

            {/* Divider before full grid */}
            {(hasRecommendations || hasLocationSections) && (
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">All Companions</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
          </motion.div>
        )}

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
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
