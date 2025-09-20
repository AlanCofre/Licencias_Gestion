import React from "react";
import BannerSection from "../components/BannerSection";
import { Upload } from "lucide-react";

export default function GenerarRevision() {
  return (
    <div className="flex flex-col flex-grow bg-blue-100">
      {/* Banner superior */}
      <BannerSection title="Generar revisión de licencia" />

      {/* Formulario + Upload */}
      <main className="container mx-auto px-6 py-12 flex-grow">
        <div className="bg-white rounded-lg shadow-lg p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Formulario */}
          <form className="flex flex-col gap-6">
            <div>
              <label className="block text-gray-600 mb-1">
                N° de identificación documento
              </label>
              <input
                type="text"
                placeholder="Al subir un documento el numero se hace automaticamente."
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Numero de Folio</label>
              <input
                type="text"
                placeholder="Escribe el numero de folio en la parte superior de tu documento."
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Fecha de subida</label>
              <input
                type="date"
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Razon de licencia</label>
              <input
                type="text"
                placeholder="Escribe la razon de porque se genero la licencia."
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <button
              type="submit"
              className="bg-gray-400 text-white px-6 py-3 rounded cursor-not-allowed"
              disabled
            >
              Enviar
            </button>
          </form>

          {/* Upload */}
          <div className="border-2 border-dashed border-blue-400 rounded-lg flex flex-col items-center justify-center p-6 text-blue-500 cursor-pointer hover:bg-blue-50 transition">
            <Upload size={48} />
            <p className="mt-4 text-center">
              Arrastra el documento hacia esta zona para subirlo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
