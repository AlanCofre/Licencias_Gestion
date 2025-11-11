import React from "react";

export default function AlertaLicenciasAnual({ licenciasporAño, año = new Date().getFullYear() }) {
  const licenciasAño = licenciasporAño[año] || [];
  const cantidad = licenciasAño.length;
  const excedido = cantidad > 5;

  if (!excedido) return null;

  return (
    <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex gap-3 items-start">
      <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4v2m0 4v2M12 3a9 9 0 110 18 9 9 0 010-18z" />
      </svg>
      <div>
        <h3 className="font-semibold text-red-800">Alerta: Licencias en exceso</h3>
        <p className="text-sm text-red-700 mt-1">
          Este estudiante tiene <span className="font-bold">{cantidad} licencias</span> en {año}, excediendo el máximo de 5.
        </p>
      </div>
    </div>
  );
}