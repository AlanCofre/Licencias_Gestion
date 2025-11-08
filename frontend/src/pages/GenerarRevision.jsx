import React, { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import { Upload } from "lucide-react";
import PreviewEnvio from "../components/PreviewEnvio";
import Toast from "../components/toast"; // <-- import del Toast

export default function GenerarRevision() {
  const initialForm = {
    folio: "",
    fechaEmision: "",
    fechaInicioReposo: "",
    fechaFinalReposo: "",
    motivoMedico: "", // <-- NUEVO
  };
  const [formData, setFormData] = useState(initialForm);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // --- Validación de cursos seleccionados ---
  const [selectedCursos, setSelectedCursos] = useState([]);
  const [errorCursos, setErrorCursos] = useState(false);
  const cursosSelectorRef = useRef(null);

  // Validación motivo (tocado para mostrar errores)
  const [motivoTouched, setMotivoTouched] = useState(false);

  // Step: form | preview
  const [step, setStep] = useState("form");
  const [sending, setSending] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null); // { message, type }

  // Confirmación antes de enviar
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingFormRef = useRef(null);

  // Simulación de cursos activos (reemplaza por tu fuente real)
  const cursosActivos = [
    { codigo: "INF-101", nombre: "Programación I", seccion: "A" },
    { codigo: "MAT-201", nombre: "Matemáticas II", seccion: "B" },
  ];

  // --- Helpers de validación ---
  const regexMotivo = /^[\p{L}\p{N}\s,-]{3,}$/u; // letras (con acentos), números, espacio, coma, guion; 3+ chars
  const isMotivoValid = (str) => regexMotivo.test((str || "").trim());

  // Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "folio" && !/^\d*$/.test(value)) {
      return;
    }
    // Para el motivo, solo filtramos hard-fails en tiempo real (opcional)
    if (name === "motivoMedico") {
      // Permitimos escribir libremente pero guardamos tal cual;
      // La validación final la hace isMotivoValid
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo de archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      setToast({ message: "Por favor sube un archivo PDF válido.", type: "error" });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      setToast({ message: "Solo se permiten archivos PDF.", type: "error" });
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
    isMotivoValid(formData.motivoMedico) && // <-- incluir motivo
    file !== null &&
    selectedCursos.length > 0;

  // Envío al backend -> abre modal de confirmación en vez de enviar directamente
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedCursos.length === 0) {
      setErrorCursos(true);
      cursosSelectorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
  // Función que realiza el envío real (usada por PreviewEnvio)
  const sendData = async ({ form = formData, cursos = selectedCursos, archivo = file } = {}) => {
    if (!form || !archivo || cursos.length === 0) {
      throw new Error("Faltan datos obligatorios para el envío.");
    }
    setErrorCursos(false);
    // Validación extra de FE por seguridad
    if (!isMotivoValid(form.motivoMedico)) {
      throw new Error("El motivo médico no es válido (mín. 3 caracteres; sin caracteres especiales).");
    }

    setSending(true);
    try {
      const fd = new FormData();
      fd.append("archivo", archivo);
      fd.append("folio", form.folio);
      fd.append("fecha_emision", form.fechaEmision);
      fd.append("fecha_inicio", form.fechaInicioReposo);
      fd.append("fecha_fin", form.fechaFinalReposo);
      fd.append("cursos", JSON.stringify(cursos));
      fd.append("motivo_medico", form.motivoMedico.trim()); // <-- NUEVO: se envía al BE

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

      // Éxito: limpiar estado y volver al formulario vacío
      setFormData(initialForm);
      setFile(null);
      setSelectedCursos([]);
      setErrorCursos(false);
      setMotivoTouched(false);
      setStep("form");
      return { ok: true };
    } catch (err) {
      console.error("Catch error enviar licencia:", err);
      toast.error("Error al enviar la licencia. Revisa la consola y la pestaña Network.");
    }
  };

  // Cuando el usuario hace "Siguiente / Confirmar" en el formulario: validar y pasar a preview
  const handleFormNext = (e) => {
    e.preventDefault();
    if (selectedCursos.length === 0) {
      setErrorCursos(true);
      cursosSelectorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!isFormValid) {
      // Ayuda específica si el motivo no es válido
      if (!isMotivoValid(formData.motivoMedico)) {
        alert(
          "Motivo médico inválido. Debe tener al menos 3 caracteres y solo letras (incluye acentos), números, espacios, comas y guiones."
        );
        return;
      }
      alert("Completa todos los campos obligatorios antes de continuar.");
      return;
    }
    setErrorCursos(false);
    setStep("preview");
  };

  // Obtener fecha de hoy en formato YYYY-MM-DD para validación de fechaFinal
  const hoy = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
      <Navbar />

      <BannerSection title="Generar revisión de licencia" />

      {/* Contenido */}
      <main className="container mx-auto px-6 py-12 flex-grow">
        {step === "form" ? (
          <div className="bg-white rounded-lg shadow-lg p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Formulario */}
            <form className="flex flex-col gap-6" onSubmit={handleFormNext}>
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

              {/* NUEVO: Motivo médico */}
              <div>
                <label className="block text-gray-600 mb-1">
                  Motivo médico o patología (resumen)
                </label>
                <input
                  type="text"
                  name="motivoMedico"
                  value={formData.motivoMedico}
                  onChange={handleChange}
                  onBlur={() => setMotivoTouched(true)}
                  placeholder="Ej: Bronquitis, COVID-19, Migraña"
                  aria-invalid={motivoTouched && !isMotivoValid(formData.motivoMedico)}
                  aria-describedby="motivoHelp motivoError"
                  className={`w-full p-3 border rounded focus:outline-none focus:ring-2 ${
                    motivoTouched && !isMotivoValid(formData.motivoMedico)
                      ? "border-red-500 focus:ring-red-400"
                      : "focus:ring-blue-400"
                  }`}
                />
                <div id="motivoHelp" className="text-xs text-gray-500 mt-1">
                  Requerido. Mínimo 3 caracteres. Sólo letras (incluye acentos), números, espacios, comas y guiones.
                </div>
                {motivoTouched && !isMotivoValid(formData.motivoMedico) && (
                  <div id="motivoError" className="mt-1 text-red-600 text-sm" role="alert">
                    El motivo no es válido. Revisa el formato.
                  </div>
                )}
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
                              e.target.checked ? [...prev, curso.codigo] : prev.filter((c) => c !== curso.codigo)
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
                {errorCursos && (
                  <div className="mt-2 text-red-600 text-sm font-medium" aria-live="polite">
                    Debes seleccionar al menos un curso afectado por tu licencia.
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-400 dark:text-muted">
                  Solo verás cursos del periodo activo.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // opcional: limpiar
                    setFormData(initialForm);
                    setFile(null);
                    setSelectedCursos([]);
                    setErrorCursos(false);
                    setMotivoTouched(false);
                  }}
                  className="px-6 py-3 rounded border text-sm"
                >
                  Limpiar
                </button>

                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`px-6 py-3 rounded text-white transition ${
                    isFormValid ? "bg-blue-500 hover:bg-blue-600 cursor-pointer" : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Siguiente: Confirmar
                </button>
              </div>
            </form>

            {/* Upload */}
            <div
              className="border-2 border-dashed border-blue-400 rounded-lg flex flex-col items-center justify-center p-6 text-blue-500 cursor-pointer hover:bg-blue-50 transition"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current.click()}
            >
              <Upload size={48} />
              <p className="mt-4 text-center">Arrastra un documento PDF o haz clic para seleccionarlo.</p>
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
        ) : (
          // Preview step
          <div className="bg-white rounded-lg shadow-lg p-8">
            <PreviewEnvio
              formData={formData}
              selectedCursos={selectedCursos}
              file={file}
              onEdit={(section) => {
                setStep("form");
                if (section === "cursos") {
                  setTimeout(() => cursosSelectorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                }
                if (section === "file") {
                  setTimeout(() => fileInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
                }
              }}
              onSubmit={async ({ formData: f, selectedCursos: sc, file: fl }) => {
                try {
                  await sendData({ form: f, cursos: sc, archivo: fl });
                  // usar toast en vez de alert
                  setToast({ message: "Licencia enviada correctamente.", type: "success" });
                } catch (err) {
                  setToast({ message: "Error al enviar: " + (err?.message || err), type: "error" });
                }
              }}
              apiBase={(import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "")}
            />
          </div>
        )}
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

      {/* Toast global */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
