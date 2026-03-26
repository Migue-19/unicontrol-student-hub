import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  nombre: string;
  codigo_estudiantil: string;
  carrera_id: string;
  carrera_nombre?: string;
  semestre_actual: number;
  email: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string, profileData: {
    nombre: string;
    codigo_estudiantil: string;
    carrera_id: string;
    semestre_actual: number;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*, carreras(nombre)")
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      setProfile({
        id: data.id,
        nombre: data.nombre,
        codigo_estudiantil: data.codigo_estudiantil,
        carrera_id: data.carrera_id,
        carrera_nombre: (data.carreras as any)?.nombre || "",
        semestre_actual: data.semestre_actual,
        email,
      });
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Use setTimeout to avoid deadlock with Supabase auth
        setTimeout(() => fetchProfile(session.user.id, session.user.email || ""), 0);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id, session.user.email || "");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Inicio de sesión exitoso" };
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    profileData: { nombre: string; codigo_estudiantil: string; carrera_id: string; semestre_actual: number }
  ) => {
    if (!email.endsWith("@uceva.edu.co")) {
      return { success: false, message: "El correo debe ser @uceva.edu.co" };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) return { success: false, message: error.message };
    if (!data.user) return { success: false, message: "Error al crear usuario" };

    // Insert profile
    const { error: profileError } = await supabase.from("usuarios").insert({
      id: data.user.id,
      nombre: profileData.nombre,
      codigo_estudiantil: profileData.codigo_estudiantil,
      carrera_id: profileData.carrera_id,
      semestre_actual: profileData.semestre_actual,
    });

    if (profileError) return { success: false, message: profileError.message };

    // Sign out so user goes to login
    await supabase.auth.signOut();

    return { success: true, message: "Registro exitoso. Inicia sesión." };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id, user.email || "");
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider value={{
      user, profile, loading, login, register, logout,
      isAuthenticated: !!user && !!profile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
