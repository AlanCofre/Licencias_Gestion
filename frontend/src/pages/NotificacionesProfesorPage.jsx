// src/pages/profesor/NotificacionesProfesorPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";  // ← CORREGIDO
import Footer from "../components/Footer";  // ← CORREGIDO

export default function NotificacionesProfesorPage() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

  const fetchNotificaciones = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/notificaciones`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          // Filtrar notificaciones relevantes para profesor
          const notifsProfesor = data.data.filter(notif =>
            notif.asunto?.includes('licencia') || 
            notif.contenido?.includes('estudiante') ||
            notif.asunto?.includes('Licencia')
          );
          setNotificaciones(notifsProfesor);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (idNotificacion) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/api/notificaciones/${idNotificacion}/leida`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Actualizar estado local
      setNotificaciones(prev =>
        prev.map(notif =>
          notif.id_notificacion === idNotificacion
            ? { ...notif, leido: 1 }
            : notif
        )
      );
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      const token = localStorage.getItem("token");
      const promises = notificaciones
        .filter(notif => !notif.leido)
        .map(notif =>
          fetch(`${API}/api/notificaciones/${notif.id_notificacion}/leida`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        );

      await Promise.all(promises);
      fetchNotificaciones(); // Recargar
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leido);
  const notificacionesLeidas = notificaciones.filter(n => n.leido);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              to="/profesor"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Volver al dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              Notificaciones
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona las notificaciones de licencias médicas
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex space-x-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header con estadísticas */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Resumen
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {notificacionesNoLeidas.length} no leídas • {notificaciones.length} total
                    </p>
                  </div>
                  {notificacionesNoLeidas.length > 0 && (
                    <button
                      onClick={marcarTodasComoLeidas}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
              </div>

              {/* Notificaciones no leídas */}
              {notificacionesNoLeidas.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      No leídas ({notificacionesNoLeidas.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {notificacionesNoLeidas.map(notificacion => (
                      <NotificacionItem
                        key={notificacion.id_notificacion}
                        notificacion={notificacion}
                        onMarcarLeida={marcarComoLeida}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Notificaciones leídas */}
              {notificacionesLeidas.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Leídas ({notificacionesLeidas.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {notificacionesLeidas.map(notificacion => (
                      <NotificacionItem
                        key={notificacion.id_notificacion}
                        notificacion={notificacion}
                        onMarcarLeida={marcarComoLeida}
                        isLeida={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {notificaciones.length === 0 && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay notificaciones
                  </h3>
                  <p className="text-gray-600">
                    Las notificaciones de licencias médicas aparecerán aquí.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Componente de item de notificación
function NotificacionItem({ notificacion, onMarcarLeida, isLeida = false }) {
  const extractLicenciaId = (contenido) => {
    const match = contenido.match(/licencia\s+#?(\d+)/i);
    return match ? match[1] : null;
  };

  const licenciaId = extractLicenciaId(notificacion.contenido);

  return (
    <div className={`px-6 py-4 ${isLeida ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
              isLeida ? 'bg-gray-300' : 'bg-blue-500'
            }`} />
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                isLeida ? 'text-gray-600' : 'text-gray-900'
              }`}>
                {notificacion.asunto}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {notificacion.contenido}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(notificacion.fecha_envio).toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 ml-4">
          {!isLeida && (
            <button
              onClick={() => onMarcarLeida(notificacion.id_notificacion)}
              className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
            >
              Marcar leída
            </button>
          )}
          {licenciaId && (
            <a
              href={`/profesor/licencias/${licenciaId}`}
              className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
            >
              Ver licencia
            </a>
          )}
        </div>
      </div>
    </div>
  );
}