import { supabase } from './supabaseClient';

export interface PaymentRequest {
  bookingId: string;
  paymentMethod: string;
  amount: number;
  userId: string;
  providerId: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'processing';
}

export interface PaymentMethodInfo {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
}

// Payment method configurations
export const PAYMENT_METHODS: Record<string, PaymentMethodInfo> = {
  cash_on_delivery: {
    id: 'cash_on_delivery',
    name: 'Cash on Delivery',
    description: 'Pay in cash when the service is completed',
    isAvailable: true
  },
  visa_debit_card: {
    id: 'visa_debit_card',
    name: 'Visa/Debit Card',
    description: 'Secure online payment with your card',
    isAvailable: true
  },
  easypaisa: {
    id: 'easypaisa',
    name: 'Easypaisa',
    description: 'Pay using Easypaisa mobile wallet',
    isAvailable: true
  }
};

// Get payment method name for display
export const getPaymentMethodName = (methodId: string): string => {
  return PAYMENT_METHODS[methodId]?.name || 'Cash on Delivery';
};

// Process payment based on method
export const processPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  try {
    console.log('🔄 Processing payment:', request);

    switch (request.paymentMethod) {
      case 'cash_on_delivery':
        return await processCashOnDelivery(request);
      
      case 'visa_debit_card':
        return await processCardPayment(request);
      
      case 'easypaisa':
        return await processEasypaisaPayment(request);
      
      default:
        throw new Error('Invalid payment method');
    }
  } catch (error) {
    console.error('❌ Payment processing failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Payment processing failed',
      paymentStatus: 'failed'
    };
  }
};

// Cash on Delivery processing
const processCashOnDelivery = async (request: PaymentRequest): Promise<PaymentResponse> => {
  try {
    // Update booking with payment method and status
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_method: request.paymentMethod,
        payment_method_name: getPaymentMethodName(request.paymentMethod),
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.bookingId);

    if (error) {
      throw error;
    }

    console.log('✅ Cash on Delivery payment processed successfully');
    
    return {
      success: true,
      message: 'Payment will be collected upon service completion',
      paymentStatus: 'pending'
    };
  } catch (error) {
    console.error('❌ Cash on Delivery processing failed:', error);
    throw error;
  }
};

// Card payment processing (simulated)
const processCardPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  try {
    // Simulate card payment processing
    console.log('💳 Processing card payment...');
    
    // In a real implementation, you would integrate with a payment gateway like Stripe
    // For now, we'll simulate the process
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful payment (90% success rate)
    const isSuccessful = Math.random() > 0.1;
    
    if (!isSuccessful) {
      throw new Error('Card payment failed. Please try again.');
    }

    // Generate transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update booking with payment details
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_method: request.paymentMethod,
        payment_method_name: getPaymentMethodName(request.paymentMethod),
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.bookingId);

    if (error) {
      throw error;
    }

    console.log('✅ Card payment processed successfully');
    
    return {
      success: true,
      message: 'Payment processed successfully',
      transactionId,
      paymentStatus: 'paid'
    };
  } catch (error) {
    console.error('❌ Card payment processing failed:', error);
    throw error;
  }
};

// Easypaisa payment processing (simulated)
const processEasypaisaPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  try {
    // Simulate Easypaisa payment processing
    console.log('📱 Processing Easypaisa payment...');
    
    // In a real implementation, you would integrate with Easypaisa API
    // For now, we'll simulate the process
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful payment (85% success rate)
    const isSuccessful = Math.random() > 0.15;
    
    if (!isSuccessful) {
      throw new Error('Easypaisa payment failed. Please try again.');
    }

    // Generate transaction ID
    const transactionId = `EP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update booking with payment details
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_method: request.paymentMethod,
        payment_method_name: getPaymentMethodName(request.paymentMethod),
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.bookingId);

    if (error) {
      throw error;
    }

    console.log('✅ Easypaisa payment processed successfully');
    
    return {
      success: true,
      message: 'Easypaisa payment processed successfully',
      transactionId,
      paymentStatus: 'paid'
    };
  } catch (error) {
    console.error('❌ Easypaisa payment processing failed:', error);
    throw error;
  }
};

// Get payment status for a booking
export const getPaymentStatus = async (bookingId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('payment_status, payment_method, payment_method_name')
      .eq('id', bookingId)
      .single();

    if (error) {
      throw error;
    }

    return data?.payment_status || null;
  } catch (error) {
    console.error('❌ Failed to get payment status:', error);
    return null;
  }
};

// Update payment status
export const updatePaymentStatus = async (
  bookingId: string, 
  status: 'pending' | 'paid' | 'failed' | 'refunded'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      throw error;
    }

    console.log(`✅ Payment status updated to: ${status}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to update payment status:', error);
    return false;
  }
};

// Get payment analytics
export const getPaymentAnalytics = async () => {
  try {
    const { data, error } = await supabase
      .from('booking_payment_analytics')
      .select('*');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Failed to get payment analytics:', error);
    return [];
  }
}; 