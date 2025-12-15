import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Clock, Shield, Phone, Calendar, ChevronLeft, ChevronRight, Loader2, CheckCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";
import { processPayment, getPaymentMethodName } from "@/lib/paymentService";

import InteractiveGoogleMap from "@/components/InteractiveGoogleMap";
import MapErrorBoundary from "@/components/MapErrorBoundary";
import { type Location, type ProviderWithLocation, getUserLocation, calculateDistance } from "@/lib/locationUtils";

interface Provider {
  id: string;
  user_id: string;
  name: string;
  service_category: string;
  bio: string;
  experience: string;
  location: string;
  profile_image: string;
  is_verified: boolean;
  rating: number;
  reviews_count: number;
  jobs_pricing: Record<string, Array<{ job: string; price: number }>>;
  created_at: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  users?: {
    phone?: string;
  };
}

interface SelectedJob {
  category: string;
  job: string;
  price: number;
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

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<SelectedJob[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasBooked, setHasBooked] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash_on_delivery');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

  // Get user location
  useEffect(() => {
    const getLocation = async () => {
      try {
        const location = await getUserLocation();
        if (location) {
          setUserLocation(location);
          setLocationPermissionGranted(true);
          
          // Calculate distance if provider has coordinates
          if (provider?.latitude && provider?.longitude) {
            const calculatedDistance = calculateDistance(
              location.latitude,
              location.longitude,
              provider.latitude,
              provider.longitude
            );
            setDistance(calculatedDistance);
          }
        }
      } catch (error) {
        console.log('Location permission denied or error:', error);
        setLocationPermissionGranted(false);
      }
    };

    getLocation();
  }, [provider]);

  // Get current user and check if they have booked this provider
  useEffect(() => {
    const userData = localStorage.getItem('user_info');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
             // Check if user has an active booking with this provider
       const checkBooking = async () => {
         if (!user || !provider) return;
         
         try {
           const { data, error } = await supabase
             .from('bookings')
             .select('id, status')
             .eq('user_id', user.id)
             .eq('provider_id', provider.id)
             .in('status', ['pending', 'confirmed']) // Only consider active bookings
             .limit(1);
           
           if (!error && data && data.length > 0) {
             setHasBooked(true);
           } else {
             setHasBooked(false);
           }
         } catch (error) {
           console.error('Error checking booking:', error);
         }
       };
      
      checkBooking();
    }
  }, [provider]);

  // Fetch provider data from Supabase
  useEffect(() => {
    const fetchProvider = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

                 const { data, error } = await supabase
           .from('providers')
           .select('*')
           .eq('id', id)
           .eq('is_verified', true)
           .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Provider not found');
        }

        // Parse jobs_pricing if it's a string
        let parsedJobsPricing = data.jobs_pricing;
        
        if (typeof data.jobs_pricing === 'string') {
          try {
            parsedJobsPricing = JSON.parse(data.jobs_pricing);
          } catch (error) {
            console.error('❌ Error parsing jobs_pricing string:', error);
            parsedJobsPricing = null;
          }
        }

                 // Fetch user's phone number from auth.users
         let userPhone = null;
         try {
           const { data: userData, error: userError } = await supabase
             .from('auth.users')
             .select('phone')
             .eq('id', data.user_id)
             .single();
           
           if (!userError && userData) {
             userPhone = userData.phone;
           }
         } catch (error) {
           console.log('Could not fetch user phone number:', error);
         }

         // Update the data with parsed jobs_pricing and user phone
         const processedData = {
           ...data,
           jobs_pricing: parsedJobsPricing,
           users: {
             phone: userPhone
           }
         };

         setProvider(processedData);
         console.log('📊 Provider data loaded:', {
           rating: data.rating,
           reviews_count: data.reviews_count,
           name: data.name
         });
       } catch (error: any) {
         console.error('Error fetching provider:', error);
         setError(error.message || 'Failed to load provider');
       } finally {
         setIsLoading(false);
       }
     };

    fetchProvider();
  }, [id]);

  // Fetch reviews when provider is loaded
  useEffect(() => {
    if (provider) {
      fetchReviews();
    }
  }, [provider]);

  // Real-time subscription for new reviews and provider updates
  useEffect(() => {
    if (!provider?.id) return;

    const subscription = supabase
      .channel(`provider_profile_${provider.id}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `provider_id=eq.${provider.id}`
        },
        (payload) => {
          console.log('🔄 New review received for provider:', payload);
          // Refresh reviews and provider data
          fetchReviews();
          // Re-fetch provider data
          const refetchProvider = async () => {
            try {
              const { data, error } = await supabase
                .from('providers')
                .select('*')
                .eq('id', provider.id)
                .eq('is_verified', true)
                .single();

              if (!error && data) {
                let parsedJobsPricing = data.jobs_pricing;
                if (typeof data.jobs_pricing === 'string') {
                  try {
                    parsedJobsPricing = JSON.parse(data.jobs_pricing);
                  } catch (error) {
                    console.error('❌ Error parsing jobs_pricing string:', error);
                    parsedJobsPricing = null;
                  }
                }

                // Fetch user's phone number from auth.users
                let userPhone = null;
                try {
                  const { data: userData, error: userError } = await supabase
                    .from('auth.users')
                    .select('phone')
                    .eq('id', data.user_id)
                    .single();
                  
                  if (!userError && userData) {
                    userPhone = userData.phone;
                  }
                } catch (error) {
                  console.log('Could not fetch user phone number:', error);
                }

                const processedData = {
                  ...data,
                  jobs_pricing: parsedJobsPricing,
                  users: {
                    phone: userPhone
                  }
                };

                setProvider(processedData);
              }
            } catch (error) {
              console.error('Error refetching provider:', error);
            }
          };
          refetchProvider();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'providers',
          filter: `id=eq.${provider.id}`
        },
        (payload) => {
          console.log('🔄 Provider data updated:', payload);
          // Re-fetch provider data
          const refetchProvider = async () => {
            try {
              const { data, error } = await supabase
                .from('providers')
                .select('*')
                .eq('id', provider.id)
                .eq('is_verified', true)
                .single();

              if (!error && data) {
                let parsedJobsPricing = data.jobs_pricing;
                if (typeof data.jobs_pricing === 'string') {
                  try {
                    parsedJobsPricing = JSON.parse(data.jobs_pricing);
                  } catch (error) {
                    console.error('❌ Error parsing jobs_pricing string:', error);
                    parsedJobsPricing = null;
                  }
                }

                // Fetch user's phone number from auth.users
                let userPhone = null;
                try {
                  const { data: userData, error: userError } = await supabase
                    .from('auth.users')
                    .select('phone')
                    .eq('id', data.user_id)
                    .single();
                  
                  if (!userError && userData) {
                    userPhone = userData.phone;
                  }
                } catch (error) {
                  console.log('Could not fetch user phone number:', error);
                }

                const processedData = {
                  ...data,
                  jobs_pricing: parsedJobsPricing,
                  users: {
                    phone: userPhone
                  }
                };

                setProvider(processedData);
              }
            } catch (error) {
              console.error('Error refetching provider:', error);
            }
          };
          refetchProvider();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [provider?.id]);

    const fetchReviews = async () => {
    if (!id) return;

    setIsLoadingReviews(true);
    try {
      // First, fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', id)
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
      console.log('📝 Reviews loaded:', reviewsWithUsers.length, 'reviews');
      reviewsWithUsers.forEach((review, index) => {
        console.log(`Review ${index + 1}:`, {
          rating: review.rating,
          comment: review.comment,
          userName: review.users?.name,
          date: review.created_at
        });
      });
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const getServiceCategories = (provider: Provider) => {
    if (typeof provider.service_category === 'string') {
      return provider.service_category.split(',').map(cat => cat.trim()).join(', ');
    }
    return provider.service_category || 'General Services';
  };

  const getServiceCategoriesArray = (provider: Provider) => {
    if (typeof provider.service_category === 'string') {
      return provider.service_category.split(',').map(cat => cat.trim());
    }
    return [];
  };

  const getFormattedExperience = (provider: Provider) => {
    if (!provider.experience) return "Experience: Not specified";
    
    const serviceCategories = getServiceCategoriesArray(provider);
    const experienceValues = provider.experience.split(',').map(exp => exp.trim());
    
    // If we have the same number of categories and experience values, map them
    if (serviceCategories.length === experienceValues.length) {
      const experienceMap = serviceCategories.map((category, index) => ({
        category: category.trim(),
        experience: experienceValues[index] || "Not specified"
      }));
      
      return experienceMap.map(item => 
        `${item.category} experience: ${item.experience} years`
      ).join(', ');
    }
    
    // Fallback: if we can't map properly, show the raw experience
    return `Experience: ${provider.experience}`;
  };

  const getStartingPrice = (provider: Provider) => {
    if (!provider.jobs_pricing) return "Contact for pricing";
    
    let minPrice = Infinity;
    Object.values(provider.jobs_pricing).forEach((services: any) => {
      if (Array.isArray(services)) {
        services.forEach((service: any) => {
          const numPrice = Number(service.price);
          if (!isNaN(numPrice) && numPrice < minPrice) {
            minPrice = numPrice;
          }
        });
      }
    });
    
    return minPrice === Infinity ? "Contact for pricing" : `Starting from Rs. ${minPrice.toLocaleString()}`;
  };

  const calculateTotalPrice = () => {
    return selectedJobs.reduce((total, job) => total + job.price, 0);
  };

  const handleJobSelection = (category: string, job: any) => {
    setSelectedJobs(prev => {
      const isSelected = prev.some(j => j.category === category && j.job === job.job);
      
      if (isSelected) {
        return prev.filter(j => !(j.category === category && j.job === job.job));
      } else {
        return [...prev, { category, job: job.job, price: job.price }];
      }
    });
  };

  const isJobSelected = (category: string, job: any) => {
    return selectedJobs.some(j => j.category === category && j.job === job.job);
  };

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString()}`;
  };

  const formatReviewDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleRedirectToDashboard = () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access your dashboard.",
        variant: "destructive"
      });
      return;
    }
    
    // Redirect to user dashboard
    navigate('/user-dashboard');
    toast({
      title: "Redirecting to Dashboard",
      description: "You can chat and call your provider from your bookings section.",
    });
  };



  const handleRefreshLocation = async () => {
    try {
      const location = await getUserLocation();
      if (location) {
        setUserLocation(location);
        setLocationPermissionGranted(true);
        
        if (provider?.latitude && provider?.longitude) {
          const calculatedDistance = calculateDistance(
            location.latitude,
            location.longitude,
            provider.latitude,
            provider.longitude
          );
          setDistance(calculatedDistance);
        }
      }
    } catch (error) {
      console.error('Error refreshing location:', error);
      toast({
        title: "Location Error",
        description: "Failed to get your location. Please check your browser settings.",
        variant: "destructive"
      });
    }
  };

  const handleBooking = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book this service.",
        variant: "destructive"
      });
      return;
    }

    // Check if current user is logged in as a provider
    const currentAccountType = localStorage.getItem('current_account_type');
    if (currentAccountType === 'provider') {
      toast({
        title: "Access Restricted",
        description: "Service providers cannot book services. Please switch to your user account to book services.",
        variant: "destructive"
      });
      return;
    }

    if (!provider) {
      toast({
        title: "Error",
        description: "Provider information not available.",
        variant: "destructive"
      });
      return;
    }

    if (selectedJobs.length === 0) {
      toast({
        title: "No Services Selected",
        description: "Please select at least one service to book.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Schedule Required",
        description: "Please select a date and time for your appointment.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      // First create the booking
      const bookingData = {
        user_id: currentUser.id,
        provider_id: provider.id,
        selected_services: selectedJobs,
        total_amount: calculateTotalPrice(),
        booking_date: selectedDate,
        booking_time: selectedTime,
        status: 'pending',
        payment_method: selectedPaymentMethod,
        payment_method_name: getPaymentMethodName(selectedPaymentMethod),
        payment_status: 'pending'
      };

      const { data: bookingResult, error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      // Process payment
      const paymentResponse = await processPayment({
        bookingId: bookingResult.id,
        paymentMethod: selectedPaymentMethod,
        amount: calculateTotalPrice(),
        userId: currentUser.id,
        providerId: provider.id
      });

      if (!paymentResponse.success) {
        // If payment fails, update booking status
        await supabase
          .from('bookings')
          .update({ 
            payment_status: 'failed',
            status: 'cancelled'
          })
          .eq('id', bookingResult.id);

        throw new Error(paymentResponse.message);
      }

      toast({
        title: "Booking Successful",
        description: paymentResponse.message,
      });

      setHasBooked(true);
      setSelectedJobs([]);
      setSelectedDate("");
      setSelectedTime("");
      setSelectedPaymentMethod('cash_on_delivery');
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32">
          <div className="container mx-auto px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-lg">Loading provider profile...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32">
          <div className="container mx-auto px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">Provider Not Found</h1>
              <p className="text-muted-foreground mb-6">{error || "The provider you're looking for doesn't exist or is not available."}</p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
              <div className="pt-32 pb-16">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Provider Info */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* Profile Header */}
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                <Card className="relative p-4 md:p-8 border-border bg-card hover:shadow-elegant transition-shadow">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  <img
                    src={provider.profile_image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face"}
                    alt={provider.name}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover mx-auto md:mx-0"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face";
                    }}
                  />
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{provider.name}</h1>
                    <p className="text-primary font-medium text-base md:text-lg mb-3">{getServiceCategories(provider)}</p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4 mb-3 md:mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 md:h-5 md:w-5 fill-primary text-primary" />
                        <span className="font-semibold text-foreground text-sm md:text-base">{(provider.rating || 0).toFixed(1)}</span>
                        <span className="text-muted-foreground text-xs md:text-sm">({provider.reviews_count || 0} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-xs md:text-sm">{provider.location || "Location not specified"}</span>
                        {distance !== null && (
                          <span className="text-xs md:text-sm text-primary font-medium">
                            • {distance.toFixed(1)} km away
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-3 md:mb-4 text-sm md:text-base">
                      {getFormattedExperience(provider)}
                    </p>
                    
                    <p className="font-semibold text-foreground text-base md:text-lg">
                      {getStartingPrice(provider)}
                    </p>
                  </div>
                </div>
                </Card>
              </div>

              {/* Interactive Location Map */}
              {provider.latitude && provider.longitude && (
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                <Card className="relative p-4 md:p-8 border-border bg-card hover:shadow-elegant transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">Location</h2>
                    {distance !== null && (
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                        <span>Distance: <span className="font-medium text-primary">{distance.toFixed(1)} km</span></span>
                      </div>
                    )}
                  </div>
                  
                  <MapErrorBoundary onRetry={handleRefreshLocation}>
                    <InteractiveGoogleMap
                      userLocation={userLocation}
                      providers={[{
                        ...provider,
                        latitude: provider.latitude!,
                        longitude: provider.longitude!
                      }]}
                      onRefreshLocation={handleRefreshLocation}
                      isLoading={false}
                      selectedServiceType="All Services"
                      searchRadius={50}
                      onProviderSelect={() => {}}
                    />
                  </MapErrorBoundary>
                  
                  <div className="mt-4 p-3 md:p-4 bg-muted rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                        <span>{provider.location}</span>
                      </div>
                      {distance !== null && (
                        <div className="flex items-center gap-2">
                          <span>•</span>
                          <span>Distance from you: <span className="font-medium text-primary">{distance.toFixed(1)} km</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
              )}

              {/* About Section */}
              {provider.bio && (
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                <Card className="relative p-4 md:p-8 border-border bg-card hover:shadow-elegant transition-shadow">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">About</h2>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{provider.bio}</p>
                </Card>
              </div>
              )}

              {/* Services & Pricing */}
              {!provider.jobs_pricing || Object.keys(provider.jobs_pricing).length === 0 ? (
                <div className="relative group">
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  <Card className="relative p-4 md:p-8 border-border bg-card hover:shadow-elegant transition-shadow">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Services & Pricing</h2>
                  <div className="text-center py-6 md:py-8">
                    <p className="text-sm md:text-base text-muted-foreground">No services and pricing information available.</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">This provider hasn't set up their services yet.</p>
                  </div>
                  </Card>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  <Card className="relative p-4 md:p-8 border-border bg-card hover:shadow-elegant transition-shadow">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Services & Pricing</h2>
                  <div className="space-y-6">
                                        {Object.entries(provider.jobs_pricing).map(([category, services]) => (
                      <div key={category} className="border-b border-border pb-6 last:border-b-0">
                        <h3 className="text-lg font-semibold text-foreground mb-3">{category}</h3>
                        <div className="space-y-3">
                          {Array.isArray(services) && services.map((service: any, index: number) => (
                            <div 
                              key={index} 
                              className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent ${
                                isJobSelected(category, service) 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border bg-background'
                              }`}
                              onClick={() => handleJobSelection(category, service)}
                            >
                              <div className="flex items-center gap-3">
                                <CheckCircle 
                                  className={`h-5 w-5 ${
                                    isJobSelected(category, service) 
                                      ? 'text-primary' 
                                      : 'text-muted-foreground'
                                  }`}
                                />
                                <span className="font-medium text-foreground">{service.job}</span>
                              </div>
                              <span className="font-semibold text-primary">{formatPrice(Number(service.price))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  </Card>
                </div>
              )}

              {/* Reviews Section */}
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                <Card className="relative p-8 border-border bg-card hover:shadow-elegant transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Reviews & Ratings</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (provider.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {provider.rating?.toFixed(1) || '0'} ({provider.reviews_count || 0} reviews)
                    </span>
                  </div>
                </div>

                {isLoadingReviews ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading reviews...</span>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground">
                      Be the first to review this provider's services.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {review.users?.name?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {review.users?.name || 'Anonymous'}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {formatReviewDate(review.created_at)}
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
                          <p className="text-foreground leading-relaxed">
                            "{review.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              </div>

              {/* Booking Section */}
              {!hasBooked && (
                <div className="relative group">
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  <Card className="relative p-8 border-border bg-card hover:shadow-elegant transition-shadow">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Book Appointment</h2>
                  
                  {/* Date and Time Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Time</label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                      />
                    </div>
                  </div>

                  {/* Selected Services Summary */}
                  {selectedJobs.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-foreground mb-3">Selected Services</h3>
                      <div className="space-y-2">
                        {selectedJobs.map((job, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="text-foreground">{job.job}</span>
                            <span className="font-semibold text-primary">{formatPrice(job.price)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary">
                          <span className="font-semibold text-foreground">Total</span>
                          <span className="font-bold text-primary">{formatPrice(calculateTotalPrice())}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Method Selection */}
                  {selectedJobs.length > 0 && (
                    <div className="mb-6">
                      <PaymentMethodSelector
                        selectedMethod={selectedPaymentMethod}
                        onMethodChange={setSelectedPaymentMethod}
                        totalAmount={calculateTotalPrice()}
                      />
                    </div>
                  )}

                  <Button 
                    onClick={handleBooking}
                    disabled={selectedJobs.length === 0 || !selectedDate || !selectedTime || isProcessingPayment}
                    className="w-full"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      'Book Appointment'
                    )}
                  </Button>
                </Card>
                </div>
              )}

              {/* Already Booked Message */}
              {hasBooked && (
                <div className="relative group">
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  <Card className="relative p-8 border-border bg-card hover:shadow-elegant transition-shadow">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Already Booked</h3>
                    <p className="text-muted-foreground">You have already booked this provider.</p>
                  </div>
                </Card>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 md:space-y-6">
              {/* Contact Card */}
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                <Card className="relative p-4 md:p-6 border-border bg-card hover:shadow-elegant transition-shadow">
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Contact</h3>
                
                <div className="space-y-3 md:space-y-4">
                  {hasBooked ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full text-sm"
                        onClick={handleRedirectToDashboard}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat with Provider
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full text-sm"
                        onClick={handleRedirectToDashboard}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Provider
                      </Button>
                      <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-xs md:text-sm text-primary font-medium">
                          Click above to access chat and call features in your dashboard
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 md:p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                          <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                          <span className="font-medium text-foreground text-sm md:text-base">Chat with Provider</span>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Chat with your provider from your user dashboard after booking
                        </p>
                      </div>
                      
                      <div className="p-3 md:p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                          <Phone className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                          <span className="font-medium text-foreground text-sm md:text-base">Call Provider</span>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Call your provider from your user dashboard after booking
                        </p>
                      </div>
                      
                      <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-xs md:text-sm text-primary font-medium">
                          Book an appointment to access contact features in your dashboard
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Card>
              </div>

              {/* Verification Badge */}
              {provider.is_verified && (
                <div className="relative group">
                  <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                  <Card className="relative p-4 md:p-6 border-border bg-card hover:shadow-elegant transition-shadow">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    <div>
                      <h4 className="font-semibold text-foreground text-sm md:text-base">Verified Provider</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">This provider has been verified by our team</p>
                    </div>
                  </div>
                </Card>
                </div>
              )}

              {/* Quick Stats */}
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                <Card className="relative p-4 md:p-6 border-border bg-card hover:shadow-elegant transition-shadow">
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Quick Stats</h3>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs md:text-sm">Rating</span>
                    <span className="font-semibold text-foreground text-xs md:text-sm">{(provider.rating || 0).toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs md:text-sm">Reviews</span>
                    <span className="font-semibold text-foreground text-xs md:text-sm">{provider.reviews_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs md:text-sm">Experience</span>
                    <span className="font-semibold text-foreground text-xs md:text-sm">
                      {provider.experience ? 
                        provider.experience.split(',').length > 1 ? 
                          `${provider.experience.split(',').length} services` : 
                          provider.experience 
                        : "N/A"}
                    </span>
                  </div>
                  {distance !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs md:text-sm">Distance</span>
                      <span className="font-semibold text-primary text-xs md:text-sm">{distance.toFixed(1)} km</span>
                    </div>
                  )}
                </div>
              </Card>
              </div>
            </div>
          </div>
        </div>
      </div>



      <Footer />
    </div>
  );
};

export default ProviderProfile;