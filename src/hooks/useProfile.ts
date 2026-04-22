/**
 * useProfile — délègue entièrement à AuthContext.
 */
import { useAuth, type Profile } from "@/context/AuthContext";
import { canDelete, isAdminOrAbove, isSuperAdminRole, type AppModule } from "@/lib/permissions";
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
      await refreshProfile();
      return { success: true };
    }
    return { success: false, error };
  };

  const role = profile?.role ?? null;

  const isAdmin = isAdminOrAbove(role);
  const isSuperAdmin = isSuperAdminRole(role);
  const canDeleteIn = (module: AppModule) => canDelete(role, module);

  const displayName =
    profile?.first_name || profile?.last_name
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      : profile?.email || "Utilisateur";

  return {
    profile,
    loading,
    updateProfile,
    isAdmin,
    isSuperAdmin,
    canDeleteIn,
    displayName,
    refreshProfile,
  };
}