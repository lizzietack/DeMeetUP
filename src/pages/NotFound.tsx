import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--gradient-dark)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm"
      >
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-9 h-9 text-muted-foreground" />
        </div>
        <h1 className="font-display text-5xl font-bold text-foreground mb-3">404</h1>
        <p className="text-muted-foreground mb-8">This page could not be found</p>
        <Button
          onClick={() => navigate("/")}
          className="gradient-gold text-primary-foreground font-semibold rounded-xl px-8 h-12"
        >
          <Home className="w-4 h-4 mr-2" /> Return Home
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
