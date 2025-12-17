import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

const EmailVerificationSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const role = searchParams.get('role') || 'requester';

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to appropriate login page
          // Use window.location.origin to work with any domain
          const loginUrl = `${window.location.origin}/login?role=${role}`;
          window.location.href = loginUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [role]);

  const handleGoToLogin = () => {
    // Use window.location.origin to work with any domain
    const loginUrl = `${window.location.origin}/login?role=${role}`;
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Email Verified Successfully!
            </CardTitle>
            <CardDescription className="text-base">
              Your email has been confirmed. You can now log in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 text-center">
                <strong>Authentication completed!</strong>
              </p>
              <p className="text-xs text-green-700 text-center mt-2">
                You will be redirected to the login page in {countdown} seconds...
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleGoToLogin}
                className="w-full"
                size="lg"
              >
                Go to Login Page
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Link to="/">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Redirecting to {role === 'worker' ? 'worker' : 'requester'} login page...
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmailVerificationSuccess;
