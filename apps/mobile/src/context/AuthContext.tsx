import React, { createContext, useContext, useState, useCallback } from "react";

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  addresses?: any[];
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isFirstTime: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAuthenticated: (authenticated: boolean, isFirstTime?: boolean) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  const setTokens = useCallback((access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
  }, []);

  const setAuthenticated = useCallback(
    (authenticated: boolean, isFirstTimeUser: boolean = false) => {
      console.log(
        "[AuthContext] setAuthenticated called with:",
        authenticated,
        "isFirstTime:",
        isFirstTimeUser,
      );
      if (authenticated) {
        setIsFirstTime(isFirstTimeUser);
        // Set authentication state
        if (!user || !user.id) {
          setUser({ id: "temp", phone: "", name: "User" });
        }
        setAccessToken("authenticated");
        setRefreshToken("authenticated");
        console.log(
          "[AuthContext] User authenticated, isFirstTime:",
          isFirstTimeUser,
        );
      } else {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setIsFirstTime(false);
        console.log("[AuthContext] User logged out");
      }
    },
    [user],
  );

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setIsFirstTime(false);
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!user && !!accessToken,
    isFirstTime,
    loading,
    setUser,
    setTokens,
    setAuthenticated,
    logout,
    setLoading,
  };

  console.log(
    "[AuthContext] Current state - isAuthenticated:",
    !!user && !!accessToken,
    "isFirstTime:",
    isFirstTime,
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
