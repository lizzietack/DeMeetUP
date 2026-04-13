import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BadgeCheck, Star, MapPin, Heart, Share2, MessageCircle, Calendar, DollarSign, ShieldBan, MoreVertical, Flag } from "lucide-react";
import { useCompanion } from "@/hooks/use-companions";
import { useStartConversation } from "@/hooks/use-chat";
import { useTrackInteraction } from "@/hooks/use-recommendations";
import { useBlockUser, useBlockedUsers } from "@/hooks/use-blocked-users";
import { useSavedCompanionIds, useToggleSaveCompanion } from "@/hooks/use-saved-companions";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ReportUserModal from "@/components/ReportUserModal";

const CompanionProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: companion, isLoading } = useCompanion(id);
  const { user } = useAuth();
  const startConversation = useStartConversation();
  const { trackView, trackLike } = useTrackInteraction();
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const savedIds = useSavedCompanionIds();
  const toggleSave = useToggleSaveCompanion();
  const isSaved = id ? savedIds.has(id) : false;
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const blockUser = useBlockUser();
  const { data: blockedUsers = [] } = useBlockedUsers();

  const isBlocked = companion?.userId ? blockedUsers.some((b) => b.blocked_id === companion.userId) : false;

  const handleBlock = async () => {
    if (!user) { navigate("/login"); return; }
    if (!companion?.userId) return;
    try {
      await blockUser.mutateAsync(companion.userId);
      toast.success(`${companion.name} has been blocked`);
      setShowMenu(false);
    } catch {
      toast.error("Failed to block user");
    }
  };

  // Track profile view
  useEffect(() => {
    if (companion?.id) {
      trackView(companion.id);
    }
  }, [companion?.id, trackView]);

  const handleMessage = async () => {
    if (!user) { navigate("/login"); return; }
    if (!companion?.userId) { toast.error("Cannot message this companion"); return; }
    try {
      const conversationId = await startConversation.mutateAsync(companion.userId);
      navigate(`/chat/${conversationId}`);
    } catch (e) {
      toast.error("Failed to start conversation");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="h-[65vh] bg-secondary shimmer" />
        <div className="max-w-lg mx-auto px-4 -mt-16 relative z-10 space-y-4">
          <div className="glass-strong rounded-2xl p-5 space-y-4">
            <div className="h-8 bg-secondary rounded shimmer w-1/2" />
            <div className="h-4 bg-secondary rounded shimmer w-3/4" />
            <div className="h-20 bg-secondary rounded shimmer" />
          </div>
        </div>
      </div>
    );
  }

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
            <button onClick={() => {
              if (!user) { navigate("/login"); return; }
              if (!id) return;
              toggleSave.mutate({ companionProfileId: id, isSaved });
              if (!isSaved && companion?.id) trackLike(companion.id);
            }} className="w-10 h-10 glass rounded-full flex items-center justify-center">
              <Heart className={`w-5 h-5 ${isSaved ? "fill-destructive text-destructive" : "text-foreground"}`} />
            </button>
            <button className="w-10 h-10 glass rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 glass rounded-full flex items-center justify-center">
                <MoreVertical className="w-5 h-5 text-foreground" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 top-12 glass-strong rounded-xl overflow-hidden min-w-[160px] z-50"
                  >
                    <button
                      onClick={handleBlock}
                      disabled={blockUser.isPending || isBlocked}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <ShieldBan className="w-4 h-4" />
                      {isBlocked ? "Already Blocked" : "Block User"}
                    </button>
                    <button
                      onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-secondary/50 transition-colors border-t border-border/30"
                    >
                      <Flag className="w-4 h-4" />
                      Report User
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                <h1 className="font-display text-2xl font-bold text-foreground">{companion.name}</h1>
                {companion.verified && <BadgeCheck className="w-5 h-5 text-gold" />}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{companion.location}</span>
              </div>
            </div>
            {companion.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="font-display font-semibold text-foreground">{companion.rating}</span>
                <span className="text-xs text-muted-foreground">({companion.reviewCount})</span>
              </div>
            )}
          </div>

          {companion.bio && (
            <p className="text-muted-foreground text-sm leading-relaxed">{companion.bio}</p>
          )}

          {/* Services */}
          {companion.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {companion.services.map((s) => (
                <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border">
                  {s}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pricing */}
        {(companion.hourlyRate > 0 || companion.overnightRate > 0) && (
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
              {companion.hourlyRate > 0 && (
                <div className="bg-secondary rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Hourly</p>
                  <p className="font-display text-xl font-bold text-gold">${companion.hourlyRate}</p>
                </div>
              )}
              {companion.overnightRate > 0 && (
                <div className="bg-secondary rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Overnight</p>
                  <p className="font-display text-xl font-bold text-gold">${companion.overnightRate}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/50 p-4 z-40">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={handleMessage}
            disabled={startConversation.isPending}
            className="flex-1 bg-secondary text-foreground font-display font-semibold py-3 rounded-xl
                       flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4" /> {startConversation.isPending ? "..." : "Message"}
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
