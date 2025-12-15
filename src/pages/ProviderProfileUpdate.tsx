import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Eye, 
  EyeOff, 
  Save, 
  ArrowLeft,
  Shield,
  AlertCircle
} from "lucide-react";

interface ProviderInfo {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  service_category: string;
  bio: string;
  experience: string;
  location: string;
  profile_image: string;
  is_verified: boolean;
  rating: number;
  reviews_count: number;
  created_at: string;
}

const ProviderProfileUpdate = () => {
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const providerToken = localStorage.getItem('provider_token');
      const storedProviderInfo = localStorage.getItem('provider_info');

      if (!providerToken || !storedProviderInfo) {
        navigate('/provider-login');
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        localStorage.removeItem('provider_token');
        localStorage.removeItem('provider_info');
        navigate('/provider-login');
        return;
      }

      const providerData = JSON.parse(storedProviderInfo);
      setProviderInfo(providerData);
      
      // Load user data from Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user && !userError) {
        setFormData(prev => ({
          ...prev,
          email: user.email || "",
          name: providerData.name || "",
          phone: providerData.phone || "",
          location: providerData.location || "",
          bio: providerData.bio || ""
        }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/provider-login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validate phone number if provided
      if (formData.phone) {
        const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
        if (!phoneRegex.test(formData.phone)) {
          throw new Error("Please enter a valid Pakistani phone number (e.g., 03xxxxxxxxx)");
        }
        if (formData.phone.length !== 11) {
          throw new Error("Phone number must be exactly 11 characters long");
        }
      }

      // Validate password change if provided
      if (formData.new_password) {
        if (!formData.current_password) {
          throw new Error("Current password is required to change password");
        }
        if (formData.new_password !== formData.confirm_password) {
          throw new Error("New passwords do not match");
        }
        if (formData.new_password.length < 6) {
          throw new Error("New password must be at least 6 characters long");
        }
      }

      // Update password if provided
      if (formData.new_password && formData.current_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.new_password
        });

        if (passwordError) {
          throw new Error(passwordError.message);
        }
      }

      // Update provider profile (only basic info, not service-related fields)
      const { error: profileError } = await supabase
        .from('providers')
        .update({
          name: formData.name,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio
        })
        .eq('user_id', providerInfo?.user_id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      // Update local storage with new data
      const updatedProviderInfo = {
        ...providerInfo,
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio
      };
      localStorage.setItem('provider_info', JSON.stringify(updatedProviderInfo));

      toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated.",
      });

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: ""
      }));

    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (!providerInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/provider-dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Update Profile</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your account information
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and account credentials. Service categories and experience are managed in the Services section.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            name="name"
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
                            value={formData.email}
                            disabled
                            className="pl-10 bg-muted"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
                           value={formData.phone}
                           onChange={handleChange}
                           className="pl-10"
                           placeholder="03xxxxxxxxx"
                           maxLength={11}
                         />
                       </div>
                       <p className="text-xs text-muted-foreground">
                         Enter your 11-digit Pakistani phone number (e.g., 03xxxxxxxxx)
                       </p>
                     </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className="pl-10"
                          placeholder="Enter your location"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself and your services..."
                        rows={3}
                      />
                    </div>

                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground">Service Management</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            To update your service categories, experience levels, and pricing, please use the Services section in your dashboard.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Password Change Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Change Password
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current_password">Current Password</Label>
                        <div className="relative">
                          <Eye className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="current_password"
                            name="current_password"
                            type={showPassword ? "text" : "password"}
                            value={formData.current_password}
                            onChange={handleChange}
                            className="pl-10 pr-10"
                            placeholder="Enter current password"
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
                        <Label htmlFor="new_password">New Password</Label>
                        <div className="relative">
                          <Eye className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="new_password"
                            name="new_password"
                            type={showNewPassword ? "text" : "password"}
                            value={formData.new_password}
                            onChange={handleChange}
                            className="pl-10 pr-10"
                            placeholder="Enter new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                        <div className="relative">
                          <Eye className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirm_password"
                            name="confirm_password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirm_password}
                            onChange={handleChange}
                            className="pl-10 pr-10"
                            placeholder="Confirm new password"
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
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          Save Changes
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfileUpdate; 