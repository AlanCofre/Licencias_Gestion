// src/components/NotificacionesProfesor.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function NotificacionesProfesor() {
  const { t } = useTranslation();
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

  // Obtener notificaciones del profesor
  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.warn("[NotificacionesProfesor] No hay token disponible");
        return;
      }

      const response = await fetch(`${API}/api/notificaciones`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.ok && Array.isArray(data.data)) {
        // Filtrar notificaciones relevantes para el profesor
        const notifsProfesor = data.data.filter(notif => 
          notif.asunto?.includes('licencia') || 
          notif.asunto?.includes('Licencia') ||
          notif.contenido?.includes('licencia') ||
          notif.contenido?.includes('estudiante')
        );
        setNotificaciones(notifsProfesor);
      } else {
        setNotificaciones([]);
      }
    } catch (err) {
      console.error("❌ Error cargando notificaciones:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificación como leída
  const marcarComoLeida = async (idNotificacion) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/notificaciones/${idNotificacion}/leida`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Actualizar estado local
        setNotificaciones(prev => 
          prev.map(notif => 
            notif.id_notificacion === idNotificacion 
              ? { ...notif, leido: 1 } 
              : notif
          )
        );
      }
    } catch (err) {
      console.error("❌ Error marcando notificación como leída:", err);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    
    // Polling cada 30 segundos para nuevas notificaciones
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  // Notificaciones no leídas
  const notificacionesNoLeidas = notificaciones.filter(n => !n.leido);
  const totalNoLeidas = notificacionesNoLeidas.length;

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-blue-200 rounded w-3/4"></div>
            <div className="h-3 bg-blue-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-800 text-sm">Error cargando notificaciones: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Badge de contador en el banner */}
      {totalNoLeidas > 0 && (
        <div className="bg-white border border-yellow-200 rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-800 font-bold text-sm">
                    {totalNoLeidas}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {totalNoLeidas === 1 
                    ? 'Tienes 1 notificación nueva' 
                    : `Tienes ${totalNoLeidas} notificaciones nuevas`
                  }
                </h3>
                <p className="text-sm text-gray-500">
                  Licencias médicas pendientes de revisión
                </p>
              </div>
            </div>
            <button
              onClick={fetchNotificaciones}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Actualizar
            </button>
          </div>
        </div>
      )}

      {/* Lista de notificaciones no leídas */}
      {notificacionesNoLeidas.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Notificaciones Recientes
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {notificacionesNoLeidas.slice(0, 5).map((notificacion) => (
              <div
                key={notificacion.id_notificacion}
                className="px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {notificacion.asunto}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {notificacion.contenido}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(notificacion.fecha_envio).toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => marcarComoLeida(notificacion.id_notificacion)}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      Marcar leída
                    </button>
                    {/* Enlace a la licencia si está disponible en el contenido */}
                    {notificacion.contenido?.includes('licencia') && (
                      <button
                        onClick={() => {
                          // Extraer ID de licencia del contenido si es posible
                          const licenciaMatch = notificacion.contenido.match(/licencia\s+#?(\d+)/i);
                          if (licenciaMatch) {
                            window.location.href = `/profesor/licencias/${licenciaMatch[1]}`;
                          }
                        }}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                      >
                        Ver licencia
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {notificacionesNoLeidas.length > 5 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => window.location.href = '/profesor/notificaciones'}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas las notificaciones ({notificacionesNoLeidas.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Estado vacío */}
      {notificacionesNoLeidas.length === 0 && notificaciones.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 text-sm">
            ✅ No tienes notificaciones pendientes
          </p>
        </div>
      )}

      {notificaciones.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-sm">
            No hay notificaciones disponibles
          </p>
        </div>
      )}
    </div>
  );
}