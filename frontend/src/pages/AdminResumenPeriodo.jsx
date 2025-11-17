import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";

export default function AdminResumenPeriodo() {
  const [periodos, setPeriodos] = useState([]);
  const [periodoSel, setPeriodoSel] = useState("");
  const [cursosRaw, setCursosRaw] = useState([]);   // datos crudos desde BE
  const [cursos, setCursos] = useState([]);         // datos que se muestran en tabla
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  // 1) Cargar TODOS los cursos+matrículas una sola vez
  useEffect(() => {
    const fetchCursos = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");

        const res = await axios.get("http://localhost:3000/admin/cursos-matriculas", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.data?.ok) {
          throw new Error(res.data?.error || "Respuesta inválida del servidor");
        }

        const lista = res.data.data || [];

        // === Crear mapa de periodos únicos ===
        const mapa = new Map();
        for (const c of lista) {
          if (!c.periodo) continue;
          const code = c.periodo.codigo;
          if (!mapa.has(code)) {
            mapa.set(code, {
              id: code,
              nombre: code,
              activo: !!c.periodo.activo,
            });
          }
        }

        const periodosArr = Array.from(mapa.values()).sort((a, b) =>
          b.id.localeCompare(a.id)
        );

        setPeriodos(periodosArr);

        const activo = periodosArr.find((p) => p.activo) || periodosArr[0];
        setPeriodoSel(activo?.id || "");

        setCursosRaw(lista);
      } catch (err) {
        console.error("[AdminResumenPeriodo] error cargando cursos:", err);
        setError(err.message || "Error al cargar cursos y matrículas");
      } finally {
        setLoading(false);
      }
    };

    fetchCursos();
  }, []);

  // 2) Al cambiar periodo seleccionado, recalcular cursos que se muestran
  useEffect(() => {
    if (!periodoSel) {
      setCursos([]);
      return;
    }

    const filtrados = cursosRaw.filter(
      (c) => c.periodo && c.periodo.codigo === periodoSel
    );

    const adaptados = filtrados.map((c) => ({
      id_curso: c.id_curso,
      codigo: c.codigo,                         // del JSON real
      nombre: c.nombre_curso,
      profesor: c.profesor?.nombre || "Sin profesor asignado",
      matriculados: (c.matriculados || []).map((m) => ({
        nombre: m.nombre || m.correo || "Estudiante sin nombre",
      })),
    }));

    setCursos(adaptados);
    setExpanded({});
  }, [periodoSel, cursosRaw]);

  // 3) Exportar CSV
  const exportarCSV = () => {
    let csv = "Código,Nombre,Profesor,Matriculados\n";
    cursos.forEach((c) => {
      csv += `"${c.codigo}","${c.nombre}","${c.profesor}",${c.matriculados.length}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumen_cursos_${periodoSel || "sin_periodo"}.csv`;
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

          {/* Filtros */}
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
                  {p.nombre}
                </option>
              ))}
            </select>

            {periodos.find((p) => p.id === periodoSel && p.activo) && (
              <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full px-3 py-1 text-xs font-semibold">
                Activo
              </span>
            )}

            <button
              onClick={exportarCSV}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
              disabled={loading || cursos.length === 0}
            >
              Exportar CSV
            </button>
          </div>

          {/* Mensajes de error / carga / vacío / tabla */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-center mb-4 shadow">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white dark:bg-surface rounded-lg p-8 text-center text-gray-500 animate-pulse shadow">
              Cargando datos...
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
                    <React.Fragment
                      key={`${curso.id_curso}-${curso.codigo}-${idx}`}
                    >
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
                          <td
                            colSpan={5}
                            className="bg-blue-50 dark:bg-app/40 px-6 py-3"
                          >
                            {curso.matriculados.length === 0 ? (
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                Sin matrículas en este curso.
                              </div>
                            ) : (
                              <ul className="list-disc ml-6 text-blue-900 dark:text-blue-100">
                                {curso.matriculados.map((est, i) => (
                                  <li key={i}>{est.nombre}</li>
                                ))}
                              </ul>
                            )}
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
