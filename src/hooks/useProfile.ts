/**
 * useProfile — délègue entièrement à AuthContext.
 *
 * Plus d'appel getUser() redondant qui causait le spinner infini
 * après un redirect OAuth. AuthContext est la source unique de vérité.
 */
import { useAuth, type Profile } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export type { Profile };

type UpdateProfileInput = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
};

export function useProfile() {
  const { profile, loading, refreshProfile } = useAuth();

  const updateProfile = async (values: UpdateProfileInput) => {
    if (!profile) return { success: false };

    const { error } = await supabase
      .from("profiles")
      .update(values)
      .eq("id", profile.id);

    if (!error) {
      await refreshProfile(); // Recharge depuis AuthContext
      return { success: true };
    }
    return { success: false, error };
  };

  const isAdminRole = (role?: string | null) => {
    const normalized = String(role || "").toLowerCase();
    return normalized === "admin" || normalized === "administrateur";
  };

  const isAdmin = isAdminRole(profile?.role);

  const displayName =
    profile?.first_name || profile?.last_name
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      : profile?.email || "Utilisateur";

  return {
    profile,
    loading,
    updateProfile,
    isAdmin,
    displayName,
    refreshProfile,
  };
}