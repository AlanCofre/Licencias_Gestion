import React, { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import { Upload } from "lucide-react";
import { toast } from "react-hot-toast";

export default function GenerarRevision() {
  const [formData, setFormData] = useState({
    folio: "",
    fechaEmision: "",
    fechaInicioReposo: "",
    fechaFinalReposo: "",
    razon: "",
  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // --- Validación de cursos seleccionados ---
  const [selectedCursos, setSelectedCursos] = useState([]);
  const [errorCursos, setErrorCursos] = useState(false);
  const cursosSelectorRef = useRef(null);

  // Confirmación antes de enviar
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingFormRef = useRef(null);

  // Simulación de cursos activos (reemplaza por tu fuente real)
  const cursosActivos = [
    { codigo: "INF-101", nombre: "Programación I", seccion: "A" },
    { codigo: "MAT-201", nombre: "Matemáticas II", seccion: "B" },
  ];

  // Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "folio" && !/^\d*$/.test(value)) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo de archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast.error("Por favor sube un archivo PDF válido.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      toast.error("Solo se permiten archivos PDF.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Validar formulario
  const isFormValid =
    formData.folio.trim() !== "" &&
    formData.fechaEmision.trim() !== "" &&
    formData.fechaInicioReposo.trim() !== "" &&
    formData.fechaFinalReposo.trim() !== "" &&
    file !== null &&
    selectedCursos.length > 0;

  // Envío al backend -> abre modal de confirmación en vez de enviar directamente
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedCursos.length === 0) {
      setErrorCursos(true);
      cursosSelectorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrorCursos(false);

    if (!isFormValid) {
      toast.error("Completa todos los campos requeridos antes de enviar.");
      return;
    }

    // Guardar datos pendientes y abrir modal
    pendingFormRef.current = {
      folio: formData.folio,
      fecha_emision: formData.fechaEmision,
      fecha_inicio: formData.fechaInicioReposo,
      fecha_fin: formData.fechaFinalReposo,
      motivo: formData.razon,
      cursos: selectedCursos,
      file,
    };
    setShowConfirm(true);
  };

  // Confirmar envío (envía los datos)
  const confirmSend = async () => {
    setShowConfirm(false);
    const pending = pendingFormRef.current;
    if (!pending) {
      toast.error("No hay datos para enviar.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("archivo", pending.file);
      fd.append("folio", pending.folio);
      fd.append("fecha_emision", pending.fecha_emision);
      fd.append("fecha_inicio", pending.fecha_inicio);
      fd.append("fecha_fin", pending.fecha_fin);
      fd.append("cursos", JSON.stringify(pending.cursos));
      fd.append("motivo", pending.motivo || "");

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken") ||
        "";

      const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/licencias/crear`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      let json;
      try {
        json = await res.json();
      } catch {
        const text = await res.text().catch(() => null);
        json = { mensaje: text ?? "Respuesta no JSON" };
      }

      if (res.ok) {
        toast.success("Licencia enviada correctamente.");
        setFormData({
          folio: "",
          fechaEmision: "",
          fechaInicioReposo: "",
          fechaFinalReposo: "",
          razon: "",
        });
        setFile(null);
        setSelectedCursos([]);
        pendingFormRef.current = null;
      } else {
        const msg = json?.mensaje || json?.error || JSON.stringify(json);
        toast.error("Error enviando licencia: " + msg);
        console.error("Error backend:", res.status, json);
      }
    } catch (err) {
      console.error("Catch error enviar licencia:", err);
      toast.error("Error al enviar la licencia. Revisa la consola y la pestaña Network.");
    }
  };

  const cancelSend = () => {
    setShowConfirm(false);
  };

  const hoy = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
      <Navbar />

      <BannerSection title="Generar revisión de licencia" />

      <main className="container mx-auto px-6 py-12 flex-grow">
        <div className="bg-white rounded-lg shadow-lg p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-600 mb-1">Número de Folio</label>
              <input
                type="text"
                name="folio"
                value={formData.folio}
                onChange={handleChange}
                placeholder="Escribe el número de folio en la parte superior de tu documento."
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Fecha de emisión</label>
              <input
                type="date"
                name="fechaEmision"
                value={formData.fechaEmision}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <small className="text-gray-500">
                Fecha de creación de la licencia en el centro de salud.
              </small>
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Fecha inicio reposo</label>
              <input
                type="date"
                name="fechaInicioReposo"
                value={formData.fechaInicioReposo}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Fecha final reposo</label>
              <input
                type="date"
                name="fechaFinalReposo"
                value={formData.fechaFinalReposo}
                onChange={handleChange}
                min={hoy}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Selector de cursos */}
            <div
              ref={cursosSelectorRef}
              className={`mb-4 p-4 rounded border transition
                ${errorCursos ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-gray-200 dark:border-app"}
              `}
              aria-live="polite"
            >
              <label className="block font-medium mb-2">
                Cursos afectados por la licencia
                <span
                  className="ml-2 text-gray-400 cursor-pointer"
                  tabIndex={0}
                  title="Solo verás cursos del periodo activo"
                  aria-label="Ayuda: Solo verás cursos del periodo activo"
                >
                  <svg className="inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
                  </svg>
                </span>
              </label>
              <div className="flex flex-col gap-2">
                {cursosActivos.length === 0 ? (
                  <span className="text-gray-500 dark:text-muted text-sm">No hay cursos activos disponibles.</span>
                ) : (
                  cursosActivos.map((curso) => (
                    <label key={curso.codigo + curso.seccion} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={curso.codigo}
                        checked={selectedCursos.includes(curso.codigo)}
                        onChange={(e) => {
                          setErrorCursos(false);
                          setSelectedCursos((prev) =>
                            e.target.checked
                              ? [...prev, curso.codigo]
                              : prev.filter((c) => c !== curso.codigo)
                          );
                        }}
                      />
                      <span>
                        {curso.nombre} ({curso.codigo} - Sección {curso.seccion})
                      </span>
                    </label>
                  ))
                )}
              </div>
              {/* Mensaje de error inline */}
              {errorCursos && (
                <div className="mt-2 text-red-600 text-sm font-medium" aria-live="polite">
                  Debes seleccionar al menos un curso afectado por tu licencia.
                </div>
              )}
              {/* Tooltip/ayuda accesible */}
              <div className="mt-1 text-xs text-gray-400 dark:text-muted">
                Solo verás cursos del periodo activo.
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`px-6 py-3 rounded text-white transition ${
                isFormValid
                  ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Enviar
            </button>
          </form>

          <div
            className="border-2 border-dashed border-blue-400 rounded-lg flex flex-col items-center justify-center p-6 text-blue-500 cursor-pointer hover:bg-blue-50 transition"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current.click()}
          >
            <Upload size={48} />
            <p className="mt-4 text-center">
              Arrastra un documento PDF o haz clic para seleccionarlo.
            </p>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Archivo seleccionado: <span className="font-semibold">{file.name}</span>
              </p>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </main>

      {/* Modal de confirmación */}
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            zIndex: 9999,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: 380,
              maxWidth: "90%",
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>¿Estás seguro de enviar la licencia?</h3>
            <p>Al confirmar, los datos serán considerados definitivos y se enviarán al sistema.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={cancelSend} style={{ padding: "8px 12px" }}>
                No, volver
              </button>
              <button
                type="button"
                onClick={confirmSend}
                style={{ padding: "8px 12px", background: "#007bff", color: "#fff", border: "none", borderRadius: 4 }}
              >
                Sí, confirmar y enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
