import React from "react";

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  const prev = () => onChange(Math.max(1, page - 1));
  const next = () => onChange(Math.min(totalPages, page + 1));
  return (
    <div className="flex items-center gap-3 justify-center mt-6">
      <button onClick={prev} disabled={page === 1} className="px-3 py-1 bg-white rounded shadow disabled:opacity-50">
        Anterior
      </button>
      <div className="text-sm text-gray-600">
        Página {page} de {totalPages}
      </div>
      <button onClick={next} disabled={page === totalPages} className="px-3 py-1 bg-white rounded shadow disabled:opacity-50">
        Siguiente
      </button>
    </div>
  );
}