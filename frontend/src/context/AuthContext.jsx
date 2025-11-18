// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Hidratación inicial desde localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Simular tiempo de verificación de sesión
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const raw = localStorage.getItem("user");
        if (raw) {
          try {
            setUser(JSON.parse(raw));
          } catch {
            localStorage.removeItem("user");
          }
        }
      } catch (error) {
        console.error("Error inicializando auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userData) => {
    setIsAuthenticating(true);
    try {
      // Simular autenticación en backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // si tienes endpoint de logout, puedes llamarlo aquí sin bloquear la UI
  };

  // Mostrar loading inicial mientras se verifica la sesión
  if (isLoading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Verificando sesión..."
      />
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
