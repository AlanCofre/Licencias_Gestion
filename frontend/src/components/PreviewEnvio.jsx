import React, { useMemo, useState } from "react";

export default function PreviewRevision({
  formData = {},
  selectedCursos = [],
  file = null,
  onEdit = (section) => {}, // onEdit('form'|'cursos'|'file')
  onSubmit = null, // async function to actually send the data (optional)
  apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, ""),
}) {
  const [sending, setSending] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);

  // Validaciones obligatorias
  const missing = useMemo(() => {
    const m = [];
    if (!formData?.folio || !formData.folio.toString().trim()) m.push("Número de folio");
    if (!formData?.fechaEmision) m.push("Fecha de emisión");
    if (!formData?.fechaInicioReposo) m.push("Fecha inicio de reposo");
    if (!formData?.fechaFinalReposo) m.push("Fecha final de reposo");
    if (!selectedCursos || selectedCursos.length === 0) m.push("Cursos seleccionados");
    if (!file) m.push("Archivo adjunto (PDF)");
    return m;
  }, [formData, selectedCursos, file]);

  const canSend = missing.length === 0 && !sending;

  const humanFileSize = (size) => {
    if (!size) return "";
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(1) * 1 + " " + ["B", "KB", "MB", "GB"][i];
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setResultMsg(null);
    try {
      if (typeof onSubmit === "function") {
        await onSubmit({ formData, selectedCursos, file });
      } else {
        // simulación de envío similar al flujo real
        const fd = new FormData();
        fd.append("archivo", file);
        fd.append("folio", formData.folio);
        fd.append("fecha_emision", formData.fechaEmision);
        fd.append("fecha_inicio", formData.fechaInicioReposo);
        fd.append("fecha_fin", formData.fechaFinalReposo);
        fd.append("cursos", JSON.stringify(selectedCursos));

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("accessToken") ||
          "";

        const res = await fetch(`${apiBase}/api/licencias/crear`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: fd,
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.mensaje || json?.error || `HTTP ${res.status}`);
      }

      // Éxito: mensaje breve
      setResultMsg({ type: "success", text: "Licencia enviada correctamente." });
    } catch (err) {
      console.error("Error enviando licencia:", err);
      setResultMsg({ type: "error", text: `Error al enviar: ${err?.message || err}` });
    } finally {
      // Mantener spinner breve para UX
      setTimeout(() => setSending(false), 600);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Vista previa — Confirmar datos antes de enviar</h2>

      {/* Estado de validación */}
      {missing.length > 0 ? (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          Faltan campos obligatorios:{" "}
          <strong>{missing.join(", ")}</strong>. Usa "Editar" para completar antes de enviar.
        </div>
      ) : (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
          Todos los datos obligatorios están presentes.
        </div>
      )}

      {/* Fechas */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">Fechas</h3>
          <button
            type="button"
            onClick={() => onEdit("form")}
            className="text-sm text-blue-600 hover:underline"
          >
            Editar
          </button>
        </div>
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="py-2 font-medium w-48">Número de folio</td>
              <td className="py-2">{formData?.folio ?? "-"}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-2 font-medium">Fecha de emisión</td>
              <td className="py-2">{formData?.fechaEmision ?? "-"}</td>
            </tr>
            <tr>
              <td className="py-2 font-medium">Inicio reposo</td>
              <td className="py-2">{formData?.fechaInicioReposo ?? "-"}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-2 font-medium">Fin reposo</td>
              <td className="py-2">{formData?.fechaFinalReposo ?? "-"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Cursos */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">Cursos seleccionados ({selectedCursos?.length ?? 0})</h3>
          <button
            type="button"
            onClick={() => onEdit("cursos")}
            className="text-sm text-blue-600 hover:underline"
          >
            Editar
          </button>
        </div>

        {selectedCursos && selectedCursos.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {selectedCursos.map((c, i) => (
              <div key={c + i} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded">
                <div className="text-sm">{c}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No hay cursos seleccionados.</div>
        )}
      </section>

      {/* Archivo */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">Archivo adjunto</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onEdit("file")}
              className="text-sm text-blue-600 hover:underline"
            >
              Editar
            </button>
            {file && (
              <a
                href={URL.createObjectURL(file)}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-gray-600 hover:underline"
              >
                Ver PDF
              </a>
            )}
          </div>
        </div>

        {file ? (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded">
            <div className="text-sm">
              <div className="font-medium">{file.name}</div>
              <div className="text-xs text-gray-500">{file.type} • {humanFileSize(file.size)}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No hay archivo seleccionado.</div>
        )}
      </section>

      {/* Result message */}
      {resultMsg && (
        <div
          className={`mb-4 p-3 rounded ${
            resultMsg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {resultMsg.text}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => onEdit("back")}
          className="px-4 py-2 rounded border border-gray-200 text-sm"
          disabled={sending}
        >
          Volver
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={`px-4 py-2 rounded text-white text-sm ${
            canSend ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          } flex items-center gap-2`}
        >
          {sending ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Enviando...
            </>
          ) : (
            "Enviar licencia"
          )}
        </button>
      </div>
    </div>
  );
}