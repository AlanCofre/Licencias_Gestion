// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hidratación inicial desde localStorage
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");
      const rawToken = localStorage.getItem("token");
      if (rawUser) setUser(JSON.parse(rawUser));
      if (rawToken) setToken(rawToken);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  // API del contexto: recibe el user normalizado (tu AppLogin ya lo normaliza)
  const login = (userData, tokenStr) => {
    setUser(userData || null);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));
    else localStorage.removeItem("user");

    if (tokenStr) {
      setToken(tokenStr);
      localStorage.setItem("token", tokenStr);
    } else {
      setToken(null);
      localStorage.removeItem("token");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // si tienes endpoint de logout, puedes llamarlo aquí sin bloquear la UI
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
