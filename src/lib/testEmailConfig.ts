import { supabase } from './supabaseClient';

export const testEmailConfiguration = async (email: string) => {
  console.log("=== TESTING EMAIL CONFIGURATION ===");
  console.log("Testing email:", email);
  
  try {
    // Test 1: Check if user exists and email confirmation status
    console.log("🔄 Checking user email confirmation status...");
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    console.log("User data:", userData);
    console.log("User error:", userError);

    if (userError) {
      return { 
        success: false, 
        error: `User not found in database: ${userError.message}`,
        userExists: false
      };
    }

    console.log("✅ User found in database");

    // Test 2: Check email confirmation status
    const isEmailConfirmed = userData.email_confirmed_at !== null;
    console.log("Email confirmed:", isEmailConfirmed);
    console.log("Email confirmed at:", userData.email_confirmed_at);

    // Test 3: Try to resend confirmation email (only if not confirmed)
    if (!isEmailConfirmed) {
      console.log("🔄 Testing email resend functionality...");
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      console.log("Resend error:", resendError);

      if (resendError) {
        return { 
          success: false, 
          error: `Failed to resend email: ${resendError.message}`,
          userExists: true,
          emailConfirmed: false
        };
      }

      console.log("✅ Email resend test successful");
    } else {
      console.log("⚠️ Email already confirmed, skipping resend test");
    }

    // Test 4: Check Supabase Auth user status (if possible)
    console.log("🔄 Checking Supabase Auth status...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session);
      
      if (session) {
        console.log("✅ User has active session");
        console.log("Session user email confirmed:", session.user.email_confirmed_at);
      } else {
        console.log("⚠️ No active session found");
      }
    } catch (authError) {
      console.log("⚠️ Could not check auth status:", authError);
    }

    return { 
      success: true, 
      message: "Email configuration test completed successfully",
      userData,
      emailConfirmed: isEmailConfirmed,
      userExists: true
    };

  } catch (error: any) {
    console.error("❌ Email configuration test failed:", error);
    return { 
      success: false, 
      error: error.message,
      userExists: false
    };
  }
};

export const checkEmailSettings = async () => {
  console.log("=== CHECKING EMAIL SETTINGS ===");
  
  try {
    // This would require admin privileges, but we can check what we can
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log("✅ User is authenticated");
      console.log("Session user:", session.user);
      
      // Check if email is confirmed
      const isEmailConfirmed = session.user.email_confirmed_at !== null;
      console.log("Email confirmed:", isEmailConfirmed);
      
      return { 
        success: true, 
        emailConfirmed: isEmailConfirmed,
        userId: session.user.id
      };
    } else {
      console.log("⚠️ No authenticated session");
      return { success: false, error: "No authenticated session" };
    }
  } catch (error: any) {
    console.error("❌ Email settings check failed:", error);
    return { success: false, error: error.message };
  }
}; 

export const testSupabaseEmailConfig = async () => {
  console.log("=== TESTING SUPABASE EMAIL CONFIGURATION ===");
  
  try {
    // Test 1: Check if we can access Supabase Auth
    console.log("🔄 Testing Supabase Auth access...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log("Session check result:", { session: !!session, error: sessionError });
    
    // Test 2: Try to get current user info
    if (session) {
      console.log("✅ User is authenticated");
      console.log("User email:", session.user.email);
      console.log("Email confirmed:", session.user.email_confirmed_at);
      console.log("User ID:", session.user.id);
      
      return {
        success: true,
        message: "Supabase Auth is working correctly",
        userEmail: session.user.email,
        emailConfirmed: !!session.user.email_confirmed_at,
        userId: session.user.id
      };
    } else {
      console.log("⚠️ No authenticated session");
      
      // Test 3: Try to sign up a test user to check email functionality
      console.log("🔄 Testing email functionality with test signup...");
      const testEmail = `test-${Date.now()}@example.com`;
      
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123'
      });
      
      console.log("Test signup result:", { signupData, signupError });
      
      if (signupError) {
        return {
          success: false,
          error: `Email configuration issue: ${signupError.message}`,
          details: signupError
        };
      }
      
      if (signupData.user) {
        console.log("✅ Test user created successfully");
        console.log("Test user ID:", signupData.user.id);
        
        // Clean up test user
        console.log("🔄 Cleaning up test user...");
        const { error: deleteError } = await supabase.auth.admin.deleteUser(signupData.user.id);
        
        if (deleteError) {
          console.log("⚠️ Could not delete test user:", deleteError);
        } else {
          console.log("✅ Test user deleted successfully");
        }
        
        return {
          success: true,
          message: "Supabase email configuration is working correctly",
          testUserCreated: true,
          testUserDeleted: !deleteError
        };
      }
    }
    
    return {
      success: false,
      error: "Could not test email configuration - no session and signup failed"
    };
    
  } catch (error: any) {
    console.error("❌ Supabase email config test failed:", error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}; 

export const testPasswordReset = async (email: string) => {
  console.log("=== TESTING PASSWORD RESET ===");
  console.log("Testing password reset for email:", email);
  
  try {
    // Test 1: Check if user exists
    console.log("🔄 Checking if user exists...");
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return { 
        success: false, 
        error: "User not found in database",
        userExists: false
      };
    }

    console.log("✅ User found in database");

    // Test 2: Try to send password reset email
    console.log("🔄 Testing password reset email...");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (resetError) {
      return { 
        success: false, 
        error: `Failed to send reset email: ${resetError.message}`,
        userExists: true
      };
    }

    console.log("✅ Password reset email sent successfully");

    return { 
      success: true, 
      message: "Password reset email sent successfully",
      userExists: true
    };

  } catch (error: any) {
    console.error("❌ Password reset test failed:", error);
    return { 
      success: false, 
      error: error.message,
      userExists: false
    };
  }
}; 