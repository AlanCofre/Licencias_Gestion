import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function LicenciaNueva() {
  const [cursos, setCursos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [periodoActivo, setPeriodoActivo] = useState(true); // simula periodo activo
  const [selected, setSelected] = useState([]);

  // Simulación de carga inicial (mock)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // Simula cursos activos
      setCursos([
        { codigo: "INF-101", nombre: "Programación I", seccion: "A", profesor: "Rumencio González" },
        { codigo: "MAT-201", nombre: "Matemáticas II", seccion: "B", profesor: "Ana Martínez" },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  // Filtro de búsqueda local
  const cursosFiltrados = cursos.filter(
    (c) =>
      c.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Nueva Licencia - Selecciona Cursos</h1>

        {!periodoActivo ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-center">
            No hay un periodo académico activo. No puedes solicitar licencia en este momento.
          </div>
        ) : loading ? (
          <div className="text-center text-gray-500">Cargando cursos...</div>
        ) : cursos.length === 0 ? (
          <div className="bg-white dark:bg-surface rounded-lg border dark:border-app p-6 text-center">
            No tienes cursos activos.{" "}
            <a
              href="/estudiante/mis-matriculas"
              className="text-blue-600 underline"
            >
              Ver matrículas
            </a>
          </div>
        ) : (
          <div className="bg-white dark:bg-surface rounded-lg border dark:border-app p-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-3">
              {cursosFiltrados.length === 0 ? (
                <div className="text-gray-500 text-center">No hay cursos que coincidan.</div>
              ) : (
                cursosFiltrados.map((curso) => (
                  <label key={curso.codigo + curso.seccion} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(curso.codigo)}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, curso.codigo]
                            : prev.filter((c) => c !== curso.codigo)
                        );
                      }}
                    />
                    <span>
                      <b>{curso.codigo}</b> - {curso.nombre} (Sección {curso.seccion}) — Prof. {curso.profesor}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}