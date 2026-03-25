import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { authService } from "@/services/authService";
import { User } from "@/services/mockData";

interface AuthContextType {
  user: User | null;
  login: (correo: string, password: string) => { success: boolean; message: string };
  register: (data: Omit<User, "id">) => { success: boolean; message: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());

  const login = useCallback((correo: string, password: string) => {
    const result = authService.login(correo, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const register = useCallback((data: Omit<User, "id">) => {
    return authService.register(data);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
