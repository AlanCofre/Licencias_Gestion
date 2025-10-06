import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Eye, Clock, Calendar, User, GraduationCap, Search } from "lucide-react";

const mockLicenciasRevision = [
  {
    id: "123",
    estudiante: "Rumencio González",
    carrera: "Ingeniería",
    fechaEmision: "2025-09-27",
    fechaEnvio: "2025-09-28",
    fechaInicioReposo: "2025-10-01",
    fechaFinReposo: "2025-10-07",
    estado: "En revisión"
  },
  {
    id: "456",
    estudiante: "Carlos Rodríguez",
    carrera: "Ingeniería",
    fechaEmision: "2025-09-13",
    fechaEnvio: "2025-09-14",
    fechaInicioReposo: "2025-09-15",
    fechaFinReposo: "2025-09-20",
    estado: "En revisión"
  },
  {
    id: "789",
    estudiante: "Ana Martínez",
    carrera: "Derecho",
    fechaEmision: "2025-10-01",
    fechaEnvio: "2025-10-02",
    fechaInicioReposo: "2025-10-03",
    fechaFinReposo: "2025-10-05",
    estado: "En revisión"
  }
];

export default function LicenciasPorRevisar() {
  const [allLicencias, setAllLicencias] = useState([]);
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros & orden
  const [filterDate, setFilterDate] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // búsqueda inline

  useEffect(() => {
    const cargarLicencias = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800)); // simulación
      const licenciasEnRevision = mockLicenciasRevision.filter(
        licencia => licencia.estado === "En revisión"
      );
      setAllLicencias(licenciasEnRevision);
      setLicencias(licenciasEnRevision);
      setLoading(false);
    };
    cargarLicencias();
  }, []);

  useEffect(() => {
    let resultado = [...allLicencias];

    // filtrar por estado
    if (filterEstado) {
      const mapEstado = {
        "por revisar": "En revisión",
        "aceptado": "Aceptado",
        "rechazado": "Rechazado"
      };
      const estadoTarget = mapEstado[filterEstado];
      resultado = resultado.filter(l => l.estado === estadoTarget);
    }

    // filtrar por fecha
    if (filterDate) {
      resultado = resultado.filter(l => l.fechaEmision === filterDate);
    }

    // filtrar por búsqueda (nombre)
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      resultado = resultado.filter(l => l.estudiante.toLowerCase().includes(termLower));
    }

    // ordenar por fechaEmision
    resultado.sort((a, b) => {
      const da = new Date(a.fechaEmision).getTime();
      const db = new Date(b.fechaEmision).getTime();
      return sortAsc ? da - db : db - da;
    });

    setLicencias(resultado);
  }, [allLicencias, filterDate, filterEstado, sortAsc, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 w-full overflow-x-hidden">
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Licencias por Revisar</h1>
                  <p className="text-gray-600 mt-2">Bandeja principal de revisión para secretarios</p>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-800 font-semibold">
                      {licencias.length} En Revisión
                    </span>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 font-semibold">
                      Pendientes Hoy
                    </span>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center">
                    <GraduationCap className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-semibold">
                      Múltiples Carreras
                    </span>
                  </div>
                </div>
              </div>
                {/* Controles: todo en una línea */}
                <div className="mt-6 flex items-center gap-4 flex-wrap justify-center">
                  {/* Filtro fecha */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="filterDate" className="text-sm text-gray-600">Fecha (Emisión)</label>
                    <input
                      id="filterDate"
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="border border-gray-200 bg-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                    />
                  </div>

                  {/* Botón ordenar */}
                  <button
                    onClick={() => setSortAsc(prev => !prev)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-md border border-gray-200 text-sm font-medium shadow-sm"
                  >
                    {sortAsc ? "Ascendente ▲" : "Descendente ▼"}
                  </button>

                  {/* Filtro estado */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="filterEstado" className="text-sm text-gray-600">Estado</label>
                    <select
                      id="filterEstado"
                      value={filterEstado}
                      onChange={(e) => setFilterEstado(e.target.value)}
                      className="border border-gray-200 bg-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#048FD4]"
                    >
                      <option value="">Todos</option>
                      <option value="por revisar">Por revisar</option>
                      <option value="aceptado">Aceptado</option>
                      <option value="rechazado">Rechazado</option>
                    </select>
                  </div>

                  {/* Barra de búsqueda */}
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

                  {/* Botón limpiar */}
                  <button
                    onClick={() => {
                      setFilterDate("");
                      setFilterEstado("");
                      setSortAsc(false);
                      setSearchTerm(""); // limpiar búsqueda
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white rounded-md border border-gray-200 text-sm text-gray-600"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
          </div>

          {/* Tabla o mensaje vacío */}
          {licencias.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-3">
                No hay licencias pendientes
              </h2>
              <p className="text-gray-500 text-lg">
                Todas las licencias han sido procesadas o no hay resultados para los filtros seleccionados.
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
                          <User className="h-4 w-4 mr-2" />
                          Estudiante
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Carrera
                        </div>
                      </th>
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
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full p-2 mr-3">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {licencia.estudiante}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {licencia.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-1 rounded-full inline-block">
                            {licencia.carrera}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm space-y-1">
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-blue-600">Emisión:</span>
                              <span className="ml-2">{licencia.fechaEmision}</span>
                            </div>
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-green-600">Inicio reposo:</span>
                              <span className="ml-2">{licencia.fechaInicioReposo}</span>
                            </div>
                            <div className="flex items-center text-gray-900">
                              <span className="font-medium text-red-600">Fin reposo:</span>
                              <span className="ml-2">{licencia.fechaFinReposo}</span>
                            </div>
                            <div className="flex items-center text-gray-500 text-xs">
                              <span className="font-medium">Enviado:</span>
                              <span className="ml-2">{licencia.fechaEnvio}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="px-3 py-2 inline-flex text-sm leading-5 font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200">
                            <Clock className="h-4 w-4 mr-1" />
                            {licencia.estado}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <Link
                            to={`/evaluar/${licencia.id}`}
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
