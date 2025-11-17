import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BarChart3, Download, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../components/LoadingSpinner";

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
  const { t } = useTranslation();
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

    if (loading && periodos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:bg-app dark:bg-none">
        <LoadingSpinner size="large" text="Cargando resumen de períodos..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BarChart3 className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Resumen de Periodo
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Visualiza cursos, profesores y matrículas del periodo
                    seleccionado.
                  </p>
                </div>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-12 md:col-span-6">
                  <label
                    htmlFor="periodo"
                    className="block text-xs font-medium text-gray-600 mb-1"
                  >
                    Periodo
                  </label>
                  <select
                    id="periodo"
                    value={periodoSel}
                    onChange={(e) => setPeriodoSel(e.target.value)}
                    className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                    disabled={loading || periodos.length === 0}
                  >
                    {periodos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <div className="flex items-center justify-between gap-2">
                    {periodos.find((p) => p.id === periodoSel && p.activo) && (
                      <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full px-3 py-1 text-xs font-semibold">
                        Activo
                      </span>
                    )}
                    <button
                      onClick={exportarCSV}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                      disabled={loading || cursos.length === 0}
                    >
                      <Download className="h-4 w-4" />
                      Exportar CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-center shadow-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-center py-16 text-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                Cargando cursos...
              </div>
            </div>
          ) : cursos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="text-center text-gray-500 text-sm py-16">
                No hay cursos para este periodo.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Profesor
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Matriculados
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {cursos.map((curso, idx) => (
                      <React.Fragment key={curso.codigo}>
                        <tr className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {curso.codigo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {curso.nombre}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {curso.profesor}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-semibold">
                              {curso.matriculados.length}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() =>
                                setExpanded((prev) => ({
                                  ...prev,
                                  [idx]: !prev[idx],
                                }))
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 transition-all shadow-sm"
                            >
                              {expanded[idx] ? "Ocultar" : "Ver"}
                            </button>
                          </td>
                        </tr>
                        {expanded[idx] && (
                          <tr className="bg-blue-50/50">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Estudiantes matriculados
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {curso.matriculados.map((est, i) => (
                                    <li
                                      key={i}
                                      className="text-sm text-gray-700 bg-white rounded px-3 py-2 border border-gray-100"
                                    >
                                      {est.nombre}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}