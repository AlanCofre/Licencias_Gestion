import React, { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import { Upload } from "lucide-react";

export default function GenerarRevision() {
  const [formData, setFormData] = useState({
    id: "",
    folio: "",
    fecha: "", // 
    fechaEmision: "", 
    fechaInicioReposo: "", 
    fechaFinalReposo: "",  
    razon: "",
  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validación: solo números en id y folio (si usuario escribe folio numérico)
    if ((name === "id" || name === "folio") && !/^\d*$/.test(value)) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo de archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);

      // Guardar fecha y hora del momento en que se sube
      const now = new Date();
      const fechaFormateada = now.toLocaleString("es-CL", {
        dateStyle: "short",
        timeStyle: "short",
      });

      setFormData((prev) => ({ ...prev, fecha: fechaFormateada }));
    } else {
      alert("Por favor sube un archivo PDF válido.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);

      const now = new Date();
      const fechaFormateada = now.toLocaleString("es-CL", {
        dateStyle: "short",
        timeStyle: "short",
      });

      setFormData((prev) => ({ ...prev, fecha: fechaFormateada }));
    } else {
      alert("Solo se permiten archivos PDF.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Validar si todos los campos están completos
  // Nota: id no es requerido en el FE (se completa automáticamente en BE)
  const isFormValid =
    formData.folio.trim() !== "" &&
    formData.fecha.trim() !== "" &&
    formData.fechaEmision.trim() !== "" &&
    formData.fechaInicioReposo.trim() !== "" &&
    formData.fechaFinalReposo.trim() !== "" &&
    formData.razon.trim() !== "" &&
    file !== null;

  // Envío real al backend (multipart/form-data)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      const fd = new FormData();
      // campo que el BE espera: 'archivo'
      fd.append("archivo", file);
      // campos que el BE guarda en BD
      fd.append("folio", formData.folio);
      fd.append("fecha_emision", formData.fechaEmision);
      fd.append("fecha_inicio", formData.fechaInicioReposo);
      fd.append("fecha_fin", formData.fechaFinalReposo);
      // opcional: enviar razón (motivo) si el BE lo acepta; si no, queda null por defecto
      fd.append("motivo", formData.razon);

      // obtener token desde localStorage (ajustar clave si usan otra)
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("accessToken") ||
        "";

      // usar VITE_API_URL si está definido en .env; fallback a localhost:3000
      const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/licencias/crear`, {
         method: "POST",
         headers: {
           ...(token ? { Authorization: `Bearer ${token}` } : {}),
           // DO NOT set Content-Type; fetch lo maneja para FormData
         },
         body: fd,
       });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        alert("Licencia enviada correctamente.");
        console.log("Respuesta BE:", json);
        // limpiar formulario
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
    <div className="min-h-screen flex flex-col bg-blue-100">
      <Navbar />

      {/* Banner superior */}
      <BannerSection title="Generar revisión de licencia" />

      {/* Formulario + Upload */}
      <main className="container mx-auto px-6 py-12 flex-grow">
        <div className="bg-white rounded-lg shadow-lg p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Formulario */}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-600 mb-1">
                N° de identificación documento
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                placeholder="Se genera automáticamente en el servidor al guardar la licencia."
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                readOnly
              />
            </div>

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
              <label className="block text-gray-600 mb-1">Fecha de subida</label>
              <input
                type="text"
                name="fecha"
                value={formData.fecha}
                readOnly
                className="w-full p-3 border rounded bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <small className="text-gray-500">
                Esta fecha se genera automáticamente al subir el documento.
              </small>
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

            <div>
              <label className="block text-gray-600 mb-1">Razón de licencia</label>
              <input
                type="text"
                name="razon"
                value={formData.razon}
                onChange={handleChange}
                placeholder="Escribe la razón de por qué se hizo la licencia."
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
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
