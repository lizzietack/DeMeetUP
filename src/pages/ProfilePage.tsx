import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Edit, User, Calendar, Image, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useImageModeration } from "@/hooks/use-image-moderation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import VerificationBadges from "@/components/VerificationBadges";
import ImageStatusBadge from "@/components/ImageStatusBadge";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile, user, loading } = useAuth();
  const { data: moderatedImages } = useImageModeration();

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <header className="glass-strong sticky top-0 z-10 safe-top">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const isFullyVerified = profile?.photo_verified && profile?.selfie_verified;

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-strong sticky top-0 z-10 safe-top">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">My Profile</h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 pt-6 space-y-5"
      >
        {/* Avatar & Name */}
        <div className="flex flex-col items-center gap-3">
          <Avatar className="w-24 h-24 border-2 border-primary/30">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-secondary text-foreground text-2xl font-display">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-foreground">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <VerificationBadges
            photoVerified={profile?.photo_verified}
            selfieVerified={profile?.selfie_verified}
            isFullyVerified={isFullyVerified}
          />
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          <InfoRow icon={<User className="w-4 h-4" />} label="Role" value={profile?.role === "companion" ? "Companion" : "Guest"} />
          <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value={profile?.location || "Not set"} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Member since" value={user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"} />
        </div>

        {/* Bio */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bio</h3>
          <p className="text-sm text-foreground leading-relaxed">
            {profile?.bio || "No bio added yet."}
          </p>
        </div>

        {/* My Images */}
        {moderatedImages && moderatedImages.length > 0 && (
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-4 h-4 text-gold" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Images</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {moderatedImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0.5 left-0.5">
                    <ImageStatusBadge status={img.status as string} rejectionReason={img.rejection_reason} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust Score */}
        {profile?.trust_score !== undefined && (
          <div className="glass rounded-xl p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trust Score</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full gradient-gold rounded-full transition-all"
                  style={{ width: `${Math.min(profile.trust_score, 100)}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gold">{profile.trust_score}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => navigate("/onboarding")}
            className="flex-1 gradient-gold text-primary-foreground font-semibold rounded-xl h-12"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
          <Button
            onClick={() => navigate("/settings")}
            variant="outline"
            className="rounded-xl h-12"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="glass rounded-xl p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
      {icon}
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

export default ProfilePage;
