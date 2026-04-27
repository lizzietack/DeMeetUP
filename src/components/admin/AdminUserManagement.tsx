import { useState } from "react";
import { ShieldCheck, ShieldBan, Star, Eye, CheckCircle2, Trash2, User } from "lucide-react";
import AdminInvitesPanel from "./AdminInvitesPanel";
import {
  useAdminCompanionProfiles,
  useAdminUpdateProfile,
  useAdminUpdateCompanion,
  useAdminDeleteCompanion,
  useAdminGuestProfiles,
  useAdminDeleteGuest,
} from "@/hooks/use-admin";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminUserManagement = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const [section, setSection] = useState<"companions" | "guests" | "invites">("companions");
  const { data: companions, isLoading } = useAdminCompanionProfiles(isAdmin);
  const updateProfile = useAdminUpdateProfile();
  const updateCompanion = useAdminUpdateCompanion();
  const deleteCompanion = useAdminDeleteCompanion();
  const { data: guests, isLoading: guestsLoading } = useAdminGuestProfiles(isAdmin && section === "guests");
  const deleteGuest = useAdminDeleteGuest();
  const [filter, setFilter] = useState<"all" | "verified" | "unverified" | "flagged">("all");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmDeleteGuest, setConfirmDeleteGuest] = useState<{ userId: string; name: string } | null>(null);

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

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteCompanion.mutateAsync({ profileId: confirmDelete.id });
      toast.success(`Removed ${confirmDelete.name}'s companion profile`);
      setConfirmDelete(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete profile");
    }
  };

  const handleDeleteGuest = async () => {
    if (!confirmDeleteGuest) return;
    try {
      await deleteGuest.mutateAsync({ userId: confirmDeleteGuest.userId });
      toast.success(`Removed ${confirmDeleteGuest.name}'s account`);
      setConfirmDeleteGuest(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete guest");
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(["companions", "guests", "invites"] as const).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              section === s ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"
            }`}
          >
            {s === "companions" ? "Companions" : s === "guests" ? "Guests" : "Invitations"}
          </button>
        ))}
      </div>

      {section === "invites" && <AdminInvitesPanel isAdmin={isAdmin} />}

      {section === "companions" && (
      <>
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
                    <button
                      onClick={() => setConfirmDelete({ id: comp.id, name: p?.display_name || "Unknown" })}
                      disabled={deleteCompanion.isPending}
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete companion profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{confirmDelete?.name}</strong>'s companion profile
              and gallery images. The user account stays, but they'll need to re-onboard as a companion.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCompanion.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCompanion.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCompanion.isPending ? "Deleting…" : "Delete profile"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
      )}

      {section === "guests" && (
        <div>
          {guestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : (guests || []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No guest accounts found</div>
          ) : (
            <div className="space-y-3">
              {(guests || []).map((g: any) => (
                <div key={g.id} className="glass rounded-xl p-4 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden shrink-0">
                    {g.avatar_url ? (
                      <img src={g.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {g.display_name || "Unnamed guest"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {g.location || g.country || "—"} • Joined {new Date(g.created_at).toLocaleDateString()}
                    </p>
                    {g.flagged_for_review && (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
                        Flagged
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setConfirmDeleteGuest({ userId: g.user_id, name: g.display_name || "Unnamed guest" })}
                    disabled={deleteGuest.isPending}
                    className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          <AlertDialog open={!!confirmDeleteGuest} onOpenChange={(o) => !o && setConfirmDeleteGuest(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete guest account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove <strong>{confirmDeleteGuest?.name}</strong>'s profile from the platform.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteGuest.isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteGuest}
                  disabled={deleteGuest.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteGuest.isPending ? "Deleting…" : "Delete guest"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
