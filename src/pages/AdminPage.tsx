import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image, Users, CheckCircle2, XCircle, Clock, Eye, ShieldBan, Filter } from "lucide-react";
import { useAdminImages, useAdminUpdateImage } from "@/hooks/use-image-moderation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"images" | "users">("images");
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const { data: images, isLoading } = useAdminImages(statusFilter);
  const updateImage = useAdminUpdateImage();
  const [flaggedProfiles, setFlaggedProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const loadFlaggedProfiles = async () => {
    setLoadingProfiles(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("flagged_for_review", true)
      .order("created_at", { ascending: false });
    setFlaggedProfiles(data || []);
    setLoadingProfiles(false);
  };

  const handleApprove = async (id: string) => {
    try {
      await updateImage.mutateAsync({ moderationId: id, status: "approved" });
      toast.success("Image approved");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await updateImage.mutateAsync({ moderationId: id, status: "rejected", rejectionReason: reason });
      toast.success("Image rejected");
    } catch {
      toast.error("Failed to reject");
    }
  };

  const handleSuspend = async (userId: string) => {
    // Flag for review (suspension placeholder)
    await supabase.from("profiles").update({ flagged_for_review: true }).eq("user_id", userId);
    toast.success("Account flagged for suspension");
    loadFlaggedProfiles();
  };

  const handleUnflag = async (userId: string) => {
    await supabase.from("profiles").update({ flagged_for_review: false }).eq("user_id", userId);
    toast.success("Account unflagged");
    loadFlaggedProfiles();
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-strong sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Admin Panel</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("images")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === "images" ? "gradient-gold text-primary-foreground" : "glass"
            }`}
          >
            <Image className="w-4 h-4" /> Image Review
          </button>
          <button
            onClick={() => { setTab("users"); loadFlaggedProfiles(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === "users" ? "gradient-gold text-primary-foreground" : "glass"
            }`}
          >
            <Users className="w-4 h-4" /> Flagged Users
          </button>
        </div>

        {tab === "images" && (
          <>
            {/* Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {["pending_review", "approved", "rejected", "all"].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                ))}
              </div>
            ) : images?.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No images with this status</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images?.map((img) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass rounded-xl overflow-hidden"
                  >
                    <div className="aspect-[3/4] relative">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          img.status === "approved" ? "bg-emerald-500/80 text-white" :
                          img.status === "rejected" ? "bg-destructive/80 text-white" :
                          "bg-amber-500/80 text-white"
                        }`}>
                          {String(img.status).replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Type: {img.image_type} • {new Date(img.created_at).toLocaleDateString()}
                      </p>
                      {img.ai_analysis && typeof img.ai_analysis === 'object' && (
                        <div className="text-[10px] text-muted-foreground space-y-0.5">
                          {(img.ai_analysis as any).face_detected !== undefined && (
                            <p>Face: {(img.ai_analysis as any).face_detected ? "✓" : "✗"}</p>
                          )}
                          {(img.ai_analysis as any).nsfw_score !== undefined && (
                            <p>NSFW: {(img.ai_analysis as any).nsfw_score}/100</p>
                          )}
                          {(img.ai_analysis as any).quality_score !== undefined && (
                            <p>Quality: {(img.ai_analysis as any).quality_score}/100</p>
                          )}
                        </div>
                      )}
                      {img.rejection_reason && (
                        <p className="text-[10px] text-destructive">{img.rejection_reason}</p>
                      )}
                      {img.status === "pending_review" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(img.id)}
                            disabled={updateImage.isPending}
                            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(img.id)}
                            disabled={updateImage.isPending}
                            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "users" && (
          <>
            {loadingProfiles ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : flaggedProfiles.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No flagged users</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flaggedProfiles.map((p) => (
                  <div key={p.id} className="glass rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                          {(p.display_name || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{p.display_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{p.role} • Trust: {p.trust_score}</p>
                      <div className="flex gap-1 mt-1">
                        {p.photo_verified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Photo ✓</span>}
                        {!p.photo_verified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">No Photo</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUnflag(p.user_id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      >
                        Unflag
                      </button>
                      <button
                        onClick={() => handleSuspend(p.user_id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                      >
                        <ShieldBan className="w-3 h-3 inline mr-1" /> Suspend
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
