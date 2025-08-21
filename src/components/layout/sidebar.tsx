
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  FileText,
  DollarSign,
  Wrench,
  TrendingUp,
  Package,
  MapPin,
  ShoppingCart,
  CreditCard,
  Shield,
  Upload,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    description: "Overview & Analytics"
  },
  {
    name: "Clubs",
    href: "/clubs",
    icon: Users,
    description: "Manage Farmer Groups"
  },
  {
    name: "Seasons",
    href: "/seasons",
    icon: Calendar,
    description: "Season Management"
  },
  {
    name: "Inputs & Stock",
    href: "/inputs",
    icon: Package,
    description: "Inventory & Distribution"
  },
  {
    name: "Field Monitoring",
    href: "/field-visits",
    icon: MapPin,
    description: "Visit & Monitor Farms"
  },
  {
    name: "Buying & Grading",
    href: "/deliveries",
    icon: ShoppingCart,
    description: "Process Deliveries"
  },
  {
    name: "Payments & Loans",
    href: "/payments",
    icon: CreditCard,
    description: "Financial Management"
  },
  {
    name: "Equipment",
    href: "/equipment",
    icon: Wrench,
    description: "Equipment Tracking"
  },
  {
    name: "Bulk Uploads",
    href: "/uploads",
    icon: Upload,
    description: "Import Data"
  },
  {
    name: "Audit Logs",
    href: "/audit",
    icon: Shield,
    description: "System Activity"
  },
  {
    name: "Reports",
    href: "/reports",
    icon: TrendingUp,
    description: "Analytics & Insights"
  },
];

const adminNavigation = [
  {
    name: "Admin",
    href: "/admin",
    icon: Shield,
    description: "System Administration"
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ mobileOpen = false, onMobileClose, isMobile = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Handle responsive behavior for desktop
  useEffect(() => {
    if (!isMobile) {
      const checkMobile = () => {
        const mobile = window.innerWidth < 768;
        if (mobile) {
          setCollapsed(true);
        }
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [isMobile]);

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  const SidebarContent = () => (
    <motion.aside
      initial={false}
      animate={{ 
        width: collapsed ? 80 : 280,
        transition: { duration: 0.3, ease: "easeInOut" }
      }}
      className="flex flex-col h-full bg-card border-r border-border shadow-card"
    >
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.h2
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-semibold text-foreground truncate"
            >
              Cotton Club Manager
            </motion.h2>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0 hover:bg-secondary shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-2 pt-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-secondary group relative",
                  active 
                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden flex-1"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium truncate">{item.name}</span>
                        <span className="text-xs opacity-70 truncate">{item.description}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active indicator for collapsed state */}
                {collapsed && active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-2 w-2 h-2 bg-primary-foreground rounded-full"
                  />
                )}
              </NavLink>
            );
          })}
        </div>

        <Separator className="my-6" />

        {/* Admin Section */}
        <div className="space-y-2">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-3 py-2"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {adminNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-secondary group relative",
                  active 
                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden flex-1"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium truncate">{item.name}</span>
                        <span className="text-xs opacity-70 truncate">{item.description}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active indicator for collapsed state */}
                {collapsed && active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-2 w-2 h-2 bg-primary-foreground rounded-full"
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </motion.aside>
  );

  // Mobile overlay and sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={onMobileClose}
            />
          )}
        </AnimatePresence>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed left-0 top-0 h-full z-50 md:hidden"
            >
              <div className="relative h-full">
                <SidebarContent />
                
                {/* Close button for mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMobileClose}
                  className="absolute top-4 right-4 h-8 w-8 p-0 bg-card border border-border shadow-lg"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop sidebar
  return <SidebarContent />;
}
