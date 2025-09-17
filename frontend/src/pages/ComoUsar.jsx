import React from "react";
import Navbar from "../components/Navbar";
import BannerSection from "../components/BannerSection";
import Footer from "../components/Footer";

export default function ComoUsar() {
  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <Navbar />

      {/* Banner reutilizado para mantener look */}
      <BannerSection />

      <main className="container mx-auto px-8 py-12 flex-grow">
        <div className="bg-white rounded-lg shadow-lg p-8 lg:p-12 max-w-4xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-bold mb-6 font-sans">
            ¿Como usar el gestor de licencias?
          </h1>

          <h2 className="text-xl font-semibold mb-3">Primeros pasos:</h2>
          <p className="mb-4 text-gray-700">
            Antes de poder utilizar el gestor de licencias, es necesario iniciar
            sesión en el sistema y tener a mano la copia de las licencias que
            necesitas gestionar.
          </p>

          <ul className="list-disc pl-6 mb-6 text-gray-700">
            <li className="mb-2">
              <strong>Iniciar sesión.</strong> Haz click en "Iniciar sesión" en la
              esquina superior derecha.
            </li>
            <li className="mb-2">
              <strong>Generar Revisión.</strong> Sube o selecciona la licencia y
              genera la revisión.
            </li>
          </ul>

          <p className="text-gray-600 text-sm">
            Para iniciar sesión puedes dar click en "Iniciar sesión" en la esquina
            superior derecha. Recuerda tener tu correo y contraseña a mano.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}