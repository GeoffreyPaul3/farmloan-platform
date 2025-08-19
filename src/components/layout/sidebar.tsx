import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wrench,
  TrendingUp,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & Analytics"
  },
  {
    name: "Farmer Groups",
    href: "/farmers",
    icon: Users,
    description: "Manage Groups & Members"
  },
  {
    name: "Loans",
    href: "/loans", 
    icon: CreditCard,
    description: "Track Loans & Repayments"
  },
  {
    name: "Equipment",
    href: "/equipment",
    icon: Wrench,
    description: "Equipment Management"
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: TrendingUp,
    description: "Reports & Insights"
  },
  {
    name: "Documents",
    href: "/documents",
    icon: FileText,
    description: "Upload & Export Files"
  },
];

const adminNavigation = [
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "System Configuration"
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: collapsed ? 80 : 280,
        transition: { duration: 0.3, ease: "easeInOut" }
      }}
      className="flex flex-col h-full bg-card border-r border-border shadow-card"
    >
      {/* Collapse Toggle */}
      <div className="flex justify-end p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0 hover:bg-secondary"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-secondary group",
                  active 
                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary-hover" 
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
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs opacity-70">{item.description}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-secondary group",
                  active 
                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary-hover" 
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
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs opacity-70">{item.description}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </motion.aside>
  );
}