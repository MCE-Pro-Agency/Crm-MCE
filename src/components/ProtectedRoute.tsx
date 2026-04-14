import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

/**
 * ProtectedRoute — bloque l'accès si non connecté.
 * Pendant le chargement de la session (loading=true), affiche un splash
 * au lieu de rediriger prématurément vers /login.
 */
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ── Session en cours de chargement → splash screen ────────────────────────
  // (capte le cas OAuth redirect où le token est dans l'URL)
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white font-bold text-sm">MCE</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <svg
            className="animate-spin h-4 w-4 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Chargement de votre session...
        </div>
      </div>
    );
  }

  // ── Pas connecté → rediriger vers login ───────────────────────────────────
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Connecté → afficher la page ───────────────────────────────────────────
  return <>{children}</>;
};