import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// MOCKS para frontend (puedes reemplazar por fetch real, ver comentarios abajo)
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
  const [error, setError] = useState(null);

  // Carga periodos al inicio (mock)
  useEffect(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setPeriodos(mockPeriodos);
      const activo = mockPeriodos.find((p) => p.activo) || mockPeriodos[0];
      setPeriodoSel(activo?.id || "");
      setLoading(false);
    }, 500);
  }, []);

  // Carga cursos al cambiar periodo (mock)
  useEffect(() => {
    if (!periodoSel) return;
    setLoading(true);
    setError(null);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-100 to-blue-300 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-8 text-blue-900 dark:text-blue-200 flex items-center gap-3">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17v-2a4 4 0 014-4h6m-6 0V7a4 4 0 00-4-4H5a4 4 0 00-4 4v10a4 4 0 004 4h6a4 4 0 004-4z"
              />
            </svg>
            Resumen de Cursos y Matrículas por Periodo
          </h1>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-surface rounded-lg shadow p-4">
            <label className="font-medium text-blue-900 dark:text-blue-200">
              Periodo:
            </label>
            <select
              value={periodoSel}
              onChange={(e) => setPeriodoSel(e.target.value)}
              className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              disabled={loading || periodos.length === 0}
            >
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.activo ? "(Activo)" : ""}
                </option>
              ))}
            </select>
            <button
              onClick={exportarCSV}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
              disabled={loading || cursos.length === 0}
            >
              Exportar CSV
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-center mb-4 shadow">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white dark:bg-surface rounded-lg p-8 text-center text-gray-500 animate-pulse shadow">
              Cargando cursos...
            </div>
          ) : cursos.length === 0 ? (
            <div className="bg-white dark:bg-surface rounded-lg p-8 text-center text-gray-500 shadow">
              No hay cursos para este periodo.
            </div>
          ) : (
            <div className="bg-white dark:bg-surface rounded-lg border dark:border-app overflow-x-auto shadow">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b dark:border-app bg-blue-50 dark:bg-app/30">
                    <th className="py-3 px-4 text-left text-blue-900 dark:text-blue-200 font-semibold">
                      Código
                    </th>
                    <th className="py-3 px-4 text-left text-blue-900 dark:text-blue-200 font-semibold">
                      Nombre
                    </th>
                    <th className="py-3 px-4 text-left text-blue-900 dark:text-blue-200 font-semibold">
                      Profesor
                    </th>
                    <th className="py-3 px-4 text-center text-blue-900 dark:text-blue-200 font-semibold">
                      Matriculados
                    </th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {cursos.map((curso, idx) => (
                    <React.Fragment key={curso.codigo}>
                      <tr className="border-b dark:border-app hover:bg-blue-50/60 dark:hover:bg-app/20 transition">
                        <td className="py-2 px-4 font-mono">{curso.codigo}</td>
                        <td className="py-2 px-4">{curso.nombre}</td>
                        <td className="py-2 px-4">{curso.profesor}</td>
                        <td className="py-2 px-4 text-center">
                          <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full px-3 py-1 text-xs font-semibold">
                            {curso.matriculados.length}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-center">
                          <button
                            className="text-blue-600 underline text-sm hover:text-blue-800"
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
                            <ul className="list-disc ml-6 text-blue-900 dark:text-blue-100">
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
        </div>
      </main>
      <Footer />
    </div>
  );
}