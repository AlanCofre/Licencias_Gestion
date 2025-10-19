import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function ConfirmModal({
  open,
  title,
  confirmLabel = "confirm",
  onClose,
  onConfirm,
  loading,
}) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setNote("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    const isReject = confirmLabel.toLowerCase() === t("btn.reject").toLowerCase();
    if (isReject && note.trim() === "") {
      setError(t("confirmModal.errorNote"));
      return;
    }
    setError("");
    onConfirm({ note });
    setNote("");
  };

  const isReject = confirmLabel.toLowerCase() === t("btn.reject").toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>

        <p className="text-sm text-gray-600 mb-2">
          {isReject
            ? t("confirmModal.rejectMsg")
            : t("confirmModal.noteMsg")}
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border rounded p-2 mb-2"
          rows={4}
          placeholder={
            isReject
              ? t("confirmModal.rejectPlaceholder")
              : t("confirmModal.notePlaceholder")
          }
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            {t("btn.cancel")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded disabled:opacity-50 ${
              isReject
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? t("btn.loading") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Versión simple con traducción unificada
export function ConfirmModalSimple({ title, children, onConfirm, onCancel }) {
  const { t } = useTranslation();
  return (
    <div className="modal">
      <h3>{title ?? t("evaluar.title")}</h3>
      <div>{children}</div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn">
          {t("btn.cancel")}
        </button>
        <button onClick={onConfirm} className="btn btn-primary">
          {t("btn.submit")}
        </button>
      </div>
    </div>
  );
}
