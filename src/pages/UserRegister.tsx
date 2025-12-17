import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff, User, Lock, Mail, Phone, MapPin, ArrowRight, CheckCircle, Home, ArrowLeft } from "lucide-react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

type UserRole = 'requester' | 'worker' | 'affiliate';

// Simple password hashing function (in production, use bcrypt or similar)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

const UserRegister = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') as UserRole | null;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    city: "Houston",
    zipCode: "",
    bio: ""
  });
  const [userRole, setUserRole] = useState<UserRole>(roleParam || 'requester');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect to role selection if no role provided
  useEffect(() => {
    if (!roleParam || !['requester', 'worker', 'affiliate'].includes(roleParam)) {
      navigate('/choose-role');
    } else {
      setUserRole(roleParam);
    }
  }, [roleParam, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push("Name is required");
    if (!formData.email.trim()) errors.push("Email is required");
    if (!formData.phone.trim()) errors.push("Phone number is required");
    if (!formData.password) errors.push("Password is required");
    if (formData.password.length < 6) errors.push("Password must be at least 6 characters");
    if (formData.password !== formData.confirmPassword) errors.push("Passwords do not match");
    if (!formData.city.trim()) errors.push("City is required");

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("=== USER REGISTRATION START ===");
      console.log("Form data:", formData);

      // Validate form
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        toast({
          title: "Validation Error",
          description: validationErrors[0],
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match.",
          variant: "destructive"
        });
        return;
      }

      console.log("✅ Form validation passed");

      // Hash password
      const hashedPassword = await hashPassword(formData.password);
      console.log("✅ Password hashed successfully");

      console.log("🔄 Creating user in Supabase Auth...");
      
      // Check if user already exists in auth
      const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      let authData;
      let authError;

      if (existingUser.user) {
        // User already exists in auth - this is fine, we'll just update their profile
        console.log("✅ User already exists in Supabase Auth, proceeding with profile creation");
        authData = { user: existingUser.user };
        authError = null;
      } else {
        // Create new user in auth
        // Set redirectTo to point to the email verification success page
        // This will work with any domain (localhost or deployed)
        const redirectUrl = `${window.location.origin}/email-verification-success?role=${userRole}`;
        
        const signUpResult = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              phone: formData.phone
            },
            emailRedirectTo: redirectUrl
          }
        });
        authData = signUpResult.data;
        authError = signUpResult.error;
      }

      console.log("Supabase Auth response:", { authData, authError });

      if (authError) {
        console.error("❌ Supabase Auth error:", authError);
        throw new Error(authError.message);
      }

      if (authData.user) {
        console.log("✅ User created/verified in Supabase Auth:", authData.user.id);

        console.log("🔄 Creating user profile in users table...");
        
        const userProfileData = {
          id: authData.user.id,
          roles: [userRole], // Set roles array: ['requester'], ['worker'], or ['affiliate']
          role: userRole, // Set primary role for backward compatibility
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          city: formData.city || 'Houston',
          zip_code: formData.zipCode || null,
          bio: userRole === 'worker' ? formData.bio : null,
          // Note: address is not stored in users table - it's stored per job
          profile_photo: null,
          rating_average: 0,
          rating_count: 0,
          is_verified: false,
          stripe_account_id: null,
          stripe_customer_id: null,
          payout_method_added: false,
          location_enabled: false,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log("User profile data to insert:", userProfileData);

        // Check if user already exists in users table
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        let profileData;
        let profileError;

        if (existingProfile) {
          // Update existing profile - add role to roles array if not already present
          console.log("✅ User profile already exists, updating...");
          
          // Get existing roles (support both old 'role' and new 'roles' array)
          const existingRoles = existingProfile.roles || (existingProfile.role ? [existingProfile.role] : []);
          const rolesToSet = existingRoles.includes(userRole) 
            ? existingRoles 
            : [...existingRoles, userRole];
          
          const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update({
              roles: rolesToSet, // Update roles array
              role: rolesToSet[0] || userRole, // Keep primary role for backward compatibility
              name: formData.name,
              phone: formData.phone,
              city: formData.city || 'Houston',
              zip_code: formData.zipCode || null,
              bio: userRole === 'worker' ? formData.bio : existingProfile.bio || formData.bio || null,
              // Note: address is not stored in users table - it's stored per job
              updated_at: new Date().toISOString()
            })
            .eq('id', authData.user.id)
            .select();
          
          profileData = updateData;
          profileError = updateError;
        } else {
          // Create new profile
          console.log("✅ Creating new user profile with role:", userRole);
          const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert(userProfileData)
            .select();
          
          profileData = insertData;
          profileError = insertError;
        }

        console.log("Users table insert/update response:", { profileData, profileError });

        if (profileError) {
          console.error("❌ Users table error:", profileError);
          throw new Error(`Failed to create user profile: ${profileError.message}`);
        }

        console.log("✅ User profile created/updated successfully:", profileData);

        // Show success message based on role
        const roleMessages = {
          requester: "Your requester account has been created. You can now post jobs!",
          worker: "Your worker account has been created. Complete onboarding to start accepting jobs!",
          affiliate: "Your affiliate account has been created. Start referring users to earn commissions!"
        };

          toast({
            title: "Registration Successful",
          description: roleMessages[userRole] || "Your account has been created successfully. Please check your email for verification.",
          });

        // Store user role in localStorage for immediate use
        localStorage.setItem('user_role', userRole);
        localStorage.setItem('user_id', authData.user.id);

        console.log("=== USER REGISTRATION SUCCESS ===");
        
        // Redirect to login page with role parameter
        navigate(`/login?role=${userRole}`);
      } else {
        throw new Error("Failed to create user account");
      }
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      let errorMessage = error.message;
      
      if (error.message.includes("User already registered")) {
        errorMessage = "This email is already registered. You can log in or reset your password.";
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "Password should be at least 6 characters long.";
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };



  // Show success state if registration was successful
  if (isVerificationSent) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Navigation */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Back Button */}
              <div className="flex items-center gap-4">
                <Link 
                  to="/" 
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Home</span>
                </Link>
              </div>

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">ThoseJobs</span>
              </Link>

              {/* Right side - empty for balance */}
              <div className="w-24"></div>
            </div>
          </div>
        </header>

        {/* Success Message */}
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
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
                  className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
                <CardTitle className="text-2xl font-bold text-green-600">Registration Successful!</CardTitle>
                <CardDescription>
                  Your account has been created successfully. Please check your email for verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Next Steps:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Check your email for verification link</li>
                    <li>• Click the verification link to activate your account</li>
                    <li>• Once verified, you can log in to your account</li>
                  </ul>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => navigate(`/login?role=${userRole}`)}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Back Button */}
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Home</span>
              </Link>
            </div>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">ThoseJobs</span>
            </Link>

            {/* Right side - empty for balance */}
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Registration Form */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
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
                <User className="w-8 h-8 text-primary" />
              </motion.div>
              <CardTitle className="text-2xl font-bold">
                {userRole === 'requester' && 'Create Requester Account'}
                {userRole === 'worker' && 'Create Worker Account'}
                {userRole === 'affiliate' && 'Create Affiliate Account'}
              </CardTitle>
              <CardDescription>
                {userRole === 'requester' && 'Post jobs and get them done'}
                {userRole === 'worker' && 'Start earning by completing tasks'}
                {userRole === 'affiliate' && 'Earn commissions by referring users'}
              </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="Houston"
                      value={formData.city}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    type="text"
                    placeholder="77001"
                    value={formData.zipCode}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Note: Address is not stored in user profile - it will be collected when posting jobs */}

              {userRole === 'worker' && (
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Input
                    id="bio"
                    name="bio"
                    type="text"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
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
                      <EyeOff className="h-4 h-4" />
                    ) : (
                      <Eye className="h-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
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
                      <EyeOff className="h-4 h-4" />
                    ) : (
                      <Eye className="h-4 h-4" />
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
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>


            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to={`/login?role=${userRole}`} className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </div>

            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Security Notice:</strong> Your account will be verified via email before you can access our services.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  </div>
  );
};

export default UserRegister; 