import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import Announcement from "../components/Announcement";

export default function DashboardSecretary() {
  // Simulando un estado de licencias, esto debería venir de tu estado global o contexto


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
      <Navbar />

      <main id="main-content" className="flex-1">
        {/* Banner (igual que en el inicio de alumno) */}
        <BannerSection />

        {/* Franja de botones / contenido y anuncio centrado como en la imagen */}
        <div className="container mx-auto px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Mantengo el Announcement grande centrado */}
            <Announcement />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}