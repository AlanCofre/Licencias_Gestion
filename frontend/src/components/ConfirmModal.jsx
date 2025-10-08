import React, { useState, useEffect } from "react";

export default function ConfirmModal({
  open,
  title,
  confirmLabel = "Confirmar",
  onClose,
  onConfirm,
  loading,
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Cuando se abra el modal, limpiar nota y error
  useEffect(() => {
    if (open) {
      setNote("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    // Si es rechazo, validar que haya nota
    if (confirmLabel.toLowerCase() === "rechazar" && note.trim() === "") {
      setError("Debe ingresar una razón para rechazar.");
      return;
    }
    setError("");
    onConfirm({ note });
    setNote("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">
          {confirmLabel.toLowerCase() === "rechazar"
            ? "Escribe la razón del rechazo (obligatorio):"
            : "Agrega una nota u observación (opcional):"}
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border rounded p-2 mb-2"
          rows={4}
          placeholder={
            confirmLabel.toLowerCase() === "rechazar"
              ? "Motivo del rechazo..."
              : "Notas (opcional)..."
          }
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
              confirmLabel.toLowerCase() === "rechazar"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
