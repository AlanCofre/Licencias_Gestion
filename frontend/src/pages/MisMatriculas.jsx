import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SkeletonList from "../components/SkeletonList";

const toast = { error: (msg) => alert(msg) };

export default function MisMatriculas() {
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error409, setError409] = useState(false);

  useEffect(() => {
    cargarMatriculas();
    // eslint-disable-next-line
  }, []);

  async function cargarMatriculas({ historicos = false } = {}) {
    setLoading(true);
    setError409(false);
    try {
      // Llamada real a la API
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');
      
      let url = `${API_BASE}/api/matriculas/mismatriculas`;
      if (historicos) {
        url += '?historicos=true';
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Respuesta no válida del servidor: ${response.status}`);
      }

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError409(true);
          return;
        }
        throw new Error(result.error || `Error ${response.status} al cargar matrículas`);
      }

      if (result.ok && result.data) {
        console.log('📦 Datos recibidos del backend:', result.data);
        
        // Los datos ya vienen agrupados por periodo del backend
        const dataOrdenada = [...result.data].sort((a, b) => b.periodo.localeCompare(a.periodo));
        
        // Ordenar cursos por nombre y sección dentro de cada periodo
        dataOrdenada.forEach((periodo) => {
          if (periodo.cursos && periodo.cursos.length > 0) {
            periodo.cursos.sort((a, b) =>
              a.nombre.localeCompare(b.nombre) || a.seccion.localeCompare(b.seccion)
            );
          }
        });
        
        setMatriculas(dataOrdenada);
      } else {
        setMatriculas([]);
      }
    } catch (err) {
      console.error('Error cargando matrículas:', err);
      if (err.status === 409) {
        setError409(true);
      } else {
        toast.error("Error al cargar matrículas. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mis Matrículas</h1>

        {loading ? (
          <SkeletonList count={2} />
        ) : error409 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-xl mx-auto text-center">
            <p className="text-yellow-800 mb-2">
              No hay un periodo académico activo en este momento.
            </p>
            <button
              onClick={() => cargarMatriculas({ historicos: true })}
              className="mt-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition"
            >
              Ver histórico de matrículas
            </button>
          </div>
        ) : matriculas.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-surface rounded-lg border dark:border-app max-w-xl mx-auto">
            <p className="text-gray-500 dark:text-muted">
              No se encontraron matrículas registradas.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {matriculas.map((periodo) => (
              <section
                key={periodo.periodo}
                className="bg-white dark:bg-surface rounded-lg border dark:border-app overflow-hidden"
              >
                <div className="px-6 py-4 border-b dark:border-app">
                  <h2 className="text-lg font-semibold">
                    Periodo {periodo.nombre}
                  </h2>
                </div>
                <div className="divide-y dark:divide-app">
                  {periodo.cursos.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-muted">
                      No tienes cursos inscritos en este periodo.
                    </div>
                  ) : (
                    periodo.cursos.map((curso, index) => (
                      <div
                        key={`${curso.codigo}-${curso.seccion}-${index}`}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{curso.nombre}</h3>
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                curso.activo
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {curso.activo ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-muted">
                            Código: {curso.codigo} • Sección: {curso.seccion}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-muted mt-2 sm:mt-0">
                          Prof. {curso.profesor}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}