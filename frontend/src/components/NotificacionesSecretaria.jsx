import React, { useEffect, useMemo, useState } from "react";
import { Bell, X } from "lucide-react";

/**
 * Overlay de notificaciones para Secretaría/Funcionario.
 * GET /funcionario/alertas/exceso-licencias?anio=YYYY
 */
export default function NotificacionesSecretaria() {
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    const raw = sessionStorage.getItem("notif_exceso_dismissed");
    return new Set(raw ? JSON.parse(raw) : []);
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
        const token = localStorage.getItem("token") || "";
        const anio = new Date().getFullYear();

        const res = await fetch(`${API}/funcionario/alertas/exceso-licencias?anio=${anio}`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.mensaje || `Error ${res.status}`);
        setItems(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    sessionStorage.setItem("notif_exceso_dismissed", JSON.stringify([...dismissed]));
  }, [dismissed]);

  const visibles = useMemo(() => items.filter(n => !dismissed.has(n.id_usuario)), [items, dismissed]);

  if (loading || err || visibles.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-sm">
      {visibles.map((n) => (
        <div
          key={n.id_usuario}
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 shadow-lg flex gap-3 items-start"
          role="alert" aria-live="polite"
        >
          <div className="flex-shrink-0 mt-0.5">
            <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 dark:text-red-200">⚠ Exceso de licencias</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              <strong>{n.nombre}</strong> tiene <strong>{n.cantidad} licencias</strong> aceptadas en {n.anio}, excediendo el máximo de 5.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">({n.correo})</p>
          </div>
          <button
            onClick={() => setDismissed(prev => new Set([...prev, n.id_usuario]))}
            className="flex-shrink-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            aria-label="Descartar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
