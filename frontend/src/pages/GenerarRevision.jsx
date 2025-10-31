import React, { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import { Upload } from "lucide-react";

export default function GenerarRevision() {
  const [formData, setFormData] = useState({
    folio: "",
    fechaEmision: "",
    fechaInicioReposo: "",
    fechaFinalReposo: "",
  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // --- Validación de cursos seleccionados ---
  const [selectedCursos, setSelectedCursos] = useState([]);
  const [errorCursos, setErrorCursos] = useState(false);
  const cursosSelectorRef = useRef(null);

  // Simulación de cursos activos (reemplaza por tu fuente real)
  const cursosActivos = [
    { codigo: "INF-101", nombre: "Programación I", seccion: "A" },
    { codigo: "MAT-201", nombre: "Matemáticas II", seccion: "B" },
  ];

  // Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "folio" && !/^\d*$/.test(value)) {
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
      alert("Por favor sube un archivo PDF válido.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      alert("Solo se permiten archivos PDF.");
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
    file !== null &&
    selectedCursos.length > 0;

  // Envío real al backend (multipart/form-data)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCursos.length === 0) {
      setErrorCursos(true);
      cursosSelectorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrorCursos(false);
    if (!isFormValid) return;

    try {
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

      const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/licencias/crear`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        alert("Licencia enviada correctamente.");
        setFormData({
          id: "",
          folio: "",
          fecha: "",
          fechaEmision: "",
          fechaInicioReposo: "",
          fechaFinalReposo: "",
          razon: "",
        });
        setFile(null);
        setSelectedCursos([]);
      } else {
        const msg = json?.mensaje || json?.error || JSON.stringify(json);
        alert("Error enviando licencia: " + msg);
        console.error("Error backend:", res.status, json);
      }
    } catch (err) {
      console.error("Catch error enviar licencia:", err);
      alert("Error al enviar la licencia. Revisa la consola.");
    }
  };

  // Obtener fecha de hoy en formato YYYY-MM-DD para validación de fechaFin
  const hoy = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
      <Navbar />

      {/* Banner superior */}
      <BannerSection title="Generar revisión de licencia" />

      {/* Formulario + Upload */}
      <main className="container mx-auto px-6 py-12 flex-grow">
        <div className="bg-white rounded-lg shadow-lg p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Formulario */}
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
                min={hoy} // no permite fechas pasadas
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

          {/* Upload */}
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
                Archivo seleccionado:{" "}
                <span className="font-semibold">{file.name}</span>
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

      <Footer />
    </div>
  );
}
