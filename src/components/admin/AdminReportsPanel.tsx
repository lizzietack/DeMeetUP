import { useState } from "react";
import { useAdminReports, useAdminUpdateReport, useAdminUpdateProfile } from "@/hooks/use-admin";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, XCircle, ShieldBan } from "lucide-react";
import { toast } from "sonner";

const AdminReportsPanel = () => {
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data: reports, isLoading } = useAdminReports(statusFilter);
  const updateReport = useAdminUpdateReport();
  const updateProfile = useAdminUpdateProfile();

  const handleResolve = async (reportId: string) => {
    try {
      await updateReport.mutateAsync({ reportId, status: "resolved" });
      toast.success("Report resolved");
    } catch {
      toast.error("Failed");
    }
  };

  const handleReview = async (reportId: string) => {
    try {
      await updateReport.mutateAsync({ reportId, status: "reviewed" });
      toast.success("Marked as reviewed");
    } catch {
      toast.error("Failed");
    }
  };

  const handleSuspendUser = async (userId: string, reportId: string) => {
    try {
      await Promise.all([
        updateProfile.mutateAsync({ userId, updates: { flagged_for_review: true, profile_visible: false } }),
        updateReport.mutateAsync({ reportId, status: "resolved" }),
      ]);
      toast.success("User suspended and report resolved");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["pending", "reviewed", "resolved", "all"].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
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
      ) : reports?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No reports with this status
        </div>
      ) : (
        <div className="space-y-3">
          {reports?.map((report: any) => (
            <div key={report.id} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      report.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                      report.status === "reviewed" ? "bg-blue-500/20 text-blue-400" :
                      "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">
                      {report.reason}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-foreground font-medium">{report.reporter_profile?.display_name || "Unknown"}</span>
                    {" → "}
                    <span className="text-foreground font-medium">{report.reported_profile?.display_name || "Unknown"}</span>
                  </p>
                  {report.details && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.details}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(report.created_at).toLocaleDateString()}</p>
                </div>
                {report.status === "pending" && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => handleReview(report.id)} disabled={updateReport.isPending}
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50">
                      <CheckCircle2 className="w-3 h-3" /> Review
                    </button>
                    <button onClick={() => handleResolve(report.id)} disabled={updateReport.isPending}
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                      <XCircle className="w-3 h-3" /> Resolve
                    </button>
                    <button onClick={() => handleSuspendUser(report.reported_user_id, report.id)} disabled={updateReport.isPending || updateProfile.isPending}
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors disabled:opacity-50">
                      <ShieldBan className="w-3 h-3" /> Suspend
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReportsPanel;
