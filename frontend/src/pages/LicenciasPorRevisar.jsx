import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Mock data básico de licencias
const mockLicenciasRevision = [
  {
    id: "123",
    estudiante: "María González",
    carrera: "Medicina",
    fechaInicio: "2025-10-01",
    fechaFin: "2025-10-07",
    estado: "En revisión"
  },
  {
    id: "456", 
    estudiante: "Carlos Rodríguez",
    carrera: "Ingeniería",
    fechaInicio: "2025-09-15",
    fechaFin: "2025-09-20",
    estado: "En revisión"
  }
];

export default function LicenciasPorRevisar() {
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga 
    const cargarLicencias = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setLicencias(mockLicenciasRevision);
      setLoading(false);
    };

    cargarLicencias();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p>Cargando...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Licencias por Revisar</h1>

        {/* Tabla  */}
        <div className="bg-white rounded-lg shadow p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Nombre del Estudiante</th>
                <th className="text-left py-2">Carrera</th>
                <th className="text-left py-2">Fechas</th>
                <th className="text-left py-2">Estado Actual</th>
              </tr>
            </thead>
            <tbody>
              {licencias.map((licencia) => (
                <tr key={licencia.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{licencia.estudiante}</td>
                  <td className="py-3">{licencia.carrera}</td>
                  <td className="py-3">
                    {licencia.fechaInicio} - {licencia.fechaFin}
                  </td>
                  <td className="py-3">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                      {licencia.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}