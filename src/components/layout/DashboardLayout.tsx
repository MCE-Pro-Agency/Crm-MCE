import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { UserPlus } from "lucide-react";
import {
  BarChart3,
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  UserCheck,
  Users
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { NotificationHeader } from "../shared/NotificationHeader";

// --- CONFIGURATION NAVIGATION ---
interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: "Tableau de bord", href: "/dashboard" },
  { icon: <Users className="w-5 h-5" />, label: "Prospect", href: "/dashboard/Leads" },
  { icon: <UserCheck className="w-5 h-5" />, label: "Clients", href: "/dashboard/clients" },
  { icon: <FolderKanban className="w-5 h-5" />, label: "Projets", href: "/dashboard/projects" },
  { icon: <CheckSquare className="w-5 h-5" />, label: "Tâches", href: "/dashboard/tasks" },
  { icon: <Calendar className="w-5 h-5" />, label: "Calendrier", href: "/dashboard/calendar" },
  { icon: <MessageSquare className="w-5 h-5" />, label: "Collaboration", href: "/dashboard/collaboration" },
  { icon: <FileText className="w-5 h-5" />, label: "Devis", href: "/dashboard/quotes", adminOnly: true },
  { icon: <FileText className="w-5 h-5" />, label: "Factures", href: "/dashboard/invoices", adminOnly: true },
  // MODULE RH
  { icon: <UserPlus className="w-5 h-5" />, label: "Recrutement", href: "/dashboard/recruitment", adminOnly: true },
];

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { profile, loading } = useProfile();

  const userRole = profile?.role || "user";
  const isAdmin = userRole === "admin";
  const filteredNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  // --- LOGIQUE DE REDIRECTION NOTIFICATION ---
  const handleNotificationRedirect = (projectId: string) => {
    // Redirige vers la page projets avec l'ID du projet dans l'URL
    navigate(`/dashboard/projects?open=${projectId}`);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Déconnexion réussie");
      navigate("/");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
          {/* DEBUG: Affichage du rôle et de l'ID utilisateur */}
          {!collapsed && profile && (
            <div className="mt-2 text-xs text-red-600 font-mono">
              <div>role: <b>{profile.role ?? "(aucun)"}</b></div>
              <div>id: <b>{profile.id}</b></div>
            </div>
          )}
    }
  };

  const getInitials = () => {
    if (!profile?.first_name) return "U";
    return (profile.first_name[0] + (profile.last_name?.[0] || "")).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            {!collapsed && <span className="text-lg font-bold tracking-tight">AgenceCRM</span>}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden lg:flex h-8 w-8" 
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              onClick={() => setMobileOpen(false)}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link to="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent">
            <Settings className="w-5 h-5" />
            {!collapsed && <span>Paramètres</span>}
          </Link>
          <button 
            onClick={handleSignOut} 
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 z-30 shadow-sm">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-4 ml-auto">
            {/* 🔔 NOTIFICATIONS AVEC REDIRECTION */}
            {!loading && profile?.id && (
              <NotificationHeader 
                userId={profile.id} 
                onNotificationClick={handleNotificationRedirect} 
              />
            )}

            <div className="flex items-center gap-3 border-l pl-4">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold Leadsing-none">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1 tracking-wider">{profile?.role}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                    <span className="text-primary font-bold text-xs">{getInitials()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
};