import { Search, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlobalSearch } from "@/components/search/global-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/ui/theme-provider";
import { Link } from "react-router-dom";
import { NotificationsPanel } from "@/components/notifications/notifications-panel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/farm-logo.png"

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'staff';
  avatar_url?: string;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { setTheme, theme } = useTheme();

  // Fetch user profile data
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
  };

  // Get display name and role
  const displayName = userProfile?.full_name || user?.email || "User";
  const userRole = userProfile?.role || "staff";
  const roleDisplay = userRole === 'admin' ? 'Administrator' : 'Staff Member';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
           <Link to="/" >
                  <img 
                   src={logo}
                   alt="Logo"
                   width={70}
                   height={70}
                    />
                </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground truncate">Farm Manager</h1>
            <p className="text-xs text-muted-foreground truncate">Loan & Equipment Platform</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <GlobalSearch 
            placeholder="Search farmers, loans, equipment..."
            className="w-full"
          />
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationsPanel />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="inline-flex"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-border">
                  <AvatarImage src={userProfile?.avatar_url || ""} alt="User" />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{roleDisplay}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button - positioned at the very end */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="md:hidden h-10 w-10 p-0"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}