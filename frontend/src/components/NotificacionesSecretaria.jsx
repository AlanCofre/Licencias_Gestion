import React, { useMemo, useState } from "react";
import { Bell, X } from "lucide-react";
import { useLicenciasporAño } from "../hooks/useLicenciasporAño";

const studentsMock = [
  {
    id: "s3",
    nombre: "Ana Martínez",
    rut: "12.345.678-9",
    licencias: [
      { fecha_emision: "2025-01-15", estado: "validada" },
      { fecha_emision: "2025-02-20", estado: "validada" },
      { fecha_emision: "2025-03-10", estado: "validada" },
      { fecha_emision: "2025-04-05", estado: "validada" },
      { fecha_emision: "2025-05-12", estado: "validada" },
      { fecha_emision: "2025-06-18", estado: "validada" },
    ],
  },
];

export default function NotificacionesSecretaria() {
  const [dismissed, setDismissed] = useState(new Set());
  const año = new Date().getFullYear();

  const notificaciones = useMemo(() => {
    return studentsMock
      .map((est) => {
        const licporAño = useLicenciasporAño(est.licencias);
        const cantidad = (licporAño[año] || []).length;
        if (cantidad > 5) {
          return {
            id: est.id,
            estudiante: est.nombre,
            rut: est.rut,
            cantidad,
            año,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, []);

  const handleDismiss = (id) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const visibles = notificaciones.filter((n) => !dismissed.has(n.id));

  if (visibles.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-sm">
      {visibles.map((notif) => (
        <div
          key={notif.id}
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 shadow-lg flex gap-3 items-start animate-slideIn"
        >
          <div className="flex-shrink-0 mt-0.5">
            <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 dark:text-red-200">
              ⚠ Exceso de licencias
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              <strong>{notif.estudiante}</strong> ({notif.rut}) tiene <strong>{notif.cantidad} licencias</strong> validadas en {notif.año}, excediendo el máximo de 5.
            </p>
          </div>
          <button
            onClick={() => handleDismiss(notif.id)}
            className="flex-shrink-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}