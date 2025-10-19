import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  GraduationCap,
  Search,
  Eye,
} from "lucide-react";

// Mock con licencias ya procesadas
const mockHistorialLicencias = [
  {
    id: "H001",
    estudiante: "Rumencio González",
    carrera: "Ingeniería",
    fechaEmision: "2025-09-27",
    fechaEnvio: "2025-09-28",
    fechaInicioReposo: "2025-10-01",
    fechaFinReposo: "2025-10-07",
    fechaRevision: "2025-09-29",
    estado: "Verificada",
    comentario: "Licencia válida, documento médico legible.",
  },
  {
    id: "H002",
    estudiante: "Carlos Rodríguez",
    carrera: "Ingeniería",
    fechaEmision: "2025-09-13",
    fechaEnvio: "2025-09-14",
    fechaInicioReposo: "2025-09-15",
    fechaFinReposo: "2025-09-20",
    fechaRevision: "2025-09-15",
    estado: "Rechazada",
    comentario: "Documento incompleto. Faltan datos del médico tratante.",
  },
  {
    id: "H003",
    estudiante: "Ana Martínez",
    carrera: "Derecho",
    fechaEmision: "2025-10-01",
    fechaEnvio: "2025-10-02",
    fechaInicioReposo: "2025-10-03",
    fechaFinReposo: "2025-10-05",
    fechaRevision: "2025-10-04",
    estado: "Verificada",
    comentario: "Reposo breve, documentación completa.",
  },
];

export default function HistorialLicencias() {
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros & orden (añadidos)
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const cargarLicencias = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800)); // simulación de carga
      setLicencias(mockHistorialLicencias);
      setLoading(false);
    };
    cargarLicencias();
  }, []);

  // Aplicar filtros: búsqueda por nombre (searchTerm), filtro por estado y fecha, y orden
  const licenciasFiltradas = licencias
    .filter((l) =>
      !searchTerm ? true : l.estudiante.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((l) => (!filterEstado ? true : l.estado === filterEstado))
    .filter((l) => (!filterDate ? true : l.fechaEmision === filterDate))
    .sort((a, b) => {
      const da = new Date(a.fechaEmision).getTime();
      const db = new Date(b.fechaEmision).getTime();
      return sortAsc ? da - db : db - da;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">Cargando historial...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Historial de Licencias Médicas
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Registros de licencias verificadas y rechazadas
                  </p>
                </div>
              </div>

              {/* Controles: búsqueda + filtros */}
              <div className="mt-6 flex items-center gap-4 flex-wrap justify-center">

                {/* Filtro por fecha (emisión) */}
                <div className="flex items-center gap-2">
                  <label htmlFor="filterDate" className="text-sm text-gray-600">
                    Fecha (Emisión)
                  </label>
                  <input
                    id="filterDate"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border border-gray-200 bg-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                  />
                </div>
                {/* Ordenar */}
                <button
                  onClick={() => setSortAsc((p) => !p)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-md border border-gray-200 text-sm font-medium shadow-sm"
                >
                  {sortAsc ? "Ascendente ▲" : "Descendente ▼"}
                </button>

                {/* Filtro por estado */}
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
                    <option value="Verificada">Verificada</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                </div>

                {/* Buscar por estudiante (barra) */}
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex items-center w-full max-w-xs bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2"
                >
                  <Search className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por estudiante..."
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  />
                </form>

                {/* Limpiar */}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSortAsc(false);
                    setFilterDate("");
                    setFilterEstado("");
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-md border border-gray-200 text-sm text-gray-600"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          {licenciasFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-3">
                No hay registros en el historial
              </h2>
              <p className="text-gray-500 text-lg">
                No se encontraron licencias según los filtros.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Estudiante
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Carrera
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <Calendar className="h-4 w-4 mr-2" />
                        Fechas
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Detalle
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {licenciasFiltradas.map((lic) => (
                      <tr
                        key={lic.id}
                        className="hover:bg-blue-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full p-2 mr-3">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {lic.estudiante}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {lic.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-1 rounded-full inline-block">
                            {lic.carrera}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm space-y-1">
                          <div>
                            <span className="font-medium text-blue-600">
                              Emisión:
                            </span>{" "}
                            {lic.fechaEmision}
                          </div>
                          <div>
                            <span className="font-medium text-green-600">
                              Inicio:
                            </span>{" "}
                            {lic.fechaInicioReposo}
                          </div>
                          <div>
                            <span className="font-medium text-red-600">
                              Fin:
                            </span>{" "}
                            {lic.fechaFinReposo}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {lic.estado === "Verificada" ? (
                            <span className="px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verificada
                            </span>
                          ) : (
                            <span className="px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazada
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <button
                            onClick={() => navigate(`/licencias-evaluadas/${lic.id}`)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalle
                          </button>
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
