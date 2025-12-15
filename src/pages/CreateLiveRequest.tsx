import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { useToast } from "@/hooks/use-toast";
import LiveRequestForm from "@/components/LiveRequestForm";
import { AlertCircle, CheckCircle, Clock, Users, MapPin, Zap } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const CreateLiveRequest = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to create an urgent request.",
            variant: "destructive",
          });
          navigate('/user-login');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/user-login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const handleSuccess = (requestId: string) => {
    setIsCreating(true);
    toast({
      title: "Urgent Request Created Successfully!",
      description: "Providers in your area will be notified immediately.",
    });
    
    // Navigate to user urgent requests after a short delay
    setTimeout(() => {
      navigate('/user-urgent-requests');
    }, 2000);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create Urgent Service Request
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Need something done ASAP? Post an urgent request and get immediate bids from nearby providers.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Zap className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold">Instant Notifications</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Providers in your area get notified immediately when you post an urgent request.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Competitive Bidding</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get multiple bids from verified providers and choose the best offer.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Smart Location</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use Google Maps to find your exact location or search for addresses.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                How Urgent Requests Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold text-red-600">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Post Request</h4>
                  <p className="text-sm text-muted-foreground">
                    Describe your urgent need and set your budget
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold text-green-600">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Get Bids</h4>
                  <p className="text-sm text-muted-foreground">
                    Providers submit competitive bids within minutes
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold text-purple-600">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Compare & Choose</h4>
                  <p className="text-sm text-muted-foreground">
                    Review provider profiles, ratings, and prices
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold text-orange-600">4</span>
                  </div>
                  <h4 className="font-semibold mb-2">Accept & Book</h4>
                  <p className="text-sm text-muted-foreground">
                    Accept the best bid and get your service done
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          {!isCreating ? (
            <LiveRequestForm onSuccess={handleSuccess} onCancel={handleCancel} />
          ) : (
            <Card className="w-full max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Urgent Request Created Successfully!</h3>
                <p className="text-muted-foreground mb-4">
                  Your urgent request has been posted. Providers in your area will be notified immediately.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Redirecting to request details...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default CreateLiveRequest; 