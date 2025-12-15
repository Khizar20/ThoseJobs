import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { Briefcase, User, Users, ArrowRight, ArrowLeft, Home } from "lucide-react";

type UserRole = 'requester' | 'worker' | 'affiliate';

const ChooseRole = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selectedRole) return;
    
    // Navigate to signup with role parameter
    navigate(`/signup?role=${selectedRole}`);
  };

  const roles: Array<{
    id: UserRole;
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
  }> = [
    {
      id: 'requester',
      title: 'I need jobs done',
      description: 'Post tasks and get them completed by verified workers',
      icon: <User className="w-8 h-8" />,
      features: [
        'Post jobs quickly',
        'Set your budget',
        'Choose verified workers',
        'Track job progress'
      ]
    },
    {
      id: 'worker',
      title: 'I want to do jobs',
      description: 'Earn money by completing small tasks in your area',
      icon: <Briefcase className="w-8 h-8" />,
      features: [
        'Browse available jobs',
        'Set your own schedule',
        'Get paid quickly',
        'Build your rating'
      ]
    },
    {
      id: 'affiliate',
      title: 'Partner with us',
      description: 'Earn commissions by referring workers and requesters',
      icon: <Users className="w-8 h-8" />,
      features: [
        'Track referrals',
        'Earn commissions',
        'Get paid monthly',
        'Access marketing tools'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070A] via-[#0A0E14] to-[#05070A]">
      {/* Header Navigation */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>

            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0846BC] rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">ThoseJobs</span>
            </Link>

            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              Join ThoseJobs
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-white/70"
            >
              Choose how you want to use ThoseJobs
            </motion.p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-300 h-full ${
                    selectedRole === role.id
                      ? 'ring-2 ring-[#0846BC] bg-[#0846BC]/10 border-[#0846BC]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader className="text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      selectedRole === role.id
                        ? 'bg-[#0846BC] text-white'
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {role.icon}
                    </div>
                    <CardTitle className="text-white">{role.title}</CardTitle>
                    <CardDescription className="text-white/60">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {role.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-white/80">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            selectedRole === role.id ? 'bg-[#0846BC]' : 'bg-white/40'
                          }`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              onClick={handleContinue}
              disabled={!selectedRole}
              className="w-full md:w-auto min-w-[200px] bg-[#0846BC] hover:bg-[#063A9B] text-white"
              size="lg"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-white/60 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0846BC] hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChooseRole;

