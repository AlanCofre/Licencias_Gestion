import React from "react";

/**
 * Muestra un aviso cuando el estudiante excede el límite anual de licencias.
 * Espera props simples: { anio, cantidad, limite }
 */
export default function AlertaLicenciasAnual({ anio, cantidad, limite = 5 }) {
  // Si no excede, no mostramos nada
  if (typeof cantidad !== "number" || cantidad <= limite) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-red-50 border border-red-300 rounded-lg p-4 flex gap-3 items-start"
    >
      <svg
        className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <title>Alerta</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v6m0 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 3a9 9 0 110 18 9 9 0 010-18z"
        />
      </svg>
      <div>
        <h3 className="font-semibold text-red-800">Alerta: licencias en exceso</h3>
        <p className="text-sm text-red-700 mt-1">
          Este estudiante tiene{" "}
          <span className="font-bold">{cantidad} licencias</span> en {anio},
          excediendo el máximo de {limite}.
        </p>
      </div>
    </div>
  );
}
