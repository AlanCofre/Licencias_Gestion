import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Users, Download, Calendar, BookOpen, User, ChevronDown, ChevronUp } from "lucide-react";

// =============================== API FUNCTIONS ===============================
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function apiRequest(path, opts = {}) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const response = await fetch(`${API_BASE}/api${path}`, {
    credentials: "include",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    ...opts,
  });

  if (!response.ok) {
    let errorMessage = "Error en la solicitud";
    try {
      const errorData = await response.json();
      errorMessage = errorData.mensaje || errorMessage;
    } catch {
      errorMessage = await response.text() || `Error ${response.status}`;
    }
    
    const err = new Error(errorMessage);
    err.status = response.status;
    throw err;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    return data.data !== undefined ? data.data : data;
  }
  
  return response.blob();
}

// Obtener cursos con matrículas
async function getCursosMatriculas() {
  return apiRequest("/admin/cursos-matriculas");
}

// Obtener periodos
async function getPeriodos() {
  return apiRequest("/periodos");
}

// =============================== MAIN COMPONENT ===============================
export default function AdminResumenPeriodo() {
  const [periodos, setPeriodos] = useState([]);
  const [periodoSel, setPeriodoSel] = useState("");
  const [cursosRaw, setCursosRaw] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  // 1) Cargar TODOS los cursos+matrículas y periodos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Cargando datos de resumen...');
        
        const [cursosData, periodosData] = await Promise.all([
          getCursosMatriculas(),
          getPeriodos()
        ]);

        console.log('📊 Cursos recibidos:', cursosData);
        console.log('📅 Periodos recibidos:', periodosData);

        // Verificar estructura de datos
        if (!Array.isArray(cursosData)) {
          throw new Error("Formato de datos inválido: se esperaba array de cursos");
        }

        setCursosRaw(cursosData);
        setPeriodos(periodosData);

        // Seleccionar periodo activo por defecto, o el primero
        const periodoActivo = periodosData.find(p => p.activo);
        const periodoDefault = periodoActivo || (periodosData.length > 0 ? periodosData[0] : null);
        
        if (periodoDefault) {
          setPeriodoSel(String(periodoDefault.id_periodo));
          console.log('🎯 Periodo seleccionado por defecto:', periodoDefault.codigo);
        }

      } catch (err) {
        console.error('[AdminResumenPeriodo] error cargando datos:', err);
        setError(err.message || "Error al cargar cursos y matrículas");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2) Filtrar cursos cuando cambia el periodo seleccionado
  useEffect(() => {
    if (!periodoSel || !cursosRaw.length) {
      setCursos([]);
      return;
    }

    console.log('🔍 Filtrando cursos para periodo:', periodoSel);
    
    const filtrados = cursosRaw.filter(
      (c) => c.periodo && String(c.periodo.id_periodo) === String(periodoSel)
    );

    console.log('📚 Cursos filtrados:', filtrados.length);

    const adaptados = filtrados.map((c) => ({
      id_curso: c.id_curso,
      codigo: c.codigo,
      nombre_curso: c.nombre_curso,
      semestre: c.semestre,
      seccion: c.seccion,
      profesor: c.profesor ? {
        nombre: c.profesor.nombre,
        correo: c.profesor.correo
      } : null,
      matriculados: (c.matriculados || []).map((m) => ({
        id_estudiante: m.id_estudiante,
        nombre: m.nombre || 'Estudiante sin nombre',
        correo: m.correo,
        fecha_matricula: m.fecha_matricula
      })),
      periodo: c.periodo
    }));

    setCursos(adaptados);
    setExpanded({});
  }, [periodoSel, cursosRaw]);

  // 3) Exportar CSV mejorado
  const exportarCSV = () => {
    const periodoNombre = periodos.find(p => String(p.id_periodo) === String(periodoSel))?.codigo || 'sin_periodo';
    
    let csv = "Código,Nombre del Curso,Semestre,Sección,Profesor,Total Matriculados,Estudiantes\n";
    
    cursos.forEach((c) => {
      const estudiantesNombres = c.matriculados.map(m => m.nombre).join('; ');
      csv += `"${c.codigo}","${c.nombre_curso}",${c.semestre},${c.seccion},"${c.profesor?.nombre || 'Sin profesor'}",${c.matriculados.length},"${estudiantesNombres}"\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumen_cursos_${periodoNombre}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 4) Toggle expandir/contraer todos
  const toggleAll = () => {
    if (Object.keys(expanded).length === cursos.length) {
      // Contraer todos
      setExpanded({});
    } else {
      // Expandir todos
      const allExpanded = {};
      cursos.forEach((_, index) => {
        allExpanded[index] = true;
      });
      setExpanded(allExpanded);
    }
  };

  const periodoActual = periodos.find(p => String(p.id_periodo) === String(periodoSel));
  const totalMatriculados = cursos.reduce((sum, curso) => sum + curso.matriculados.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
      <Navbar />
      
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BookOpen className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Resumen de Cursos y Matrículas
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Visualiza cursos, profesores y estudiantes matriculados por período académico
                  </p>
                </div>
              </div>

              {/* Filtros y estadísticas */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Selector de periodo */}
                <div className="md:col-span-4">
                  <label htmlFor="periodo" className="block text-xs font-medium text-gray-600 mb-1">
                    Periodo Académico
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <select
                      id="periodo"
                      value={periodoSel}
                      onChange={(e) => setPeriodoSel(e.target.value)}
                      className="w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                      disabled={loading || periodos.length === 0}
                    >
                      <option value="">Selecciona un periodo</option>
                      {periodos.map((p) => (
                        <option key={p.id_periodo} value={String(p.id_periodo)}>
                          {p.codigo} {p.activo ? "(Activo)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="md:col-span-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{cursos.length}</div>
                      <div className="text-xs text-blue-600">Cursos</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{totalMatriculados}</div>
                      <div className="text-xs text-green-600">Matriculados</div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="md:col-span-4">
                  <div className="flex flex-col sm:flex-row gap-2 justify-end">
                    <button
                      onClick={toggleAll}
                      disabled={cursos.length === 0}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                    >
                      {Object.keys(expanded).length === cursos.length ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Contraer Todos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Expandir Todos
                        </>
                      )}
                    </button>
                    <button
                      onClick={exportarCSV}
                      disabled={loading || cursos.length === 0}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      Exportar CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-center shadow-sm">
              <div className="font-semibold">Error al cargar datos</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando cursos y matrículas...</p>
            </div>
          ) : cursos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {periodoSel ? "No hay cursos para este período" : "Selecciona un período"}
              </h3>
              <p className="text-gray-600">
                {periodoSel 
                  ? "No se encontraron cursos matriculados para el período seleccionado."
                  : "Por favor selecciona un período académico para ver los cursos."
                }
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Curso
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Profesor
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Sección
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Matriculados
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {cursos.map((curso, idx) => (
                      <React.Fragment key={`${curso.id_curso}-${idx}`}>
                        <tr className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{curso.codigo}</div>
                                <div className="text-sm text-gray-600 mt-1">{curso.nombre_curso}</div>
                                <div className="text-xs text-gray-500 mt-1">Semestre {curso.semestre}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {curso.profesor ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{curso.profesor.nombre}</div>
                                  <div className="text-xs text-gray-500">{curso.profesor.correo}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">Sin profesor asignado</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Sección {curso.seccion}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-semibold text-gray-900">
                                {curso.matriculados.length}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setExpanded(prev => ({
                                ...prev,
                                [idx]: !prev[idx]
                              }))}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              {expanded[idx] ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  Ocultar
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  Ver Estudiantes
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                        {expanded[idx] && (
                          <tr>
                            <td colSpan={5} className="bg-blue-50 px-6 py-4">
                              <div className="max-w-4xl">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Estudiantes Matriculados ({curso.matriculados.length})
                                </h4>
                                {curso.matriculados.length === 0 ? (
                                  <p className="text-sm text-gray-500 italic">
                                    No hay estudiantes matriculados en este curso.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {curso.matriculados.map((estudiante, estIdx) => (
                                      <div
                                        key={estIdx}
                                        className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                                      >
                                        <div className="font-medium text-gray-900">
                                          {estudiante.nombre}
                                        </div>
                                        {estudiante.correo && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            {estudiante.correo}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
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