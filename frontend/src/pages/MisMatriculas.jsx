import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SkeletonList from "../components/SkeletonList";
import LoadingSpinner from "../components/LoadingSpinner";

const toast = { error: (msg) => alert(msg) };

// Simulación de llamada a API (reemplaza por fetch real en producción)
async function getMatriculas() {
  // Simula delay
  await new Promise((r) => setTimeout(r, 700));
  // Simula error 409 (sin periodo activo)
  // throw { status: 409 };
  // Simula error 5xx
  // throw { status: 500 };
  // Simula datos reales
  return [
    {
      periodo: "2025-1",
      nombre: "2025 - Semestre 1",
      activo: true,
      cursos: [
        {
          codigo: "INF-101",
          nombre: "Programación I",
          seccion: "A",
          profesor: "Rumencio González",
        },
        {
          codigo: "MAT-201",
          nombre: "Tópicos de Matemáticas",
          seccion: "B",
          profesor: "Ana Martínez",
        },
      ],
    },
    {
      periodo: "2024-2",
      nombre: "2024 - Semestre 2",
      activo: false,
      cursos: [
        {
          codigo: "INF-150",
          nombre: "Bases de Datos",
          seccion: "A",
          profesor: "Carlos Rodríguez",
        },
      ],
    },
  ];
}

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
      // Aquí deberías llamar a tu API real:
      // const data = await fetch("/api/estudiantes/matriculas").then(r => r.json());
      const data = await getMatriculas();
      // Ordenar periodos descendente
      data.sort((a, b) => b.periodo.localeCompare(a.periodo));
      // Ordenar cursos por nombre y sección
      data.forEach((p) =>
        p.cursos.sort((a, b) =>
          a.nombre.localeCompare(b.nombre) || a.seccion.localeCompare(b.seccion)
        )
      );
      setMatriculas(data);
    } catch (err) {
      if (err.status === 409) {
        setError409(true);
      } else {
        toast.error("Error al cargar matrículas. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ✅ Loading pantalla completa
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando mis matrículas..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mis Matrículas</h1>

        {error409 ? (
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
                <div className="px-6 py-4 border-b dark:border-app flex justify-between items-center">
                  <h2 className="text-lg font-semibold">
                    Periodo {periodo.nombre}
                  </h2>
                  <span
                    className={`px-2 py-1 text-sm rounded ${
                      periodo.activo
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {periodo.activo ? "Activo" : "Cerrado"}
                  </span>
                </div>
                <div className="divide-y dark:divide-app">
                  {periodo.cursos.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-muted">
                      No tienes cursos inscritos en este periodo.
                    </div>
                  ) : (
                    periodo.cursos.map((curso) => (
                      <div
                        key={`${curso.codigo}-${curso.seccion}`}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <h3 className="font-medium">{curso.nombre}</h3>
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