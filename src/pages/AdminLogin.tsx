import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      // Verify token is still valid
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Token is valid, redirect to admin panel
        window.location.href = "/admin";
      } else {
        // Token is invalid, remove it
        localStorage.removeItem("admin_token");
      }
    } catch (error) {
      localStorage.removeItem("admin_token");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Hardcoded admin credentials check
      const ADMIN_USERNAME = "admin";
      const ADMIN_PASSWORD = "admin123";

      if (formData.username === ADMIN_USERNAME && formData.password === ADMIN_PASSWORD) {
        // Create mock admin token
        const mockToken = "mock-admin-token-" + Date.now();
        
        // Store token
        localStorage.setItem("admin_token", mockToken);
        localStorage.setItem("admin_expires_at", (Date.now() + 86400000).toString()); // 24 hours
        
        toast({
          title: "Login Successful",
          description: "Welcome to the admin panel!",
        });

        // Redirect to admin panel
        window.location.href = "/admin";
        return;
      }

      // Try regular API login as fallback
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const data = await response.json();
          
          // Store token
          localStorage.setItem("admin_token", data.token);
          localStorage.setItem("admin_expires_at", data.expires_at);
          
          toast({
            title: "Login Successful",
            description: "Welcome to the admin panel!",
          });

          // Redirect to admin panel
          window.location.href = "/admin";
        } else {
          const errorData = await response.json();
          toast({
            title: "Login Failed",
            description: errorData.detail || "Invalid credentials",
            variant: "destructive"
          });
        }
      } catch (apiError) {
        toast({
          title: "Login Failed",
          description: "Invalid credentials. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin Login</CardTitle>
              <CardDescription>
                Enter your credentials to access the admin panel
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Logging in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Login
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>Default credentials:</p>
                <p className="font-mono">Username: admin</p>
                <p className="font-mono">Password: admin123</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminLogin; 