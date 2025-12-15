import { supabase } from './supabaseClient';

export interface EarningsOverview {
  totalEarnings: number;
  thisMonthEarnings: number;
  pendingPayments: number;
  averageBookingValue: number;
  totalBookings: number;
  completedBookings: number;
}

export interface MonthlyEarnings {
  month: string;
  earnings: number;
  bookings: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  methodName: string;
  earnings: number;
  bookings: number;
  percentage: number;
}

export interface ServiceCategoryEarnings {
  category: string;
  earnings: number;
  bookings: number;
  averageValue: number;
}

export interface RecentTransaction {
  id: string;
  booking_date: string;
  total_amount: number;
  payment_method_name: string;
  payment_status: string;
  user_name: string;
  service_location: string;
  created_at: string;
}

// Get earnings overview for a provider
export const getEarningsOverview = async (providerId: string): Promise<EarningsOverview> => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId);

    if (error) throw error;

    console.log('🔍 [EARNINGS] All bookings for provider:', bookings?.length);
    console.log('🔍 [EARNINGS] Sample booking:', bookings?.[0]);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Only consider completed bookings for earnings
    const totalEarnings = bookings
      ?.filter(booking => booking.status === 'completed' && booking.total_amount && booking.total_amount > 0)
      ?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

    const thisMonthEarnings = bookings
      ?.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return booking.status === 'completed' && 
               booking.total_amount && booking.total_amount > 0 &&
               bookingDate.getMonth() === currentMonth &&
               bookingDate.getFullYear() === currentYear;
      })
      ?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

    // Pending payments - bookings that are confirmed but not completed
    const pendingPayments = bookings
      ?.filter(booking => booking.status === 'confirmed' && booking.total_amount && booking.total_amount > 0)
      ?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

    const completedBookings = bookings
      ?.filter(booking => booking.status === 'completed' && booking.total_amount && booking.total_amount > 0)
      ?.length || 0;

    const averageBookingValue = completedBookings > 0 ? totalEarnings / completedBookings : 0;

    console.log('🔍 [EARNINGS] Calculated values:', {
      totalEarnings,
      thisMonthEarnings,
      pendingPayments,
      completedBookings,
      averageBookingValue
    });

    return {
      totalEarnings,
      thisMonthEarnings,
      pendingPayments,
      averageBookingValue,
      totalBookings: bookings?.length || 0,
      completedBookings
    };
  } catch (error) {
    console.error('Error fetching earnings overview:', error);
    return {
      totalEarnings: 0,
      thisMonthEarnings: 0,
      pendingPayments: 0,
      averageBookingValue: 0,
      totalBookings: 0,
      completedBookings: 0
    };
  }
};

// Get monthly earnings for the last 6 months
export const getMonthlyEarnings = async (providerId: string): Promise<MonthlyEarnings[]> => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId);

    if (error) throw error;

    const monthlyData: { [key: string]: { earnings: number; bookings: number } } = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      monthlyData[monthKey] = { earnings: 0, bookings: 0 };
    }

    // Calculate earnings for each month - only completed bookings
    bookings?.forEach(booking => {
      if (booking.status === 'completed' && booking.total_amount && booking.total_amount > 0) {
        const bookingDate = new Date(booking.booking_date);
        const monthKey = bookingDate.toISOString().slice(0, 7);
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].earnings += booking.total_amount || 0;
          monthlyData[monthKey].bookings += 1;
        }
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      earnings: data.earnings,
      bookings: data.bookings
    }));
  } catch (error) {
    console.error('Error fetching monthly earnings:', error);
    return [];
  }
};

// Get payment method breakdown
export const getPaymentMethodBreakdown = async (providerId: string): Promise<PaymentMethodBreakdown[]> => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId);

    if (error) throw error;

    const methodData: { [key: string]: { earnings: number; bookings: number; methodName: string } } = {};
    let totalEarnings = 0;

    bookings?.forEach(booking => {
      if (booking.status === 'completed' && booking.total_amount && booking.total_amount > 0) {
        const method = booking.payment_method || 'cash_on_delivery';
        const methodName = booking.payment_method_name || 'Cash on Delivery';
        const amount = booking.total_amount || 0;

        if (!methodData[method]) {
          methodData[method] = { earnings: 0, bookings: 0, methodName };
        }

        methodData[method].earnings += amount;
        methodData[method].bookings += 1;
        totalEarnings += amount;
      }
    });

    return Object.entries(methodData).map(([method, data]) => ({
      method,
      methodName: data.methodName,
      earnings: data.earnings,
      bookings: data.bookings,
      percentage: totalEarnings > 0 ? (data.earnings / totalEarnings) * 100 : 0
    }));
  } catch (error) {
    console.error('Error fetching payment method breakdown:', error);
    return [];
  }
};

// Get service category earnings
export const getServiceCategoryEarnings = async (providerId: string): Promise<ServiceCategoryEarnings[]> => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId);

    if (error) throw error;

    const categoryData: { [key: string]: { earnings: number; bookings: number } } = {};

    bookings?.forEach(booking => {
      if (booking.status === 'completed' && booking.total_amount && booking.total_amount > 0) {
        const services = booking.selected_services || [];
        const amount = booking.total_amount || 0;

        services.forEach((service: any) => {
          const category = service.category || 'General';
          
          if (!categoryData[category]) {
            categoryData[category] = { earnings: 0, bookings: 0 };
          }

          categoryData[category].earnings += amount / services.length; // Split amount among services
          categoryData[category].bookings += 1;
        });
      }
    });

    return Object.entries(categoryData).map(([category, data]) => ({
      category,
      earnings: data.earnings,
      bookings: data.bookings,
      averageValue: data.bookings > 0 ? data.earnings / data.bookings : 0
    })).sort((a, b) => b.earnings - a.earnings);
  } catch (error) {
    console.error('Error fetching service category earnings:', error);
    return [];
  }
};

// Get recent transactions
export const getRecentTransactions = async (providerId: string, limit: number = 10): Promise<RecentTransaction[]> => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users (
          name
        )
      `)
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return bookings?.map(booking => ({
      id: booking.id,
      booking_date: booking.booking_date,
      total_amount: booking.total_amount,
      payment_method_name: booking.payment_method_name || 'Cash on Delivery',
      payment_status: booking.payment_status,
      user_name: booking.users?.name || 'Unknown User',
      service_location: booking.service_location,
      created_at: booking.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return [];
  }
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString()}`;
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
}; 

// Debug function to understand booking data
export const debugBookings = async (providerId: string) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId);

    if (error) throw error;

    console.log('🔍 [DEBUG] All bookings for provider:', bookings?.length);
    
    if (bookings && bookings.length > 0) {
      console.log('🔍 [DEBUG] Sample bookings:');
      bookings.slice(0, 3).forEach((booking, index) => {
        console.log(`Booking ${index + 1}:`, {
          id: booking.id,
          status: booking.status,
          payment_status: booking.payment_status,
          total_amount: booking.total_amount,
          booking_date: booking.booking_date,
          created_at: booking.created_at
        });
      });

      // Count by status
      const statusCounts = bookings.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Count by payment_status
      const paymentStatusCounts = bookings.reduce((acc, booking) => {
        acc[booking.payment_status] = (acc[booking.payment_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('🔍 [DEBUG] Status counts:', statusCounts);
      console.log('🔍 [DEBUG] Payment status counts:', paymentStatusCounts);
    }

    return bookings;
  } catch (error) {
    console.error('Error debugging bookings:', error);
    return [];
  }
}; 