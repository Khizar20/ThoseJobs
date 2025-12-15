import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

interface UserRouteGuardProps {
  children: React.ReactNode;
}

const UserRouteGuard = ({ children }: UserRouteGuardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      // Check if user is logged in with valid token
      const userToken = localStorage.getItem('user_token');
      const tokenData = localStorage.getItem('user_token_data');
      const storedUserInfo = localStorage.getItem('user_info');

      if (!userToken || !tokenData || !storedUserInfo) {
        navigate('/user-login');
        return;
      }

      // Check if this is a mock token (hardcoded login)
      if (userToken.startsWith('mock-requester-token-') || userToken.startsWith('mock-')) {
        // Allow mock tokens for hardcoded login
        setIsAuthenticated(true);
        return;
      }

      // Verify session with Supabase for real users
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        handleLogout();
        return;
      }

      // Verify user exists
      const userInfo = JSON.parse(storedUserInfo);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError || !userData) {
        handleLogout();
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Authentication check failed:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_token_data');
    localStorage.removeItem('user_info');
    setIsAuthenticated(false);
    navigate('/user-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
};

export default UserRouteGuard; 