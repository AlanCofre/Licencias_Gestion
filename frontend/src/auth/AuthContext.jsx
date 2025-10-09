import React, { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth.api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const data = await authApi.getProfile();
                // data puede ser { user: {...} } o {...}
                setUser(data.user ?? data);
            } catch (e) {
                localStorage.removeItem("authToken");
                localStorage.removeItem("refreshToken");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const login = async (credentials) => {
        const data = await authApi.login(credentials);
        const token = data.token ?? data.accessToken;
        const refresh = data.refreshToken;
        if (token) localStorage.setItem("authToken", token);
        if (refresh) localStorage.setItem("refreshToken", refresh);
        setUser(data.user ?? null);
        return data;
    };

    const register = async (payload) => {
        const data = await authApi.register(payload);
        return data;
    };

    const logout = async () => {
        await authApi.logout().catch(() => null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated: !!user,
            login,
            logout,
            register
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}