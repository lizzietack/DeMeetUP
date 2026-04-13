import { Clock, CheckCircle2, XCircle } from "lucide-react";

interface ImageStatusBadgeProps {
  status: string;
  rejectionReason?: string | null;
}

const ImageStatusBadge = ({ status, rejectionReason }: ImageStatusBadgeProps) => {
  switch (status) {
    case "approved":
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span className="text-[10px] font-medium">Approved</span>
        </div>
      );
    case "rejected":
      return (
        <div className="group relative">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/20 text-destructive">
            <XCircle className="w-3 h-3" />
            <span className="text-[10px] font-medium">Rejected</span>
          </div>
          {rejectionReason && (
            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50 max-w-[200px]">
              <div className="bg-popover text-popover-foreground text-xs p-2 rounded-lg shadow-lg border border-border">
                {rejectionReason}
              </div>
            </div>
          )}
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">
          <Clock className="w-3 h-3" />
          <span className="text-[10px] font-medium">Under Review</span>
        </div>
      );
  }
};

export default ImageStatusBadge;
