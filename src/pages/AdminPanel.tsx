import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3,
  Users,
  Briefcase,
  DollarSign,
  LogOut,
  Filter,
  Search,
  AlertCircle,
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  MessageSquare,
  Image as ImageIcon,
  TrendingUp,
  FileText,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Hardcoded Platform Metrics
const platformMetrics = {
  totalJobsCompleted: 350,
  totalWorkers: 50,
  totalClients: 120,
  totalFeesCollected: 15000.00,
  jobsPerWeek: 15,
  jobsPerDay: [5, 7, 4, 6, 8, 9, 5], // Last 7 days
  jobsPerMonth: [45, 52, 48, 55] // Last 4 months
};

// Hardcoded User List
const userList = [
  {
    id: "user-001",
    name: "John Smith",
    email: "john.smith@example.com",
    role: "Worker",
    rating: 4.8,
    jobsCompleted: 25,
    flagStatus: "None",
    joinedDate: "2025-01-15T10:00:00Z"
  },
  {
    id: "user-002",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    role: "Worker",
    rating: 3.2,
    jobsCompleted: 12,
    flagStatus: "Low Rating",
    joinedDate: "2025-02-20T14:30:00Z"
  },
  {
    id: "user-003",
    name: "Mike Davis",
    email: "mike.davis@example.com",
    role: "Worker",
    rating: 5.0,
    jobsCompleted: 45,
    flagStatus: "None",
    joinedDate: "2024-11-10T09:15:00Z"
  },
  {
    id: "user-004",
    name: "Emily Chen",
    email: "emily.chen@example.com",
    role: "Worker",
    rating: 4.5,
    jobsCompleted: 30,
    flagStatus: "None",
    joinedDate: "2024-12-05T11:20:00Z"
  },
  {
    id: "user-005",
    name: "Robert Wilson",
    email: "robert.w@example.com",
    role: "Worker",
    rating: 2.8,
    jobsCompleted: 8,
    flagStatus: "Suspicious Activity",
    joinedDate: "2025-03-01T16:45:00Z"
  },
  {
    id: "user-006",
    name: "Khizar Ahmed",
    email: "khizarahmed3@gmail.com",
    role: "Client",
    rating: null,
    jobsPosted: 8,
    flagStatus: "None",
    joinedDate: "2024-10-20T08:00:00Z"
  },
  {
    id: "user-007",
    name: "Lisa Anderson",
    email: "lisa.a@example.com",
    role: "Client",
    rating: null,
    jobsPosted: 15,
    flagStatus: "None",
    joinedDate: "2024-09-15T12:30:00Z"
  },
  {
    id: "user-008",
    name: "David Brown",
    email: "david.brown@example.com",
    role: "Client",
    rating: null,
    jobsPosted: 5,
    flagStatus: "None",
    joinedDate: "2025-01-25T10:15:00Z"
  }
];

// Hardcoded Job List
const jobList = [
  {
    id: "job-001",
    title: "Replace lightbulb on 'Acme Co' sign",
    client: "Khizar Ahmed",
    worker: "John Smith",
    status: "Completed",
    suspicious: false,
    disputeStatus: "None",
    amount: 100.00,
    date: "2025-11-20T17:00:00Z"
  },
  {
    id: "job-002",
    title: "Property check and photo documentation",
    client: "Lisa Anderson",
    worker: "Sarah Johnson",
    status: "Submitted",
    suspicious: true,
    disputeStatus: "Open",
    amount: 80.00,
    date: "2025-11-25T14:00:00Z"
  },
  {
    id: "job-003",
    title: "Deliver package to downtown office",
    client: "David Brown",
    worker: "Mike Davis",
    status: "In Progress",
    suspicious: false,
    disputeStatus: "None",
    amount: 60.00,
    date: "2025-11-28T10:00:00Z"
  },
  {
    id: "job-004",
    title: "Minor fence repair",
    client: "Khizar Ahmed",
    worker: "Emily Chen",
    status: "Completed",
    suspicious: false,
    disputeStatus: "Closed",
    amount: 120.00,
    date: "2025-11-15T18:00:00Z"
  },
  {
    id: "job-005",
    title: "Gutter cleaning for residential property",
    client: "Lisa Anderson",
    worker: "Robert Wilson",
    status: "Completed",
    suspicious: true,
    disputeStatus: "None",
    amount: 140.00,
    date: "2025-11-10T15:00:00Z"
  }
];

// Hardcoded Dispute Data
const disputeData = {
  jobId: "job-002",
  jobTitle: "Property check and photo documentation",
  client: "Lisa Anderson",
  worker: "Sarah Johnson",
  amount: 80.00,
  date: "2025-11-25T14:00:00Z",
  chatHistory: [
    {
      sender: "Client",
      message: "Hi, I need someone to check my property and take photos of the exterior.",
      timestamp: "2025-11-25T10:00:00Z"
    },
    {
      sender: "Worker",
      message: "I can help with that! I'll be there at 2 PM today.",
      timestamp: "2025-11-25T10:15:00Z"
    },
    {
      sender: "Client",
      message: "Perfect, thank you!",
      timestamp: "2025-11-25T10:20:00Z"
    },
    {
      sender: "Worker",
      message: "Job completed! I've uploaded the photos.",
      timestamp: "2025-11-25T14:30:00Z"
    },
    {
      sender: "Client",
      message: "The photos don't show what I requested. I asked for interior photos too, but you only took exterior ones.",
      timestamp: "2025-11-25T15:00:00Z"
    },
    {
      sender: "Worker",
      message: "I apologize for the confusion. The job description said 'exterior photos' so I focused on that.",
      timestamp: "2025-11-25T15:10:00Z"
    },
    {
      sender: "Client",
      message: "This is not acceptable. I want a refund.",
      timestamp: "2025-11-25T15:30:00Z"
    }
  ],
  proofImages: [
    "https://via.placeholder.com/400x300?text=Proof+Image+1",
    "https://via.placeholder.com/400x300?text=Proof+Image+2",
    "https://via.placeholder.com/400x300?text=Proof+Image+3"
  ],
  aiCheckResult: "Failed - Images do not match job requirements"
};

// Hardcoded Payout List
const payoutList = [
  {
    id: "payout-001",
    workerName: "John Smith",
    amount: 70.00,
    jobTitle: "Replace lightbulb on 'Acme Co' sign",
    status: "Approved",
    date: "2025-11-20T18:00:00Z"
  },
  {
    id: "payout-002",
    workerName: "Mike Davis",
    amount: 42.00,
    jobTitle: "Deliver package to downtown office",
    status: "Pending",
    date: "2025-11-28T11:00:00Z"
  },
  {
    id: "payout-003",
    workerName: "Emily Chen",
    amount: 84.00,
    jobTitle: "Minor fence repair",
    status: "Approved",
    date: "2025-11-15T19:00:00Z"
  },
  {
    id: "payout-004",
    workerName: "Sarah Johnson",
    amount: 56.00,
    jobTitle: "Property check and photo documentation",
    status: "Pending",
    date: "2025-11-25T15:00:00Z"
  }
];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("metrics");
  const [filteredUsers, setFilteredUsers] = useState(userList);
  const [filteredJobs, setFilteredJobs] = useState(jobList);
  const [roleFilter, setRoleFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [flagFilter, setFlagFilter] = useState("all");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [suspiciousFilter, setSuspiciousFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin-login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    // Filter users
    let filtered = [...userList];

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (ratingFilter !== "all") {
      if (ratingFilter === "high") {
        filtered = filtered.filter(user => user.rating && user.rating >= 4.5);
      } else if (ratingFilter === "low") {
        filtered = filtered.filter(user => user.rating && user.rating < 3.5);
      }
    }

    if (flagFilter !== "all") {
      filtered = filtered.filter(user => user.flagStatus === flagFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [roleFilter, ratingFilter, flagFilter, searchTerm]);

  useEffect(() => {
    // Filter jobs
    let filtered = [...jobList];

    if (jobStatusFilter !== "all") {
      filtered = filtered.filter(job => job.status === jobStatusFilter);
    }

    if (suspiciousFilter !== "all") {
      filtered = filtered.filter(job => 
        suspiciousFilter === "suspicious" ? job.suspicious : !job.suspicious
      );
    }

    setFilteredJobs(filtered);
  }, [jobStatusFilter, suspiciousFilter]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_expires_at");
    navigate("/admin-login");
  };

  const handleDisputeAction = (action: "full-refund" | "partial-refund" | "uphold") => {
              toast({
      title: "Dispute Action",
      description: `Dispute action "${action}" has been processed.`,
    });
  };

  const handlePayoutAction = (payoutId: string, action: "approve" | "deny") => {
      toast({
      title: action === "approve" ? "Payout Approved" : "Payout Denied",
      description: `Payout ${action === "approve" ? "approved" : "denied"} successfully.`,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const tabs = [
    { id: "metrics", label: "Metrics/Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "jobs", label: "Jobs & Disputes", icon: Briefcase },
    { id: "finance", label: "Finance & Payouts", icon: DollarSign },
  ];

    return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-32 pb-12">
        <div className="container mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-heading">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Platform oversight and management
              </p>
        </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
      </div>

          {/* Tab Navigation */}
          <div className="mb-8 border-b border-border">
            <div className="flex flex-wrap gap-2 md:gap-4 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
  return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </div>
              </div>

          {/* Tab Content */}
          <div className="mt-8">
            {/* Metrics/Overview Tab */}
            {activeTab === "metrics" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <Card className="p-6 border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Jobs Completed</span>
                      <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                    <div className="text-3xl font-bold text-foreground">{platformMetrics.totalJobsCompleted}</div>
                  </Card>

                  <Card className="p-6 border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Workers</span>
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground">{platformMetrics.totalWorkers}</div>
                </Card>

                  <Card className="p-6 border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Clients</span>
                      <Users className="w-5 h-5 text-primary" />
                      </div>
                    <div className="text-3xl font-bold text-foreground">{platformMetrics.totalClients}</div>
                  </Card>

                  <Card className="p-6 border-border" style={{ backgroundColor: "#FFDE59" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">Total Fees Collected</span>
                      <DollarSign className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="text-3xl font-bold text-foreground">${platformMetrics.totalFeesCollected.toLocaleString()}</div>
                </Card>
                </div>

                <Card className="p-6 border-border">
                  <h2 className="text-xl font-bold text-foreground mb-4 font-heading">
                    Jobs Per Week
                  </h2>
                  <div className="flex items-end gap-2 h-48">
                    {platformMetrics.jobsPerDay.map((count, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full rounded-t"
                          style={{
                            height: `${(count / 10) * 100}%`,
                            backgroundColor: "#0846BC",
                            minHeight: "20px"
                          }}
                        />
                        <span className="text-xs text-muted-foreground mt-2">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                        </span>
                        <span className="text-xs font-semibold text-foreground">{count}</span>
                      </div>
                    ))}
                    </div>
                </Card>

                <div className="mt-6">
                  <Card className="p-6 border-border">
                    <h2 className="text-xl font-bold text-foreground mb-4 font-heading flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Jobs Per Month (Last 4 Months)
                    </h2>
                    <div className="flex items-end gap-4 h-64">
                      {platformMetrics.jobsPerMonth.map((count, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full rounded-t"
                            style={{
                              height: `${(count / 60) * 100}%`,
                              backgroundColor: "#0846BC",
                              minHeight: "20px"
                            }}
                          />
                          <span className="text-xs text-muted-foreground mt-2">
                            Month {index + 1}
                          </span>
                          <span className="text-xs font-semibold text-foreground">{count}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
            </motion.div>
          )}

            {/* Users Tab */}
            {activeTab === "users" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                        placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="Worker">Worker</SelectItem>
                        <SelectItem value="Client">Client</SelectItem>
                  </SelectContent>
                </Select>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        <SelectItem value="high">High (4.5+)</SelectItem>
                        <SelectItem value="low">Low (&lt;3.5)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={flagFilter} onValueChange={setFlagFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by Flag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Flags</SelectItem>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Low Rating">Low Rating</SelectItem>
                        <SelectItem value="Suspicious Activity">Suspicious Activity</SelectItem>
                      </SelectContent>
                    </Select>
                                </div>
                              </div>

                <Card className="border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Role</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Rating</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Activity</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Flag Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                            <td className="py-3 px-4 text-sm text-foreground font-medium">{user.name}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className={
                                user.role === "Worker" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"
                              }>
                                {user.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-foreground">
                              {user.rating ? (
                                <div className="flex items-center gap-1">
                                  <span>{user.rating.toFixed(1)}</span>
                                  <span className="text-yellow-500">★</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {user.role === "Worker" ? `${user.jobsCompleted} jobs` : `${user.jobsPosted} posts`}
                            </td>
                            <td className="py-3 px-4">
                              {user.flagStatus === "None" ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  None
                                    </Badge>
                              ) : user.flagStatus === "Low Rating" ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Low Rating
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  Suspicious
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                                </div>
                </Card>
              </motion.div>
            )}

            {/* Jobs & Disputes Tab */}
            {activeTab === "jobs" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Posted">Posted</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Submitted">Submitted</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={suspiciousFilter} onValueChange={setSuspiciousFilter}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter Suspicious" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Jobs</SelectItem>
                        <SelectItem value="suspicious">Suspicious Only</SelectItem>
                        <SelectItem value="normal">Normal Only</SelectItem>
                      </SelectContent>
                    </Select>
                                      </div>
                                    </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Jobs List */}
                                    <div>
                    <h2 className="text-xl font-bold text-foreground mb-4 font-heading">
                      All Jobs ({filteredJobs.length})
                    </h2>
                    <Card className="border-border">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Job Title</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Suspicious</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Dispute</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredJobs.map((job) => (
                              <tr key={job.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                                <td className="py-3 px-4 text-sm text-foreground">{job.title}</td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className={
                                    job.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                                    job.status === "In Progress" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                    "bg-blue-50 text-blue-700 border-blue-200"
                                  }>
                                    {job.status}
                                              </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  {job.suspicious ? (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                      Yes
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      No
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {job.disputeStatus === "Open" ? (
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                      Open
                                    </Badge>
                                  ) : job.disputeStatus === "Closed" ? (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                      Closed
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">None</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                                          </div>
                    </Card>
                                        </div>

                  {/* Handling Disputes */}
                                          <div>
                    <h2 className="text-xl font-bold text-foreground mb-4 font-heading flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Handling Disputes
                    </h2>
                    <Card className="p-6 border-border">
                      <div className="space-y-6">
                        {/* Job Details */}
                                          <div>
                          <h3 className="font-semibold text-foreground mb-2">Job Details</h3>
                          <div className="space-y-2 text-sm">
                            <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{disputeData.jobTitle}</span></div>
                            <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{disputeData.client}</span></div>
                            <div><span className="text-muted-foreground">Worker:</span> <span className="font-medium">{disputeData.worker}</span></div>
                            <div><span className="text-muted-foreground">Amount:</span> <span className="font-medium">${disputeData.amount.toFixed(2)}</span></div>
                            <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{formatDate(disputeData.date)}</span></div>
                            <div className="mt-2">
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                {disputeData.aiCheckResult}
                              </Badge>
                                          </div>
                                      </div>
                                    </div>

                        {/* Chat History */}
                                      <div>
                          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Chat History
                          </h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto border border-border rounded-lg p-4 bg-secondary/30">
                            {disputeData.chatHistory.map((chat, index) => (
                              <div key={index} className={`${chat.sender === "Client" ? "text-left" : "text-right"}`}>
                                <div className={`inline-block max-w-[80%] p-2 rounded-lg ${
                                  chat.sender === "Client" 
                                    ? "bg-background border border-border" 
                                    : "bg-primary text-white"
                                }`}>
                                  <div className="text-xs font-semibold mb-1">{chat.sender}</div>
                                  <div className="text-sm">{chat.message}</div>
                                  <div className={`text-xs mt-1 ${
                                    chat.sender === "Client" ? "text-muted-foreground" : "text-white/70"
                                  }`}>
                                    {formatDate(chat.timestamp)}
                                                  </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                        {/* Proof Images */}
                                    <div>
                          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Proof Images
                          </h3>
                          <div className="grid grid-cols-3 gap-2">
                            {disputeData.proofImages.map((image, index) => (
                              <a
                                key={index}
                                href={image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="aspect-square rounded-lg border border-border bg-secondary/30 flex items-center justify-center hover:bg-secondary transition-colors"
                              >
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                              </a>
                            ))}
                                      </div>
                                    </div>

                                    {/* Admin Actions */}
                                      <div>
                          <h3 className="font-semibold text-foreground mb-3">Admin Actions</h3>
                          <div className="flex flex-col gap-2">
                                            <Button
                                              variant="destructive"
                              className="w-full"
                              onClick={() => handleDisputeAction("full-refund")}
                                            >
                              Full Refund
                                            </Button>
                                  <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => handleDisputeAction("partial-refund")}
                            >
                              Partial Refund
                                  </Button>
                                  <Button
                              className="w-full"
                              style={{ backgroundColor: "#0846BC", color: "#FFFFFF" }}
                              onClick={() => handleDisputeAction("uphold")}
                            >
                              Uphold Payout
                                  </Button>
                                </div>
                            </div>
                          </div>
                      </Card>
              </div>
                </div>
              </motion.div>
            )}

            {/* Finance & Payouts Tab */}
            {activeTab === "finance" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Card className="p-6 border-border" style={{ backgroundColor: "#FFDE59" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground">Total Fees Collected</span>
                      <DollarSign className="w-5 h-5 text-foreground" />
                                </div>
                    <div className="text-3xl font-bold text-foreground">
                      ${platformMetrics.totalFeesCollected.toLocaleString()}
                                  </div>
                  </Card>

                  <Card className="p-6 border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Total Payout to Workers</span>
                      <CreditCard className="w-5 h-5 text-primary" />
                                </div>
                    <div className="text-3xl font-bold text-foreground">
                      ${(platformMetrics.totalFeesCollected * 0.70).toLocaleString()}
                                </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      70% of total fees
                                </div>
                  </Card>
                              </div>

                <Card className="border-border">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground font-heading">
                      Recent Payouts
                    </h2>
                              </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Worker</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Job Title</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutList.map((payout) => (
                          <tr key={payout.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                            <td className="py-3 px-4 text-sm text-foreground font-medium">{payout.workerName}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{payout.jobTitle}</td>
                            <td className="py-3 px-4 text-sm font-semibold text-primary">${payout.amount.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              {payout.status === "Approved" ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Approved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(payout.date)}</td>
                            <td className="py-3 px-4">
                              {payout.status === "Pending" && (
                                <div className="flex gap-2">
                                <Button
                                    size="sm"
                                  variant="outline"
                                    onClick={() => handlePayoutAction(payout.id, "approve")}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                  size="sm"
                                    variant="outline"
                                    onClick={() => handlePayoutAction(payout.id, "deny")}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    Deny
                                </Button>
                              </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                        </div>
                </Card>
            </motion.div>
          )}
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPanel; 
