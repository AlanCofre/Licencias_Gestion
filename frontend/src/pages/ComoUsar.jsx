import React from "react";
import Navbar from "../components/Navbar";
import BannerSection from "../components/BannerSection";
import Footer from "../components/Footer";
import signo from "../assets/SignoPregunta.png";

export default function ComoUsar() {
  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <Navbar />

      {/* Banner reutilizado para mantener look */}
      <BannerSection />

      <main className="container mx-auto px-6 py-12 flex-grow">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 p-10">
              <h1 className="text-3xl lg:text-4xl font-bold mb-6">
                ¿Como usar el gestor de licencias?
              </h1>

              <h2 className="text-lg font-semibold mb-3">Primeros pasos:</h2>
              <p className="mb-4 text-gray-700">
                Antes de poder utilizar el gestor de licencias, es necesario iniciar
                sesión en el sistema y tener a mano la copia de las licencias que
                necesitas gestionar.
              </p>

              <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-3">
                <li>
                  <strong>Iniciar sesión.</strong> Para iniciar sesión, haz click en
                  "Iniciar sesión" en la esquina superior derecha. Recuerda tener tu
                  correo y contraseña de la institución a mano.
                </li>
                <li>
                  <strong>Generar Revisión.</strong> Sube o selecciona la licencia y
                  genera la revisión.
                </li>
              </ul>

              <p className="text-gray-600 text-sm">
                Para más información, puedes volver al inicio o usar las opciones del
                menú superior. Esta guía está pensada para orientarte en los pasos
                básicos.
              </p>
            </div>
            <div className="lg:col-span-1 flex items-center justify-center p-8">
              <img
                src={signo}
                alt="Signo de pregunta"
                className="w-44 h-44 object-contain"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}