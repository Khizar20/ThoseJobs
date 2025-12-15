import { useState } from "react";
import { MapPin, Calendar, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navigation as NavComponent } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { motion } from "framer-motion";

// Hardcoded job data following ThoseJobs.com specifications
const mockJobs = [
  {
    id: "JOB-001",
    title: "Replace lightbulb on 'Acme Co' sign",
    payout: 70.00,
    category: "Signage Maintenance",
    locationArea: "Sugar Land, TX",
    dueDate: "2025-11-30T17:00:00Z",
    distance: 5.2,
    status: "Available",
    clientPrice: 100.00
  },
  {
    id: "JOB-002",
    title: "Property check and photo documentation",
    payout: 56.00,
    category: "Property Inspection",
    locationArea: "Katy, TX",
    dueDate: "2025-12-01T14:00:00Z",
    distance: 8.7,
    status: "Available",
    clientPrice: 80.00
  },
  {
    id: "JOB-003",
    title: "Deliver package to downtown office building",
    payout: 42.00,
    category: "Delivery",
    locationArea: "Houston, TX",
    dueDate: "2025-11-29T16:00:00Z",
    distance: 3.1,
    status: "Available",
    clientPrice: 60.00
  },
  {
    id: "JOB-004",
    title: "Minor fence repair - replace 2 boards",
    payout: 84.00,
    category: "Minor Maintenance",
    locationArea: "Pearland, TX",
    dueDate: "2025-12-02T18:00:00Z",
    distance: 12.3,
    status: "Available",
    clientPrice: 120.00
  },
  {
    id: "JOB-005",
    title: "Gutter cleaning for residential property",
    payout: 98.00,
    category: "Property Maintenance",
    locationArea: "The Woodlands, TX",
    dueDate: "2025-12-03T15:00:00Z",
    distance: 15.8,
    status: "Available",
    clientPrice: 140.00
  },
  {
    id: "JOB-006",
    title: "Move furniture items between rooms",
    payout: 63.00,
    category: "Moving Assistance",
    locationArea: "Spring, TX",
    dueDate: "2025-11-28T13:00:00Z",
    distance: 7.4,
    status: "Available",
    clientPrice: 90.00
  }
];

// Categories for filtering
const jobCategories = [
  "All Categories",
  "Signage Maintenance",
  "Property Inspection",
  "Delivery",
  "Minor Maintenance",
  "Property Maintenance",
  "Moving Assistance"
];

const Services = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState<"distance" | "payout" | "dueDate">("distance");

  // Filter jobs by category
  const filteredJobs = selectedCategory === "All Categories"
    ? mockJobs
    : mockJobs.filter(job => job.category === selectedCategory);

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case "distance":
        return a.distance - b.distance;
      case "payout":
        return b.payout - a.payout;
      case "dueDate":
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      default:
        return 0;
    }
  });

  // Format date for display
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

  return (
    <div className="min-h-screen bg-background">
      <NavComponent />
      <div className="pt-32">
        <div className="container mx-auto px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 md:mb-4 font-heading">
              Browse Available Jobs
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Find local gig opportunities in the Houston area. Accept jobs that match your skills and schedule.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-center justify-between bg-secondary/30 rounded-xl p-4 md:p-6 border border-border">
              {/* Filter by Category */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Filter className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  {jobCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort by Distance */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <ArrowUpDown className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "distance" | "payout" | "dueDate")}
                  className="flex-1 sm:flex-none px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <option value="distance">Sort by Distance</option>
                  <option value="payout">Sort by Payout</option>
                  <option value="dueDate">Sort by Due Date</option>
                </select>
              </div>
            </div>
          </div>

          {/* Job Cards Grid */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">
                Available Jobs
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                {sortedJobs.length} {sortedJobs.length === 1 ? "job" : "jobs"} found
              </p>
            </div>

            {sortedJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {sortedJobs.map((job, idx) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="relative group bg-background hover:shadow-elegant card-hover border border-border rounded-xl overflow-hidden">
                      <div className="p-4 md:p-6">
                        {/* Job Title */}
                        <h3 className="font-semibold text-lg md:text-xl text-foreground mb-3 group-hover:text-primary transition-colors font-heading">
                          {job.title}
                        </h3>

                        {/* Payout - Highlighted in Soft Yellow */}
                        <div className="mb-4">
                          <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg md:text-xl text-foreground"
                            style={{ backgroundColor: "#FFDE59" }}
                          >
                            <span className="text-sm md:text-base">$</span>
                            <span>{job.payout.toFixed(2)}</span>
                            <span className="text-sm md:text-base font-normal">Payout</span>
                          </div>
                        </div>

                        {/* Category Badge */}
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-secondary text-foreground border border-border">
                            {job.category}
                          </span>
                        </div>

                        {/* Location and Distance */}
                        <div className="flex items-center gap-2 mb-3 text-sm md:text-base text-muted-foreground">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {job.locationArea} • {job.distance} mi away
                          </span>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-2 mb-4 text-sm md:text-base text-muted-foreground">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Due by: {formatDate(job.dueDate)}</span>
                        </div>

                        {/* Status */}
                        <div className="mb-4">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            {job.status}
                          </span>
                        </div>

                        {/* Accept Job Button - Deep Blue */}
                        <Button
                          className="w-full font-medium text-sm md:text-base"
                          style={{ backgroundColor: "#0846BC", color: "#FFFFFF" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#073a9e";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#0846BC";
                          }}
                        >
                          Accept Job
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or check back later for new opportunities.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Services;
