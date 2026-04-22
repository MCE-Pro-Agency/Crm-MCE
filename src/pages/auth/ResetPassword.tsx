import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// ─── MCE Logo (même que Login) ───────────────────────────────────────────────
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

// ─── Section droite (même style que Login) ────────────────────────────────────
const MCEAgencySection = () => (
  <div className="hidden lg:flex flex-1 hero-section items-center justify-center p-12 relative overflow-hidden">
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(90deg, #00AEEF 1px, transparent 1px), linear-gradient(#00AEEF 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-gradient-to-r from-[#00AEEF]/30 to-[#0A6EBD]/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gradient-to-l from-[#00AEEF]/20 to-cyan-500/10 rounded-full blur-3xl animate-float" />
    </div>

    <div className="relative z-10 text-center max-w-md">
      <div className="flex justify-center mb-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00AEEF] to-cyan-400 rounded-3xl blur-2xl opacity-40" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl">
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
        <span className="text-sm font-semibold text-[#00AEEF] tracking-widest uppercase">Sécurité du compte</span>
        <div className="h-1 w-8 bg-gradient-to-l from-[#00AEEF] to-transparent rounded-full" />
      </div>

      <p className="text-white/70 text-lg leading-relaxed mb-1">Définissez votre nouveau mot de passe</p>
      <p className="text-white/60 text-base">et reprenez le contrôle de votre compte</p>
    </div>
  </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────
const ResetPassword = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase rétablit automatiquement la session via le hash dans l'URL
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Si la session est déjà active (rechargement de page)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const passwordRules = [
    { label: "Au moins 8 caractères", valid: password.length >= 8 },
    { label: "Une lettre majuscule", valid: /[A-Z]/.test(password) },
    { label: "Un chiffre", valid: /[0-9]/.test(password) },
  ];

  const allRulesValid = passwordRules.every((r) => r.valid);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRulesValid) {
      toast.error("Le mot de passe ne respecte pas les critères de sécurité.");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Mot de passe mis à jour avec succès !");

      // Redirection vers le login après 3 secondes
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour du mot de passe.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Formulaire */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-20 py-12">
        <div className="w-full max-w-md mx-auto">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display font-bold text-foreground">
                Nouveau mot de passe
              </h1>
            </div>
            <p className="text-muted-foreground">
              Choisissez un mot de passe sécurisé pour votre compte.
            </p>
          </div>

          {/* ── État de succès ── */}
          {isSuccess ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Mot de passe mis à jour !</h2>
              <p className="text-muted-foreground">
                Vous allez être redirigé vers la page de connexion...
              </p>
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : !sessionReady ? (
            /* ── Attente de la session ── */
            <div className="text-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                Vérification de votre lien de réinitialisation...
              </p>
              <p className="text-xs text-muted-foreground">
                Si rien ne se passe, le lien a peut-être expiré.{" "}
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Demander un nouveau lien
                </Link>
              </p>
            </div>
          ) : (
            /* ── Formulaire ── */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                {/* Indicateurs de sécurité */}
                <div className="space-y-1.5 pt-1">
                  {passwordRules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          rule.valid ? "bg-green-500" : "bg-muted-foreground/30"
                        }`}
                      />
                      <span className={rule.valid ? "text-green-600" : "text-muted-foreground"}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {confirmPassword.length > 0 && (
                  <p className={`text-xs ${passwordsMatch ? "text-green-600" : "text-destructive"}`}>
                    {passwordsMatch ? "Les mots de passe correspondent ✓" : "Les mots de passe ne correspondent pas"}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12"
                disabled={isLoading || !allRulesValid || !passwordsMatch}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mise à jour...
                  </span>
                ) : (
                  "Mettre à jour le mot de passe"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Section droite */}
      <MCEAgencySection />
    </div>
  );
};

export default ResetPassword;