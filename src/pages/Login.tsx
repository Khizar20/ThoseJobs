import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Lock, Mail, Home, ArrowLeft, User, Briefcase } from "lucide-react";

const Login = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') as 'requester' | 'worker' | null;
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [userRole, setUserRole] = useState<'requester' | 'worker' | null>(roleParam);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Supabase login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        let errorMessage = error.message;
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please verify your email address before logging in.";
        }
        throw new Error(errorMessage);
      }

      if (data.user && data.session) {
        // Get user profile to check roles
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          throw new Error("Failed to load user profile. Please try again.");
        }

        if (!userProfile) {
          throw new Error("User profile not found. Please register first.");
        }

        // Get user roles (support both old 'role' field and new 'roles' array)
        // Handle roles array - Supabase may return it as string or array
        let userRoles: string[] = [];
        if (userProfile.roles) {
          if (Array.isArray(userProfile.roles)) {
            userRoles = userProfile.roles;
          } else if (typeof userProfile.roles === 'string') {
            // Parse string representation of array
            try {
              userRoles = JSON.parse(userProfile.roles);
            } catch (e) {
              // If parsing fails, try to extract from string format
              const match = userProfile.roles.match(/\[(.*?)\]/);
              if (match) {
                userRoles = match[1].split(',').map(r => r.trim().replace(/['"]/g, ''));
              }
            }
          }
        }
        
        // Fallback to old role field if roles array is empty
        if (userRoles.length === 0 && userProfile.role) {
          userRoles = [userProfile.role];
        }
        
        const primaryRole = userRoles[0] || userProfile.role || 'requester';
        
        console.log('Login - User roles:', userRoles, 'Selected role:', userRole, 'Primary role:', primaryRole);

        // If a specific role was selected, check if user has that role
        if (userRole) {
          if (!userRoles.includes(userRole)) {
            // User doesn't have this role yet - offer to add it
            const hasOtherRoles = userRoles.length > 0;
            throw new Error(
              hasOtherRoles 
                ? `This account doesn't have ${userRole} access yet. You currently have: ${userRoles.join(', ')}. Would you like to add this role?`
                : `This account is not registered as a ${userRole}. Please sign up with the ${userRole} role first.`
            );
          }
        }

        // Store user info with roles
        const userInfoWithRoles = {
          ...userProfile,
          roles: userRoles,
          role: primaryRole // Keep for backward compatibility
        };
        
        // Store all data in localStorage
        localStorage.setItem('user_info', JSON.stringify(userInfoWithRoles));
        const selectedRole = userRole || primaryRole;
        localStorage.setItem('user_role', selectedRole); // Store selected role or primary
        localStorage.setItem('user_roles', JSON.stringify(userRoles)); // Store all roles
        localStorage.setItem('user_token', data.session.access_token);
        localStorage.setItem('user_token_data', JSON.stringify({
          token: data.session.access_token,
          timestamp: Date.now()
        }));

        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent('auth-state-changed'));

        toast({
          title: "Login Successful!",
          description: `Welcome back, ${userProfile.name}!`,
        });

        // Redirect immediately - localStorage is already set
        const redirectRole = userRole || primaryRole;
        console.log('Redirecting with role:', redirectRole, 'User roles:', userRoles);
        
        // Small delay to ensure all state is set, then navigate
        setTimeout(() => {
          if (redirectRole === 'requester') {
            navigate('/requester-dashboard', { replace: true });
          } else if (redirectRole === 'worker') {
            console.log('Navigating to worker dashboard...');
            navigate('/worker-dashboard', { replace: true });
          } else if (redirectRole === 'affiliate') {
            navigate('/affiliate-dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 50);
      } else {
        throw new Error("Login failed. Please try again.");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070A] via-[#0A0E14] to-[#05070A]">
      {/* Header Navigation */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>

            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0846BC] rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">ThoseJobs</span>
            </Link>

            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/5 border-white/10 shadow-xl">
            <CardHeader className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto w-16 h-16 bg-[#0846BC]/20 rounded-full flex items-center justify-center mb-4"
              >
                {userRole === 'requester' ? (
                  <User className="w-8 h-8 text-[#0846BC]" />
                ) : userRole === 'worker' ? (
                  <Briefcase className="w-8 h-8 text-[#0846BC]" />
                ) : (
                  <Lock className="w-8 h-8 text-[#0846BC]" />
                )}
              </motion.div>
              <CardTitle className="text-2xl font-bold text-white">
                {userRole === 'requester' && 'Requester Login'}
                {userRole === 'worker' && 'Worker Login'}
                {!userRole && 'Login'}
              </CardTitle>
              <CardDescription className="text-white/60">
                {userRole === 'requester' && 'Sign in to post jobs'}
                {userRole === 'worker' && 'Sign in to find jobs'}
                {!userRole && 'Sign in to your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#0846BC] dark:text-blue-400 z-10" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#0846BC] dark:text-blue-400 z-10" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-[#0846BC] dark:text-blue-400 hover:text-[#073a9e] dark:hover:text-blue-300"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#0846BC] hover:bg-[#063A9B] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-white/60">
                  Don't have an account?{" "}
                  <Link 
                    to={userRole ? `/signup?role=${userRole}` : '/choose-role'} 
                    className="text-[#0846BC] hover:underline font-medium"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>

              {!userRole && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60 text-center mb-2">Or login as:</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                      onClick={() => navigate('/login?role=requester')}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Requester
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                      onClick={() => navigate('/login?role=worker')}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Worker
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

