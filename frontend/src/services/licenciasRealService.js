// frontend/src/services/licenciasRealService.js
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Helper para requests autenticados
async function authenticatedRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No autenticado");

  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
    config.headers["Content-Type"] = "application/json";
  }

  console.log(`🔍 API Call: ${url}`, config);

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error ${response.status}:`, errorText);
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export const licenciasRealService = {
  // ESTUDIANTE - Historial de licencias
  getMisLicencias: (page = 1, limit = 20) => 
    authenticatedRequest(`/api/licencias/mis-licencias?page=${page}&limit=${limit}`),

  // SECRETARÍA - Licencias pendientes
  getLicenciasPendientes: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return authenticatedRequest(`/api/licencias/en-revision?${params.toString()}`);
  },

  // SECRETARÍA - Licencias resueltas
  getLicenciasResueltas: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return authenticatedRequest(`/api/licencias/resueltas?${params.toString()}`);
  },

  // DETALLE de licencia
  getDetalleLicencia: (idLicencia) => 
    authenticatedRequest(`/api/licencias/${idLicencia}`),

  // PREVISUALIZACIÓN - Obtener URL firmada del PDF
  getUrlArchivo: (idLicencia) => 
    authenticatedRequest(`/api/licencias/${idLicencia}/archivo`)
};