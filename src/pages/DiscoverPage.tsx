import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Sparkles, Eye, MapPin, TrendingUp, Clock, X, ArrowUpDown, ChevronDown, Globe } from "lucide-react";
import CompanionCard from "@/components/CompanionCard";
import { useCompanions } from "@/hooks/use-companions";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useAuth } from "@/contexts/AuthContext";
import type { Companion } from "@/data/mock";
import { COUNTRIES } from "@/data/countries";
import { BODY_TYPES, ETHNICITIES } from "@/data/personalAttributes";

const SERVICE_OPTIONS = [
  "Dinner Date", "Travel Companion", "Party Partner", "Social Events",
  "City Tour", "Fitness Partner", "Concert Buddy", "Art Gallery",
  "Wine Tasting", "Weekend Getaway", "Business Event", "Photography",
];

function extractCity(location: string | null | undefined): string {
  if (!location) return "";
  return location.split(",")[0].trim().toLowerCase();
}

const HorizontalSection = ({
  title, subtitle, icon, companions, reasons, badge,
}: {
  title: string; subtitle?: string; icon: React.ReactNode;
  companions: Companion[]; reasons?: Record<string, string>; badge?: string;
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

type SortOption = "newest" | "price_low" | "price_high" | "rating";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  price_low: "Price: Low → High",
  price_high: "Price: High → Low",
  rating: "Top Rated",
};

const PAGE_SIZE = 12;

const DiscoverPage = () => {
  const { data: companions = [], isLoading } = useCompanions();
  const { user, profile } = useAuth();
  const { data: recommendations, isLoading: recsLoading } = useRecommendations();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(1000);
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [bodyTypeFilters, setBodyTypeFilters] = useState<string[]>([]);
  const [ethnicityFilters, setEthnicityFilters] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(65);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Unique locations for suggestions
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    companions.forEach((c) => {
      if (c.location && c.location !== "Unknown") locs.add(c.location);
    });
    return Array.from(locs).sort();
  }, [companions]);

  const filteredLocations = useMemo(() => {
    if (!locationFilter) return [];
    return uniqueLocations
      .filter((l) => l.toLowerCase().includes(locationFilter.toLowerCase()))
      .slice(0, 5);
  }, [uniqueLocations, locationFilter]);

  const filtered = useMemo(() => {
    let result = companions.filter((c) => {
      const cAny = c as any;
      if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !c.location.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !c.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      if (selectedServices.length > 0 && !selectedServices.some((s) => c.services.includes(s))) return false;
      if (c.hourlyRate < priceMin || c.hourlyRate > priceMax) return false;
      if (selectedGender !== "all" && c.gender !== selectedGender) return false;
      if (locationFilter && !c.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (countryFilter && (cAny.country || "") !== countryFilter) return false;
      if (bodyTypeFilters.length > 0 && !bodyTypeFilters.includes(cAny.bodyType || "")) return false;
      if (ethnicityFilters.length > 0 && !ethnicityFilters.includes(cAny.ethnicity || "")) return false;
      if (c.age > 0 && (c.age < ageMin || c.age > ageMax)) return false;
      if (verifiedOnly && !c.verified) return false;
      return true;
    });

    // Sort
    switch (sortBy) {
      case "price_low":
        result.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case "price_high":
        result.sort((a, b) => b.hourlyRate - a.hourlyRate);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
      default:
        result.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        break;
    }
    return result;
  }, [companions, searchQuery, selectedServices, priceMin, priceMax, selectedGender, locationFilter, countryFilter, bodyTypeFilters, ethnicityFilters, ageMin, ageMax, sortBy]);

  // Reset visible count when filters/sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedServices, priceMin, priceMax, selectedGender, locationFilter, countryFilter, bodyTypeFilters, ethnicityFilters, ageMin, ageMax, sortBy]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filtered.length) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filtered.length]);

  const visibleCompanions = filtered.slice(0, visibleCount);

  const toggleService = (s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const activeFilterCount =
    selectedServices.length +
    (selectedGender !== "all" ? 1 : 0) +
    (priceMin > 0 ? 1 : 0) +
    (priceMax < 1000 ? 1 : 0) +
    (locationFilter ? 1 : 0) +
    (countryFilter ? 1 : 0) +
    bodyTypeFilters.length +
    ethnicityFilters.length +
    (ageMin > 18 || ageMax < 65 ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedServices([]);
    setSelectedGender("all");
    setPriceMin(0);
    setPriceMax(1000);
    setLocationFilter("");
    setCountryFilter("");
    setBodyTypeFilters([]);
    setEthnicityFilters([]);
    setAgeMin(18);
    setAgeMax(65);
    setSearchQuery("");
  };

  const toggleBodyType = (b: string) =>
    setBodyTypeFilters((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);
  const toggleEthnicity = (e: string) =>
    setEthnicityFilters((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);

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
    return companions.filter((c) => extractCity(c.location) === userCity).slice(0, 8);
  }, [companions, userCity]);

  const trendingInCity = useMemo(() => {
    if (!userCity) return [];
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
    if (recent.length === 0) {
      return [...companions]
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        .slice(0, 6);
    }
    return recent;
  }, [companions]);

  const isSearching = searchQuery || selectedServices.length > 0 || selectedGender !== "all" || priceMax < 1000 || priceMin > 0 || locationFilter || countryFilter || bodyTypeFilters.length > 0 || ethnicityFilters.length > 0 || ageMin > 18 || ageMax < 65;
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
                placeholder="Search name, city, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground
                           focus:outline-none focus:ring-1 focus:ring-gold/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                ${showFilters ? "gradient-gold text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
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
                {/* Location Filter */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Location</p>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter by city..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full bg-secondary rounded-lg pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground
                                 focus:outline-none focus:ring-1 focus:ring-gold/50"
                    />
                    {locationFilter && (
                      <button onClick={() => setLocationFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {filteredLocations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {filteredLocations.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => setLocationFilter(loc)}
                          className={`px-2 py-1 rounded-lg text-[10px] transition-colors ${
                            locationFilter === loc
                              ? "gradient-gold text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Country */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Country</p>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <select
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      className="w-full bg-secondary rounded-lg pl-9 pr-8 py-2 text-xs text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-gold/50"
                    >
                      <option value="">All countries</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.country}>{c.country}</option>
                      ))}
                    </select>
                    {countryFilter && (
                      <button onClick={() => setCountryFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body Type */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Body Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BODY_TYPES.map((b) => (
                      <button
                        key={b}
                        onClick={() => toggleBodyType(b)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors
                          ${bodyTypeFilters.includes(b) ? "gradient-gold text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ethnicity */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Ethnicity</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ETHNICITIES.map((e) => (
                      <button
                        key={e}
                        onClick={() => toggleEthnicity(e)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors
                          ${ethnicityFilters.includes(e) ? "gradient-gold text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Gender</p>
                  <div className="flex gap-2">
                    {["all", "female", "male", "non-binary"].map((g) => (
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

                {/* Price Range */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                    Price Range: ${priceMin} — ${priceMax === 1000 ? "1000+" : `$${priceMax}`}/hr
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-8">Min</span>
                      <input
                        type="range"
                        min={0} max={500} step={25}
                        value={priceMin}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPriceMin(Math.min(val, priceMax));
                        }}
                        className="w-full accent-gold"
                      />
                      <span className="text-xs text-foreground w-10 text-right">${priceMin}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-8">Max</span>
                      <input
                        type="range"
                        min={0} max={1000} step={25}
                        value={priceMax}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPriceMax(Math.max(val, priceMin));
                        }}
                        className="w-full accent-gold"
                      />
                      <span className="text-xs text-foreground w-10 text-right">${priceMax === 1000 ? "∞" : priceMax}</span>
                    </div>
                  </div>
                </div>

                {/* Age Range */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                    Age: {ageMin} — {ageMax === 65 ? "65+" : ageMax}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-8">Min</span>
                      <input
                        type="range"
                        min={18} max={65} step={1}
                        value={ageMin}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAgeMin(Math.min(val, ageMax));
                        }}
                        className="w-full accent-gold"
                      />
                      <span className="text-xs text-foreground w-10 text-right">{ageMin}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-8">Max</span>
                      <input
                        type="range"
                        min={18} max={65} step={1}
                        value={ageMax}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAgeMax(Math.max(val, ageMin));
                        }}
                        className="w-full accent-gold"
                      />
                      <span className="text-xs text-foreground w-10 text-right">{ageMax === 65 ? "65+" : ageMax}</span>
                    </div>
                  </div>
                </div>

                {/* Clear All */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="w-full text-xs text-destructive hover:text-destructive/80 font-medium py-2 transition-colors"
                  >
                    Clear All Filters ({activeFilterCount})
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {locationFilter && (
              <FilterChip label={`📍 ${locationFilter}`} onRemove={() => setLocationFilter("")} />
            )}
            {countryFilter && (
              <FilterChip label={`🌍 ${countryFilter}`} onRemove={() => setCountryFilter("")} />
            )}
            {bodyTypeFilters.map((b) => (
              <FilterChip key={`bt-${b}`} label={b} onRemove={() => toggleBodyType(b)} />
            ))}
            {ethnicityFilters.map((e) => (
              <FilterChip key={`et-${e}`} label={e} onRemove={() => toggleEthnicity(e)} />
            ))}
            {(ageMin > 18 || ageMax < 65) && (
              <FilterChip
                label={`Age ${ageMin}–${ageMax === 65 ? "65+" : ageMax}`}
                onRemove={() => { setAgeMin(18); setAgeMax(65); }}
              />
            )}
            {selectedGender !== "all" && (
              <FilterChip label={selectedGender} onRemove={() => setSelectedGender("all")} />
            )}
            {selectedServices.map((s) => (
              <FilterChip key={s} label={s} onRemove={() => toggleService(s)} />
            ))}
            {(priceMin > 0 || priceMax < 1000) && (
              <FilterChip
                label={`$${priceMin}–$${priceMax === 1000 ? "∞" : priceMax}`}
                onRemove={() => { setPriceMin(0); setPriceMax(1000); }}
              />
            )}
            <button onClick={clearAllFilters} className="text-[10px] text-destructive hover:underline px-1">
              Clear all
            </button>
          </div>
        )}

        {/* AI Recommendations - only show when not searching */}
        {!isSearching && hasRecommendations && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
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
            {/* Results header with count + sort */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{filtered.length} companions found</p>
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>{SORT_LABELS[sortBy]}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1 z-40 w-44 glass rounded-xl border border-border overflow-hidden shadow-lg"
                    >
                      {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                        <button
                          key={option}
                          onClick={() => { setSortBy(option); setShowSortMenu(false); }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors
                            ${sortBy === option ? "text-gold bg-gold/10 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                        >
                          {SORT_LABELS[option]}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {visibleCompanions.map((c, i) => (
                <CompanionCard key={c.id} companion={c} index={i} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {visibleCount < filtered.length && (
              <div ref={sentinelRef} className="flex justify-center py-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                  Loading more...
                </div>
              </div>
            )}

            {visibleCount >= filtered.length && filtered.length > PAGE_SIZE && (
              <p className="text-center text-[10px] text-muted-foreground py-4">
                You've seen all {filtered.length} companions
              </p>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <p className="text-muted-foreground">No companions match your filters</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="text-sm text-gold hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium capitalize">
    {label}
    <button onClick={onRemove} className="hover:text-destructive transition-colors">
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default DiscoverPage;
