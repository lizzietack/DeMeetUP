import { BadgeCheck, Camera, Shield, Star } from "lucide-react";

interface VerificationBadgesProps {
  photoVerified?: boolean;
  selfieVerified?: boolean;
  isFullyVerified?: boolean;
  compact?: boolean;
}

const VerificationBadges = ({ photoVerified, selfieVerified, isFullyVerified, compact }: VerificationBadgesProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {photoVerified && (
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center" title="Photo Verified">
            <Camera className="w-3 h-3 text-emerald-400" />
          </div>
        )}
        {selfieVerified && (
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center" title="Selfie Verified">
            <BadgeCheck className="w-3 h-3 text-blue-400" />
          </div>
        )}
        {isFullyVerified && (
          <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center" title="Fully Verified">
            <Star className="w-3 h-3 text-gold" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {photoVerified && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">Photo Verified</span>
        </div>
      )}
      {selfieVerified && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
          <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-medium text-blue-400">Selfie Verified</span>
        </div>
      )}
      {isFullyVerified && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20">
          <Shield className="w-3.5 h-3.5 text-gold" />
          <span className="text-xs font-medium text-gold">Fully Verified</span>
        </div>
      )}
      {!photoVerified && !selfieVerified && !isFullyVerified && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border">
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Not Verified</span>
        </div>
      )}
    </div>
  );
};

export default VerificationBadges;
