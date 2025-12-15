import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export interface ProviderApprovalEmailData {
  provider_name: string;
  provider_email: string;
  one_time_password: string;
  login_url: string;
  service_category: string;
}

export const sendProviderApprovalEmail = async (data: ProviderApprovalEmailData): Promise<boolean> => {
  console.log("=== EMAIL SERVICE START ===");
  console.log("EmailJS Config:", {
    SERVICE_ID: EMAILJS_SERVICE_ID,
    TEMPLATE_ID: EMAILJS_TEMPLATE_ID,
    PUBLIC_KEY: EMAILJS_PUBLIC_KEY ? "SET" : "NOT SET"
  });
  console.log("Input data:", data);
  
  try {
    const templateParams = {
      to_email: data.provider_email,
      to_name: data.provider_name,
      one_time_password: data.one_time_password,
      login_url: data.login_url,
      service_category: data.service_category
    };

    console.log("Template params:", templateParams);

    console.log("Calling emailjs.send...");
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("EmailJS response:", response);
    console.log("✅ Email sent successfully!");
    console.log("=== EMAIL SERVICE END ===");
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      text: error.text,
      name: error.name
    });
    console.log("=== EMAIL SERVICE END ===");
    return false;
  }
};



// Generate a secure one-time password
export const generateOneTimePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}; 