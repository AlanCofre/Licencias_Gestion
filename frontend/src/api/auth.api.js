import client from "./client";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "";

export async function login(credentials) {
    // Espera respuesta: { token, refreshToken, user }
    const res = await client.post("/auth/login", credentials);
    return res.data;
}

export async function register(data) {
    const res = await client.post("/auth/register", data);
    return res.data;
}

export async function logout() {
    // Intenta avisar al backend; si falla, el caller debe limpiar localStorage
    const res = await client.post("/auth/logout").catch(() => null);
    return res ? res.data : null;
}

export async function getProfile() {
    const res = await client.get("/auth/me");
    return res.data;
}

// Llamada directa (sin interceptores) para refrescar token cuando haga falta
export async function refreshToken(refreshToken) {
    const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
    return res.data;
}