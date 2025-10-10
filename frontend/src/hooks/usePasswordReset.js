import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useRequestReset() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function requestReset(email) {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/usuarios/password-reset/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                const message = body.message || res.statusText;
                throw new Error(message);
            }
            setLoading(false);
            return body;
        } catch (err) {
            setError(err.message || "Error");
            setLoading(false);
            throw err;
        }
    }

    return { requestReset, loading, error };
}

export function useConfirmReset() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function confirmReset(email, code, newPassword) {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/usuarios/password-reset/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, newPassword }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                const message = body.message || res.statusText;
                throw new Error(message);
            }
            setLoading(false);
            return body;
        } catch (err) {
            setError(err.message || "Error");
            setLoading(false);
            throw err;
        }
    }

    return { confirmReset, loading, error };
}