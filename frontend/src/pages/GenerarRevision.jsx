import React, { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import { Upload } from "lucide-react";

export default function GenerarRevision() {
  const [formData, setFormData] = useState({
    id: "",
    folio: "",
    fecha: "", // se llenará automáticamente al subir archivo
    fechaFin: "",
    razon: "",
  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validación: solo números en id y folio
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
  const isFormValid =
    formData.id.trim() !== "" &&
    formData.folio.trim() !== "" &&
    formData.fecha.trim() !== "" && // se llena solo al subir archivo
    formData.fechaFin.trim() !== "" &&
    formData.razon.trim() !== "" &&
    file !== null;

  // Envío (simulado)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    alert(
      "El formulario ha sido enviado, puedes verificar el resultado en la pestaña de verificar resultados"
    );
    console.log("Datos enviados:", { ...formData, file });
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
                placeholder="Al subir un documento el número se hace automáticamente."
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              <label className="block text-gray-600 mb-1">
                Fecha de término de la licencia
              </label>
              <input
                type="date"
                name="fechaFin"
                value={formData.fechaFin}
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
