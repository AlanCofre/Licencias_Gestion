import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import signo from "../assets/SignoPregunta.png";
import { useAuth } from "../context/AuthContext";

export default function ComoUsar() {
  const { user } = useAuth();
  const role = String(user?.role || "").toLowerCase();
  const isSecretary = role === "secretaria" || role === "secretary";

  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <Navbar />

      {/* Banner reutilizado */}
      <BannerSection />

      <main className="container mx-auto px-8 py-12 flex-grow">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 p-12 lg:p-16">
              {isSecretary ? (
                <>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-6">
                    Guía rápida — Secretaría
                  </h1>

                  <h2 className="text-lg font-semibold mb-3">Objetivo</h2>
                  <p className="mb-4 text-gray-700">
                    Gestionar eficientemente las licencias médicas recibidas:
                    revisar, generar revisiones, validar o rechazar y mantener el
                    historial actualizado.
                  </p>

                  <h2 className="text-lg font-semibold mb-3">Pasos recomendados</h2>
                  <ol className="list-decimal pl-6 space-y-3 text-gray-700 mb-6">
                    <li>
                      Inicia sesión con tu cuenta de secretaria. Verifica que el
                      encabezado muestre "Sec. ...".
                    </li>
                    <li>
                      Accede a "Pendientes" desde el menú para ver las licencias
                      nuevas. Usa filtros (fecha, facultad) para filtrar resultados.
                    </li>
                    <li>
                      Abre una licencia y utiliza "Generar Revisión" si falta
                      documentación o deseas reasignarla.
                    </li>
                    <li>
                      Marca la licencia como "Verificada" o "Rechazada" según
                      corresponda y agrega observaciones.
                    </li>
                    <li>
                      Consulta "Historial" para ver acciones pasadas y exportar
                      comprobantes si es necesario.
                    </li>
                  </ol>

                  

                  <p className="mt-6 text-sm text-gray-500">
                    Si necesitas más ayuda, contacta al soporte desde el pie de
                    página.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-6">
                    ¿Cómo se usa?
                  </h1>

                  <p className="mb-4 text-gray-700">
                    Esta sección explica los pasos básicos para usar el gestor de
                    licencias desde una cuenta estándar. Inicia sesión, sube o
                    selecciona tu licencia y utiliza "Verificar resultados" para
                    conocer su estado.
                  </p>

                  <h2 className="text-lg font-semibold mb-3">Pasos</h2>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Inicia sesión con tu cuenta.</li>
                    <li>
                      Ve a "Generar Revisión" para subir una nueva licencia o
                      solicitar revisión.
                    </li>
                    <li>
                      Usa "Verificar Resultados" para ver el estado actual de tus
                      licencias.
                    </li>
                    <li>Consulta el historial para ver decisiones anteriores.</li>
                  </ul>

                  <p className="mt-6 text-sm text-gray-500">
                    Si eres secretaria y necesitas la guía específica, inicia
                    sesión con una cuenta de secretaria.
                  </p>
                </>
              )}
            </div>

            <div className="lg:col-span-1 flex items-center justify-center p-8 lg:p-12 bg-[var(--blue-50)]">
              <img
                src={signo}
                alt="Ayuda"
                className="w-48 h-48 lg:w-56 lg:h-56 object-contain"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}