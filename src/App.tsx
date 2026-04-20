import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
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
import OnboardingPage from "./pages/OnboardingPage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import NotificationPreferencesPage from "./pages/NotificationPreferencesPage.tsx";
import BottomNav from "./components/BottomNav.tsx";
import PWAInstallBanner from "./components/PWAInstallBanner.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const GuestOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return <Navigate to="/discover" replace />;
  return <>{children}</>;
};

const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile && !profile.profile_completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { user } = useAuth();
  const hideNav = location.pathname.startsWith("/chat/") ||
    location.pathname.startsWith("/book/") ||
    ["/login", "/register", "/select-role", "/companion-setup", "/forgot-password", "/reset-password", "/profile", "/saved-companions", "/safety-privacy", "/settings", "/notification-preferences", "/onboarding", "/admin"].includes(location.pathname);

  return (
    <>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<GuestOnlyRoute><LoginPage /></GuestOnlyRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<GuestOnlyRoute><RegisterPage /></GuestOnlyRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/select-role" element={<ProtectedRoute><SelectRolePage /></ProtectedRoute>} />
        <Route path="/companion-setup" element={<ProtectedRoute><CompanionSetupPage /></ProtectedRoute>} />
        <Route path="/discover" element={<OnboardingGuard><DiscoverPage /></OnboardingGuard>} />
        <Route path="/featured" element={<OnboardingGuard><FeaturedPage /></OnboardingGuard>} />
        <Route path="/companion/:id" element={<OnboardingGuard><CompanionProfilePage /></OnboardingGuard>} />
        <Route path="/chat" element={<OnboardingGuard><ChatListPage /></OnboardingGuard>} />
        <Route path="/chat/:id" element={<OnboardingGuard><ChatPage /></OnboardingGuard>} />
        <Route path="/book/:id" element={<OnboardingGuard><BookingPage /></OnboardingGuard>} />
        <Route path="/dashboard" element={<OnboardingGuard><DashboardPage /></OnboardingGuard>} />
        <Route path="/profile" element={<OnboardingGuard><ProfilePage /></OnboardingGuard>} />
        <Route path="/saved-companions" element={<OnboardingGuard><SavedCompanionsPage /></OnboardingGuard>} />
        <Route path="/safety-privacy" element={<OnboardingGuard><SafetyPrivacyPage /></OnboardingGuard>} />
        <Route path="/settings" element={<OnboardingGuard><SettingsPage /></OnboardingGuard>} />
        <Route path="/notification-preferences" element={<OnboardingGuard><NotificationPreferencesPage /></OnboardingGuard>} />
        <Route path="/admin" element={<OnboardingGuard><AdminPage /></OnboardingGuard>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideNav && <BottomNav />}
      <PWAInstallBanner />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
