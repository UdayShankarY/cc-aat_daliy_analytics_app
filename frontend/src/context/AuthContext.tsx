import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, type ApiUser, setToken, getToken } from "@/lib/api";

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  signOut: () => void;
  setAuth: (token: string, user: ApiUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const signOut = () => {
    setToken(null);
    setUser(null);
  };

  const setAuth = (token: string, u: ApiUser) => {
    setToken(token);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
