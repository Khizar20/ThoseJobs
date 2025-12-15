import { Users, Shield, Award, Heart } from "lucide-react";
import { motion, useInView, animate } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
// about hero uses solid brand-aligned background, no image overlay

// Number Ticker Component for counting animation
const NumberTicker = ({ from = 0, to = 1000, duration = 1.2 }: { from?: number; to: number; duration?: number }) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.floor(v)),
    });
    return () => controls.stop();
  }, [isInView, from, to, duration]);

  return (
    <span ref={ref} aria-label={`${to}`} role="text">
      {value.toLocaleString()}
    </span>
  );
};

const values = [
  {
    icon: Shield,
    title: "Verified Gig Doers",
    description: "All workers undergo identity verification and background checks. We verify their location and ensure they're ready to complete tasks safely and professionally."
  },
  {
    icon: Award,
    title: "Secure Payments", 
    description: "Payment is held in escrow until job completion. Workers get 70% of the budget, platform takes 30%. No payment until you approve the work."
  },
  {
    icon: Heart,
    title: "Real-World Tasks",
    description: "We focus on physical tasks like property checks, deliveries, minor maintenance, and signage work - things that need to be done in person."
  },
  {
    icon: Users,
    title: "Houston Area Focus",
    description: "Currently serving the Greater Houston Area including Sugar Land, Katy, The Woodlands, Pearland, Spring, and surrounding communities."
  }
];

const stats = [
  { number: "12,000+", label: "Jobs Completed", value: 12000, suffix: "+" },
  { number: "5,000+", label: "Active Workers", value: 5000, suffix: "+" },
  { number: "5", label: "Task Categories", value: 5, suffix: "" },
  { number: "4.8", label: "Average Rating", value: 4.8, suffix: "", isDecimal: true }
];

const About = () => {
  // Removed page-specific cursor follower; replaced by global cursor component

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundColor: '#FCFAF8'
          }}
        />
        {/* Decorative animated shapes */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -z-0 inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Subtle animated SVG grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#CC6E37" strokeOpacity="0.15" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <motion.div
            className="absolute right-10 top-10 w-40 h-40 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(204,110,55,0.10), transparent 60%)' }}
            animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 12 }}
          />
          <motion.div
            className="absolute left-0 bottom-10 w-56 h-56 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle at 70% 70%, rgba(204,110,55,0.08), transparent 60%)' }}
            animate={{ y: [0, 12, 0], x: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 14 }}
          />
          {/* Global cursor handles page-wide cursor effects */}
        </motion.div>
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-heading font-light text-hero text-foreground mb-6"
            >
              HOW IT WORKS.<br />
              THOSEJOBS.<br />
              SIMPLIFIED.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
            >
              The gig marketplace for physical, real-world tasks. Connect with verified Gig Doers in the Houston area to get things done quickly and efficiently.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-heading font-bold text-display text-foreground mb-8 text-center"
            >
              How ThoseJobs Works
            </motion.h2>
            
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
              {[
                "ThoseJobs is a gig marketplace designed specifically for physical, real-world tasks. Whether you need a property walkthrough, a lightbulb changed, a package picked up, or signage work completed, we connect you with verified Gig Doers in the Houston area.",
                "For Requesters: Post your task with a budget, and verified workers will accept and complete it. Payment is held securely in escrow until you approve the completed work. You keep 100% control - approve when satisfied, dispute if needed.",
                "For Workers: Browse available jobs, accept tasks that match your skills and location, complete the work, and submit proof. Once approved, you receive 70% of the budget directly to your account. Build your reputation through ratings and reviews.",
                "Our platform focuses on small, manageable tasks that can be completed quickly - typically in under 2 hours. We handle all payments securely, verify worker identities, and provide in-app communication so you can coordinate seamlessly."
              ].map((text, index) => {
                const ref = useRef(null);
                const isInView = useInView(ref, { once: true, margin: "-50px" });
                
                return (
                  <motion.p
                    key={index}
                    ref={ref}
                    initial={{ opacity: 0, x: -30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="text-xl leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: text.replace(/<strong>(.*?)<\/strong>/g, '<strong class="text-foreground">$1</strong>') }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading font-bold text-display text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-xl text-muted-foreground">
              The principles that guide everything we do
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const ref = useRef(null);
              const isInView = useInView(ref, { once: true, margin: "-100px" });
              
              return (
                <motion.div
                  key={value.title}
                  ref={ref}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                <Card 
                    className="h-full min-h-[280px] p-6 text-center border-border bg-background hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                    <motion.div
                      className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 flex-shrink-0"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                    <value.icon className="h-8 w-8 text-primary" />
                    </motion.div>
                    <h3 className="font-semibold text-lg text-foreground mb-3 flex-shrink-0">{value.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed flex-grow">{value.description}</p>
                </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading font-bold text-display text-foreground mb-4">
              ThoseJobs by the Numbers
            </h2>
            <p className="text-xl text-muted-foreground">
              Real results from real tasks completed in the Houston area
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const ref = useRef(null);
              const isInView = useInView(ref, { once: true, margin: "-100px" });
              
              return (
                <motion.div
                key={stat.label} 
                  ref={ref}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.6, delay: index * 0.15, type: "spring", stiffness: 100 }}
                className="text-center"
              >
                <div className="font-heading font-bold text-5xl md:text-6xl text-primary mb-2">
                    {isInView ? (
                      <>
                        {stat.isDecimal ? (
                          <NumberTicker to={stat.value} duration={2} decimals={1} />
                        ) : (
                          <>
                            <NumberTicker to={stat.value} duration={2} />
                            {stat.suffix}
                          </>
                        )}
                      </>
                    ) : (
                      stat.number
                    )}
                </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: index * 0.15 + 0.5 }}
                    className="text-lg text-muted-foreground font-medium"
                  >
                    {stat.label}
                  </motion.p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-heading font-bold text-display text-primary-foreground mb-6"
            >
              Our Mission
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl text-primary-foreground/90 leading-relaxed"
            >
              To make small, physical tasks easy to get done. We connect people who need things done with verified Gig Doers who can do them quickly, safely, and professionally. Simple tasks, local hands, trusted results.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading font-bold text-display text-foreground mb-4">
              Leadership Team
            </h2>
            <p className="text-xl text-muted-foreground">
              Meet the people building the future of local services
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                image: "/young-man.png",
                name: "Michael Johnson",
                role: "CEO & Founder",
                description: "Visionary leader driving innovation in gig marketplace platforms"
              },
              {
                image: "/businesswoman.png",
                name: "Sarah Chen",
                role: "CTO",
                description: "Tech expert with deep expertise in marketplace platforms and mobile applications"
              },
              {
                image: "/bussiness-man.png",
                name: "David Williams",
                role: "Head of Operations",
                description: "Operations specialist ensuring quality and efficiency across all gig tasks"
              }
            ].map((member, index) => {
              const ref = useRef(null);
              const isInView = useInView(ref, { once: true, margin: "-100px" });
              
              return (
                <motion.div
                  key={member.name}
                  ref={ref}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
                  transition={{ duration: 0.6, delay: index * 0.2, type: "spring", stiffness: 100 }}
                  className="text-center"
                >
                  <motion.div
                    className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-4 border-primary/20 shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <h3 className="font-semibold text-lg text-foreground">{member.name}</h3>
                  <p className="text-primary">{member.role}</p>
              <p className="text-sm text-muted-foreground mt-2">
                    {member.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;