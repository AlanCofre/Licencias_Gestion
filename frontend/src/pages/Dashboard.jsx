import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import Announcement from "../components/Announcement";

export default function Dashboard() {
  // Datos de ejemplo si se requieren más adelante (se eliminó SummaryCards)
  const lastLicense = {
    type: "Licencia médica por gripe",
    date: "2024-03-15",
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
      <Navbar />

      <main id="main-content" className="flex-1">
        <BannerSection />

        {/* Espacio para contenido principal (Resumen rápido movido a otra sección) */}
        <div className="container mx-auto px-4 py-8">
          {/* Aquí irá el contenido principal de la página de inicio sin el resumen rápido */}
          <div className="max-w-6xl mx-auto">
            <Announcement />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}