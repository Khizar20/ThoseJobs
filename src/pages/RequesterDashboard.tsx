import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import {
  User,
  Settings,
  Calendar,
  Star,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Edit,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  DollarSign,
  Briefcase,
  X,
  Eye,
  Filter,
  Search
} from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: string;
}

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  address: string;
  address_area: string;
  budget: number;
  worker_earnings: number;
  platform_fee: number;
  status: string;
  deadline: string;
  created_at: string;
  assigned_worker_id: string | null;
  accepting_quotes?: boolean;
  assigned_worker?: {
    name: string;
    rating_average: number;
    rating_count: number;
  };
}

interface Quote {
  id: string;
  job_id: string;
  worker_id: string;
  quoted_amount: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  worker?: {
    name: string;
    rating_average: number;
    rating_count: number;
  };
}

interface Transaction {
  id: string;
  job_id: string;
  total_amount: number;
  worker_payout: number;
  platform_fee: number;
  status: string;
  completed_at: string;
  job?: {
    title: string;
  };
}

const RequesterDashboard = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [activeTab, setActiveTab] = useState('my-jobs');
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showPostJobForm, setShowPostJobForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [jobToCancel, setJobToCancel] = useState<Job | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    city: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedJobForQuotes, setSelectedJobForQuotes] = useState<Job | null>(null);
  const [showQuotesDialog, setShowQuotesDialog] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isAcceptingQuote, setIsAcceptingQuote] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state for posting a job
  const [jobForm, setJobForm] = useState({
    title: '',
    category: '',
    description: '',
    address: '',
    address_area: '',
    budget: '',
    deadline: '',
    time_window_start: '',
    time_window_end: '',
    special_requirements: [] as string[],
    reference_images: [] as string[]
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          navigate('/login?role=requester');
          return;
        }

        // Get user profile from database using the UUID from Supabase Auth
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError || !userProfile) {
          toast({
            title: "Error",
            description: "User profile not found. Please complete registration.",
            variant: "destructive"
          });
          navigate('/login?role=requester');
          return;
        }

        // Verify user has requester role (support both old 'role' and new 'roles' array)
        // Handle roles array - Supabase may return it as string or array
        let userRoles: string[] = [];
        if (userProfile.roles) {
          if (Array.isArray(userProfile.roles)) {
            userRoles = userProfile.roles;
          } else if (typeof userProfile.roles === 'string') {
            // Parse string representation of array
            try {
              userRoles = JSON.parse(userProfile.roles);
            } catch (e) {
              // If parsing fails, try to extract from string format
              const match = userProfile.roles.match(/\[(.*?)\]/);
              if (match) {
                userRoles = match[1].split(',').map(r => r.trim().replace(/['"]/g, ''));
              }
            }
          }
        }
        
        // Fallback to old role field if roles array is empty
        if (userRoles.length === 0 && userProfile.role) {
          userRoles = [userProfile.role];
        }
        
        // Check if user has requester role
        if (!userRoles.includes('requester')) {
          toast({
            title: "Access Denied",
            description: "This dashboard is only for requesters.",
            variant: "destructive"
          });
          navigate('/login?role=requester');
          return;
        }

        // Update localStorage with correct user info (including roles array)
        const userInfoWithRoles = {
          ...userProfile,
          roles: userRoles,
          role: userRoles[0] || userProfile.role || 'requester'
        };
        localStorage.setItem('user_info', JSON.stringify(userInfoWithRoles));
        localStorage.setItem('user_role', 'requester'); // Store selected role
        localStorage.setItem('user_roles', JSON.stringify(userRoles)); // Store all roles
        
        // Set userInfo with proper structure matching UserInfo interface
        const userInfoData = {
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          city: userProfile.city || '',
          role: userRoles[0] || userProfile.role || 'requester'
        };
        setUserInfo(userInfoData);
        
        // Initialize profile form
        setProfileForm({
          name: userInfoData.name,
          phone: userInfoData.phone,
          city: userInfoData.city || 'Houston'
        });
      } catch (error) {
        navigate('/login?role=requester');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      if (!userInfo?.id) return;

      try {
        console.log('Fetching jobs for requester_id:', userInfo.id);
        
        // Try fetching with foreign key relationship
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            assigned_worker:users!assigned_worker_id (
              name,
              rating_average,
              rating_count
            )
          `)
          .eq('requester_id', userInfo.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching jobs with relationship:', error);
          
          // If foreign key relationship fails, try without it
          if (error.message?.includes('foreign key') || error.code === 'PGRST116' || error.message?.includes('relation')) {
            console.warn('Foreign key relationship failed, fetching without worker details');
            const { data: simpleData, error: simpleError } = await supabase
              .from('jobs')
              .select('*')
              .eq('requester_id', userInfo.id)
              .order('created_at', { ascending: false });
            
            if (simpleError) {
              console.error('Error fetching jobs without relationship:', simpleError);
              throw simpleError;
            }
            
            // Manually fetch worker details if assigned_worker_id exists
            const jobsWithWorkers = await Promise.all((simpleData || []).map(async (job: any) => {
              if (job.assigned_worker_id) {
                const { data: workerData } = await supabase
                  .from('users')
                  .select('name, rating_average, rating_count')
                  .eq('id', job.assigned_worker_id)
                  .single();
                
                return {
                  ...job,
                  assigned_worker: workerData || null
                };
              }
              return job;
            }));
            
            console.log('Jobs fetched successfully (without relationship):', jobsWithWorkers);
            setJobs(jobsWithWorkers);
            return;
          }
          
          throw error;
        }

        console.log('Jobs fetched successfully:', data);
        setJobs(data || []);
      } catch (error: any) {
        console.error('Failed to load jobs:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load your jobs. Please try again.",
          variant: "destructive"
        });
      }
    };

    fetchJobs();
  }, [userInfo?.id, toast]);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userInfo?.id) return;

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            job:jobs (
              title
            )
          `)
          .eq('requester_id', userInfo.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setTransactions(data || []);
      } catch (error: any) {
        // Silently fail for transactions - not critical
      }
    };

    fetchTransactions();
  }, [userInfo?.id]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo?.id) return;

    try {
      // Calculate fees (70/30 split)
      const budget = parseFloat(jobForm.budget);
      if (isNaN(budget) || budget <= 0) {
        toast({
          title: "Invalid Budget",
          description: "Please enter a valid budget amount greater than 0.",
          variant: "destructive"
        });
        return;
      }

      const workerEarnings = Math.round(budget * 0.70 * 100) / 100;
      const platformFee = Math.round(budget * 0.30 * 100) / 100;

      // Convert datetime-local strings to ISO format for TIMESTAMPTZ
      let deadlineISO = null;
      if (jobForm.deadline && jobForm.deadline.trim()) {
        deadlineISO = new Date(jobForm.deadline).toISOString();
      }

      // For time windows, combine with today's date
      let timeWindowStartISO = null;
      let timeWindowEndISO = null;
      if (jobForm.time_window_start && jobForm.time_window_start.trim()) {
        const today = new Date().toISOString().split('T')[0];
        timeWindowStartISO = new Date(`${today}T${jobForm.time_window_start}:00`).toISOString();
      }
      if (jobForm.time_window_end && jobForm.time_window_end.trim()) {
        const today = new Date().toISOString().split('T')[0];
        timeWindowEndISO = new Date(`${today}T${jobForm.time_window_end}:00`).toISOString();
      }

      // Prepare job data - only include fields that have values
      const jobData: any = {
        requester_id: userInfo.id,
        title: jobForm.title.trim(),
        category: jobForm.category,
        description: jobForm.description.trim(),
        budget: budget,
        worker_earnings: workerEarnings,
        platform_fee: platformFee,
        status: 'posted',
        accepting_quotes: true // Enable quote-based system by default
      };

      // Optional fields - only add if they have values
      if (jobForm.address && jobForm.address.trim()) {
        jobData.address = jobForm.address.trim();
      }
      if (jobForm.address_area && jobForm.address_area.trim()) {
        jobData.address_area = jobForm.address_area.trim();
      } else if (jobForm.address && jobForm.address.trim()) {
        jobData.address_area = jobForm.address.trim();
      }
      if (deadlineISO) {
        jobData.deadline = deadlineISO;
      }
      if (timeWindowStartISO) {
        jobData.time_window_start = timeWindowStartISO;
      }
      if (timeWindowEndISO) {
        jobData.time_window_end = timeWindowEndISO;
      }
      if (jobForm.special_requirements && jobForm.special_requirements.length > 0) {
        jobData.special_requirements = jobForm.special_requirements;
      }
      if (jobForm.reference_images && jobForm.reference_images.length > 0) {
        jobData.reference_images = jobForm.reference_images;
      }

      const { data, error } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to post job');
      }

      toast({
        title: "Job Posted!",
        description: "Your job has been posted successfully. Workers can now see and accept it.",
        variant: "success",
      });

      // Reset form
      setJobForm({
        title: '',
        category: '',
        description: '',
        address: '',
        address_area: '',
        budget: '',
        deadline: '',
        time_window_start: '',
        time_window_end: '',
        special_requirements: [],
        reference_images: []
      });
      setShowPostJobForm(false);

      // Refresh jobs list
      const { data: updatedJobs } = await supabase
        .from('jobs')
        .select(`
          *,
          assigned_worker:users (
            name,
            rating_average,
            rating_count
          )
        `)
        .eq('requester_id', userInfo.id)
        .order('created_at', { ascending: false });

      if (updatedJobs) {
        setJobs(updatedJobs);
        setActiveTab('my-jobs');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post job. Please check all required fields and try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'posted': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const fetchQuotesForJob = async (jobId: string) => {
    setIsLoadingQuotes(true);
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          worker:users!quotes_worker_id_fkey (
            name,
            rating_average,
            rating_count
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) {
        // Try without foreign key relationship
        const { data: simpleData, error: simpleError } = await supabase
          .from('quotes')
          .select('*')
          .eq('job_id', jobId)
          .order('created_at', { ascending: false });

        if (simpleError) throw simpleError;

        // Manually fetch worker details
        const quotesWithWorkers = await Promise.all((simpleData || []).map(async (quote: any) => {
          const { data: workerData } = await supabase
            .from('users')
            .select('name, rating_average, rating_count')
            .eq('id', quote.worker_id)
            .single();

          return {
            ...quote,
            worker: workerData || null
          };
        }));

        setQuotes(quotesWithWorkers);
        return;
      }

      setQuotes(data || []);
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
      toast({
        title: "Error",
        description: "Failed to load quotes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const handleViewQuotes = async (job: Job) => {
    setSelectedJobForQuotes(job);
    setShowQuotesDialog(true);
    await fetchQuotesForJob(job.id);
  };

  const handleAcceptQuote = async (quote: Quote) => {
    if (!selectedJobForQuotes) return;

    setIsAcceptingQuote(true);
    try {
      // Update quote status to accepted (trigger will handle the rest)
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quote.id);

      if (error) throw error;

      toast({
        title: "Quote Accepted!",
        description: `You've accepted ${quote.worker?.name || 'the worker'}'s quote. The job has been assigned.`,
        variant: "success",
      });

      // Refresh quotes and jobs
      await fetchQuotesForJob(selectedJobForQuotes.id);
      
      // Refresh jobs list
      const { data: updatedJobs } = await supabase
        .from('jobs')
        .select(`
          *,
          assigned_worker:users!assigned_worker_id (
            name,
            rating_average,
            rating_count
          )
        `)
        .eq('requester_id', userInfo?.id)
        .order('created_at', { ascending: false });

      if (updatedJobs) {
        setJobs(updatedJobs);
      }

      // Close dialog if job is now assigned
      const updatedJob = updatedJobs?.find(j => j.id === selectedJobForQuotes.id);
      if (updatedJob?.assigned_worker_id) {
        setShowQuotesDialog(false);
        setSelectedJobForQuotes(null);
      }
    } catch (error: any) {
      console.error('Error accepting quote:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAcceptingQuote(false);
    }
  };

  const handleRejectQuote = async (quote: Quote) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('id', quote.id);

      if (error) throw error;

      toast({
        title: "Quote Rejected",
        description: "The quote has been rejected.",
        variant: "default",
      });

      await fetchQuotesForJob(selectedJobForQuotes?.id || '');
    } catch (error: any) {
      console.error('Error rejecting quote:', error);
      toast({
        title: "Error",
        description: "Failed to reject quote. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancelClick = (job: Job) => {
    setJobToCancel(job);
    setShowCancelDialog(true);
  };

  const handleCancelJob = async () => {
    if (!jobToCancel || !userInfo?.id) return;

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobToCancel.id)
        .eq('requester_id', userInfo.id);

      if (error) throw error;

      toast({
        title: "Job Cancelled",
        description: "The job has been cancelled successfully.",
        variant: "default",
      });

      // Refresh jobs list
      const { data: updatedJobs } = await supabase
        .from('jobs')
        .select(`
          *,
          assigned_worker:users!assigned_worker_id (
            name,
            rating_average,
            rating_count
          )
        `)
        .eq('requester_id', userInfo.id)
        .order('created_at', { ascending: false });

      if (updatedJobs) {
        setJobs(updatedJobs);
      }

      setShowCancelDialog(false);
      setJobToCancel(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel job. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userInfo?.id) return;

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileForm.name,
          phone: profileForm.phone,
          city: profileForm.city,
          updated_at: new Date().toISOString()
        })
        .eq('id', userInfo.id);

      if (error) throw error;

      // Update local state
      setUserInfo({
        ...userInfo,
        name: profileForm.name,
        phone: profileForm.phone,
        city: profileForm.city
      });

      // Update localStorage
      const storedUserInfo = localStorage.getItem('user_info');
      if (storedUserInfo) {
        const userInfoData = JSON.parse(storedUserInfo);
        userInfoData.name = profileForm.name;
        userInfoData.phone = profileForm.phone;
        userInfoData.city = profileForm.city;
        localStorage.setItem('user_info', JSON.stringify(userInfoData));
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
        variant: "success",
      });

      setIsEditingProfile(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 pt-32">
        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden mb-6">
          <div className="flex overflow-x-auto space-x-2 pb-2">
            <Button
              variant={activeTab === 'my-jobs' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('my-jobs')}
              className="whitespace-nowrap"
            >
              <Briefcase className="w-4 h-4 mr-1" />
              My Jobs
            </Button>
            <Button
              variant={activeTab === 'post-job' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('post-job')}
              className="whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" />
              Post Job
            </Button>
            <Button
              variant={activeTab === 'payments' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('payments')}
              className="whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Payments
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('settings')}
              className="whitespace-nowrap"
            >
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requester Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'my-jobs' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('my-jobs')}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  My Jobs
                </Button>
                <Button
                  variant={activeTab === 'post-job' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('post-job')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post a Job
                </Button>
                <Button
                  variant={activeTab === 'payments' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('payments')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payments
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

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* My Jobs Tab */}
            {activeTab === 'my-jobs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">My Jobs</h2>
                    <p className="text-muted-foreground">Manage your posted jobs</p>
                  </div>
                  <Button onClick={() => setActiveTab('post-job')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                </div>

                {/* Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search jobs..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="posted">Posted</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="disputed">Disputed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Jobs List */}
                {filteredJobs.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {jobs.length === 0 ? "No Jobs Yet" : "No Jobs Found"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {jobs.length === 0 
                          ? "Start by posting your first job!"
                          : "Try adjusting your search or filters."}
                      </p>
                      {jobs.length === 0 && (
                        <Button onClick={() => setActiveTab('post-job')}>
                          <Plus className="w-4 h-4 mr-2" />
                          Post Your First Job
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{job.title}</h3>
                                <Badge className={getStatusColor(job.status)}>
                                  {job.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{job.category}</p>
                              <p className="text-sm mb-3">{job.description}</p>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {job.address_area || job.address}
                                </span>
                                {job.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Due: {formatDate(job.deadline)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Posted: {formatDate(job.created_at)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-primary">
                                ${job.budget.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Worker: ${job.worker_earnings.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Fee: ${job.platform_fee.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Assigned Worker Info */}
                          {job.assigned_worker_id && job.assigned_worker && (
                            <div className="mb-4 p-3 bg-secondary rounded-lg">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">Assigned Worker:</span>
                                <span>{job.assigned_worker.name}</span>
                                {job.assigned_worker.rating_average > 0 && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm">
                                      {job.assigned_worker.rating_average.toFixed(1)} 
                                      ({job.assigned_worker.rating_count})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(job)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            {job.status === 'posted' && job.accepting_quotes !== false && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewQuotes(job)}
                                className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:border-purple-800 dark:text-purple-300"
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                View Quotes
                              </Button>
                            )}
                            {job.assigned_worker_id && (
                              <Button variant="outline" size="sm">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                Chat
                              </Button>
                            )}
                            {(job.status === 'posted' || job.status === 'accepted') && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleCancelClick(job)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                            {job.status === 'submitted' && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Post Job Tab */}
            {activeTab === 'post-job' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-2">Post a Job</h2>
                  <p className="text-muted-foreground">Create a new job listing for workers to accept</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                    <CardDescription>Fill in the details of the task you need completed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePostJob} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Job Title *</Label>
                        <Input
                          id="title"
                          value={jobForm.title}
                          onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                          placeholder="e.g., Change lightbulb on sign"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={jobForm.category}
                          onValueChange={(value) => setJobForm({ ...jobForm, category: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Photos">Photos</SelectItem>
                            <SelectItem value="Pickup/Dropoff">Pickup/Dropoff</SelectItem>
                            <SelectItem value="Walkthrough">Walkthrough</SelectItem>
                            <SelectItem value="Signage">Signage</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={jobForm.description}
                          onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                          placeholder="Describe the task in detail..."
                          rows={5}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Full Address</Label>
                          <Input
                            id="address"
                            value={jobForm.address}
                            onChange={(e) => setJobForm({ ...jobForm, address: e.target.value })}
                            placeholder="Full address (shown after acceptance)"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address_area">Area/ZIP (Public) *</Label>
                          <Input
                            id="address_area"
                            value={jobForm.address_area}
                            onChange={(e) => setJobForm({ ...jobForm, address_area: e.target.value })}
                            placeholder="e.g., Houston, TX 77001"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            This will be shown to workers before they accept the job
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="budget">Budget (Total Amount) *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="budget"
                            type="number"
                            step="0.01"
                            min="0"
                            value={jobForm.budget}
                            onChange={(e) => setJobForm({ ...jobForm, budget: e.target.value })}
                            className="pl-10"
                            placeholder="100.00"
                            required
                          />
                        </div>
                        {jobForm.budget && (
                          <div className="text-sm text-muted-foreground mt-2 p-3 bg-secondary rounded-lg">
                            <p>Worker Earnings: <strong>${(parseFloat(jobForm.budget) * 0.70).toFixed(2)}</strong> (70%)</p>
                            <p>Platform Fee: <strong>${(parseFloat(jobForm.budget) * 0.30).toFixed(2)}</strong> (30%)</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="deadline">Deadline</Label>
                          <Input
                            id="deadline"
                            type="datetime-local"
                            value={jobForm.deadline}
                            onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time_window">Time Window</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="time"
                              value={jobForm.time_window_start}
                              onChange={(e) => setJobForm({ ...jobForm, time_window_start: e.target.value })}
                              placeholder="Start"
                            />
                            <Input
                              type="time"
                              value={jobForm.time_window_end}
                              onChange={(e) => setJobForm({ ...jobForm, time_window_end: e.target.value })}
                              placeholder="End"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button type="submit" className="flex-1">
                          <Plus className="w-4 h-4 mr-2" />
                          Post Job
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setJobForm({
                              title: '',
                              category: '',
                              description: '',
                              address: '',
                              address_area: '',
                              budget: '',
                              deadline: '',
                              time_window_start: '',
                              time_window_end: '',
                              special_requirements: [],
                              reference_images: []
                            });
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-2">Payments</h2>
                  <p className="text-muted-foreground">View your payment history and fees</p>
                </div>

                {transactions.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                      <p className="text-muted-foreground">
                        Your payment history will appear here once jobs are completed.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <Card key={transaction.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">
                                {transaction.job?.title || 'Job'}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {transaction.completed_at ? formatDate(transaction.completed_at) : 'Pending'}
                              </p>
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Total: </span>
                                  <span className="font-medium">${transaction.total_amount.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Worker Payout: </span>
                                  <span className="font-medium">${transaction.worker_payout.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Platform Fee: </span>
                                  <span className="font-medium">${transaction.platform_fee.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            <Badge
                              className={
                                transaction.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : transaction.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-2">Settings</h2>
                  <p className="text-muted-foreground">Manage your account settings</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Add payment methods for posting jobs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Payment method management will be integrated with Stripe Connect.
                    </p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your personal information</CardDescription>
                    </div>
                    {!isEditingProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditingProfile ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="profile-name">Name *</Label>
                          <Input
                            id="profile-name"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            placeholder="Your full name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={userInfo.email}
                            disabled
                            className="bg-muted cursor-not-allowed"
                          />
                          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-phone">Phone *</Label>
                          <Input
                            id="profile-phone"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            placeholder="Your phone number"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-city">City *</Label>
                          <Input
                            id="profile-city"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                            placeholder="Your city"
                            required
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={handleUpdateProfile}
                            disabled={isUpdatingProfile}
                            className="flex-1"
                          >
                            {isUpdatingProfile ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditingProfile(false);
                              setProfileForm({
                                name: userInfo.name,
                                phone: userInfo.phone,
                                city: userInfo.city || 'Houston'
                              });
                            }}
                            disabled={isUpdatingProfile}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label>Name</Label>
                          <p className="text-sm mt-1">{userInfo.name}</p>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <p className="text-sm mt-1">{userInfo.email}</p>
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <p className="text-sm mt-1">{userInfo.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label>City</Label>
                          <p className="text-sm mt-1">{userInfo.city || 'Houston'}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={showJobDetails} onOpenChange={setShowJobDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-primary/20 dark:border-primary/30 shadow-2xl overflow-hidden flex flex-col">
          {/* Header Section with Gradient */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 px-6 py-5 border-b border-primary/10">
            <DialogHeader>
              <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {selectedJob?.title}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Complete job details and information
              </DialogDescription>
            </DialogHeader>
            
            {/* Status and Category Badges */}
            {selectedJob && (
              <div className="flex items-center gap-3 mt-4">
                <Badge className={`${getStatusColor(selectedJob.status)} text-sm px-3 py-1 font-semibold`}>
                  {selectedJob.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-1 border-primary/30 text-primary">
                  {selectedJob.category}
                </Badge>
              </div>
            )}
          </div>

          {/* Scrollable Content Area */}
          {selectedJob && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Description Section */}
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h4 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Description
                </h4>
                <p className="text-muted-foreground leading-relaxed text-base">{selectedJob.description}</p>
              </div>

              {/* Location and Budget Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg p-5 border border-blue-200 dark:border-blue-800/30 shadow-sm">
                  <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Location
                  </h4>
                  <div className="space-y-1">
                    <p className="text-foreground font-medium">
                      {selectedJob.address_area || selectedJob.address || 'Not specified'}
                    </p>
                    {selectedJob.address && selectedJob.address_area && (
                      <p className="text-sm text-muted-foreground mt-2">{selectedJob.address}</p>
                    )}
                  </div>
                </div>

                {/* Budget Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-lg p-5 border border-green-200 dark:border-green-800/30 shadow-sm">
                  <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Budget Breakdown
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-primary">${selectedJob.budget.toFixed(2)}</p>
                      <span className="text-xs text-muted-foreground">Total</span>
                    </div>
                    <div className="pt-2 border-t border-green-200 dark:border-green-800/30 space-y-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Worker Earnings:</span>
                        <span className="font-semibold text-foreground">${selectedJob.worker_earnings.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Platform Fee:</span>
                        <span className="font-semibold text-foreground">${selectedJob.platform_fee.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedJob.deadline && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-lg p-5 border border-orange-200 dark:border-orange-800/30 shadow-sm">
                    <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      Deadline
                    </h4>
                    <p className="text-foreground font-medium">{formatDate(selectedJob.deadline)}</p>
                  </div>
                )}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-lg p-5 border border-purple-200 dark:border-purple-800/30 shadow-sm">
                  <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Posted Date
                  </h4>
                  <p className="text-foreground font-medium">{formatDate(selectedJob.created_at)}</p>
                </div>
              </div>

              {/* Time Window */}
              {(selectedJob.time_window_start || selectedJob.time_window_end) && (
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-lg p-5 border border-indigo-200 dark:border-indigo-800/30 shadow-sm">
                  <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Preferred Time Window
                  </h4>
                  <p className="text-foreground font-medium">
                    {selectedJob.time_window_start && formatDate(selectedJob.time_window_start)}
                    {selectedJob.time_window_start && selectedJob.time_window_end && ' - '}
                    {selectedJob.time_window_end && formatDate(selectedJob.time_window_end)}
                  </p>
                </div>
              )}

              {/* Assigned Worker */}
              {selectedJob.assigned_worker_id && selectedJob.assigned_worker && (
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 rounded-lg p-5 border border-cyan-200 dark:border-cyan-800/30 shadow-sm">
                  <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    Assigned Worker
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{selectedJob.assigned_worker.name}</p>
                      {selectedJob.assigned_worker.rating_average > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-foreground">
                              {selectedJob.assigned_worker.rating_average.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({selectedJob.assigned_worker.rating_count} {selectedJob.assigned_worker.rating_count === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Special Requirements */}
              {selectedJob.special_requirements && selectedJob.special_requirements.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-lg p-5 border border-amber-200 dark:border-amber-800/30 shadow-sm">
                  <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    Special Requirements
                  </h4>
                  <ul className="space-y-2">
                    {selectedJob.special_requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                        <span className="flex-1">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowJobDetails(false)}
                className="min-w-[100px]"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Job Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Cancel Job?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to cancel "{jobToCancel?.title}"? This action cannot be undone.
              {jobToCancel?.assigned_worker_id && (
                <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                  Note: A worker has already been assigned to this job. They will be notified of the cancellation.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling} className="text-foreground">
              Keep Job
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelJob}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancelling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Job'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quotes Dialog */}
      <Dialog open={showQuotesDialog} onOpenChange={setShowQuotesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Quotes for {selectedJobForQuotes?.title}
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600 dark:text-gray-300 mt-1">
                  Review quotes submitted by workers for this job. Select the best quote to assign the job.
                </DialogDescription>
              </div>
              {quotes.length > 0 && (
                <Badge className="bg-purple-500 text-white text-sm px-3 py-1">
                  {quotes.length} {quotes.length === 1 ? 'Quote' : 'Quotes'}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 py-4">
            {isLoadingQuotes ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Quotes Yet</p>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Workers haven't submitted any quotes for this job yet. Check back later!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
              {quotes.map((quote, index) => (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    className={`border-2 transition-all duration-200 ${
                      quote.status === 'accepted' 
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 shadow-green-500/20' 
                        : quote.status === 'rejected'
                        ? 'border-gray-300 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        : 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-lg hover:shadow-purple-500/10'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          {/* Worker Info Header */}
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${
                              quote.status === 'accepted' 
                                ? 'bg-green-100 dark:bg-green-900/30' 
                                : 'bg-primary/10'
                            }`}>
                              <User className={`w-6 h-6 ${
                                quote.status === 'accepted' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-primary'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                                  {quote.worker?.name || 'Unknown Worker'}
                                </h4>
                                {quote.worker?.rating_average && quote.worker.rating_average > 0 && (
                                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 rounded-md border border-yellow-200 dark:border-yellow-800">
                                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                                      {quote.worker.rating_average.toFixed(1)}
                                    </span>
                                    {quote.worker.rating_count > 0 && (
                                      <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                        ({quote.worker.rating_count})
                                      </span>
                                    )}
                                  </div>
                                )}
                                {quote.status === 'pending' && (
                                  <Badge className="bg-purple-500 text-white">
                                    Pending Review
                                  </Badge>
                                )}
                                {quote.status === 'accepted' && (
                                  <Badge className="bg-green-500 text-white">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Accepted
                                  </Badge>
                                )}
                                {quote.status === 'rejected' && (
                                  <Badge variant="outline" className="border-gray-300 text-gray-600">
                                    Rejected
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Submitted {new Date(quote.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>

                        {/* Quote Amount */}
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-4 border border-primary/20 dark:border-primary/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Quote Amount</p>
                              <p className="text-3xl font-bold text-primary dark:text-primary-foreground">
                                ${quote.quoted_amount.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Worker Receives</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                ${(quote.quoted_amount * 0.7).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">(after 30% fee)</p>
                            </div>
                          </div>
                        </div>

                        {/* Message */}
                        {quote.message && (
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Message:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                              {quote.message}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {quote.status === 'pending' && !selectedJobForQuotes?.assigned_worker_id && (
                        <div className="flex flex-col gap-3 lg:min-w-[160px]">
                          <Button
                            onClick={() => handleAcceptQuote(quote)}
                            disabled={isAcceptingQuote}
                            className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold border-2 border-primary"
                            size="lg"
                          >
                            {isAcceptingQuote ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Accepting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accept Quote
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleRejectQuote(quote)}
                            variant="outline"
                            size="lg"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-2 border-red-300 dark:border-red-800 font-medium"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowQuotesDialog(false);
                setSelectedJobForQuotes(null);
                setQuotes([]);
              }}
              className="w-full sm:w-auto bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequesterDashboard;

