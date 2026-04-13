import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Edit, BadgeCheck, User, Calendar, Venus, Mars } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { profile, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <header className="glass-strong sticky top-0 z-10">
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

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-strong sticky top-0 z-10">
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
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-display text-xl font-bold text-foreground">{displayName}</h2>
              {profile?.role === "companion" && <BadgeCheck className="w-5 h-5 text-primary" />}
            </div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
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

        {/* Verification */}
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profile?.role === "companion" ? "bg-primary/10" : "bg-secondary"}`}>
            <BadgeCheck className={`w-5 h-5 ${profile?.role === "companion" ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Verification Status</p>
            <p className="text-xs text-muted-foreground">
              {profile?.role === "companion" ? "Verified companion" : "Standard account"}
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate("/dashboard")}
          className="w-full gradient-gold text-primary-foreground font-semibold rounded-xl h-12"
        >
          <Edit className="w-4 h-4 mr-2" /> Edit Profile
        </Button>
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
