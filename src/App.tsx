import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import MessageNotification from "@/components/MessageNotification";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import GlobalCursor from "@/components/GlobalCursor";
import Index from "./pages/Index";
import Services from "./pages/Services";
import BrowseJobs from "./pages/BrowseJobs";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProviderProfile from "./pages/ProviderProfile";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderProfileUpdate from "./pages/ProviderProfileUpdate";
import ProviderRouteGuard from "./components/ProviderRouteGuard";
import WorkerDashboard from "./pages/WorkerDashboard";
import WorkerRouteGuard from "./components/WorkerRouteGuard";
import ChooseRole from "./pages/ChooseRole";
import Login from "./pages/Login";
import UserRegister from "./pages/UserRegister";
import UserRouteGuard from "./components/UserRouteGuard";
import RequesterDashboard from "./pages/RequesterDashboard";
import RequesterRouteGuard from "./components/RequesterRouteGuard";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import CreateLiveRequest from "./pages/CreateLiveRequest";
import UserUrgentRequests from "./pages/UserUrgentRequests";
import ProviderNotifications from "./pages/ProviderNotifications";
import TestLocationAutocomplete from "./pages/TestLocationAutocomplete";
import EmailVerificationSuccess from "./pages/EmailVerificationSuccess";

const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

function AnimatedRoutes() {
  const location = useLocation();
  
  // Handle email verification redirects
  useEffect(() => {
    const handleEmailVerification = async () => {
      // Check for email confirmation parameters in URL
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      const type = urlParams.get('type') || hashParams.get('type');
      
      if (accessToken && refreshToken && type === 'signup') {
        try {
          // Set the session with the tokens from email verification
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
            // Redirect to login page even if there's an error
            window.location.href = '/login';
            return;
          }
          
          if (data.session) {
            // Get user role to redirect appropriately
            const { data: userProfile } = await supabase
              .from('users')
              .select('role')
              .eq('id', data.session.user.id)
              .single();
            
            // Update the user's updated_at in the database
            const { error: updateError } = await supabase
              .from('users')
              .update({ 
                updated_at: new Date().toISOString()
              })
              .eq('id', data.session.user.id);
            
            if (updateError) {
              console.error('Error updating email confirmation:', updateError);
            }
            
            // Redirect to success page with role parameter
            const roleParam = userProfile?.role || 'requester';
            window.location.href = `/email-verification-success?role=${roleParam}`;
          }
        } catch (error) {
          console.error('Error handling email verification:', error);
          // Redirect to login page even if there's an error
          window.location.href = '/login';
        }
      }
    };
    
    handleEmailVerification();
  }, [location]);
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<Services />} />
          <Route path="/browse-jobs" element={<BrowseJobs />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Auth Routes */}
          <Route path="/choose-role" element={<ChooseRole />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<UserRegister />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-verification-success" element={<EmailVerificationSuccess />} />
          
          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
          
          {/* Worker Routes */}
          <Route 
            path="/worker-dashboard" 
            element={
              <WorkerRouteGuard>
                <WorkerDashboard />
              </WorkerRouteGuard>
            } 
          />
          
          {/* Requester Routes */}
          <Route 
            path="/requester-dashboard" 
            element={
              <RequesterRouteGuard>
                <RequesterDashboard />
              </RequesterRouteGuard>
            } 
          />
          
          {/* Legacy Routes (for backward compatibility - redirect to new routes) */}
          <Route path="/provider/:id" element={<ProviderProfile />} />
          <Route path="/provider-login" element={<Login />} /> {/* Redirects to unified login */}
          <Route 
            path="/provider-dashboard" 
            element={
              <WorkerRouteGuard>
                <WorkerDashboard />
              </WorkerRouteGuard>
            } 
          />
          <Route 
            path="/provider-profile-update" 
            element={
              <WorkerRouteGuard>
                <ProviderProfileUpdate />
              </WorkerRouteGuard>
            } 
          />
          <Route path="/user-login" element={<Login />} />
          <Route path="/user-register" element={<UserRegister />} />
          <Route 
            path="/user-dashboard" 
            element={
              <RequesterRouteGuard>
                <RequesterDashboard />
              </RequesterRouteGuard>
            } 
          />
          <Route 
            path="/create-live-request" 
            element={
              <UserRouteGuard>
                <CreateLiveRequest />
              </UserRouteGuard>
            } 
          />
          <Route 
            path="/user-urgent-requests" 
            element={
              <UserRouteGuard>
                <UserUrgentRequests />
              </UserRouteGuard>
            } 
          />
          <Route 
            path="/provider-notifications" 
            element={
              <ProviderRouteGuard>
                <ProviderNotifications />
              </ProviderRouteGuard>
            } 
          />
          <Route path="/test-location-autocomplete" element={<TestLocationAutocomplete />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalCursor />
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
  </QueryClientProvider>
);

export default App;
