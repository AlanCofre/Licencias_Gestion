import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "../components/toast";
import SkeletonList from "../components/SkeletonList";

export default function Matriculas() {
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatriculas();
  }, []);

  const fetchMatriculas = async () => {
    try {
      setLoading(true);
      // TODO: Implementar llamada real mañana
      const mockData = {
        periodos: [
          {
            id: 1,
            nombre: "2023-2",
            activo: true,
            cursos: []
          }
        ]
      };
      setMatriculas(mockData.periodos);
    } catch (err) {
      toast.error("Error al cargar matrículas");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Mis Matrículas</h1>
          <SkeletonList count={3} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mis Matrículas</h1>
        
        {matriculas.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-surface rounded-lg border dark:border-app">
            <p className="text-gray-500 dark:text-muted">
              No se encontraron matrículas registradas.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Implementar vista de periodos mañana */}
            <p>Contenido pendiente...</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}