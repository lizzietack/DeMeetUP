import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, Download } from "lucide-react";
import { useState, useCallback } from "react";

interface ImageLightboxProps {
  src: string | null;
  onClose: () => void;
}

const ImageLightbox = ({ src, onClose }: ImageLightboxProps) => {
  const [scale, setScale] = useState(1);

  const zoomIn = useCallback(() => setScale((s) => Math.min(s + 0.5, 4)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - 0.5, 0.5)), []);

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = `image-${Date.now()}.jpg`;
    a.target = "_blank";
    a.click();
  };

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={onClose}
        >
          {/* Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); zoomOut(); }}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ZoomOut className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); zoomIn(); }}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Image */}
          <motion.img
            src={src}
            alt="Full size preview"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg select-none"
            style={{ scale }}
            animate={{ scale }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
