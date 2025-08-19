import { motion } from "framer-motion";
import { ArrowRight, Users, CreditCard, Wrench, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link, Navigate } from "react-router-dom";
import logo from "@/assets/farm-logo.png"

const features = [
  {
    icon: Users,
    title: "Farmer Group Management",
    description: "Register and manage farmer groups with complete member tracking and creditworthiness assessment."
  },
  {
    icon: CreditCard,
    title: "Loan & Equipment Issuing",
    description: "Streamlined loan disbursement and equipment tracking with automated balance monitoring."
  },
  {
    icon: Wrench,
    title: "Equipment Management",
    description: "Complete equipment lifecycle management from purchase to retirement."
  },
  {
    icon: TrendingUp,
    title: "Analytics & Reporting",
    description: "Comprehensive reporting on loan performance, repayment rates, and farmer analytics."
  }
];

const Index = () => {
  const { user } = useAuth();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-enterprise">
                 <Link to="/" >
                    <img 
                      src={logo}
                      alt="Logo"
                      width={100}
                      height={100}
                      />
                  </Link>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-7xl font-bold text-foreground mb-6"
            >
              Farm Manager
              <span className="block text-primary mt-2">Enterprise Platform</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto"
            >
              World-class loan and equipment management platform for agricultural cooperatives. 
              Streamline farmer onboarding, loan disbursement, and equipment tracking.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                variant="hero" 
                size="lg"
                className="group"
                onClick={() => window.location.href = '/auth'}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-background/50 backdrop-blur-sm hover:bg-background/80"
              >
                View Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage agricultural loans and equipment efficiently
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="card-enterprise hover-lift h-full">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row items-center justify-between"
          >
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Link to="/" >
                    <img 
                      src={logo}
                      alt="Logo"
                      width={100}
                      height={100}
                      />
                  </Link>
              </div>
              <div>
                <h3 className="font-bold text-foreground">Farm Manager</h3>
                <p className="text-sm text-muted-foreground">Enterprise Platform</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Farm Manager. Built for agricultural excellence.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
