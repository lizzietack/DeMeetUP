import { useState } from "react";
import { ShieldCheck, ShieldBan, Star, Eye, CheckCircle2 } from "lucide-react";
import { useAdminCompanionProfiles, useAdminUpdateProfile, useAdminUpdateCompanion } from "@/hooks/use-admin";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const AdminUserManagement = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const { data: companions, isLoading } = useAdminCompanionProfiles(isAdmin);
  const updateProfile = useAdminUpdateProfile();
  const updateCompanion = useAdminUpdateCompanion();
  const [filter, setFilter] = useState<"all" | "verified" | "unverified" | "flagged">("all");

  const filtered = companions?.filter(c => {
    const p = c.profiles as any;
    if (filter === "verified") return c.verified;
    if (filter === "unverified") return !c.verified;
    if (filter === "flagged") return p?.flagged_for_review;
    return true;
  }) || [];

  const handleVerifyProfile = async (userId: string, profileId: string) => {
    try {
      await Promise.all([
        updateProfile.mutateAsync({ userId, updates: { photo_verified: true, selfie_verified: true, trust_score: 85 } }),
        updateCompanion.mutateAsync({ profileId, updates: { verified: true } }),
      ]);
      toast.success("Profile verified as premium");
    } catch {
      toast.error("Verification failed");
    }
  };

  const handleUnverify = async (userId: string, profileId: string) => {
    try {
      await Promise.all([
        updateProfile.mutateAsync({ userId, updates: { photo_verified: false, selfie_verified: false, trust_score: 0 } }),
        updateCompanion.mutateAsync({ profileId, updates: { verified: false } }),
      ]);
      toast.success("Verification removed");
    } catch {
      toast.error("Failed");
    }
  };

  const handleFlag = async (userId: string, flag: boolean) => {
    try {
      await updateProfile.mutateAsync({ userId, updates: { flagged_for_review: flag } });
      toast.success(flag ? "Account flagged" : "Account unflagged");
    } catch {
      toast.error("Failed");
    }
  };

  const handleToggleVisibility = async (userId: string, visible: boolean) => {
    try {
      await updateProfile.mutateAsync({ userId, updates: { profile_visible: visible } });
      toast.success(visible ? "Profile visible" : "Profile hidden");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "verified", "unverified", "flagged"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No profiles match this filter</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(comp => {
            const p = comp.profiles as any;
            return (
              <div key={comp.id} className="glass rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden shrink-0">
                    {p?.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                        {(p?.display_name || "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground truncate">{p?.display_name || "Unknown"}</p>
                      {comp.verified && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{p?.country || "—"} • Trust: {p?.trust_score || 0}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {comp.services?.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{s}</span>
                      ))}
                      {(comp.services?.length || 0) > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{(comp.services?.length || 0) - 3}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Rate: {comp.hourly_rate || "—"}/hr • Overnight: {comp.overnight_rate || "—"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!comp.verified ? (
                      <button
                        onClick={() => handleVerifyProfile(comp.user_id, comp.id)}
                        disabled={updateProfile.isPending || updateCompanion.isPending}
                        className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3 h-3" /> Verify Premium
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnverify(comp.user_id, comp.id)}
                        disabled={updateProfile.isPending || updateCompanion.isPending}
                        className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                      >
                        <Star className="w-3 h-3" /> Remove Verified
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleVisibility(comp.user_id, !(p?.profile_visible ?? true))}
                      disabled={updateProfile.isPending}
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      <Eye className="w-3 h-3" /> {(p?.profile_visible ?? true) ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => handleFlag(comp.user_id, !(p?.flagged_for_review))}
                      disabled={updateProfile.isPending}
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors disabled:opacity-50"
                    >
                      <ShieldBan className="w-3 h-3" /> {p?.flagged_for_review ? "Unflag" : "Flag"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
