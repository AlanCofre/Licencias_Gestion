import React, { createContext, useContext, useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
    localStorage.removeItem("user");
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
        login,
        logout,
        isAuthenticating,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);