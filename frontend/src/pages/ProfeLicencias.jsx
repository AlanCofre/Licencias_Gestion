import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Eye, Clock, Search, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 10;

const mockLicencias = [
  {
    id: "123",
    studentName: "Rumencio González",
    studentId: "20201234",
    courseCode: "INF101",
    section: "A",
    fechaEmision: "2025-09-27",
    fechaInicio: "2025-10-01",
    fechaFin: "2025-10-07",
    estado: "En revisión",
  },
  {
    id: "456",
    studentName: "Carlos Rodríguez",
    studentId: "20195678",
    courseCode: "INF101",
    section: "A",
    fechaEmision: "2025-09-13",
    fechaInicio: "2025-09-15",
    fechaFin: "2025-09-20",
    estado: "Aceptada",
  },
  {
    id: "789",
    studentName: "Ana Martínez",
    studentId: "20221122",
    courseCode: "DER201",
    section: "B",
    fechaEmision: "2025-10-01",
    fechaInicio: "2025-10-03",
    fechaFin: "2025-10-05",
    estado: "Rechazada",
  },
];

function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfeLicencias() {
  const { user } = useAuth();
  const [items, setItems] = useState([]); // licencias
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros y paginación
  const [filterCourse, setFilterCourse] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Simula fetch y usa mockLicencias para que los filtros funcionen inmediatamente
    let mounted = true;
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      if (!mounted) return;
      // En producción sustituir por fetch("/profesores/licencias?periodo=activo")
      setItems(mockLicencias);
      setLoading(false);
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [user?.id]);

  // Camino de cursos únicos para filtro
  const courseOptions = useMemo(() => {
    const setC = new Set();
    items.forEach((it) => {
      const key = `${it.courseCode || "UNK"} - ${it.section || "?"}`;
      setC.add(key);
    });
    return Array.from(setC).sort();
  }, [items]);

  // filtro + búsqueda + fecha
  const filtered = useMemo(() => {
    let out = items.slice();

    if (filterCourse) {
      out = out.filter((it) => {
        const key = `${it.courseCode || "UNK"} - ${it.section || "?"}`;
        return key === filterCourse;
      });
    }

    if (filterDate) {
      // filtrar por fecha de emisión o inicio (adapta según necesidad)
      out = out.filter(
        (it) => it.fechaEmision === filterDate || it.fechaInicio === filterDate
      );
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      out = out.filter(
        (it) =>
          String(it.studentName || "").toLowerCase().includes(s) ||
          String(it.studentId || "").toLowerCase().includes(s)
      );
    }

    // ordenar por fecha inicio descendente
    out.sort((a, b) => {
      const da = new Date(a.fechaInicio || 0).getTime();
      const db = new Date(b.fechaInicio || 0).getTime();
      return db - da;
    });

    return out;
  }, [items, filterCourse, filterDate, searchTerm]);

  // paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
      <Navbar />

      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl">
          <div className="mb-8 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Licencias — Mis cursos</h1>
                  <p className="text-gray-600 mt-2">
                    Visualiza las licencias presentadas por los estudiantes de tus ramos en el periodo activo.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4 flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <label htmlFor="filterCourse" className="text-sm text-gray-600">Ramo</label>
                  <select
                    id="filterCourse"
                    value={filterCourse}
                    onChange={(e) => { setFilterCourse(e.target.value); setPage(1); }}
                    className="border border-gray-200 bg-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                  >
                    <option value="">Todos</option>
                    {courseOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="filterDate" className="text-sm text-gray-600">Fecha</label>
                  <div className="relative">
                    <input
                      id="filterDate"
                      type="date"
                      value={filterDate}
                      onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                      className="pl-9 pr-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                    />
                    <Calendar className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="searchTerm" className="text-sm text-gray-600">Buscar</label>
                  <div className="relative">
                    <input
                      id="searchTerm"
                      type="text"
                      placeholder="Alumno o legajo"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                      className="pl-9 pr-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                    />
                    <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="ml-auto hidden sm:flex items-center gap-2">
                  <div className="text-sm text-gray-600">Mostrando</div>
                  <div className="font-semibold text-gray-800">{filtered.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Estudiante</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Ramo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Fechas</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-5"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                        <td className="px-6 py-5"><div className="h-4 bg-gray-200 rounded w-40" /></td>
                        <td className="px-6 py-5"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                        <td className="px-6 py-5"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                        <td className="px-6 py-5 text-center"><div className="h-8 w-24 bg-gray-200 rounded mx-auto" /></td>
                      </tr>
                    ))
                  ) : paged.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                          <Clock className="h-12 w-12 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-700 mb-2">No hay licencias</h2>
                        <p className="text-gray-500">No se encontraron licencias para los filtros seleccionados.</p>
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
                        <tr key={lic.id} className="hover:bg-blue-50 transition-colors duration-200">
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
                              className={`px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full border ${
                                lic.estado === "Aceptada" || lic.estado === "validated"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : lic.estado === "Rechazada" || lic.estado === "rejected"
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                              }`}
                            >
                              {lic.estado}
                            </span>
                          </td>

                          <td className="px-6 py-5 whitespace-nowrap text-center">
                            <Link
                              to={`/detalle-licencia/${lic.id}`}
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

            {/* Paginacion */}
            {!loading && paged.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-gray-600">
                  Página {page} de {totalPages}
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