import { useState } from "react";
import { CheckCircle2, XCircle, Filter } from "lucide-react";
import { useAdminImages, useAdminUpdateImage } from "@/hooks/use-image-moderation";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminImageReview = () => {
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const { data: images, isLoading } = useAdminImages(statusFilter);
  const updateImage = useAdminUpdateImage();

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

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["pending_review", "approved", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
        </div>
      ) : images?.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No images with this status</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images?.map((img) => (
            <motion.div key={img.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl overflow-hidden">
              <div className="aspect-[3/4] relative">
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  img.status === "approved" ? "bg-emerald-500/80 text-white" :
                  img.status === "rejected" ? "bg-destructive/80 text-white" :
                  "bg-amber-500/80 text-white"
                }`}>
                  {String(img.status).replace("_", " ")}
                </span>
              </div>
              <div className="p-2.5 space-y-1.5">
                <p className="text-[10px] text-muted-foreground">
                  {img.image_type} • {new Date(img.created_at).toLocaleDateString()}
                </p>
                {img.ai_analysis && typeof img.ai_analysis === 'object' && (
                  <div className="text-[10px] text-muted-foreground">
                    {(img.ai_analysis as any).nsfw_score !== undefined && <span>NSFW: {(img.ai_analysis as any).nsfw_score}/100 </span>}
                    {(img.ai_analysis as any).quality_score !== undefined && <span>Quality: {(img.ai_analysis as any).quality_score}/100</span>}
                  </div>
                )}
                {img.rejection_reason && <p className="text-[10px] text-destructive">{img.rejection_reason}</p>}
                {img.status === "pending_review" && (
                  <div className="flex gap-1.5">
                    <button onClick={() => handleApprove(img.id)} disabled={updateImage.isPending}
                      className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                    <button onClick={() => handleReject(img.id)} disabled={updateImage.isPending}
                      className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors disabled:opacity-50">
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminImageReview;
