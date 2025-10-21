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
    file !== null;

  // Envío al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      const fd = new FormData();
      fd.append("archivo", file);
      fd.append("folio", formData.folio);
      fd.append("fecha_emision", formData.fechaEmision);
      fd.append("fecha_inicio", formData.fechaInicioReposo);
      fd.append("fecha_fin", formData.fechaFinalReposo);
      fd.append("motivo", formData.razon);

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

      if (res.ok) {
        toast.success("Licencia enviada correctamente.");
        console.log("Respuesta BE:", json);
        setFormData({
          folio: "",
          fechaEmision: "",
          fechaInicioReposo: "",
          fechaFinalReposo: "",
          razon: "",
        });
        setFile(null);
      } else {
        const msg = json?.mensaje || json?.error || JSON.stringify(json);
        toast.error("Error enviando licencia: " + msg);
        console.error("Error backend:", res.status, json);
      }
    } catch (err) {
      console.error("Catch error enviar licencia:", err);
      toast.error("Error al enviar la licencia. Revisa la consola.");
    }
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

      <Footer />
    </div>
  );
}
