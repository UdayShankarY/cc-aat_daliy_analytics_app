import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, LayoutDashboard, PlusCircle, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: typeof Activity; label: string }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Activity className="h-5 w-5" />
            </span>
            Pulse
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/add" icon={PlusCircle} label="Add entry" />
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
        <nav className="container flex items-center gap-1 pb-3 md:hidden">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/add" icon={PlusCircle} label="Add" />
        </nav>
      </header>

      <main className="container py-8 animate-fade-in">{children}</main>
    </div>
  );
};

export default AppShell;
