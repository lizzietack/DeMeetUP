import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import DiscoverPage from "./pages/DiscoverPage.tsx";
import CompanionProfilePage from "./pages/CompanionProfilePage.tsx";
import ChatListPage from "./pages/ChatListPage.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import BookingPage from "./pages/BookingPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import FeaturedPage from "./pages/FeaturedPage.tsx";
import BottomNav from "./components/BottomNav.tsx";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const hideNav = location.pathname.startsWith("/chat/") || location.pathname.startsWith("/book/");

  return (
    <>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/featured" element={<FeaturedPage />} />
        <Route path="/companion/:id" element={<CompanionProfilePage />} />
        <Route path="/chat" element={<ChatListPage />} />
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path="/book/:id" element={<BookingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
