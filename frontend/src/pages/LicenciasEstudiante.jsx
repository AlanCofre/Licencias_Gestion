import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Eye, Clock, Calendar, Search } from "lucide-react";

export default function LicenciasEstudiante() {
  const [allLicencias, setAllLicencias] = useState([]);
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros & orden
  const [filterDate, setFilterDate] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // helper: normalizar objeto de licencia y formatear fechas (respeta tus cambios)
  const normalizeLicencia = (l) => {
    const id = l.id_licencia;

    // posibles nombres que vienen desde el BE
    const fechaCreacionRaw = l.fecha_creacion;
    const fechaInicioRaw = l.fecha_inicio;
    const fechaFinRaw = l.fecha_fin;
    const estadoRaw = l.estado;

    const pad = (n) => String(n).padStart(2, "0");

    const fmtDate = (d) => {
      if (d === null || d === undefined || d === "") return "";
      const dt = new Date(d);
      if (isNaN(dt)) {
        const s = String(d);
        return s.length >= 10 ? s.slice(0, 10) : s;
      }
      return dt.toISOString().slice(0, 10); // YYYY-MM-DD
    };

    // formato con hora local "YYYY-MM-DD HH:MM"
    const fmtDateTime = (d) => {
      if (d === null || d === undefined || d === "") return "";
      const dt = new Date(d);
      if (isNaN(dt)) return String(d);
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(
        dt.getHours()
      )}:${pad(dt.getMinutes())}`;
    };

    // normalizar estados del BE a etiquetas amigables
    const STATE_MAP = {
      pendiente: "Pendiente",
      aceptado: "Aceptado",
      rechazado: "Rechazado",
    };

    const cleanKey = String(estadoRaw || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quitar tildes
      .replace(/[\s_\-\.]/g, "");

    const estadoNormalized = STATE_MAP[cleanKey] ?? (estadoRaw ? String(estadoRaw) : "");

    return {
      id: String(id),
      // fecha para filtros (YYYY-MM-DD)
      fecha_creacion: fmtDate(fechaCreacionRaw),
      // fecha con hora para mostrar
      fecha_creacionFull: fmtDateTime(fechaCreacionRaw),
      fechaInicioReposo: fmtDate(fechaInicioRaw),
      fechaFinReposo: fmtDate(fechaFinRaw),
      estadoNormalized,
      // mantener campo original por si hace falta
      _raw: l,
    };
  };

  useEffect(() => {
    const cargarLicencias = async () => {
      setLoading(true);
      try {
        const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/api/licencias`, {
          headers: {
            "Accept": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.warn('Error al obtener licencias:', json);
          setAllLicencias([]);
          setLicencias([]);
        } else {
          const arr = Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.licencias)
            ? json.licencias
            : Array.isArray(json)
            ? json
            : [];

          // normalizar y formatear las fechas antes de guardar en estado
          const normalized = arr.map(normalizeLicencia);
          setAllLicencias(normalized);
          setLicencias(normalized);
        }
      } catch (e) {
        console.error('❌ cargarLicencias error:', e);
        setAllLicencias([]);
        setLicencias([]);
      } finally {
        setLoading(false);
      }
    };
    cargarLicencias();
  }, []);

  // opciones dinámicas de estados según lo que trae el BE (normalizado)
  const estadosUnicos = useMemo(() => {
    const s = new Set(allLicencias.map((x) => x.estadoNormalized).filter(Boolean));
    return Array.from(s).sort();
  }, [allLicencias]);

  useEffect(() => {
    let resultado = [...allLicencias];

    // Filtrar por estado (usar estado normalizado)
    if (filterEstado) {
      resultado = resultado.filter(
        (l) =>
          (l.estadoNormalized || "")
            .toLowerCase()
            .includes(String(filterEstado).toLowerCase())
      );
    }

    // Filtrar por fecha (YYYY-MM-DD)
    if (filterDate) {
      resultado = resultado.filter((l) => l.fecha_creacion === filterDate);
    }

    // Filtrar por búsqueda (por ID)
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      resultado = resultado.filter((l) => (l.id || "").toLowerCase().includes(termLower));
    }

    // Ordenar por fecha_creacion (si no hay fecha, poner al final)
    resultado.sort((a, b) => {
      const da = a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0;
      const db = b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0;
      return sortAsc ? da - db : db - da;
    });

    setLicencias(resultado);
  }, [allLicencias, filterDate, filterEstado, sortAsc, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">Cargando licencias...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 w-full overflow-x-hidden">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Mis Licencias</h1>
                  <p className="text-gray-600 mt-2">Revisa el estado de tus solicitudes</p>
                </div>
              </div>

              {/* Controles de filtro */}
              <div className="mt-6 flex items-center gap-4 flex-wrap justify-center">
                {/* Filtro por fecha */}
                <div className="flex items-center gap-2">
                  <label htmlFor="filterDate" className="text-sm text-gray-600">
                    Fecha (Envíado)  
                  </label>
                  <input
                    id="filterDate"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border border-gray-200 bg-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                  />
                </div>

                {/* Orden asc/desc */}
                <button
                  onClick={() => setSortAsc((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-md border border-gray-200 text-sm font-medium shadow-sm"
                >
                  {sortAsc ? "Ascendente ▲" : "Descendente ▼"}
                </button>

                {/* Filtro por estado (dinámico según BE) */}
                <div className="flex items-center gap-2">
                  <label htmlFor="filterEstado" className="text-sm text-gray-600">
                    Estado
                  </label>
                  <select
                    id="filterEstado"
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    className="border border-gray-200 bg-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                  >
                    <option value="">Todos</option>
                    {estadosUnicos.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botón limpiar */}
                <button
                  onClick={() => {
                    setFilterDate("");
                    setFilterEstado("");
                    setSortAsc(false);
                    setSearchTerm("");
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-md border border-gray-200 text-sm text-gray-600"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          {licencias.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-3">
                No hay licencias registradas
              </h2>
              <p className="text-gray-500 text-lg">
                No se encontraron resultados según tus filtros o búsqueda.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Fechas
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Estado
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {licencias.map((licencia) => (
                      <tr key={licencia.id} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-blue-600">Enviado el:</span>
                              <span className="ml-2">
                                {licencia.fecha_creacionFull || licencia.fecha_creacion || "-"}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-green-600">Inicio reposo:</span>
                              <span className="ml-2">{licencia.fechaInicioReposo || "-"}</span>
                            </div>
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-red-600">Fin reposo:</span>
                              <span className="ml-2">{licencia.fechaFinReposo || "-"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span
                            className={`px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full border ${
                              (licencia.estadoNormalized || "").toLowerCase().includes("acept")
                                ? "bg-green-100 text-green-800 border-green-200"
                                : (licencia.estadoNormalized || "").toLowerCase().includes("rechaz")
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }`}
                          >
                            {licencia.estadoNormalized || "Sin estado"}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <Link
                            to={`/licencia/${licencia.id}`}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalle
                          </Link>
                        </td>
                      </tr>
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
