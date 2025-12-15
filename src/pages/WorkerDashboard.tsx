import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import {
  User,
  Settings,
  Calendar,
  Star,
  DollarSign,
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
  Briefcase,
  X,
  Eye,
  Filter,
  Search,
  TrendingUp,
  Award
} from "lucide-react";

interface WorkerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: string;
  rating_average: number;
  rating_count: number;
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
  deadline: string | null;
  time_window_start: string | null;
  time_window_end: string | null;
  created_at: string;
  requester_id: string;
  assigned_worker_id: string | null;
  requester?: {
    name: string;
    rating_average: number;
    rating_count: number;
  };
}

interface JobAssignment {
  id: string;
  job_id: string;
  worker_id: string;
  status: string;
  started_at: string | null;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
  job?: Job;
}

interface Transaction {
  id: string;
  job_id: string;
  worker_id: string;
  total_amount: number;
  worker_payout: number;
  platform_fee: number;
  status: string;
  completed_at: string | null;
  job?: {
    title: string;
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
  job?: {
    id: string;
    title: string;
    category: string;
    description: string;
    address_area: string;
    budget: number;
    status: string;
    requester?: {
      name: string;
    };
  };
}

const WorkerDashboard = () => {
  const [workerInfo, setWorkerInfo] = useState<WorkerInfo | null>(null);
  const [activeTab, setActiveTab] = useState('my-jobs');
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<JobAssignment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [jobToAccept, setJobToAccept] = useState<Job | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          navigate('/login?role=worker');
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
          navigate('/login?role=worker');
          return;
        }

        // Check if user has worker role
        let userRoles: string[] = [];
        if (userProfile.roles) {
          if (Array.isArray(userProfile.roles)) {
            userRoles = userProfile.roles;
          } else if (typeof userProfile.roles === 'string') {
            try {
              userRoles = JSON.parse(userProfile.roles);
            } catch (e) {
              const match = userProfile.roles.match(/\[(.*?)\]/);
              if (match) {
                userRoles = match[1].split(',').map(r => r.trim().replace(/['"]/g, ''));
              }
            }
          }
        }
        
        if (userRoles.length === 0 && userProfile.role) {
          userRoles = [userProfile.role];
        }
        
        if (!userRoles.includes('worker')) {
          toast({
            title: "Access Denied",
            description: "This dashboard is only for workers.",
            variant: "destructive"
          });
          navigate('/login?role=worker');
          return;
        }

        // Set worker info
        setWorkerInfo({
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          city: userProfile.city || 'Houston',
          role: 'worker',
          rating_average: userProfile.rating_average || 0,
          rating_count: userProfile.rating_count || 0
        });

        // Update localStorage
        const userInfoWithRoles = {
          ...userProfile,
          roles: userRoles,
          role: 'worker'
        };
        localStorage.setItem('user_info', JSON.stringify(userInfoWithRoles));
        localStorage.setItem('user_role', 'worker');
        localStorage.setItem('user_roles', JSON.stringify(userRoles));
        localStorage.setItem('user_token', session.access_token);
        localStorage.setItem('user_token_data', JSON.stringify({
          token: session.access_token,
          timestamp: Date.now()
        }));
      } catch (error) {
        navigate('/login?role=worker');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  // Fetch assigned jobs
  useEffect(() => {
    const fetchAssignedJobs = async () => {
      if (!workerInfo?.id) return;

      try {
        const { data, error } = await supabase
          .from('job_assignments')
          .select(`
            *,
            job:jobs!inner (
              *,
              requester:users!jobs_requester_id_fkey (
                name,
                rating_average,
                rating_count
              )
            )
          `)
          .eq('worker_id', workerInfo.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setAssignedJobs(data || []);
        
        // Extract jobs from assignments
        const jobsFromAssignments = (data || []).map((assignment: any) => ({
          ...assignment.job,
          assignment_status: assignment.status,
          assignment_id: assignment.id
        }));
        setJobs(jobsFromAssignments);
      } catch (error: any) {
        console.error('Error fetching assigned jobs:', error);
        toast({
          title: "Error",
          description: "Failed to load your jobs.",
          variant: "destructive"
        });
      }
    };

    fetchAssignedJobs();
  }, [workerInfo?.id, toast]);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!workerInfo?.id) return;

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            job:jobs (
              title
            )
          `)
          .eq('worker_id', workerInfo.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setTransactions(data || []);
      } catch (error: any) {
        // Silently fail for transactions
      }
    };

    fetchTransactions();
  }, [workerInfo?.id]);

  // Fetch quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      if (!workerInfo?.id) return;

      setIsLoadingQuotes(true);
      try {
        const { data, error } = await supabase
          .from('quotes')
          .select(`
            *,
            job:jobs (
              id,
              title,
              category,
              description,
              address_area,
              budget,
              status,
              requester:users!jobs_requester_id_fkey (
                name
              )
            )
          `)
          .eq('worker_id', workerInfo.id)
          .order('created_at', { ascending: false });

        if (error) {
          // Try without foreign key relationship
          const { data: simpleData, error: simpleError } = await supabase
            .from('quotes')
            .select('*')
            .eq('worker_id', workerInfo.id)
            .order('created_at', { ascending: false });

          if (simpleError) throw simpleError;

          // Manually fetch job details
          const quotesWithJobs = await Promise.all((simpleData || []).map(async (quote: any) => {
            const { data: jobData } = await supabase
              .from('jobs')
              .select('id, title, category, description, address_area, budget, status, requester_id')
              .eq('id', quote.job_id)
              .single();

            if (jobData?.requester_id) {
              const { data: requesterData } = await supabase
                .from('users')
                .select('name')
                .eq('id', jobData.requester_id)
                .single();

              return {
                ...quote,
                job: jobData ? {
                  ...jobData,
                  requester: requesterData || null
                } : null
              };
            }

            return {
              ...quote,
              job: jobData || null
            };
          }));

          setQuotes(quotesWithJobs);
          return;
        }

        setQuotes(data || []);
      } catch (error: any) {
        console.error('Error fetching quotes:', error);
        toast({
          title: "Error",
          description: "Failed to load quotes.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingQuotes(false);
      }
    };

    if (activeTab === 'my-quotes') {
      fetchQuotes();
    }
  }, [workerInfo?.id, activeTab, toast]);

  const handleAcceptJob = async () => {
    if (!jobToAccept || !workerInfo?.id) return;

    setIsAccepting(true);
    try {
      // Create job assignment
      const { error: assignmentError } = await supabase
        .from('job_assignments')
        .insert({
          job_id: jobToAccept.id,
          worker_id: workerInfo.id,
          status: 'accepted'
        });

      if (assignmentError) throw assignmentError;

      // Update job status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          status: 'accepted',
          assigned_worker_id: workerInfo.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobToAccept.id);

      if (jobError) throw jobError;

      toast({
        title: "Job Accepted!",
        description: "You have successfully accepted this job.",
      });

      // Refresh jobs list
      const { data: updatedAssignments } = await supabase
        .from('job_assignments')
        .select(`
          *,
          job:jobs!inner (
            *,
            requester:users!jobs_requester_id_fkey (
              name,
              rating_average,
              rating_count
            )
          )
        `)
        .eq('worker_id', workerInfo.id)
        .order('created_at', { ascending: false });

      if (updatedAssignments) {
        setAssignedJobs(updatedAssignments);
        const jobsFromAssignments = updatedAssignments.map((assignment: any) => ({
          ...assignment.job,
          assignment_status: assignment.status,
          assignment_id: assignment.id
        }));
        setJobs(jobsFromAssignments);
      }

      setShowAcceptDialog(false);
      setJobToAccept(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept job. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleStartJob = async (jobId: string) => {
    if (!workerInfo?.id) return;

    try {
      // Find the assignment
      const assignment = assignedJobs.find(a => a.job_id === jobId);
      if (!assignment) return;

      const { error } = await supabase
        .from('job_assignments')
        .update({
          status: 'started',
          started_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (error) throw error;

      // Update job status
      await supabase
        .from('jobs')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      toast({
        title: "Job Started",
        description: "You have started working on this job.",
      });

      // Refresh jobs
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start job.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'started':
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-orange-100 text-orange-800';
      case 'approved':
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'cancelled': return 'bg-red-100 text-red-800';
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

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (job as any).assignment_status === statusFilter || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate earnings
  const totalEarnings = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + parseFloat(t.worker_payout.toString()), 0);

  const pendingEarnings = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + parseFloat(t.worker_payout.toString()), 0);

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

  if (!workerInfo) {
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
              variant={activeTab === 'my-quotes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('my-quotes')}
              className="whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              My Quotes
            </Button>
            <Button
              variant={activeTab === 'find-jobs' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('find-jobs')}
              className="whitespace-nowrap"
            >
              <Search className="w-4 h-4 mr-1" />
              Find Jobs
            </Button>
            <Button
              variant={activeTab === 'earnings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('earnings')}
              className="whitespace-nowrap"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Earnings
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
                <CardTitle className="text-lg">Worker Dashboard</CardTitle>
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
                  variant={activeTab === 'my-quotes' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('my-quotes')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  My Quotes
                </Button>
                <Button
                  variant={activeTab === 'find-jobs' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('find-jobs')}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find Jobs
                </Button>
                <Button
                  variant={activeTab === 'earnings' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('earnings')}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Earnings
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

            {/* Worker Stats Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold">{workerInfo.rating_average.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {workerInfo.rating_count} {workerInfo.rating_count === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Total Earnings</span>
                    <span className="text-lg font-bold text-primary">${totalEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="text-sm font-medium">${pendingEarnings.toFixed(2)}</span>
                  </div>
                </div>
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
                    <p className="text-muted-foreground">Jobs you've accepted and are working on</p>
                  </div>
                  <Button onClick={() => setActiveTab('find-jobs')}>
                    <Search className="w-4 h-4 mr-2" />
                    Find More Jobs
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
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="started">Started</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
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
                          ? "Start by finding and accepting your first job!"
                          : "Try adjusting your search or filters."}
                      </p>
                      {jobs.length === 0 && (
                        <Button onClick={() => setActiveTab('find-jobs')}>
                          <Search className="w-4 h-4 mr-2" />
                          Find Jobs
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredJobs.map((job) => {
                      const assignment = assignedJobs.find(a => a.job_id === job.id);
                      const assignmentStatus = assignment?.status || job.status;
                      
                      return (
                        <Card key={job.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold">{job.title}</h3>
                                  <Badge className={getStatusColor(assignmentStatus)}>
                                    {assignmentStatus.replace('_', ' ').toUpperCase()}
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
                                  ${job.worker_earnings.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  You Earn
                                </p>
                              </div>
                            </div>

                            {/* Requester Info */}
                            {job.requester && (
                              <div className="mb-4 p-3 bg-secondary rounded-lg">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">Requester:</span>
                                  <span>{job.requester.name}</span>
                                  {job.requester.rating_average > 0 && (
                                    <div className="flex items-center gap-1 ml-2">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm">
                                        {job.requester.rating_average.toFixed(1)} 
                                        ({job.requester.rating_count})
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
                                onClick={() => {
                                  setSelectedJob(job);
                                  setShowJobDetails(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                              {assignmentStatus === 'accepted' && (
                                <Button 
                                  size="sm"
                                  onClick={() => handleStartJob(job.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Start Job
                                </Button>
                              )}
                              {assignmentStatus === 'started' && (
                                <Button variant="outline" size="sm">
                                  <FileText className="w-4 h-4 mr-1" />
                                  Submit Proof
                                </Button>
                              )}
                              {job.requester_id && (
                                <Button variant="outline" size="sm">
                                  <MessageSquare className="w-4 h-4 mr-1" />
                                  Chat
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* My Quotes Tab */}
            {activeTab === 'my-quotes' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-2">My Quotes</h2>
                  <p className="text-muted-foreground">
                    View and manage quotes you've submitted for jobs.
                  </p>
                </div>

                {isLoadingQuotes ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : quotes.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Quotes Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't submitted any quotes yet. Browse available jobs to submit quotes.
                      </p>
                      <Button onClick={() => setActiveTab('find-jobs')}>
                        <Search className="w-4 h-4 mr-2" />
                        Browse Jobs
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {quotes.map((quote) => (
                      <Card key={quote.id} className={`border-2 ${
                        quote.status === 'accepted' 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                          : quote.status === 'rejected'
                          ? 'border-gray-300 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                          : 'border-purple-200 dark:border-purple-800'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              {quote.job ? (
                                <>
                                  <div>
                                    <h3 className="text-xl font-bold text-foreground mb-1">
                                      {quote.job.title}
                                    </h3>
                                    <Badge className="mb-2">{quote.job.category}</Badge>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {quote.job.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-muted-foreground">
                                        {quote.job.address_area || 'Location not specified'}
                                      </span>
                                    </div>
                                    {quote.job.requester && (
                                      <div className="flex items-center gap-1">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                          {quote.job.requester.name}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <p className="text-muted-foreground">Job details unavailable</p>
                              )}

                              {/* Quote Amount */}
                              <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-4 border border-primary/20 dark:border-primary/30">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Your Quote</p>
                                    <p className="text-2xl font-bold text-primary">
                                      ${quote.quoted_amount.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground mb-1">You'll Receive</p>
                                    <p className="text-lg font-semibold text-foreground">
                                      ${(quote.quoted_amount * 0.7).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">(after 30% fee)</p>
                                  </div>
                                </div>
                              </div>

                              {/* Message */}
                              {quote.message && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Your Message:</p>
                                  <p className="text-sm text-foreground">{quote.message}</p>
                                </div>
                              )}

                              {/* Status and Date */}
                              <div className="flex items-center gap-3">
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
                                {quote.status === 'pending' && (
                                  <Badge className="bg-purple-500 text-white">
                                    Pending Review
                                  </Badge>
                                )}
                                {quote.status === 'withdrawn' && (
                                  <Badge variant="outline" className="border-gray-300 text-gray-600">
                                    Withdrawn
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  Submitted {new Date(quote.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Find Jobs Tab */}
            {activeTab === 'find-jobs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-2">Find Jobs</h2>
                  <p className="text-muted-foreground">Browse available jobs in your area</p>
                </div>
                <Button onClick={() => navigate('/browse-jobs')} size="lg">
                  <Search className="w-4 h-4 mr-2" />
                  Browse All Available Jobs
                </Button>
              </motion.div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-bold mb-2">Earnings</h2>
                  <p className="text-muted-foreground">Track your earnings and payments</p>
                </div>

                {/* Earnings Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                          <p className="text-2xl font-bold text-primary">${totalEarnings.toFixed(2)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Pending</p>
                          <p className="text-2xl font-bold text-yellow-600">${pendingEarnings.toFixed(2)}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Jobs Completed</p>
                          <p className="text-2xl font-bold text-green-600">{transactions.filter(t => t.status === 'completed').length}</p>
                        </div>
                        <Award className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Transactions List */}
                {transactions.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                      <p className="text-muted-foreground">Your earnings will appear here once jobs are completed.</p>
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
                                  <span className="text-muted-foreground">Your Earnings: </span>
                                  <span className="font-medium">${transaction.worker_payout.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Total: </span>
                                  <span className="font-medium">${transaction.total_amount.toFixed(2)}</span>
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
                  <p className="text-muted-foreground">Manage your worker account settings</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <p className="text-sm mt-1">{workerInfo.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm mt-1">{workerInfo.email}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm mt-1">{workerInfo.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label>City</Label>
                      <p className="text-sm mt-1">{workerInfo.city || 'Houston'}</p>
                    </div>
                    <div>
                      <Label>Rating</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{workerInfo.rating_average.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({workerInfo.rating_count} {workerInfo.rating_count === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    </div>
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
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 px-6 py-5 border-b border-primary/10">
            <DialogHeader>
              <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {selectedJob?.title}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Complete job details
              </DialogDescription>
            </DialogHeader>
            
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

          {/* Scrollable Content */}
          {selectedJob && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h4 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Description
                </h4>
                <p className="text-muted-foreground leading-relaxed text-base">{selectedJob.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg p-5 border border-blue-200 dark:border-blue-800/30 shadow-sm">
                  <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Location
                  </h4>
                  <p className="text-foreground font-medium">
                    {selectedJob.address_area || selectedJob.address || 'Not specified'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-lg p-5 border border-green-200 dark:border-green-800/30 shadow-sm">
                  <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Your Earnings
                  </h4>
                  <p className="text-2xl font-bold text-primary">${selectedJob.worker_earnings.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Budget: ${selectedJob.budget.toFixed(2)}</p>
                </div>
              </div>

              {selectedJob.deadline && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-lg p-5 border border-orange-200 dark:border-orange-800/30 shadow-sm">
                  <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    Deadline
                  </h4>
                  <p className="text-foreground font-medium">{formatDate(selectedJob.deadline)}</p>
                </div>
              )}

              {selectedJob.requester && (
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 rounded-lg p-5 border border-cyan-200 dark:border-cyan-800/30 shadow-sm">
                  <h4 className="font-bold text-base mb-3 text-foreground flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    Requester
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{selectedJob.requester.name}</p>
                      {selectedJob.requester.rating_average > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-foreground">
                              {selectedJob.requester.rating_average.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({selectedJob.requester.rating_count} {selectedJob.requester.rating_count === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowJobDetails(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Accept Job Confirmation Dialog */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Accept Job?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to accept "{jobToAccept?.title}"? You'll earn ${jobToAccept?.worker_earnings.toFixed(2)} upon completion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAccepting} className="text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAcceptJob}
              disabled={isAccepting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isAccepting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Accepting...
                </>
              ) : (
                'Yes, Accept Job'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkerDashboard;

