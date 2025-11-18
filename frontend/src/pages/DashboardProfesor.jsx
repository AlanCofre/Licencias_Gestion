// src/pages/profesor/DashboardProfesor.jsx (Actualizado)
import React from "react";
import Navbar from "../components/Navbar";  // ← CORREGIDO
import Footer from "../components/Footer";  // ← CORREGIDO
import BannerSection from "../components/BannerSection";  // ← CORREGIDO
import Announcement from "../components/Announcement";  // ← CORREGIDO
import NotificacionesProfesor from "../components/NotificacionesProfesor";  // ← CORREGIDO

export default function DashboardProfesor() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
      <Navbar />

      <main id="main-content" className="flex-1">
        <BannerSection />
        
        <div className="container mx-auto px-8 py-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna principal con anuncio */}
            <div className="lg:col-span-2">
              <Announcement />
            </div>
            
            {/* Columna lateral con notificaciones */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <NotificacionesProfesor />
                
                {/* Acciones rápidas */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Acciones Rápidas
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="/profesor/licencias"
                      className="block w-full text-left px-3 py-2 text-sm text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    >
                      📋 Ver todas las licencias
                    </a>
                    <a
                      href="/profesor/cursos"
                      className="block w-full text-left px-3 py-2 text-sm text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
                    >
                      📚 Mis cursos
                    </a>
                    <a
                      href="/profesor/regularidad"
                      className="block w-full text-left px-3 py-2 text-sm text-purple-700 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                    >
                      📊 Estado de regularidad
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}