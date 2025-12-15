import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { useToast } from "@/hooks/use-toast";
import { getUserLiveRequests, getLiveRequestDetails, cancelLiveRequest } from "@/lib/liveRequestService";
import { getUrgencyColor, getTimeRemaining } from "@/lib/liveRequestService";
import ProviderBidCard from "@/components/ProviderBidCard";
import { AlertCircle, Clock, MapPin, DollarSign, Users, Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface UrgentRequest {
  id: string;
  service_category: string;
  job_title: string;
  job_description: string;
  urgency_level: string;
  preferred_location: string;
  budget_range_min: number;
  budget_range_max: number;
  status: string;
  expires_at: string;
  created_at: string;
  bid_count?: number;
}

const UserUrgentRequests = () => {
  const [requests, setRequests] = useState<UrgentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
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
            description: "Please log in to view your urgent requests.",
            variant: "destructive",
          });
          navigate('/user-login');
          return;
        }
        setIsAuthenticated(true);
        loadRequests();
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/user-login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const loadRequests = async () => {
    try {
      const userRequests = await getUserLiveRequests();
      setRequests(userRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: "Error",
        description: "Failed to load your urgent requests.",
        variant: "destructive",
      });
    }
  };

  const handleRequestClick = async (requestId: string) => {
    try {
      const details = await getLiveRequestDetails(requestId);
      setRequestDetails(details);
      setSelectedRequest(requestId);
    } catch (error) {
      console.error('Error loading request details:', error);
      toast({
        title: "Error",
        description: "Failed to load request details.",
        variant: "destructive",
      });
    }
  };

  const handleBidAccepted = () => {
    // Refresh the requests list
    loadRequests();
    setSelectedRequest(null);
    setRequestDetails(null);
  };

  const handleBidRejected = () => {
    // Refresh the requests list
    loadRequests();
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelLiveRequest(requestId);
      toast({
        title: "Request Cancelled",
        description: "Your urgent request has been cancelled.",
      });
      loadRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Error",
        description: "Failed to cancel request.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePrice = (requestId: string) => {
    // Navigate to update price page (to be implemented)
    navigate(`/update-price/${requestId}`);
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
                My Urgent Requests
              </h1>
              <p className="text-muted-foreground">
                Track your urgent service requests and provider bids
              </p>
            </div>
            <Button
              onClick={() => navigate('/create-live-request')}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Urgent Request
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Requests List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Your Requests
                  </CardTitle>
                  <CardDescription>
                    {requests.length} urgent request{requests.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {requests.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No urgent requests yet</p>
                      <Button
                        onClick={() => navigate('/create-live-request')}
                        variant="outline"
                        className="mt-4"
                      >
                        Create Your First Request
                      </Button>
                    </div>
                  ) : (
                    requests.map((request) => (
                      <Card
                        key={request.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedRequest === request.id ? 'ring-2 ring-red-500' : ''
                        }`}
                        onClick={() => handleRequestClick(request.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1">
                                {request.job_title}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {request.job_description}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className={getUrgencyColor(request.urgency_level)}
                            >
                              {request.urgency_level}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>₨{request.budget_range_min}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{request.bid_count || 0} bids</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{getTimeRemaining(request.expires_at)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Request Details and Bids */}
            <div className="lg:col-span-2">
              {selectedRequest && requestDetails ? (
                <div className="space-y-6">
                  {/* Request Details */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          Request Details
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdatePrice(selectedRequest)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Update Price
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelRequest(selectedRequest)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">{requestDetails.request.job_title}</h4>
                        <p className="text-muted-foreground">{requestDetails.request.job_description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{requestDetails.request.preferred_location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span>₨{requestDetails.request.budget_range_min}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-500" />
                          <span>{getTimeRemaining(requestDetails.request.expires_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-500" />
                          <span>{requestDetails.bids.length} bids received</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Provider Bids */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Provider Bids</h3>
                    {requestDetails.bids.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-muted-foreground">No bids yet</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Providers in your area will be notified and can submit bids.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      requestDetails.bids.map((bid: any) => (
                        <ProviderBidCard
                          key={bid.id}
                          bid={bid}
                          requestId={selectedRequest}
                          onBidAccepted={handleBidAccepted}
                          onBidRejected={handleBidRejected}
                        />
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a request to view details</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Click on any request from the list to see provider bids and details.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default UserUrgentRequests; 