import React, { useState } from "react";

export default function ConfirmModal({ open, title, confirmLabel = "Confirmar", onClose, onConfirm, loading }) {
  const [note, setNote] = useState("");

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-xl p-6">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">Agrega una nota u observación (opcional):</p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border rounded p-2 mb-4"
          rows={4}
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Cancelar</button>
          <button
            onClick={() => onConfirm({ note })}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}