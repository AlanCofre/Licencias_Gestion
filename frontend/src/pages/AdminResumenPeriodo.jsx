import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Simulación de periodos y cursos (reemplazar por fetch real en Día 2)
const mockPeriodos = [
  { id: "2025-2", nombre: "2025 - Semestre 2", activo: true },
  { id: "2025-1", nombre: "2025 - Semestre 1", activo: false },
];

const mockCursos = {
  "2025-2": [
    {
      codigo: "INF-101",
      nombre: "Programación I",
      profesor: "Rumencio González",
      matriculados: [
        { nombre: "Ana Martínez" },
        { nombre: "Carlos Rodríguez" },
      ],
    },
    {
      codigo: "MAT-201",
      nombre: "Matemáticas II",
      profesor: "Ana Martínez",
      matriculados: [{ nombre: "Pedro Pérez" }],
    },
  ],
  "2025-1": [
    {
      codigo: "INF-101",
      nombre: "Programación I",
      profesor: "Rumencio González",
      matriculados: [{ nombre: "Ana Martínez" }],
    },
  ],
};

export default function AdminResumenPeriodo() {
  const [periodos, setPeriodos] = useState([]);
  const [periodoSel, setPeriodoSel] = useState("");
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  // Carga inicial (mock)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setPeriodos(mockPeriodos);
      const activo = mockPeriodos.find((p) => p.activo) || mockPeriodos[0];
      setPeriodoSel(activo.id);
      setCursos(mockCursos[activo.id] || []);
      setLoading(false);
    }, 600);
  }, []);

  // Cambio de periodo
  useEffect(() => {
    if (!periodoSel) return;
    setLoading(true);
    setTimeout(() => {
      setCursos(mockCursos[periodoSel] || []);
      setLoading(false);
    }, 400);
  }, [periodoSel]);

  // Exportar CSV (client-side)
  const exportarCSV = () => {
    let csv = "Código,Nombre,Profesor,Matriculados\n";
    cursos.forEach((c) => {
      csv += `"${c.codigo}","${c.nombre}","${c.profesor}",${c.matriculados.length}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumen_cursos_${periodoSel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Resumen de Cursos y Matrículas por Periodo</h1>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="font-medium">Periodo:</label>
          <select
            value={periodoSel}
            onChange={(e) => setPeriodoSel(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.activo ? "(Activo)" : ""}
              </option>
            ))}
          </select>
          <button
            onClick={exportarCSV}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Exportar CSV
          </button>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-surface rounded-lg p-8 text-center text-gray-500">
            Cargando cursos...
          </div>
        ) : cursos.length === 0 ? (
          <div className="bg-white dark:bg-surface rounded-lg p-8 text-center text-gray-500">
            No hay cursos para este periodo.
          </div>
        ) : (
          <div className="bg-white dark:bg-surface rounded-lg border dark:border-app overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b dark:border-app">
                  <th className="py-2 px-4 text-left">Código</th>
                  <th className="py-2 px-4 text-left">Nombre</th>
                  <th className="py-2 px-4 text-left">Profesor</th>
                  <th className="py-2 px-4 text-center">Matriculados</th>
                  <th className="py-2 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {cursos.map((curso, idx) => (
                  <React.Fragment key={curso.codigo}>
                    <tr className="border-b dark:border-app">
                      <td className="py-2 px-4">{curso.codigo}</td>
                      <td className="py-2 px-4">{curso.nombre}</td>
                      <td className="py-2 px-4">{curso.profesor}</td>
                      <td className="py-2 px-4 text-center">{curso.matriculados.length}</td>
                      <td className="py-2 px-4 text-center">
                        <button
                          className="text-blue-600 underline text-sm"
                          onClick={() =>
                            setExpanded((prev) => ({
                              ...prev,
                              [idx]: !prev[idx],
                            }))
                          }
                        >
                          {expanded[idx] ? "Ocultar" : "Ver estudiantes"}
                        </button>
                      </td>
                    </tr>
                    {expanded[idx] && (
                      <tr>
                        <td colSpan={5} className="bg-blue-50 dark:bg-app/40 px-6 py-3">
                          <ul className="list-disc ml-6">
                            {curso.matriculados.map((est, i) => (
                              <li key={i}>{est.nombre}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}