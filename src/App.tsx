import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import DiscoverPage from "./pages/DiscoverPage.tsx";
import CompanionProfilePage from "./pages/CompanionProfilePage.tsx";
import ChatListPage from "./pages/ChatListPage.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import BookingPage from "./pages/BookingPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import FeaturedPage from "./pages/FeaturedPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import SelectRolePage from "./pages/SelectRolePage.tsx";
import CompanionSetupPage from "./pages/CompanionSetupPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import SavedCompanionsPage from "./pages/SavedCompanionsPage.tsx";
import SafetyPrivacyPage from "./pages/SafetyPrivacyPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import BottomNav from "./components/BottomNav.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { user } = useAuth();
  const hideNav = location.pathname.startsWith("/chat/") ||
    location.pathname.startsWith("/book/") ||
    ["/login", "/register", "/select-role", "/companion-setup", "/forgot-password", "/reset-password", "/profile", "/saved-companions", "/safety-privacy", "/settings"].includes(location.pathname);

  return (
    <>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/select-role" element={<ProtectedRoute><SelectRolePage /></ProtectedRoute>} />
        <Route path="/companion-setup" element={<ProtectedRoute><CompanionSetupPage /></ProtectedRoute>} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/featured" element={<FeaturedPage />} />
        <Route path="/companion/:id" element={<CompanionProfilePage />} />
        <Route path="/chat" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/book/:id" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/saved-companions" element={<ProtectedRoute><SavedCompanionsPage /></ProtectedRoute>} />
        <Route path="/safety-privacy" element={<ProtectedRoute><SafetyPrivacyPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
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
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
