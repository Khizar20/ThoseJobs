import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden" style={{ backgroundColor: '#FCFAF8' }}>
        <div className="container mx-auto px-6 lg:px-8 relative">
          {/* Decorative animated shapes */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -z-10 inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Subtle animated SVG grid */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="gridContact" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridContact)" />
            </svg>
            <motion.div
              className="absolute right-10 top-10 w-40 h-40 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle at 30% 30%, hsla(214,88%,40%,0.25), transparent 60%)' }}
              animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 12 }}
            />
            <motion.div
              className="absolute left-0 bottom-10 w-56 h-56 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle at 70% 70%, hsla(214,88%,40%,0.20), transparent 60%)' }}
              animate={{ y: [0, 12, 0], x: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 14 }}
            />
          </motion.div>
          <div className="text-center">
            <h1 className="font-heading font-light text-display text-foreground mb-4">
              Get In Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions about ThoseJobs.com? We're here to help with support, partnerships, or any inquiries about our Houston-area gig marketplace.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="p-8 border-border bg-card h-fit">
              <h2 className="font-heading font-bold text-2xl text-foreground mb-6">
                Send us a Message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-background border-border"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-background border-border"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="bg-background border-border"
                    placeholder="What's this about?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="bg-background border-border min-h-[120px]"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                
                <Button 
                  type="submit" 
                  variant="default" 
                  size="lg" 
                  className="w-full font-medium"
                  style={{ backgroundColor: "#0846BC", color: "#FFFFFF" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#073a9e";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#0846BC";
                  }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
                </form>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="font-heading font-bold text-2xl text-foreground mb-6">
                  Contact Information
                </h2>
                <p className="text-muted-foreground mb-8">
                  Choose the most convenient way to reach us. Our team is ready to assist you with any inquiries.
                </p>
              </div>

              <div className="space-y-6">
                <Card className="p-6 border-border bg-card">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0846BC" }}>
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Phone Support</h3>
                      <p className="text-muted-foreground mb-2">Speak directly with our support team</p>
                      <a href="tel:+17135551234" className="font-medium text-primary hover:underline">
                        (713) 555-1234
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-border bg-card">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0846BC" }}>
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email Support</h3>
                      <p className="text-muted-foreground mb-2">Send us detailed inquiries</p>
                      <a href="mailto:hello@thosejobs.com" className="font-medium text-primary hover:underline">
                        hello@thosejobs.com
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-border bg-card">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0846BC" }}>
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Office Location</h3>
                      <p className="text-muted-foreground mb-2">Houston Area, Texas</p>
                      <div className="font-medium text-foreground">
                        <p>1200 Main Street, Suite 500</p>
                        <p>Houston, TX 77002</p>
                        <p className="text-sm text-muted-foreground mt-1">Serving the Greater Houston Area</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-border bg-card">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#0846BC" }}>
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Business Hours</h3>
                      <p className="text-muted-foreground mb-2">When we're available (CST)</p>
                      <div className="font-medium text-foreground">
                        <p>Monday - Friday: 8:00 AM - 8:00 PM</p>
                        <p>Saturday: 9:00 AM - 6:00 PM</p>
                        <p>Sunday: 10:00 AM - 4:00 PM</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading font-light text-display text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Quick answers to common questions about ThoseJobs.com
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">How does the payment system work?</h3>
                <p className="text-muted-foreground">
                  We use escrow payments through Stripe Connect. The client's payment is held securely until the job is completed and approved. Workers receive 70% of the payment, and we take a 30% platform commission.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">What areas do you serve?</h3>
                <p className="text-muted-foreground">
                  Currently, we're focused on the Greater Houston Area (MVP). This includes Houston, Sugar Land, Katy, The Woodlands, Pearland, Spring, and surrounding communities.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">How do I accept a job?</h3>
                <p className="text-muted-foreground">
                  Browse available jobs on the Jobs page, review the details, and click "Accept Job" to claim it. Once accepted, you'll be connected with the client through our in-app chat system.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">What types of jobs are available?</h3>
                <p className="text-muted-foreground">
                  We focus on small, physical, real-world tasks like property checks, deliveries, minor maintenance, signage work, moving assistance, and other local gig opportunities in the Houston area.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">How do I become a Worker (Gig Doer)?</h3>
                <p className="text-muted-foreground">
                  Visit our "Become a Provider" page to start the application process. We'll guide you through verification, background checks, and onboarding to get you started accepting jobs.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">How is job proof verified?</h3>
                <p className="text-muted-foreground">
                  Workers submit proof (images/video) upon job completion. Our AI verification system reviews the submission, and once approved by the client, payment is automatically released.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;