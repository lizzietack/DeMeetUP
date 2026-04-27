import { useMemo, useState } from "react";
import { Search, Shield, User as UserIcon, Sparkles, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAllProfiles, useAdminDeleteUser } from "@/hooks/use-admin";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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

type RoleFilter = "all" | "guest" | "companion" | "admin" | "flagged";

const AdminAllUsersPanel = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const { data: users, isLoading } = useAdminAllProfiles(isAdmin);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const deleteUser = useAdminDeleteUser();
  const { user } = useAuth();
  const [confirm, setConfirm] = useState<{ userId: string; name: string } | null>(null);

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      await deleteUser.mutateAsync({ userId: confirm.userId });
      toast.success(`Removed ${confirm.name}`);
      setConfirm(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete user");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users || []).filter((u: any) => {
      if (filter === "admin" && !u.is_admin) return false;
      if (filter === "guest" && u.role !== "guest") return false;
      if (filter === "companion" && u.role !== "companion") return false;
      if (filter === "flagged" && !u.flagged_for_review) return false;
      if (!q) return true;
      return (
        (u.display_name || "").toLowerCase().includes(q) ||
        (u.location || "").toLowerCase().includes(q) ||
        (u.country || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    });
  }, [users, query, filter]);

  const counts = useMemo(() => {
    const arr = users || [];
    return {
      total: arr.length,
      guests: arr.filter((u: any) => u.role === "guest").length,
      companions: arr.filter((u: any) => u.role === "companion").length,
      admins: arr.filter((u: any) => u.is_admin).length,
    };
  }, [users]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Total" value={counts.total} />
        <Stat label="Guests" value={counts.guests} />
        <Stat label="Companions" value={counts.companions} />
        <Stat label="Admins" value={counts.admins} />
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search name, location, phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "guest", "companion", "admin", "flagged"] as const).map((f) => (
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
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No users match</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u: any) => (
            <div key={u.id} className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {u.display_name || "Unnamed"}
                  </p>
                  {u.is_admin && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                  {u.role === "companion" && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      <Sparkles className="w-3 h-3" /> Companion
                    </span>
                  )}
                  {u.role === "guest" && !u.is_admin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                      Guest
                    </span>
                  )}
                  {u.flagged_for_review && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
                      Flagged
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {u.location || u.country || "—"}
                  {u.phone ? ` • ${u.phone}` : ""} • Joined{" "}
                  {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
              {user?.id !== u.user_id && (
                <button
                  onClick={() => setConfirm({ userId: u.user_id, name: u.display_name || "this user" })}
                  disabled={deleteUser.isPending}
                  className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 shrink-0"
                  title="Delete user"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{confirm?.name}</strong>'s account, profile,
              companion data, messages-related rows, and login from the platform. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? "Deleting…" : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="glass rounded-xl px-3 py-2">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-lg font-bold text-foreground">{value}</p>
  </div>
);

export default AdminAllUsersPanel;