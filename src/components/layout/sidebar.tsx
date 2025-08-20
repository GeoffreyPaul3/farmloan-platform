
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
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
  Calendar
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Clubs", href: "/clubs", icon: Users },
  { name: "Seasons", href: "/seasons", icon: Calendar },
  { name: "Inputs & Stock", href: "/inputs", icon: Package },
  { name: "Field Monitoring", href: "/field-visits", icon: MapPin },
  { name: "Buying & Grading", href: "/deliveries", icon: ShoppingCart },
  { name: "Payments & Loans", href: "/payments", icon: CreditCard },
  { name: "Equipment", href: "/equipment", icon: Wrench },
  { name: "Bulk Uploads", href: "/uploads", icon: Upload },
  { name: "Audit Logs", href: "/audit", icon: Shield },
  { name: "Reports", href: "/reports", icon: TrendingUp },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="w-64 bg-card border-r border-border h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Farm Manager
        </h2>
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
