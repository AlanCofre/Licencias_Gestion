import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Eye, Clock, Search, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 10;
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

/* -------------------- UTILIDADES -------------------- */
function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function inDateRange(valueDateStr, startStr, endStr) {
  if (!valueDateStr) return false;
  const v = new Date(valueDateStr);
  if (isNaN(v)) return false;
  if (startStr) {
    const s = new Date(startStr);
    if (isNaN(s)) return false;
    if (v < s) return false;
  }
  if (endStr) {
    const e = new Date(endStr);
    if (isNaN(e)) return false;
    e.setHours(23, 59, 59, 999);
    if (v > e) return false;
  }
  return true;
}

/* -------------------- COMPONENTE PRINCIPAL -------------------- */
export default function ProfeLicencias() {
  const { user, token, isLoading: authLoading } = useAuth();

  /* estado de datos */
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* filtros locales + paginación */
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterCourse, setFilterCourse] = useState(searchParams.get("course") || "");
  const [filterEstado, setFilterEstado] = useState(searchParams.get("estado") || "");
  const [startDate, setStartDate] = useState(searchParams.get("start") || "");
  const [endDate, setEndDate] = useState(searchParams.get("end") || "");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));

  /* período activo */
  const periodoFromUrl = searchParams.get("periodo");
  const periodoFromStorage = (() => {
    try {
      return localStorage.getItem("periodo_activo_codigo") || null;
    } catch {
      return null;
    }
  })();
  const periodoActivo = periodoFromUrl || periodoFromStorage || "2025-2";

  /* cargar datos desde backend /profesor/licencias */
  useEffect(() => {
    // Si AuthContext aún está cargando, no hacer nada
    if (authLoading) {
      console.log("[ProfeLicencias] Esperando AuthContext...");
      setLoading(true);
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      // Validar token y user DESPUÉS de que AuthContext termine de cargar
      if (!token) {
        console.warn("[ProfeLicencias] Sin token");
        setError("No hay token de autenticación. Inicia sesión nuevamente.");
        setLoading(false);
        return;
      }

      if (!user?.id_usuario) {
        console.warn("[ProfeLicencias] Sin id_usuario");
        setError("No se encontró información del usuario.");
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (periodoActivo) params.set("periodo", periodoActivo);

        const url = `${API_BASE}/profesor/licencias${
          params.toString() ? `?${params.toString()}` : ""
        }`;

        console.log("[ProfeLicencias] Llamando a:", url);
        console.log("[ProfeLicencias] Token presente:", !!token);
        console.log("[ProfeLicencias] User ID:", user?.id_usuario);

        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        console.log("[ProfeLicencias] Status:", res.status);

        if (!res.ok) {
          const txt = await res.text();
          console.error("[ProfeLicencias] Response error:", txt);
          throw new Error(txt || `HTTP ${res.status}`);
        }

        const json = await res.json();
        console.log("[ProfeLicencias] Data recibida:", json);

        if (!json.ok || !Array.isArray(json.data)) {
          throw new Error(json.mensaje || json.error || "Respuesta no válida del servidor");
        }

        // Normalizar respuesta
        const normalized = (json.data || []).map((row) => ({
          id: row.id_licencia || row.id,
          studentName: row.nombre_estudiante || row.student_name || "—",
          studentId: row.correo_estudiante || row.student_id || "—",
          courseCode: row.codigo_curso || row.course_code || "UNK",
          section: row.seccion || row.section || "?",
          fechaEmision: row.fecha_emision ? row.fecha_emision.slice(0, 10) : "",
          fechaInicio: row.fecha_inicio ? row.fecha_inicio.slice(0, 10) : "",
          fechaFin: row.fecha_fin ? row.fecha_fin.slice(0, 10) : "",
          estado: row.estado || row.status || "Desconocido",
        }));

        if (!mounted) return;

        console.log("[ProfeLicencias] Normalizadas:", normalized.length, "licencias");
        setItems(normalized);
        setLoading(false);

        if (normalized.length === 0) {
          setError("No hay licencias disponibles para este período.");
        }
      } catch (err) {
        if (!mounted) return;
        console.error("[ProfeLicencias] Error completo:", err);
        setError(err.message || String(err));
        setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [authLoading, token, user?.id_usuario, periodoActivo]);

  /* sincronizar filtros al montar */
  useEffect(() => {
    const spCourse = searchParams.get("course") || "";
    const spEstado = searchParams.get("estado") || "";
    const spStart = searchParams.get("start") || "";
    const spEnd = searchParams.get("end") || "";
    const spQ = searchParams.get("q") || "";
    const spPage = Number(searchParams.get("page") || 1);

    setFilterCourse(spCourse);
    setFilterEstado(spEstado);
    setStartDate(spStart);
    setEndDate(spEnd);
    setSearchTerm(spQ);
    setPage(spPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* opciones de dropdowns */
  const courseOptions = useMemo(() => {
    const setC = new Set();
    items.forEach((it) => {
      const key = `${it.courseCode || "UNK"} - ${it.section || "?"}`;
      setC.add(key);
    });
    return Array.from(setC).sort();
  }, [items]);

  const estadoOptions = useMemo(() => {
    const setE = new Set();
    items.forEach((it) => {
      const e = String(it.estado || "Desconocido");
      setE.add(e);
    });
    return Array.from(setE).sort();
  }, [items]);

  /* aplicar filtros */
  const filtered = useMemo(() => {
    let out = items.slice();

    if (filterCourse) {
      out = out.filter((it) => {
        const key = `${it.courseCode || "UNK"} - ${it.section || "?"}`;
        return key === filterCourse;
      });
    }

    if (filterEstado) {
      out = out.filter((it) => {
        return String(it.estado || "").toLowerCase() === String(filterEstado).toLowerCase();
      });
    }

    if (startDate || endDate) {
      out = out.filter((it) => {
        return (
          inDateRange(it.fechaEmision, startDate, endDate) ||
          inDateRange(it.fechaInicio, startDate, endDate)
        );
      });
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      out = out.filter(
        (it) =>
          String(it.studentName || "").toLowerCase().includes(s) ||
          String(it.studentId || "").toLowerCase().includes(s)
      );
    }

    out.sort((a, b) => {
      const da = new Date(a.fechaInicio || a.fechaEmision || 0).getTime();
      const db = new Date(b.fechaInicio || b.fechaEmision || 0).getTime();
      return db - da;
    });

    return out;
  }, [items, filterCourse, filterEstado, startDate, endDate, searchTerm]);

  /* paginación */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* actualizar querystring */
  useEffect(() => {
    const params = {};
    if (filterCourse) params.course = filterCourse;
    if (filterEstado) params.estado = filterEstado;
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;
    if (searchTerm) params.q = searchTerm;
    if (page && page > 1) params.page = String(page);
    setSearchParams(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCourse, filterEstado, startDate, endDate, searchTerm, page]);

  /* limpiar filtros */
  function clearFilters() {
    setFilterCourse("");
    setFilterEstado("");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setPage(1);
    setSearchParams({});
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
      <Navbar />

      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl">
          {/* header y filtros */}
          <div className="mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="h-7 w-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">Licencias — Mis cursos</h1>
                  <p className="text-gray-600 mt-1">
                    Filtra la bandeja para localizar rápidamente licencias.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Período activo: <span className="font-semibold">{periodoActivo}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded shadow-sm hover:bg-gray-50 text-sm"
                    aria-label="Limpiar filtros"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                    Limpiar filtros
                  </button>
                </div>
              </div>

              {/* filtros */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label htmlFor="filterCourse" className="text-sm text-gray-600">
                    Ramo
                  </label>
                  <select
                    id="filterCourse"
                    value={filterCourse}
                    onChange={(e) => {
                      setFilterCourse(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1 block w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                  >
                    <option value="">Todos los ramos</option>
                    {courseOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filterEstado" className="text-sm text-gray-600">
                    Estado
                  </label>
                  <select
                    id="filterEstado"
                    value={filterEstado}
                    onChange={(e) => {
                      setFilterEstado(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1 block w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                  >
                    <option value="">Todos los estados</option>
                    {estadoOptions.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label htmlFor="startDate" className="text-sm text-gray-600">
                      Desde
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setPage(1);
                        }}
                        className="block w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                      />
                    </div>
                  </div>

                  <div className="w-1/2">
                    <label htmlFor="endDate" className="text-sm text-gray-600">
                      Hasta
                    </label>
                    <div className="relative mt-1">
                      <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setPage(1);
                        }}
                        className="block w-full border border-gray-200 bg-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label htmlFor="searchTerm" className="text-sm text-gray-600">
                    Buscar
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="searchTerm"
                      type="text"
                      placeholder="Alumno o legajo"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10 pr-3 py-2 border border-gray-200 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4] bg-white"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error global */}
          {error && !loading && items.length === 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">
                <span className="font-semibold">Error:</span> {error}
              </p>
            </div>
          )}

          {/* Tabla de licencias */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Ramo
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Fechas
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-40" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-48" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-4 bg-gray-200 rounded w-24" />
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="h-8 w-24 bg-gray-200 rounded mx-auto" />
                        </td>
                      </tr>
                    ))
                  ) : paged.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                          <Clock className="h-12 w-12 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">No hay licencias</h2>
                        <p className="text-gray-500">
                          No se encontraron licencias para los filtros seleccionados.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paged.map((lic) => {
                      const courseLabel = `${lic.courseCode || "UNK"} - ${lic.section || "?"}`;
                      const studentName = lic.studentName || "Sin nombre";
                      const studentId = lic.studentId || "";
                      const fechaInicio = lic.fechaInicio || "-";
                      const fechaFin = lic.fechaFin || "-";

                      return (
                        <tr
                          key={lic.id}
                          className="hover:bg-blue-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold">
                                {initialsFromName(studentName)}
                              </div>
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{studentName}</div>
                                <div className="text-xs text-gray-500">{studentId}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{courseLabel}</div>
                            </div>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm space-y-1">
                              <div className="flex items-center text-gray-900">
                                <span className="font-medium text-blue-600">Inicio:</span>
                                <span className="ml-2">{fechaInicio}</span>
                              </div>
                              <div className="flex items-center text-gray-900">
                                <span className="font-medium text-red-600">Fin:</span>
                                <span className="ml-2">{fechaFin}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap">
                            <span
                              className={`px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full border min-w-[140px] justify-center ${
                                String(lic.estado).toLowerCase().includes("acept") ||
                                String(lic.estado).toLowerCase().includes("aprob")
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : String(lic.estado).toLowerCase().includes("rechaz")
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                              }`}
                            >
                              {lic.estado}
                            </span>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap text-center">
                            <Link
                              to={`/profesor/licencias/${lic.id}`}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {!loading && filtered.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {filtered.length} resultados — Página {page} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
