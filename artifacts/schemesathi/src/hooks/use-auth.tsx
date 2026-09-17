import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

type User = { id: string; name: string; email: string; role: "USER" | "ADMIN"; status: "ACTIVE" | "SUSPENDED" };

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.status === 200) {
        const data = await res.json();
        setUser(data.user);
      } else if (res.status === 401) {
        setUser(null);
      }
    } catch (err) {
      // Don't auto-logout on network error, but keep user null if uninitialized
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = (u: User) => setUser(u);
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

