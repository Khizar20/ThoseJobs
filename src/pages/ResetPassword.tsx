import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff, Lock, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Password hashing function (same as in registration and login)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("=== PASSWORD RESET PAGE LOAD ===");
        console.log("Current URL:", window.location.href);
        console.log("Location hash:", location.hash);
        console.log("Location search:", location.search);
        console.log("Full location object:", location);
        
        // Debug: Log all URL parameters
        const allParams = new URLSearchParams(window.location.search);
        const allHashParams = new URLSearchParams(window.location.hash.substring(1));
        console.log("All search params:", Object.fromEntries(allParams.entries()));
        console.log("All hash params:", Object.fromEntries(allHashParams.entries()));

        // Check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("Session check result:", { session: !!session, error });

        if (error) {
          console.error("Session check error:", error);
          setSessionError("Failed to check session");
          setIsCheckingSession(false);
          return;
        }

        if (!session) {
          console.log("⚠️ No active session found");
          
          // Check if we have access token in URL (from password reset link)
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          
          let accessToken = urlParams.get('access_token') || hashParams.get('access_token');
          let refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
          
          // Also check for type parameter to confirm this is a password reset
          const type = urlParams.get('type') || hashParams.get('type');
          
          console.log("URL tokens:", { 
            accessToken: !!accessToken, 
            refreshToken: !!refreshToken,
            type,
            search: window.location.search,
            hash: window.location.hash
          });

          if (accessToken && refreshToken) {
            console.log("🔄 Setting session from URL tokens...");
            
            // Set the session using the tokens from URL
            const { data: { session: newSession }, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (setSessionError) {
              console.error("Failed to set session:", setSessionError);
              setSessionError("Invalid or expired reset link. Please request a new password reset.");
            } else if (newSession) {
              console.log("✅ Session set successfully from reset link");
              setSessionError(null);
            } else {
              console.error("No session after setting tokens");
              setSessionError("Invalid reset link. Please request a new password reset.");
            }
          } else {
            console.log("❌ No reset tokens found in URL");
            console.log("Full URL:", window.location.href);
            setSessionError("Invalid reset link. Please request a new password reset.");
          }
        } else {
          console.log("✅ Active session found");
          setSessionError(null);
        }
      } catch (error: any) {
        console.error("Session check failed:", error);
        setSessionError("Failed to verify reset link. Please try again.");
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.password) errors.push("Password is required");
    if (formData.password.length < 6) errors.push("Password must be at least 6 characters");
    if (formData.password !== formData.confirmPassword) errors.push("Passwords do not match");

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("=== PASSWORD RESET SUBMIT ===");

      // Validate form
      const errors = validateForm();
      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors[0],
          variant: "destructive"
        });
        return;
      }

      // Hash the new password
      const hashedPassword = await hashPassword(formData.password);

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("No active session found. Please request a new password reset link.");
      }

      console.log("✅ User session found:", session.user.email);

      // Update password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (authError) {
        console.error("Auth update error:", authError);
        throw new Error(authError.message);
      }

      console.log("✅ Password updated in Supabase Auth");

      // Update password hash in users table
      const { error: userError } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', session.user.id);

      if (userError) {
        console.error("User table update error:", userError);
        throw new Error(userError.message);
      }

      console.log("✅ Password hash updated in users table");

      setIsSuccess(true);
      toast({
        title: "Password Updated!",
        description: "Your password has been successfully updated.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/user-login');
      }, 2000);

    } catch (error: any) {
      console.error("Password reset failed:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if session check failed
  if (sessionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4"
              >
                <AlertCircle className="w-8 h-8 text-red-600" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-red-600">Invalid Reset Link</CardTitle>
              <CardDescription>
                {sessionError}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Please request a new password reset link from the login page.
                </p>
              </div>
              <Button
                onClick={() => navigate('/user-login')}
                className="w-full"
              >
                Go to Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
              >
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-green-600">Password Updated!</CardTitle>
              <CardDescription>
                Your password has been successfully reset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  You can now log in with your new password.
                </p>
              </div>
              <Button
                onClick={() => navigate('/user-login')}
                className="w-full"
              >
                Go to Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"
            >
              <Lock className="w-8 h-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating Password...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Reset Password
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Security Tip:</strong> Use a strong password with at least 6 characters including letters, numbers, and symbols.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword; 