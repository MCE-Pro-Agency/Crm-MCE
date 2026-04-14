import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import {
  CheckSquare,
  Clock,
  FolderKanban,
  UserCheck,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";

// --- Types ---
interface CountryStat {
  country: string;
  count: number;
}

interface DashboardState {
  stats: any;
  activities: any[];
  upcomingProjects: any[];
  countries: CountryStat[];
}

// --- Composant StatCard ---
interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

const StatCard = ({ title, value, change, changeType = "neutral", icon }: StatCardProps) => (
  <div className="stat-card bg-card p-6 rounded-xl border border-border shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 rounded-xl bg-primary/10">
        {icon}
      </div>
      {change && (
        <span className={`text-sm font-medium ${
          changeType === "positive" ? "text-success" :
          changeType === "negative" ? "text-destructive" :
          "text-muted-foreground"
        }`}>
          {change}
        </span>
      )}
    </div>
    <h3 className="text-3xl font-bold font-display text-foreground mb-1">{value}</h3>
    <p className="text-sm text-muted-foreground">{title}</p>
  </div>
);

// --- Spinner ---
const Spinner = () => (
  <div className="flex items-center justify-center gap-3 p-10 text-muted-foreground">
    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
    <span className="font-display text-sm">Chargement du tableau de bord...</span>
  </div>
);

// --- Dashboard principal ---
const Dashboard = () => {
  const { displayName } = useProfile();
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // ── 1. Vérifier la session AVANT de fetcher ────────────────────────────
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      // ── 2. Stats dashboard ─────────────────────────────────────────────────
      const { data: stats, error: statsError } = await supabase
        .from("dashboard_stats")
        .select("*")
        .single();

      if (statsError) {
        console.error("Erreur dashboard_stats:", statsError.message);
        // On continue même si stats échoue — on affichera des zéros
      }

      // ── 3. Activité récente ────────────────────────────────────────────────
      const { data: activities, error: actError } = await supabase
        .from("recent_activity")
        .select("*")
        .limit(6);

      if (actError) {
        console.error("Erreur recent_activity:", actError.message);
      }

      // ── 4. Projets avec échéances proches ──────────────────────────────────
      const today = new Date();
      const next7 = new Date();
      next7.setDate(today.getDate() + 7);
      const next3 = new Date();
      next3.setDate(today.getDate() + 3);
      const next7Str = next7.toISOString().split("T")[0];

      const { data: projects, error: projError } = await supabase
        .from("projects")
        .select("name, deadline")
        .eq("status", "en_cours")
        .not("deadline", "is", null)
        .lte("deadline", next7Str)
        .order("deadline", { ascending: true });

      if (projError) {
        console.error("Erreur projects:", projError.message);
      }

      const categorized = (projects || []).map((p: any) => {
        const deadline = new Date(p.deadline);
        if (deadline < today) return { ...p, level: "overdue" };
        if (deadline <= next3) return { ...p, level: "urgent" };
        return { ...p, level: "soon" };
      });

      // ── 5. Répartition par pays ────────────────────────────────────────────
      const { data: countryData, error: countryError } = await supabase
        .from("clients")
        .select("country");

      if (countryError) {
        console.error("Erreur clients/country:", countryError.message);
      }

      const countryCounts = (countryData || []).reduce((acc: any, curr: any) => {
        const country = curr.country || "Non défini";
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});

      const formattedCountries = Object.keys(countryCounts)
        .map(key => ({ country: key, count: countryCounts[key] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setData({
        stats: stats || {},
        activities: activities || [],
        upcomingProjects: categorized,
        countries: formattedCountries,
      });

    } catch (err: any) {
      console.error("Erreur fetchDashboardData:", err);
      setError("Erreur lors du chargement. Veuillez rafraîchir la page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ProtectedRoute garantit que l'utilisateur est connecté avant ce montage.
    // On vérifie la session une seule fois et on charge les données.
    // Plus de subscription onAuthStateChange ici : AuthContext gère déjà tout.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchDashboardData();
      } else {
        setLoading(false);
        setError("Session expirée. Veuillez vous reconnecter.");
      }
    });
  }, []);

  // ── États d'affichage ──────────────────────────────────────────────────────
  if (loading) return (
    <DashboardLayout>
      <Spinner />
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="p-10 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
        >
          Réessayer
        </button>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue,{" "}
            <span className="text-primary font-medium">{displayName}</span>.
            Voici l'état de votre activité en temps réel.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Leads totaux"
            value={data?.stats?.total_Leads ?? "0"}
            change={`+${data?.stats?.new_Leads ?? 0} nouveaux`}
            changeType="positive"
            icon={<Users className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Clients confirmés"
            value={data?.stats?.confirmed_clients ?? "0"}
            change={`sur ${data?.stats?.total_clients ?? 0}`}
            icon={<UserCheck className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Projets actifs"
            value={data?.stats?.active_projects ?? "0"}
            change={`/${data?.stats?.total_projects ?? 0} total`}
            icon={<FolderKanban className="w-6 h-6 text-primary" />}
          />
          <StatCard
            title="Tâches en attente"
            value={data?.stats?.pending_tasks ?? "0"}
            change={
              (data?.stats?.overdue_tasks ?? 0) > 0
                ? `${data?.stats?.overdue_tasks} en retard`
                : "À jour"
            }
            changeType={(data?.stats?.overdue_tasks ?? 0) > 0 ? "negative" : "positive"}
            icon={<CheckSquare className="w-6 h-6 text-primary" />}
          />
        </div>

        {/* Activité + Échéances */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Activité récente */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Activité récente dans les 24h</h2>
            <div className="space-y-4">
              {data?.activities && data.activities.length > 0 ? (
                data.activities.map((act: any) => (
                  <div key={act.id} className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50">
                    <div className={`p-2 rounded-lg ${act.type === "Leads" ? "bg-info/10 text-info" : "bg-warning/10 text-warning"}`}>
                      {act.type === "Leads" ? <Users size={16} /> : <CheckSquare size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{act.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(act.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">Aucune activité récente.</p>
              )}
            </div>
          </div>

          {/* Échéances */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <h3 className="font-semibold text-foreground">Échéances proches</h3>
              </div>

              <div className="space-y-3">
                {data?.upcomingProjects && data.upcomingProjects.length > 0 ? (
                  data.upcomingProjects.map((p: any, i: number) => {
                    let colorClass = "";
                    let badge = "";

                    if (p.level === "overdue") {
                      colorClass = "text-destructive";
                      badge = "🔴 En retard";
                    } else if (p.level === "urgent") {
                      colorClass = "text-orange-500";
                      badge = "🟠 Urgent";
                    } else {
                      colorClass = "text-warning";
                      badge = "🟡 Bientôt";
                    }

                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium truncate max-w-[140px]">{p.name}</span>
                          <span className={`text-xs font-semibold ${colorClass}`}>{badge}</span>
                        </div>
                        <span className={`text-xs font-bold ${colorClass}`}>
                          {new Date(p.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground italic">Aucune échéance critique.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;