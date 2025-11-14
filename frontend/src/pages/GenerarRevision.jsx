import React, { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import { Upload } from "lucide-react";
import PreviewEnvio from "../components/PreviewEnvio";
import Toast from "../components/toast";
import { useTranslation } from "react-i18next";

export default function GenerarRevision() {
  const { t } = useTranslation();

  const initialForm = {
    folio: "",
    fechaEmision: "",
    fechaInicioReposo: "",
    fechaFinalReposo: "",
    motivoMedico: "",
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
    if (name === "motivoMedico") {
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
      setToast({
        message: t("studentGenerateRevision.errors.invalidPdf"),
        type: "error",
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      setToast({
        message: t("studentGenerateRevision.errors.onlyPdf"),
        type: "error",
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Validar si todos los campos están completos
  const isFormValid =
    formData.folio.trim() !== "" &&
    formData.fechaEmision.trim() !== "" &&
    formData.fechaInicioReposo.trim() !== "" &&
    formData.fechaFinalReposo.trim() !== "" &&
    isMotivoValid(formData.motivoMedico) &&
    file !== null &&
    selectedCursos.length > 0;

  // Función que realiza el envío real (usada por PreviewEnvio)
  const sendData = async ({
    form = formData,
    cursos = selectedCursos,
    archivo = file,
  } = {}) => {
    if (!form || !archivo || cursos.length === 0) {
      throw new Error(
        t("studentGenerateRevision.errors.sendMissingData")
      );
    }
    if (!isMotivoValid(form.motivoMedico)) {
      throw new Error(
        t("studentGenerateRevision.errors.sendMotivoInvalid")
      );
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
      fd.append("motivo_medico", form.motivoMedico.trim());

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken") ||
        "";

      const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
        /\/$/,
        ""
      );
      const res = await fetch(`${apiBase}/api/licencias/crear`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.mensaje || json?.error || JSON.stringify(json);
        throw new Error(msg || `HTTP ${res.status}`);
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
      console.error("Error enviando licencia:", err);
      throw err;
    } finally {
      setTimeout(() => setSending(false), 600);
    }
  };

  // Cuando el usuario hace "Siguiente / Confirmar" en el formulario
  const handleFormNext = (e) => {
    e.preventDefault();
    if (selectedCursos.length === 0) {
      setErrorCursos(true);
      cursosSelectorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (!isFormValid) {
      if (!isMotivoValid(formData.motivoMedico)) {
        alert(t("studentGenerateRevision.alerts.motivoInvalid"));
        return;
      }
      alert(t("studentGenerateRevision.alerts.missingFields"));
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

      {/* Banner superior */}
      <BannerSection
        title={t("studentGenerateRevision.bannerTitle")}
      />

      {/* Contenido */}
      <main className="container mx-auto px-6 py-12 flex-grow">
        {step === "form" ? (
          <div className="bg-white rounded-lg shadow-lg p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Formulario */}
            <form className="flex flex-col gap-6" onSubmit={handleFormNext}>
              <div>
                <label className="block text-gray-600 mb-1">
                  {t("studentGenerateRevision.folioLabel")}
                </label>
                <input
                  type="text"
                  name="folio"
                  value={formData.folio}
                  onChange={handleChange}
                  placeholder={t(
                    "studentGenerateRevision.folioPlaceholder"
                  )}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  {t("studentGenerateRevision.fechaEmisionLabel")}
                </label>
                <input
                  type="date"
                  name="fechaEmision"
                  value={formData.fechaEmision}
                  onChange={handleChange}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <small className="text-gray-500">
                  {t("studentGenerateRevision.fechaEmisionHelp")}
                </small>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  {t("studentGenerateRevision.fechaInicioLabel")}
                </label>
                <input
                  type="date"
                  name="fechaInicioReposo"
                  value={formData.fechaInicioReposo}
                  onChange={handleChange}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">
                  {t("studentGenerateRevision.fechaFinLabel")}
                </label>
                <input
                  type="date"
                  name="fechaFinalReposo"
                  value={formData.fechaFinalReposo}
                  onChange={handleChange}
                  min={hoy}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Motivo médico */}
              <div>
                <label className="block text-gray-600 mb-1">
                  {t("studentGenerateRevision.motivoLabel")}
                </label>
                <input
                  type="text"
                  name="motivoMedico"
                  value={formData.motivoMedico}
                  onChange={handleChange}
                  onBlur={() => setMotivoTouched(true)}
                  placeholder={t(
                    "studentGenerateRevision.motivoPlaceholder"
                  )}
                  aria-invalid={
                    motivoTouched &&
                    !isMotivoValid(formData.motivoMedico)
                  }
                  aria-describedby="motivoHelp motivoError"
                  className={`w-full p-3 border rounded focus:outline-none focus:ring-2 ${
                    motivoTouched &&
                    !isMotivoValid(formData.motivoMedico)
                      ? "border-red-500 focus:ring-red-400"
                      : "focus:ring-blue-400"
                  }`}
                />
                <div
                  id="motivoHelp"
                  className="text-xs text-gray-500 mt-1"
                >
                  {t("studentGenerateRevision.motivoHelp")}
                </div>
                {motivoTouched &&
                  !isMotivoValid(formData.motivoMedico) && (
                    <div
                      id="motivoError"
                      className="mt-1 text-red-600 text-sm"
                      role="alert"
                    >
                      {t("studentGenerateRevision.motivoError")}
                    </div>
                  )}
              </div>

              {/* Selector de cursos */}
              <div
                ref={cursosSelectorRef}
                className={`mb-4 p-4 rounded border transition
                  ${
                    errorCursos
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-app"
                  }
                `}
                aria-live="polite"
              >
                <label className="block font-medium mb-2">
                  {t("studentGenerateRevision.cursosLabel")}
                  <span
                    className="ml-2 text-gray-400 cursor-pointer"
                    tabIndex={0}
                    title={t(
                      "studentGenerateRevision.cursosHelpA11y"
                    )}
                    aria-label={t(
                      "studentGenerateRevision.cursosHelpA11y"
                    )}
                  >
                    <svg
                      className="inline w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        strokeWidth="2"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 16v-4m0-4h.01"
                      />
                    </svg>
                  </span>
                </label>
                <div className="flex flex-col gap-2">
                  {cursosActivos.length === 0 ? (
                    <span className="text-gray-500 dark:text-muted text-sm">
                      {t("studentGenerateRevision.cursosEmpty")}
                    </span>
                  ) : (
                    cursosActivos.map((curso) => (
                      <label
                        key={curso.codigo + curso.seccion}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          value={curso.codigo}
                          checked={selectedCursos.includes(
                            curso.codigo
                          )}
                          onChange={(e) => {
                            setErrorCursos(false);
                            setSelectedCursos((prev) =>
                              e.target.checked
                                ? [...prev, curso.codigo]
                                : prev.filter(
                                    (c) => c !== curso.codigo
                                  )
                            );
                          }}
                        />
                        <span>
                          {curso.nombre} ({curso.codigo} - Sección{" "}
                          {curso.seccion})
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {errorCursos && (
                  <div
                    className="mt-2 text-red-600 text-sm font-medium"
                    aria-live="polite"
                  >
                    {t("studentGenerateRevision.cursosError")}
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-400 dark:text-muted">
                  {t("studentGenerateRevision.cursosFootnote")}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(initialForm);
                    setFile(null);
                    setSelectedCursos([]);
                    setErrorCursos(false);
                    setMotivoTouched(false);
                  }}
                  className="px-6 py-3 rounded border text-sm"
                >
                  {t("studentGenerateRevision.actions.clear")}
                </button>

                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`px-6 py-3 rounded text-white transition ${
                    isFormValid
                      ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {t("studentGenerateRevision.actions.next")}
                </button>
              </div>
            </form>

            {/* Upload */}
            <div
              className="border-2 border-dashed border-blue-400 rounded-lg flex flex-col items-center justify-center p-6 text-blue-500 cursor-pointer hover:bg-blue-50 transition"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={48} />
              <p className="mt-4 text-center">
                {t(
                  "studentGenerateRevision.upload.instructions"
                )}
              </p>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  {t(
                    "studentGenerateRevision.upload.selectedFile"
                  )}{" "}
                  <span className="font-semibold">
                    {file.name}
                  </span>
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
                  setTimeout(
                    () =>
                      cursosSelectorRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      }),
                    100
                  );
                }
                if (section === "file") {
                  setTimeout(
                    () =>
                      fileInputRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      }),
                    100
                  );
                }
              }}
              onSubmit={async ({
                formData: f,
                selectedCursos: sc,
                file: fl,
              }) => {
                try {
                  await sendData({
                    form: f,
                    cursos: sc,
                    archivo: fl,
                  });
                  setToast({
                    message: t(
                      "studentGenerateRevision.toast.success"
                    ),
                    type: "success",
                  });
                } catch (err) {
                  const msg =
                    err?.message || String(err || "");
                  setToast({
                    message: t(
                      "studentGenerateRevision.toast.errorPrefix",
                      { message: msg }
                    ),
                    type: "error",
                  });
                }
              }}
              apiBase={(import.meta.env.VITE_API_URL ||
                "http://localhost:3000"
              ).replace(/\/$/, "")}
            />
          </div>
        )}
      </main>

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
