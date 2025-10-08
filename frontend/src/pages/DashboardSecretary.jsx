import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BannerSection from "../components/BannerSection";
import Announcement from "../components/Announcement";

export default function DashboardSecretary() {
  // Simulando un estado de licencias, esto debería venir de tu estado global o contexto
  const licenses = [
    { id: 1, name: "Licencia 1", details: "Detalles de la licencia 1" },
    { id: 2, name: "Licencia 2", details: "Detalles de la licencia 2" },
    // Agrega más licencias según sea necesario
  ];

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

            {/* Tabla o lista de licencias */}
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Mis Licencias</h2>
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre de la Licencia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detalles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {licenses.map((license) => (
                      <tr key={license.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {license.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {license.details}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/evaluar/${license.id}`}
                            className="text-blue-600 underline"
                          >
                            Ver / Gestionar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}