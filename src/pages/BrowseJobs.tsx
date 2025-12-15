import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Clock,
  DollarSign,
  Search,
  Filter,
  Briefcase,
  Star,
  Calendar,
  User,
  ArrowRight,
  X,
  CheckCircle,
  Info,
  MessageSquare,
  Send
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
  deadline: string | null;
  time_window_start: string | null;
  time_window_end: string | null;
  status: 'posted' | 'accepted' | 'in_progress' | 'submitted' | 'approved' | 'disputed' | 'cancelled' | 'completed';
  created_at: string;
  accepting_quotes?: boolean;
  quote_count?: number;
  requester?: {
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

const BrowseJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showRequesterMessage, setShowRequesterMessage] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState<string>("");
  const [quoteMessage, setQuoteMessage] = useState<string>("");
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [existingQuote, setExistingQuote] = useState<Quote | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterAndSortJobs();
  }, [jobs, searchQuery, categoryFilter, sortBy]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      
      // First, try to fetch jobs without join to ensure basic query works
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'posted')
        .order('created_at', { ascending: false });

      if (jobsError) {
        throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
      }

      if (!jobsData || jobsData.length === 0) {
        setJobs([]);
        setFilteredJobs([]);
        setIsLoading(false);
        return;
      }

      // Fetch requester info and quote counts separately for each job
      const jobsWithRequester = await Promise.all(
        jobsData.map(async (job) => {
          try {
            const [requesterResult, quoteCountResult] = await Promise.all([
              supabase
                .from('users')
                .select('name, rating_average, rating_count')
                .eq('id', job.requester_id)
                .single(),
              supabase
                .from('quotes')
                .select('id', { count: 'exact', head: true })
                .eq('job_id', job.id)
                .eq('status', 'pending')
            ]);

            const requesterData = requesterResult.data;
            const quoteCount = quoteCountResult.count || 0;

            return {
              ...job,
              requester: requesterData || null,
              quote_count: quoteCount,
              accepting_quotes: job.accepting_quotes !== false // Default to true if not set
            };
          } catch (err) {
            // Continue without requester info if fetch fails
            return {
              ...job,
              requester: null,
              quote_count: 0,
              accepting_quotes: true
            };
          }
        })
      );

      setJobs(jobsWithRequester);
      setFilteredJobs(jobsWithRequester);
    } catch (error: any) {
      // Log error for debugging
      console.error('Error fetching jobs:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to load jobs. Please try again.",
        variant: "destructive"
      });
      
      // Set empty arrays on error so UI shows "no jobs" instead of error state
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortJobs = () => {
    let filtered = [...jobs];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.address_area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(job => job.category === categoryFilter);
    }

    // Sort jobs
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "budget-high":
        filtered.sort((a, b) => b.budget - a.budget);
        break;
      case "budget-low":
        filtered.sort((a, b) => a.budget - b.budget);
        break;
      default:
        break;
    }

    setFilteredJobs(filtered);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleViewJob = async (job: Job) => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please log in as a worker to view job details.",
        variant: "destructive"
      });
      navigate('/login?role=worker');
      return;
    }

    // Check user role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // If user is a requester, show message popup instead of job details
    if (userProfile?.role === 'requester') {
      setShowRequesterMessage(true);
      return;
    }

    // If user is not a worker, show error
    if (userProfile?.role !== 'worker') {
      toast({
        title: "Worker Account Required",
        description: "You need a worker account to view job details.",
        variant: "destructive"
      });
      navigate('/login?role=worker');
      return;
    }

    // User is a worker, show job details
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  const checkExistingQuote = async (jobId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('job_id', jobId)
      .eq('worker_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing quote:', error);
    }

    return data || null;
  };

  const handleSubmitQuote = async () => {
    if (!selectedJob) return;

    const amount = parseFloat(quoteAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid quote amount greater than 0.",
        variant: "destructive"
      });
      return;
    }

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please log in as a worker to submit quotes.",
        variant: "destructive"
      });
      setShowQuoteDialog(false);
      navigate('/login?role=worker');
      return;
    }

    // Check if user is a worker
    const { data: userProfile } = await supabase
      .from('users')
      .select('roles')
      .eq('id', session.user.id)
      .single();

    const userRoles = userProfile?.roles || [];
    if (!userRoles.includes('worker')) {
      toast({
        title: "Worker Account Required",
        description: "You need a worker account to submit quotes.",
        variant: "destructive"
      });
      setShowQuoteDialog(false);
      navigate('/login?role=worker');
      return;
    }

    setIsSubmittingQuote(true);

    try {
      // Check if quote already exists
      const existing = await checkExistingQuote(selectedJob.id);
      
      if (existing) {
        // Update existing quote
        const { error: updateError } = await supabase
          .from('quotes')
          .update({
            quoted_amount: amount,
            message: quoteMessage || null,
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;

        toast({
          title: "Quote Updated",
          description: "Your quote has been updated successfully.",
          variant: "success",
        });
      } else {
        // Create new quote
        const { error: insertError } = await supabase
          .from('quotes')
          .insert({
            job_id: selectedJob.id,
            worker_id: session.user.id,
            quoted_amount: amount,
            message: quoteMessage || null,
            status: 'pending'
          });

        if (insertError) throw insertError;

        toast({
          title: "Quote Submitted",
          description: "Your quote has been submitted successfully. The requester will review it.",
          variant: "success",
        });
      }

      // Refresh jobs to update quote count
      await fetchJobs();
      
      // Reset form and close dialogs
      setQuoteAmount("");
      setQuoteMessage("");
      setShowQuoteDialog(false);
      setIsDialogOpen(false);
      setExistingQuote(null);
    } catch (error: any) {
      console.error('Error submitting quote:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleOpenQuoteDialog = async () => {
    if (!selectedJob) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsDialogOpen(false);
      navigate('/login?role=worker');
      return;
    }

    // Check for existing quote
    const existing = await checkExistingQuote(selectedJob.id);
    if (existing) {
      setExistingQuote(existing);
      setQuoteAmount(existing.quoted_amount.toString());
      setQuoteMessage(existing.message || "");
    } else {
      setExistingQuote(null);
      setQuoteAmount(selectedJob.budget.toString());
      setQuoteMessage("");
    }

    setIsDialogOpen(false);
    setShowQuoteDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <div className="pt-32 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Available Jobs</h1>
            <p className="text-lg text-muted-foreground">
              Find flexible gigs and earn money by completing tasks in your area
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs by title, description, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Photos">Photos</SelectItem>
                    <SelectItem value="Pickup/Dropoff">Pickup/Dropoff</SelectItem>
                    <SelectItem value="Walkthrough">Walkthrough</SelectItem>
                    <SelectItem value="Signage">Signage</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="budget-high">Highest Budget</SelectItem>
                    <SelectItem value="budget-low">Lowest Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading jobs...</span>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Jobs Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "There are no available jobs at the moment. Check back later!"}
              </p>
              {(searchQuery || categoryFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredJobs.length} of {jobs.length} available jobs
              </p>
            </div>

            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/20 group">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Header with title and budget */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-2">
                              <h3 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                                {job.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                {job.category}
                              </Badge>
                              {job.quote_count !== undefined && job.quote_count > 0 && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  {job.quote_count} {job.quote_count === 1 ? 'Quote' : 'Quotes'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right sm:min-w-[140px]">
                            <div className="text-3xl font-bold text-primary mb-1">
                              ${job.budget.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md inline-block">
                              Worker earns ${job.worker_earnings.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground leading-relaxed line-clamp-3">{job.description}</p>

                        {/* Job Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="p-1.5 rounded-md bg-primary/10">
                              <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Location</p>
                              <p className="font-medium text-foreground">{job.address_area}</p>
                            </div>
                          </div>
                          
                          {job.deadline && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1.5 rounded-md bg-orange-100">
                                <Clock className="w-4 h-4 text-orange-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Deadline</p>
                                <p className="font-medium text-foreground">{formatDate(job.deadline)}</p>
                              </div>
                            </div>
                          )}
                          
                          {job.time_window_start && job.time_window_end && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1.5 rounded-md bg-blue-100">
                                <Calendar className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Time Window</p>
                                <p className="font-medium text-foreground">
                                  {formatTime(job.time_window_start)} - {formatTime(job.time_window_end)}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {job.requester && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1.5 rounded-md bg-green-100">
                                <User className="w-4 h-4 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">Requester</p>
                                <div className="flex items-center gap-1">
                                  <p className="font-medium text-foreground truncate">{job.requester.name}</p>
                                  {job.requester.rating_average > 0 && (
                                    <span className="flex items-center gap-0.5 text-xs">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-muted-foreground">{job.requester.rating_average.toFixed(1)}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex flex-col gap-3 lg:min-w-[140px] lg:items-end">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewJob(job);
                          }}
                          className="w-full lg:w-auto bg-primary hover:bg-primary/90 text-black shadow-md hover:shadow-lg transition-all font-semibold"
                          size="lg"
                        >
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <p className="text-xs text-muted-foreground text-center lg:text-right">
                          Posted {formatDate(job.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Requester Message Dialog */}
      <Dialog open={showRequesterMessage} onOpenChange={setShowRequesterMessage}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
              <Info className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              Worker Account Required
            </DialogTitle>
            <DialogDescription className="text-center text-base text-gray-600 dark:text-gray-300">
              Job details are only available to workers. As a requester, you can post jobs and manage your own listings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Want to become a worker?</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    You can create a worker account to browse and accept jobs. Switch accounts or register as a worker to get started.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowRequesterMessage(false)}
              className="w-full sm:w-auto bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <Button
              onClick={() => {
                setShowRequesterMessage(false);
                navigate('/choose-role');
              }}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-black font-semibold shadow-md hover:shadow-lg"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Become a Worker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 shadow-2xl">
          {selectedJob && (
            <>
              <DialogHeader className="space-y-3 pb-4 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground">
                      {selectedJob.title}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {selectedJob.category}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Available
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl md:text-4xl font-bold text-primary dark:text-primary-foreground mb-1">
                      ${selectedJob.budget.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Budget</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Info className="w-5 h-5 text-primary" />
                    Job Description
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedJob.description}
                  </p>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-4 space-y-2 border border-primary/20 dark:border-primary/30">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Payment Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Budget</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">${selectedJob.budget.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3 border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-700 dark:text-green-300 mb-1">Your Earnings (70%)</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-300">${selectedJob.worker_earnings.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Platform Fee (30%)</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">${selectedJob.platform_fee.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Job Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-2 rounded-md bg-primary/10 dark:bg-primary/20">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Location</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedJob.address_area}</p>
                      {selectedJob.address && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedJob.address}</p>
                      )}
                    </div>
                  </div>

                  {selectedJob.deadline && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30">
                        <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Deadline</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatDate(selectedJob.deadline)}</p>
                      </div>
                    </div>
                  )}

                  {selectedJob.time_window_start && selectedJob.time_window_end && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Time Window</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatTime(selectedJob.time_window_start)} - {formatTime(selectedJob.time_window_end)}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedJob.requester && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                        <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Requester</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">{selectedJob.requester.name}</p>
                          {selectedJob.requester.rating_average > 0 && (
                            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-md border border-yellow-200 dark:border-yellow-800">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                                {selectedJob.requester.rating_average.toFixed(1)}
                              </span>
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                ({selectedJob.requester.rating_count})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
                      <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Posted On</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{formatDate(selectedJob.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Quote Count */}
                {selectedJob.quote_count !== undefined && selectedJob.quote_count > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                          {selectedJob.quote_count} {selectedJob.quote_count === 1 ? 'Quote' : 'Quotes'} Received
                        </p>
                        <p className="text-sm text-purple-800 dark:text-purple-300">
                          Other workers have already submitted quotes for this job.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Important Notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">How Quotes Work</p>
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        Submit your quote with the amount you'd like to receive for completing this job. 
                        The requester will review all quotes and select the best one. 
                        Payment will be held securely and released upon job completion and approval.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
                <Button
                  onClick={handleOpenQuoteDialog}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-black font-semibold shadow-md hover:shadow-lg"
                  size="lg"
                  disabled={selectedJob.accepting_quotes === false}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {selectedJob.accepting_quotes !== false ? "Submit Quote" : "Quotes Closed"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quote Submission Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 border-2 border-primary/20 dark:border-primary/30 shadow-2xl">
          <DialogHeader className="space-y-4 pb-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 -m-6 mb-0 p-6 rounded-t-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-lg">
                <img 
                  src={existingQuote ? "/update.png" : "/submit.png"} 
                  alt={existingQuote ? "Update Quote" : "Submit Quote"}
                  className="w-10 h-10"
                />
              </div>
              <div className="flex-1">
                <DialogTitle className={`text-2xl font-bold ${existingQuote ? "text-gray-900 dark:text-white" : "text-gray-900 dark:text-white"}`}>
                  {existingQuote ? "Update Your Quote" : "Submit Quote"}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {existingQuote 
                    ? "Update your quote amount and message for this job."
                    : "Enter your quote amount and optional message for this job."
                  }
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-5 py-5 overflow-y-auto flex-1 min-h-0 px-1">
              {/* Job Info Card */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-xl p-5 border-2 border-primary/20 dark:border-primary/30 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white flex-1">{selectedJob.title}</h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {selectedJob.category}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-primary/20">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Job Budget</p>
                    <p className="text-lg font-bold text-primary dark:text-primary-foreground">
                      ${selectedJob.budget.toLocaleString()}
                    </p>
                  </div>
                  {selectedJob.quote_count !== undefined && selectedJob.quote_count > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Quotes Received</p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {selectedJob.quote_count}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quote Amount Section */}
              <div className="space-y-3">
                <label htmlFor="quoteAmount" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Quote Amount (USD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary/60 z-10" />
                  <Input
                    id="quoteAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Enter your quote amount"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="pl-12 h-12 text-lg font-semibold bg-white dark:bg-gray-800 border-2 border-primary/20 dark:border-primary/30 focus:border-primary text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Enter the amount you'd like to receive for completing this job.
                </p>
              </div>

              {/* Quote Message Section */}
              <div className="space-y-3">
                <label htmlFor="quoteMessage" className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Message (Optional)
                </label>
                <Textarea
                  id="quoteMessage"
                  placeholder="Tell the requester why you're the best fit for this job..."
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  className="min-h-[120px] bg-white dark:bg-gray-800 border-2 border-primary/20 dark:border-primary/30 focus:border-primary text-gray-900 dark:text-white resize-none"
                  rows={5}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add a message to explain your quote and highlight your experience.
                </p>
              </div>

              {/* Platform Fee Info Card */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl p-4 border-2 border-primary/20 dark:border-primary/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Platform Fee Breakdown</p>
                    <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                      <p>A 30% platform fee will be deducted from your quote amount.</p>
                      {quoteAmount && parseFloat(quoteAmount) > 0 && (
                        <div className="mt-2 pt-2 border-t border-primary/20 space-y-1">
                          <div className="flex justify-between">
                            <span>Your Quote:</span>
                            <span className="font-semibold">${parseFloat(quoteAmount).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Platform Fee (30%):</span>
                            <span>${(parseFloat(quoteAmount) * 0.3).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-primary dark:text-primary-foreground pt-1 border-t border-primary/20">
                            <span>You'll Receive:</span>
                            <span>${(parseFloat(quoteAmount) * 0.7).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50/50 dark:bg-gray-800/50 -m-6 mt-0 p-6 rounded-b-lg">
            <Button
              variant="outline"
              onClick={() => {
                setShowQuoteDialog(false);
                setQuoteAmount("");
                setQuoteMessage("");
                setExistingQuote(null);
              }}
              className="w-full sm:w-auto bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              disabled={isSubmittingQuote}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmitQuote}
              variant={existingQuote ? "outline" : "default"}
              className={`w-full sm:w-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-2 ${
                existingQuote 
                  ? "!bg-white hover:!bg-gray-50 !text-black !border-black dark:!bg-gray-800 dark:hover:!bg-gray-700 dark:!text-white dark:!border-gray-600"
                  : "!bg-primary hover:!bg-primary/90 !text-black !border-primary"
              }`}
              size="lg"
              disabled={isSubmittingQuote || !quoteAmount || parseFloat(quoteAmount) <= 0}
            >
              {isSubmittingQuote ? (
                <>
                  <div className={`w-4 h-4 mr-2 border-2 ${existingQuote ? "border-black dark:border-white" : "border-white"} border-t-transparent rounded-full animate-spin`} />
                  {existingQuote ? "Updating..." : "Submitting..."}
                </>
              ) : (
                <>
                  {existingQuote ? "Update Quote" : "Submit Quote"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default BrowseJobs;

