import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

// ─── MCE Logo ────────────────────────────────────────────────────────────────
const outerDots: [number, number][] = [
  [20,4],[26,5],[32,9],[36,15],[38,20],[36,25],[32,31],[26,35],
  [20,36],[14,35],[8,31],[4,25],[2,20],[4,15],[8,9],[14,5],
];
const innerDots: [number, number][] = [
  [20,10],[27,13],[30,20],[27,27],[20,30],[13,27],[10,20],[13,13],
];

const MCELogoBeautiful = ({ size = 80 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    {outerDots.map(([cx, cy], i) => (
      <circle key={`outer-${i}`} cx={cx} cy={cy} r={1.6} fill={i % 3 === 0 ? "#00AEEF" : "#60D0F8"} />
    ))}
    {innerDots.map(([cx, cy], i) => (
      <circle key={`inner-${i}`} cx={cx} cy={cy} r={1.2} fill={i % 2 === 0 ? "#00AEEF" : "#60D0F8"} />
    ))}
    <circle cx={20} cy={20} r={1.8} fill="#0A6EBD" />
    <text x="20" y="23" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="white" fontFamily="sans-serif">MCE</text>
  </svg>
);

// ─── Google Icon ──────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// ─── Section droite ───────────────────────────────────────────────────────────
const MCEAgencySection = () => (
  <div className="hidden lg:flex flex-1 hero-section items-center justify-center p-12 relative overflow-hidden">
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(90deg, #00AEEF 1px, transparent 1px), linear-gradient(#00AEEF 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-gradient-to-r from-[#00AEEF]/30 to-[#0A6EBD]/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gradient-to-l from-[#00AEEF]/20 to-cyan-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#00AEEF]/15 rounded-full blur-[100px] opacity-50" />
    </div>

    <div className="relative z-10 text-center max-w-md">
      <div className="flex justify-center mb-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00AEEF] to-cyan-400 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
            <MCELogoBeautiful size={56} />
          </div>
        </div>
      </div>

      <h2 className="text-4xl lg:text-5xl font-bold mb-3 leading-tight">
        <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">MCE</span>
        <span className="block bg-gradient-to-r from-[#00AEEF] via-blue-400 to-cyan-300 bg-clip-text text-transparent">Agency</span>
      </h2>

      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="h-1 w-8 bg-gradient-to-r from-[#00AEEF] to-transparent rounded-full" />
        <span className="text-sm font-semibold text-[#00AEEF] tracking-widest uppercase">Plateforme CRM</span>
        <div className="h-1 w-8 bg-gradient-to-l from-[#00AEEF] to-transparent rounded-full" />
      </div>

      <p className="text-white/70 text-lg leading-relaxed mb-1">Connectez-vous à votre compte</p>
      <p className="text-white/60 text-base">et accédez à tous les outils de gestion de l'agence</p>

      <div className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-white/10">
        {[{ icon: "⚡", label: "Rapide" }, { icon: "🔒", label: "Sécurisé" }, { icon: "∞", label: "Scalable" }].map((f) => (
          <div key={f.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 hover:border-[#00AEEF]/50 transition-all">
            <span className="text-lg">{f.icon}</span>
            <span className="text-xs font-medium text-white/70">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Login principal ──────────────────────────────────────────────────────────
const Login = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  // Page d'origine avant la redirection vers /login
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  // Si l'utilisateur est déjà connecté (session valide), rediriger vers le dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading]);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading]       = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isDeletedProfile = (profile: any) =>
    String(profile?.role ?? "").toLowerCase() === "deleted";

  // ── Prefetch dashboard data ───────────────────────────────────────────────
  const prefetchDashboardData = async (userId: string) => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ["profile"],
        queryFn: async () => {
          const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
          if (error) throw error;
          return data;
        },
      });
      await queryClient.prefetchQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
          const { data, error } = await supabase.from("notifications").select("*").eq("profile_id", userId).order("created_at", { ascending: false }).limit(15);
          if (error) throw error;
          return data;
        },
      });
    } catch (err) {
      console.warn("Prefetch warning:", err);
    }
  };

  // ── Connexion email/password ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw new Error(
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect"
            : error.message
        );
      }

      if (data.user) {
        // Vérification compte supprimé avec timeout 3s — si lent, on laisse passer
        const profileCheckPromise = supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        const timeoutPromise = new Promise<{ data: null; error: null }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: null }), 3000)
        );
        const { data: loginProfile } = await Promise.race([profileCheckPromise, timeoutPromise]) as { data: any; error: any };

        if (loginProfile && isDeletedProfile(loginProfile)) {
          await supabase.auth.signOut();
          throw new Error("Votre compte a été supprimé. Contactez un administrateur.");
        }

        toast.success("Content de vous revoir !");
        // Prefetch en arrière-plan — ne pas attendre pour ne pas bloquer la navigation
        prefetchDashboardData(data.user.id).catch(() => {});
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Connexion Google OAuth ────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // ✅ Redirige vers le dashboard après auth Google
          // window.location.origin = automatiquement la bonne URL (prod ou local)
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: "https://www.googleapis.com/auth/calendar.events",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
      // La page se redirige vers Google — pas besoin de navigate()
    } catch (error: any) {
      toast.error("Erreur connexion Google : " + error.message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Formulaire */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-20 py-12">
        <div className="w-full max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Bon retour parmi nous</h1>
            <p className="text-muted-foreground">Connectez-vous à votre compte pour continuer</p>
          </div>

          {/* ── Bouton Google ── */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full mb-6 gap-3 h-12 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {isGoogleLoading ? "Redirection..." : "Continuer avec Google"}
          </Button>

          {/* Séparateur */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ── Formulaire email/password ── */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votremail@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-12" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">S'inscrire</Link>
          </p>
        </div>
      </div>

      {/* Section droite */}
      <MCEAgencySection />
    </div>
  );
};

export default Login;