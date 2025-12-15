import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { getServiceCategoryNames, getServiceCategoryByName } from "@/lib/serviceCategories";
import { Navigation } from "@/components/ui/navigation";
import ChatModal from "@/components/ChatModal";
import MessageNotification from "@/components/MessageNotification";
import NotificationBadge from "@/components/NotificationBadge";
import NotificationDropdown from "@/components/NotificationDropdown";
import EarningsOverview from "@/components/EarningsOverview";
import {
  User,
  Settings,
  LogOut,
  Calendar,
  Star,
  DollarSign,
  FileText,
  MapPin,
  Phone,
  Mail,
  Edit,
  Eye,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
  X,
  MessageSquare,
  Check
} from "lucide-react";

interface ProviderInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  service_category: string;
  bio: string;
  experience: string;
  rating: number;
  reviews_count: number;
  is_verified: boolean;
  profile_image: string;
  jobs_pricing: any;
  created_at: string;
}

interface ServiceJob {
  job: string;
  price: number;
}

interface ServiceCategory {
  category: string;
  experience: string;
  jobs: ServiceJob[];
}

interface Booking {
  id: string;
  user_name: string;
  user_phone: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_amount: number;
  selected_services: any[];
  service_location: string;
  special_instructions: string;
  created_at: string;
  user_id: string;
  payment_method?: string;
  payment_method_name?: string;
  payment_status?: string;
}

interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  users: {
    name: string;
  };
}

const ProviderDashboard = () => {
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingServices, setIsEditingServices] = useState(false);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showChatForBooking, setShowChatForBooking] = useState<string | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    bookingId: string | null;
    action: string | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    bookingId: null,
    action: null,
    title: '',
    description: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  // Handle booking parameter from URL to open chat
  useEffect(() => {
    const bookingId = searchParams.get('booking');
    console.log('🔔 [PROVIDER_DASHBOARD] URL search params:', searchParams.toString());
    console.log('🔔 [PROVIDER_DASHBOARD] Booking ID from URL:', bookingId);
    
    if (bookingId) {
      console.log('🔔 [PROVIDER_DASHBOARD] Setting showChatForBooking to:', bookingId);
      setShowChatForBooking(bookingId);
      // Clear the URL parameter after setting the chat
      console.log('🔔 [PROVIDER_DASHBOARD] Clearing URL parameter');
      navigate('/provider-dashboard', { replace: true });
    }
  }, [searchParams, navigate]);

  const checkAuthAndLoadData = async () => {
    try {
      // Check if provider is logged in with valid token
      const providerToken = localStorage.getItem('provider_token');
      const tokenData = localStorage.getItem('provider_token_data');
      const storedProviderInfo = localStorage.getItem('provider_info');

      if (!providerToken || !tokenData || !storedProviderInfo) {
        navigate('/provider-login');
        return;
      }



      // Verify session with Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        handleLogout();
        return;
      }

      // Load provider data
      const providerData = JSON.parse(storedProviderInfo);
      setProviderInfo(providerData);
      
      // Initialize services from jobs_pricing
      if (providerData.jobs_pricing) {
        console.log('📥 Loading services from providerData.jobs_pricing:', providerData.jobs_pricing);
        const servicesData = Object.entries(providerData.jobs_pricing).map(([category, jobs]) => ({
          category,
          experience: "1-2", // Default experience
          jobs: Array.isArray(jobs) ? jobs : []
        }));
        console.log('📥 Transformed servicesData:', servicesData);
        setServices(servicesData);
      } else {
        console.log('📥 No jobs_pricing data found in providerData');
      }

      // Fetch provider's bookings
      await fetchBookings(providerData.id);
      
      // Fetch provider's reviews
      await fetchReviews(providerData.id);

      // Handle auto-opening chat if booking ID is in URL
      const bookingId = searchParams.get('booking');
      if (bookingId) {
        setShowChatForBooking(bookingId);
      }

    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/provider-login');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookings = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users (
            name,
            phone
          )
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to match our interface
      const transformedBookings = data?.map(booking => ({
        id: booking.id,
        user_name: booking.users?.name || 'Unknown User',
        user_phone: booking.users?.phone || 'No phone',
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        status: booking.status,
        total_amount: booking.total_amount,
        selected_services: booking.selected_services || [],
        service_location: booking.service_location,
        special_instructions: booking.special_instructions,
        created_at: booking.created_at,
        user_id: booking.user_id,
        payment_method: booking.payment_method,
        payment_method_name: booking.payment_method_name,
        payment_status: booking.payment_status
      })) || [];

      setBookings(transformedBookings);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load your bookings.",
        variant: "destructive"
      });
    }
  };

  const fetchReviews = async (providerId: string) => {
    try {
      // First, fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        throw reviewsError;
      }

      // Then, fetch user names for each review
      const reviewsWithUsers = await Promise.all(
        (reviewsData || []).map(async (review) => {
          try {
            // Try to get user data from public.users table first
            let { data: userData, error: userError } = await supabase
              .from('users')
              .select('name')
              .eq('id', review.customer_id)
              .single();

            // If that fails, try auth.users
            if (userError) {
              const { data: authUserData, error: authUserError } = await supabase
                .from('auth.users')
                .select('name')
                .eq('id', review.customer_id)
                .single();

              if (!authUserError && authUserData) {
                userData = authUserData;
                userError = null;
              }
            }

            return {
              ...review,
              users: {
                name: userError ? 'Anonymous' : (userData?.name || 'Anonymous')
              }
            };
          } catch (error) {
            console.error('Error fetching user data for review:', error);
            return {
              ...review,
              users: {
                name: 'Anonymous'
              }
            };
          }
        })
      );

      setReviews(reviewsWithUsers);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews.",
        variant: "destructive"
      });
    }
  };

  // Real-time subscription for new reviews
  useEffect(() => {
    if (!providerInfo?.id) return;

    const subscription = supabase
      .channel(`reviews_${providerInfo.id}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `provider_id=eq.${providerInfo.id}`
        },
        (payload) => {
          console.log('🔄 New review received:', payload);
          // Refresh reviews when a new review is added
          fetchReviews(providerInfo.id);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [providerInfo?.id]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('provider_token');
      localStorage.removeItem('provider_token_data');
      localStorage.removeItem('provider_info');
      
      // Dispatch custom event to notify Navigation component
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate('/provider-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addService = () => {
    setServices([...services, {
      category: '',
      experience: '1-2',
      jobs: []
    }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof ServiceCategory, value: any) => {
    const updatedServices = [...services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    
    // If category changed, pre-populate with default jobs
    if (field === 'category' && value) {
      const serviceCategory = getServiceCategoryByName(value);
      if (serviceCategory) {
        updatedServices[index].jobs = [...serviceCategory.jobs];
      }
    }
    
    setServices(updatedServices);
  };

  const addJob = (serviceIndex: number) => {
    const updatedServices = [...services];
    updatedServices[serviceIndex].jobs.push({ job: '', price: 0 });
    setServices(updatedServices);
  };

  const removeJob = (serviceIndex: number, jobIndex: number) => {
    const updatedServices = [...services];
    updatedServices[serviceIndex].jobs.splice(jobIndex, 1);
    setServices(updatedServices);
  };

  const updateJob = (serviceIndex: number, jobIndex: number, field: keyof ServiceJob, value: any) => {
    const updatedServices = [...services];
    updatedServices[serviceIndex].jobs[jobIndex] = { 
      ...updatedServices[serviceIndex].jobs[jobIndex], 
      [field]: value 
    };
    setServices(updatedServices);
  };

  const saveServices = async () => {
    try {
      const jobsPricing: any = {};
      const serviceCategories: string[] = [];
      const experiences: string[] = [];
      
      services.forEach(service => {
        if (service.category && service.jobs.length > 0) {
          jobsPricing[service.category] = service.jobs;
          serviceCategories.push(service.category);
          experiences.push(service.experience);
        }
      });

      console.log('💾 Saving services to database:');
      console.log('💾 jobsPricing:', jobsPricing);
      console.log('💾 serviceCategories:', serviceCategories);
      console.log('💾 experiences:', experiences);

      // Update providers table with service_category, experience, and jobs_pricing
      const { error } = await supabase
        .from('providers')
        .update({ 
          jobs_pricing: jobsPricing,
          service_category: serviceCategories.join(','), // Store as comma-separated string
          experience: experiences.join(',') // Store as comma-separated string
        })
        .eq('id', providerInfo?.id);

      if (error) throw error;

      console.log('✅ Services saved successfully to database');

      // Update local state
      if (providerInfo) {
        setProviderInfo({ 
          ...providerInfo, 
          jobs_pricing: jobsPricing,
          service_category: serviceCategories.join(','),
          experience: experiences.join(',')
        });
      }

      // Update localStorage
      const updatedProviderInfo = {
        ...providerInfo,
        jobs_pricing: jobsPricing,
        service_category: serviceCategories.join(','),
        experience: experiences.join(',')
      };
      localStorage.setItem('provider_info', JSON.stringify(updatedProviderInfo));

      setIsEditingServices(false);
      toast({
        title: "Services Updated",
        description: "Your services and pricing have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving services:', error);
      toast({
        title: "Error",
        description: "Failed to save services. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-[hsl(40_30%_92%)] text-[hsl(24_20%_18%)]';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenChat = (bookingId: string) => {
    console.log('🔔 [PROVIDER_DASHBOARD] handleOpenChat called with bookingId:', bookingId);
    // Navigate to chat view for this booking
    navigate(`/provider-dashboard?booking=${bookingId}`);
  };

  const handleCallUser = (userPhone: string) => {
    if (!userPhone) {
      toast({
        title: "Phone Number Not Available",
        description: "This user's phone number is not available.",
        variant: "destructive"
      });
      return;
    }
    
    // Open phone app with user's number
    window.open(`tel:${userPhone}`, '_self');
  };

  const showConfirmationDialog = (bookingId: string, action: string, title: string, description: string) => {
    setConfirmationDialog({
      isOpen: true,
      bookingId,
      action,
      title,
      description
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationDialog.bookingId || !confirmationDialog.action) return;

    try {
      // First, get the booking details to create notification
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('user_id, provider_id, booking_date, booking_time, total_amount')
        .eq('id', confirmationDialog.bookingId)
        .single();

      if (bookingError) {
        throw bookingError;
      }

      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: confirmationDialog.action,
          confirmed_at: confirmationDialog.action === 'confirmed' ? new Date().toISOString() : null
        })
        .eq('id', confirmationDialog.bookingId);

      if (error) {
        throw error;
      }

      // Create notification for the user
      let notificationType, title, message;
      
      switch (confirmationDialog.action) {
        case 'confirmed':
          notificationType = 'booking_confirmed';
          title = 'Booking Confirmed';
          message = `Your booking for ${formatDate(bookingData.booking_date)} at ${bookingData.booking_time} has been confirmed by the provider.`;
          break;
        case 'rejected':
          notificationType = 'booking_rejected';
          title = 'Booking Rejected';
          message = `Your booking for ${formatDate(bookingData.booking_date)} at ${bookingData.booking_time} has been rejected by the provider.`;
          break;
        case 'completed':
          notificationType = 'booking_completed';
          title = 'Service Completed';
          message = `Your booking for ${formatDate(bookingData.booking_date)} at ${bookingData.booking_time} has been completed by the provider. Please rate your experience!`;
          break;
        default:
          notificationType = 'booking_updated';
          title = 'Booking Updated';
          message = `Your booking for ${formatDate(bookingData.booking_date)} at ${bookingData.booking_time} has been updated.`;
      }

      console.log('🔔 [PROVIDER] Creating notification:', {
        user_id: bookingData.user_id,
        notification_type: notificationType,
        title: title,
        message: message
      });

      const { data: notificationData, error: notificationError } = await supabase
        .from('user_notifications')
        .insert({
          user_id: bookingData.user_id,
          booking_id: confirmationDialog.bookingId,
          notification_type: notificationType,
          title: title,
          message: message
        })
        .select();

      if (notificationError) {
        console.error('❌ [PROVIDER] Error creating notification:', notificationError);
        // Don't throw error for notification failure, as booking update was successful
      } else {
        console.log('✅ [PROVIDER] Notification created successfully:', notificationData);
      }

      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === confirmationDialog.bookingId 
            ? { ...booking, status: confirmationDialog.action }
            : booking
        )
      );

      toast({
        title: "Status Updated",
        description: `Booking status updated to ${confirmationDialog.action}. User has been notified.`,
      });
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update booking status.",
        variant: "destructive"
      });
    } finally {
      setConfirmationDialog({
        isOpen: false,
        bookingId: null,
        action: null,
        title: '',
        description: ''
      });
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    // This function is now deprecated, use showConfirmationDialog instead
    showConfirmationDialog(bookingId, newStatus, 
      newStatus === 'confirmed' ? 'Confirm Booking' : 'Reject Booking',
      newStatus === 'confirmed' 
        ? 'Are you sure you want to confirm this booking? This action cannot be undone.'
        : 'Are you sure you want to reject this booking? This action cannot be undone.'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!providerInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 pt-32">
        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden mb-6">
          <div className="flex overflow-x-auto space-x-2 pb-2">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('dashboard')}
              className="whitespace-nowrap"
            >
              <Eye className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('orders')}
              className="whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Orders
              <NotificationBadge 
                currentUserId={providerInfo?.id || ''} 
                currentUserType="provider"
                className="ml-1"
              />
            </Button>
            <Button
              variant={activeTab === 'services' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('services')}
              className="whitespace-nowrap"
            >
              <FileText className="w-4 h-4 mr-1" />
              Services
            </Button>
            <Button
              variant={activeTab === 'reviews' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('reviews')}
              className="whitespace-nowrap"
            >
              <Star className="w-4 h-4 mr-1" />
              Reviews
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('dashboard')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === 'profile' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('profile')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant={activeTab === 'services' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('services')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Services
                </Button>
                <Button
                  variant={activeTab === 'orders' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('orders')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Orders
                  <NotificationBadge 
                    currentUserId={providerInfo?.id || ''} 
                    currentUserType="provider"
                    className="ml-auto"
                  />
                </Button>

                <Button
                  variant={activeTab === 'earnings' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('earnings')}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Earnings
                </Button>
                <Button
                  variant={activeTab === 'reviews' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('reviews')}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Reviews
                </Button>
                <Button
                  variant={activeTab === 'settings' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-2">Dashboard Overview</h2>
                  <p className="text-muted-foreground">Monitor your business performance</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                  <div className="relative group">
                    <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[hsl(22_65%_60%)] via-[hsl(22_65%_50%)] to-[hsl(22_65%_45%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[2px]" />
                    <Card className="relative">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Orders</p>
                          <p className="text-lg md:text-2xl font-bold">{bookings.length}</p>
                        </div>
                        <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                      </div>
                    </CardContent>
                    </Card>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[hsl(22_65%_60%)] via-[hsl(22_65%_50%)] to-[hsl(22_65%_45%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[2px]" />
                    <Card className="relative">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">Completed</p>
                          <p className="text-lg md:text-2xl font-bold">{bookings.filter(booking => booking.status === 'completed').length}</p>
                        </div>
                        <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                      </div>
                    </CardContent>
                    </Card>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[hsl(22_65%_60%)] via-[hsl(22_65%_50%)] to-[hsl(22_65%_45%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[2px]" />
                    <Card className="relative">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">Pending</p>
                          <p className="text-lg md:text-2xl font-bold">
                            Rs. {bookings
                              .filter(booking => ['pending', 'confirmed'].includes(booking.status))
                              .reduce((total, booking) => total + booking.total_amount, 0)
                              .toLocaleString()}
                          </p>
                        </div>
                        <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
                      </div>
                    </CardContent>
                    </Card>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[hsl(22_65%_60%)] via-[hsl(22_65%_50%)] to-[hsl(22_65%_45%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[2px]" />
                    <Card className="relative">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">Earnings</p>
                          <p className="text-lg md:text-2xl font-bold">
                            Rs. {bookings
                              .filter(booking => booking.status === 'completed')
                              .reduce((total, booking) => total + booking.total_amount, 0)
                              .toLocaleString()}
                          </p>
                        </div>
                        <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                      </div>
                    </CardContent>
                    </Card>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[hsl(22_65%_60%)] via-[hsl(22_65%_50%)] to-[hsl(22_65%_45%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[2px]" />
                    <Card className="relative">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">Rating</p>
                          <p className="text-lg md:text-2xl font-bold">{providerInfo.rating || 0}</p>
                        </div>
                        <Star className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
                      </div>
                    </CardContent>
                    </Card>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[hsl(22_65%_60%)] via-[hsl(22_65%_50%)] to-[hsl(22_65%_45%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[2px]" />
                    <Card className="relative">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-muted-foreground">Reviews</p>
                          <p className="text-lg md:text-2xl font-bold">{providerInfo.reviews_count || 0}</p>
                        </div>
                        <FileText className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                      </div>
                    </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Bookings</CardTitle>
                    <CardDescription>Your latest booking requests from customers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bookings.length === 0 ? (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                        <p className="text-muted-foreground">
                          You'll see booking requests here once customers start booking your services.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings.slice(0, 3).map((booking) => (
                          <div key={booking.id}>
                            <div className="relative group border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                              <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-[hsl(22_65%_60%)] via-[hsl(22_65%_50%)] to-[hsl(22_65%_45%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[2px]" />
                              <div className="relative">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">{booking.user_name}</h4>
                                <p className="text-sm text-muted-foreground">{booking.user_phone}</p>
                              </div>
                              <div className="text-right">
                                <Badge className={`mb-2 ${getStatusColor(booking.status)}`}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </Badge>
                                <p className="text-sm font-bold text-primary">
                                  Rs. {booking.total_amount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(booking.booking_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {booking.booking_time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {booking.service_location}
                              </span>
                            </div>

                            {/* Selected Services */}
                            {booking.selected_services && booking.selected_services.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Services:</p>
                                <div className="flex flex-wrap gap-1">
                                  {booking.selected_services.map((service: any, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {service.job}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Special Instructions */}
                            {booking.special_instructions && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Special Instructions:</p>
                                <p className="text-xs text-muted-foreground">{booking.special_instructions}</p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {booking.status === 'pending' && (
                              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                                <Button 
                                  size="sm" 
                                  onClick={() => showConfirmationDialog(booking.id, 'confirmed', 'Confirm Booking', 'Are you sure you want to confirm this booking? This action cannot be undone.')}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Confirm
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => showConfirmationDialog(booking.id, 'rejected', 'Reject Booking', 'Are you sure you want to reject this booking? This action cannot be undone.')}
                                  className="flex-1"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}

                            {booking.status === 'confirmed' && (
                              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                                <Button 
                                  size="sm" 
                                  onClick={() => showConfirmationDialog(booking.id, 'completed', 'Mark Complete', 'Are you sure you want to mark this booking as completed? This action cannot be undone.')}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Mark Complete
                                </Button>
                              </div>
                            )}

                            {/* Chat and Call Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setShowChatForBooking(showChatForBooking === booking.id ? null : booking.id)}
                                className="flex-1"
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                {showChatForBooking === booking.id ? 'Hide Chat' : 'Chat'}
                                <NotificationBadge 
                                  currentUserId={providerInfo?.id || ''} 
                                  currentUserType="provider"
                                  className="ml-1"
                                />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCallUser(booking.user_phone)}
                                className="flex-1"
                              >
                                <Phone className="w-4 h-4 mr-1" />
                                Call
                              </Button>
                            </div>

                            <div className="text-xs text-muted-foreground mt-2">
                              Requested on {formatDate(booking.created_at)}
                              </div>
                              </div>
                          </div>
                          
                          </div>
                        ))}
                      
                      {bookings.length > 3 && (
                        <div className="text-center pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setActiveTab('orders')}
                            className="w-full"
                          >
                            View All {bookings.length} Orders
                          </Button>
                        </div>
                      )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Profile Information</h2>
                    <p className="text-muted-foreground">Manage your personal and business information</p>
                  </div>
                  <Button onClick={() => navigate('/provider-profile-update')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <p className="text-lg">{providerInfo.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-lg">{providerInfo.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="text-lg">{providerInfo.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                        <p className="text-lg">{providerInfo.location}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bio</label>
                      <p className="text-lg">{providerInfo.bio || "No bio provided"}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={providerInfo.is_verified ? "default" : "secondary"}>
                        {providerInfo.is_verified ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending Verification
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline">
                        Member since {formatDate(providerInfo.created_at)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">Service Management</h2>
                    <p className="text-sm md:text-base text-muted-foreground">Manage your service offerings, experience, and pricing</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {isEditingServices ? (
                      <>
                        <Button onClick={saveServices} size="sm" className="text-sm">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditingServices(false)} size="sm" className="text-sm">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditingServices(true)} size="sm" className="text-sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Services
                      </Button>
                    )}
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-lg md:text-xl">Service Categories & Pricing</span>
                      {isEditingServices && (
                        <Button size="sm" onClick={addService} className="text-sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Service
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 md:space-y-6">
                      {services.map((service, serviceIndex) => (
                        <div key={serviceIndex} className="border rounded-lg p-3 md:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-3">
                            <div className="flex flex-col md:flex-row gap-3 md:gap-4 flex-1">
                              {isEditingServices ? (
                                <>
                                  <div className="flex-1">
                                    <Label className="text-sm">Service Category</Label>
                                    <Select
                                      value={service.category}
                                      onValueChange={(value) => updateService(serviceIndex, 'category', value)}
                                    >
                                      <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getServiceCategoryNames().map((category) => (
                                          <SelectItem key={category.value} value={category.value}>
                                            {category.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-full md:w-32">
                                    <Label className="text-sm">Experience</Label>
                                    <Select
                                      value={service.experience}
                                      onValueChange={(value) => updateService(serviceIndex, 'experience', value)}
                                    >
                                      <SelectTrigger className="text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="0-1">0-1 years</SelectItem>
                                        <SelectItem value="1-2">1-2 years</SelectItem>
                                        <SelectItem value="3-5">3-5 years</SelectItem>
                                        <SelectItem value="6-10">6-10 years</SelectItem>
                                        <SelectItem value="10+">10+ years</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div>
                                    <h4 className="font-medium capitalize text-sm md:text-base">{service.category}</h4>
                                    <p className="text-xs md:text-sm text-muted-foreground">{service.experience} years experience</p>
                                  </div>
                                </>
                              )}
                            </div>
                            {isEditingServices && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeService(serviceIndex)}
                                className="text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h5 className="font-medium text-sm md:text-base">Jobs & Pricing</h5>
                              {isEditingServices && (
                                <Button size="sm" onClick={() => addJob(serviceIndex)} className="text-sm">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Job
                                </Button>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              {service.jobs.map((job, jobIndex) => (
                                <div key={jobIndex} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  {isEditingServices ? (
                                    <>
                                      <Input
                                        placeholder="Job name"
                                        value={job.job}
                                        onChange={(e) => updateJob(serviceIndex, jobIndex, 'job', e.target.value)}
                                        className="flex-1 text-sm"
                                      />
                                      <Input
                                        type="number"
                                        placeholder="Price"
                                        value={job.price}
                                        onChange={(e) => updateJob(serviceIndex, jobIndex, 'price', parseInt(e.target.value) || 0)}
                                        className="w-full sm:w-24 text-sm"
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeJob(serviceIndex, jobIndex)}
                                        className="text-sm"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="flex-1 text-sm md:text-base">{job.job}</span>
                                      <span className="font-medium text-sm md:text-base">Rs. {job.price}</span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {services.length === 0 && !isEditingServices && (
                        <div className="text-center py-6 md:py-8">
                          <FileText className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                          <h3 className="text-base md:text-lg font-semibold mb-2">No services configured</h3>
                          <p className="text-sm md:text-base text-muted-foreground">
                            Add your services and pricing to start receiving bookings.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 md:space-y-6"
              >
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Orders</h2>
                  <p className="text-sm md:text-base text-muted-foreground">Manage your service requests and bookings</p>
                </div>

                {bookings.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 md:p-8">
                      <div className="text-center">
                        <Calendar className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                        <h3 className="text-base md:text-lg font-semibold mb-2">No orders yet</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          You'll see your service requests and bookings here once customers start booking your services.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <CardTitle className="text-base md:text-lg">{booking.user_name}</CardTitle>
                              <CardDescription className="text-sm">
                                {formatDate(booking.booking_date)} at {booking.booking_time}
                              </CardDescription>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 md:space-y-4">
                          <div className="grid grid-cols-1 gap-3 md:gap-4">
                            <div>
                              <h4 className="font-medium mb-2 text-sm md:text-base">Customer Details</h4>
                              <div className="space-y-1 text-xs md:text-sm">
                                <p><span className="font-medium">Name:</span> {booking.user_name}</p>
                                <p><span className="font-medium">Phone:</span> {booking.user_phone}</p>
                                <p><span className="font-medium">Location:</span> {booking.service_location}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2 text-sm md:text-base">Service Details</h4>
                              <div className="space-y-1 text-xs md:text-sm">
                                <p><span className="font-medium">Total Amount:</span> Rs. {booking.total_amount.toLocaleString()}</p>
                                <p><span className="font-medium">Services:</span></p>
                                <div className="flex flex-wrap gap-1">
                                  {booking.selected_services.map((service: any, index: number) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {service.job} - Rs. {service.price}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {booking.special_instructions && (
                            <div>
                              <h4 className="font-medium mb-2 text-sm md:text-base">Special Instructions</h4>
                              <p className="text-xs md:text-sm text-muted-foreground bg-muted p-2 md:p-3 rounded-md">
                                {booking.special_instructions}
                              </p>
                            </div>
                          )}

                          {/* Payment Information */}
                          {booking.payment_method && (
                            <div>
                              <h4 className="font-medium mb-2 text-sm md:text-base">Payment Information</h4>
                              <div className="space-y-1 text-xs md:text-sm">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {booking.payment_status === 'paid' ? 'Paid' : 
                                     booking.payment_status === 'pending' ? 'Pending' : 
                                     booking.payment_status === 'failed' ? 'Failed' : 'Unknown'}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    {booking.payment_method_name || 'Cash on Delivery'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 md:pt-4 border-t">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowChatForBooking(showChatForBooking === booking.id ? null : booking.id)}
                              className="flex-1 text-sm"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              {showChatForBooking === booking.id ? 'Hide Chat' : 'Chat'}
                              <NotificationBadge 
                                currentUserId={providerInfo?.id || ''} 
                                currentUserType="provider"
                                className="ml-1"
                              />
                            </Button>
                            
                            {booking.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => showConfirmationDialog(booking.id, 'confirmed', 'Confirm Booking', 'Are you sure you want to confirm this booking? This action cannot be undone.')}
                                  className="flex-1"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Confirm
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => showConfirmationDialog(booking.id, 'rejected', 'Reject Booking', 'Are you sure you want to reject this booking? This action cannot be undone.')}
                                  className="flex-1 text-sm"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {booking.status === 'confirmed' && (
                              <Button 
                                size="sm" 
                                onClick={() => showConfirmationDialog(booking.id, 'completed', 'Mark Complete', 'Are you sure you want to mark this booking as completed? This action cannot be undone.')}
                                className="flex-1"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark Complete
                              </Button>
                            )}
                          </div>

                          {/* Chat Modal */}
                          {showChatForBooking === booking.id && (
                            <ChatModal
                              isOpen={showChatForBooking === booking.id}
                              onClose={() => setShowChatForBooking(null)}
                              bookingId={booking.id}
                              currentUserId={providerInfo?.id || ''}
                              currentUserType="provider"
                              otherPartyName={booking.user_name}
                            />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'earnings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-2">Earnings</h2>
                  <p className="text-muted-foreground">Track your income and financial performance</p>
                </div>

                {providerInfo && (
                  <EarningsOverview providerId={providerInfo.id} />
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-2">Reviews</h2>
                  <p className="text-muted-foreground">View customer feedback and ratings</p>
                </div>

                {reviews.length === 0 ? (
                  <Card>
                    <CardContent className="p-8">
                      <div className="text-center">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                        <p className="text-muted-foreground">
                          Customer reviews and ratings will appear here once you start receiving feedback.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-primary font-semibold">
                                  {review.users?.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {review.users?.name || 'Anonymous'}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {formatDate(review.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 leading-relaxed">
                              "{review.comment}"
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-2">Settings</h2>
                  <p className="text-muted-foreground">Manage your account preferences</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Session Timeout</h4>
                        <p className="text-sm text-muted-foreground">Your session will remain active until you log out</p>
                      </div>
                      <Badge variant="outline">No expiry</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Account Status</h4>
                        <p className="text-sm text-muted-foreground">Your account verification status</p>
                      </div>
                      <Badge variant={providerInfo.is_verified ? "default" : "secondary"}>
                        {providerInfo.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* Message Notifications */}
      {providerInfo && (
        <MessageNotification 
          currentUserId={providerInfo.id} 
          currentUserType="provider" 
        />
      )}

      {/* Chat Modal - rendered outside tab content so it's always available */}
      {showChatForBooking && providerInfo && (
        <ChatModal
          isOpen={!!showChatForBooking}
          onClose={() => setShowChatForBooking(null)}
          bookingId={showChatForBooking}
          currentUserId={providerInfo.id}
          currentUserType="provider"
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmationDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setConfirmationDialog({
            isOpen: false,
            bookingId: null,
            action: null,
            title: '',
            description: ''
          });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmationDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProviderDashboard; 