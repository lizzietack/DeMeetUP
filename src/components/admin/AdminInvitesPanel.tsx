import { useState } from "react";
import { Mail, Send, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminInvitations,
  useAdminInviteUser,
  useAdminRevokeInvitation,
} from "@/hooks/use-admin";

const AdminInvitesPanel = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const { data: invites, isLoading } = useAdminInvitations(isAdmin);
  const invite = useAdminInviteUser();
  const revoke = useAdminRevokeInvitation();

  const [email, setEmail] = useState("");
  const [platformRole, setPlatformRole] = useState<"guest" | "companion">("guest");
  const [grantAdmin, setGrantAdmin] = useState(false);

  const send = async () => {
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      toast.error("Enter a valid email");
      return;
    }
    try {
      const res: any = await invite.mutateAsync({ email: v, platform_role: platformRole, grant_admin: grantAdmin });
      if (res?.warning) {
        toast.warning(res.warning);
      } else {
        toast.success(`Invitation sent to ${v}`);
      }
      setEmail("");
      setGrantAdmin(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to send invite");
    }
  };

  return (
    <div className="space-y-5">
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" /> Invite a new user
        </h3>
        <input
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
        />
        <div className="flex gap-2 flex-wrap">
          {(["guest", "companion"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setPlatformRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                platformRole === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {r === "guest" ? "Guest" : "Companion"}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={grantAdmin}
              onChange={(e) => setGrantAdmin(e.target.checked)}
              className="accent-primary"
            />
            <ShieldCheck className="w-3.5 h-3.5" /> Also grant admin
          </label>
        </div>
        <button
          onClick={send}
          disabled={invite.isPending}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> {invite.isPending ? "Sending…" : "Send invitation"}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Recent invitations</h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (invites || []).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No invitations yet</div>
        ) : (
          <div className="space-y-2">
            {(invites || []).map((inv: any) => (
              <div key={inv.id} className="glass rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{inv.email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {inv.platform_role}
                    {inv.grant_admin ? " + admin" : ""} •{" "}
                    <span
                      className={
                        inv.status === "accepted"
                          ? "text-emerald-400"
                          : inv.status === "revoked"
                          ? "text-muted-foreground"
                          : "text-amber-400"
                      }
                    >
                      {inv.status}
                    </span>{" "}
                    • {new Date(inv.created_at).toLocaleDateString()}
                  </p>
                </div>
                {inv.status === "pending" && (
                  <button
                    onClick={() => revoke.mutate({ id: inv.id })}
                    disabled={revoke.isPending}
                    className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" /> Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvitesPanel;