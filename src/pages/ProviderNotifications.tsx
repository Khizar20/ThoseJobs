import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { useToast } from "@/hooks/use-toast";
import { getProviderNotifications } from "@/lib/liveRequestService";
import ProviderNotificationCard from "@/components/ProviderNotificationCard";
import { AlertCircle, Bell, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const ProviderNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
            description: "Please log in to view your notifications.",
            variant: "destructive",
          });
          navigate('/provider-login');
          return;
        }
        setIsAuthenticated(true);
        loadNotifications();
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/provider-login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const loadNotifications = async () => {
    try {
      const providerNotifications = await getProviderNotifications();
      setNotifications(providerNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true }
          : notification
      )
    );
  };

  const handleBidOnRequest = (notificationId: string) => {
    // Navigate to bid form or request details
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      navigate(`/bid-on-request/${notification.request_id}`);
    }
  };

  const handleRefresh = () => {
    loadNotifications();
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
    return null;
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Urgent Request Notifications
              </h1>
              <p className="text-muted-foreground">
                New urgent service requests that match your category
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Notifications */}
          <div className="space-y-6">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No New Notifications</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any new urgent request notifications at the moment.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    New urgent requests in your service category will appear here automatically.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="font-semibold">
                    {notifications.length} new urgent request{notifications.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid gap-6">
                  {notifications.map((notification) => (
                    <ProviderNotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onBidOnRequest={handleBidOnRequest}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default ProviderNotifications; 