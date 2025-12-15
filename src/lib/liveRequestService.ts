import { supabase } from './supabaseClient';
import { getUserLocation } from './locationUtils';

export interface LiveRequest {
  id: string;
  user_id: string;
  service_category: string;
  job_title: string;
  job_description: string;
  urgency_level: 'low' | 'medium' | 'high' | 'urgent';
  preferred_location: string;
  latitude?: number;
  longitude?: number;
  budget_range_min: number;
  budget_range_max: number;
  status: 'active' | 'bidding_closed' | 'assigned' | 'completed' | 'cancelled';
  expires_at?: string;
  created_at: string;
  updated_at: string;
  distance?: number;
  bid_count?: number;
  lowest_bid?: number;
  highest_bid?: number;
}

export interface RequestBid {
  id: string;
  request_id: string;
  provider_id: string;
  bid_amount: number;
  estimated_time: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  updated_at: string;
  provider_name?: string;
  provider_rating?: number;
  provider_profile_image?: string;
}

export interface CreateLiveRequestData {
  service_category: string;
  job_title: string;
  job_description: string;
  urgency_level: 'low' | 'medium' | 'high' | 'urgent';
  preferred_location: string;
  budget_range_min: number;
  budget_range_max: number;
  expires_at?: string;
}

export interface CreateBidData {
  request_id: string;
  bid_amount: number;
  estimated_time: string;
  message?: string;
}

// Create a new live request
export const createLiveRequest = async (data: CreateLiveRequestData): Promise<LiveRequest> => {
  try {
    // Get user's current location
    const userLocation = await getUserLocation();
    
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data: liveRequest, error } = await supabase
      .from('live_requests')
      .insert({
        ...data,
        user_id: user.id,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify nearby providers about the new urgent request
    await notifyNearbyProviders(liveRequest);

    return liveRequest;
  } catch (error) {
    console.error('Error creating live request:', error);
    throw error;
  }
};

// Get user's live requests
export const getUserLiveRequests = async (): Promise<LiveRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('live_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user live requests:', error);
    throw error;
  }
};

// Get nearby live requests for providers
export const getNearbyLiveRequests = async (
  latitude: number,
  longitude: number,
  radius: number = 10,
  serviceCategory?: string
): Promise<LiveRequest[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_nearby_live_requests', {
        user_lat: latitude,
        user_lon: longitude,
        radius_km: radius,
        service_category_filter: serviceCategory
      });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching nearby live requests:', error);
    throw error;
  }
};

// Get live request details with bids
export const getLiveRequestDetails = async (requestId: string): Promise<{
  request: LiveRequest;
  bids: RequestBid[];
}> => {
  try {
    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('live_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;

    // Get bids for this request
    const { data: bids, error: bidsError } = await supabase
      .from('request_bids')
      .select(`
        *,
        providers:provider_id (
          name,
          rating,
          profile_image
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (bidsError) throw bidsError;

    // Transform bids to include provider info
    const transformedBids = (bids || []).map(bid => ({
      ...bid,
      provider_name: bid.providers?.name,
      provider_rating: bid.providers?.rating,
      provider_profile_image: bid.providers?.profile_image,
    }));

    return {
      request,
      bids: transformedBids
    };
  } catch (error) {
    console.error('Error fetching live request details:', error);
    throw error;
  }
};

// Submit a bid on a live request
export const submitBid = async (data: CreateBidData): Promise<RequestBid> => {
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data: bid, error } = await supabase
      .from('request_bids')
      .insert({
        ...data,
        provider_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return bid;
  } catch (error) {
    console.error('Error submitting bid:', error);
    throw error;
  }
};

// Accept a bid
export const acceptBid = async (bidId: string, requestId: string): Promise<void> => {
  try {
    // Update bid status to accepted
    const { error: bidError } = await supabase
      .from('request_bids')
      .update({ status: 'accepted' })
      .eq('id', bidId);

    if (bidError) throw bidError;

    // Update request status to assigned
    const { error: requestError } = await supabase
      .from('live_requests')
      .update({ status: 'assigned' })
      .eq('id', requestId);

    if (requestError) throw requestError;

    // Reject all other bids for this request
    const { error: rejectError } = await supabase
      .from('request_bids')
      .update({ status: 'rejected' })
      .eq('request_id', requestId)
      .neq('id', bidId);

    if (rejectError) throw rejectError;
  } catch (error) {
    console.error('Error accepting bid:', error);
    throw error;
  }
};

// Cancel a live request
export const cancelLiveRequest = async (requestId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('live_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    console.error('Error cancelling live request:', error);
    throw error;
  }
};

// Get provider's bids
export const getProviderBids = async (): Promise<RequestBid[]> => {
  try {
    const { data, error } = await supabase
      .from('request_bids')
      .select(`
        *,
        live_requests:request_id (
          job_title,
          job_description,
          urgency_level,
          budget_range_min,
          budget_range_max,
          status,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching provider bids:', error);
    throw error;
  }
};

// Withdraw a bid
export const withdrawBid = async (bidId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('request_bids')
      .update({ status: 'withdrawn' })
      .eq('id', bidId);

    if (error) throw error;
  } catch (error) {
    console.error('Error withdrawing bid:', error);
    throw error;
  }
};

// Get provider notifications
export const getProviderNotifications = async (): Promise<any[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('provider_notifications')
      .select(`
        *,
        live_requests:request_id (
          job_title,
          job_description,
          urgency_level,
          budget_range_min,
          budget_range_max,
          preferred_location
        )
      `)
      .eq('provider_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching provider notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('provider_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Get urgency level color
export const getUrgencyColor = (urgency: string): string => {
  switch (urgency) {
    case 'urgent':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Format time remaining
export const getTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
};

// Notify nearby providers about a new urgent request
const notifyNearbyProviders = async (liveRequest: LiveRequest) => {
  try {
    console.log('Notifying providers for service category:', liveRequest.service_category);
    
    // Get all active providers in the same service category
    const { data: providers, error } = await supabase
      .from('providers')
      .select('user_id, service_category, name')
      .eq('service_category', liveRequest.service_category);

    if (error) {
      console.error('Error getting providers:', error);
      console.error('Error details:', error.message, error.code, error.details);
      return;
    }

    if (!providers || providers.length === 0) {
      console.log('No providers found for this service category:', liveRequest.service_category);
      return;
    }

    console.log(`Found ${providers.length} providers for notifications`);

    // Create notifications for all providers in the same category
    const notifications = providers.map((provider: any) => ({
      provider_id: provider.user_id,
      live_request_id: liveRequest.id,
      message: `New urgent ${liveRequest.service_category} request available!`,
      is_read: false,
      created_at: new Date().toISOString()
    }));

    const { error: notificationError } = await supabase
      .from('provider_notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error creating provider notifications:', notificationError);
      console.error('Notification error details:', notificationError.message, notificationError.code);
    } else {
      console.log(`Successfully notified ${notifications.length} providers about the urgent request`);
    }
  } catch (error) {
    console.error('Error notifying providers:', error);
  }
};

// Calculate default expiry time based on urgency
export const getDefaultExpiryTime = (urgency: string): Date => {
  const now = new Date();
  
  switch (urgency) {
    case 'urgent':
      return new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
    case 'high':
      return new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
    case 'medium':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    case 'low':
      return new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  }
}; 