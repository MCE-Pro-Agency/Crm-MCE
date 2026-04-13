import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string | null;
  email?: string;
  avatar_url: string | null;
  country: string | null;
}

type UpdateProfileInput = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  country?: string;
  avatar_url?: string;
};

// 🔥 CACHE GLOBAL pour éviter de recharger à chaque mount
let profileCache: {
  profile: Profile | null;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60000; // 1 minute

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(profileCache?.profile || null);
  const [loading, setLoading] = useState(!profileCache?.profile);

  // ✅ Fonction mémorisée avec cache
  const loadProfile = useCallback(async (force = false) => {
    // Vérifier le cache
    if (!force && profileCache && Date.now() - profileCache.timestamp < CACHE_DURATION) {
      console.log("📦 Profil depuis le cache");
      setProfile(profileCache.profile);
      setLoading(false);
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setLoading(false);
      profileCache = null;
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      const newProfile = {
        ...data,
        email: user.email ?? "",
      };
      
      // 💾 Mise en cache
      profileCache = {
        profile: newProfile,
        timestamp: Date.now()
      };
      
      setProfile(newProfile);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ✅ Fonction mémorisée
  const updateProfile = useCallback(async (values: UpdateProfileInput) => {
    if (!profile) return { success: false, error: "No profile" };

    const { error } = await supabase
      .from("profiles")
      .update(values)
      .eq("id", profile.id);

    if (!error) {
      setProfile((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, ...values };
        // Mettre à jour le cache
        profileCache = {
          profile: updated,
          timestamp: Date.now()
        };
        return updated;
      });
      return { success: true };
    }
    return { success: false, error };
  }, [profile]);

  // ✅ Calculs mémorisés (ne se refont que si profile change)
  const isAdmin = useMemo(() => {
    const normalized = String(profile?.role || "").toLowerCase();
    return normalized === "admin" || normalized === "administrateur";
  }, [profile?.role]);

  const displayName = useMemo(() => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    }
    return profile?.email || "Utilisateur";
  }, [profile?.first_name, profile?.last_name, profile?.email]);

  return {
    profile,
    loading,
    updateProfile,
    isAdmin,
    displayName,
    refreshProfile: loadProfile,
  };
}