// frontend/src/components/LicensePreview.jsx
import React, { useState, useEffect } from "react";
import { licenciasService } from "../services/api"; // ← Importar desde tu api.js

export default function LicensePreview({ licenciaId, filename = "licencia.pdf", title = "Documento PDF" }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!licenciaId) {
          setError("ID de licencia no proporcionado");
          setLoading(false);
          return;
        }

        console.log(`📄 Cargando PDF para licencia: ${licenciaId}`);
        const response = await licenciasService.getUrlArchivo(licenciaId);
        
        if (response.url) {
          setPdfUrl(response.url);
          console.log(`✅ PDF cargado: ${response.url}`);
        } else {
          throw new Error("No se recibió URL del documento");
        }
      } catch (err) {
        console.error("❌ Error cargando PDF:", err);
        setError(err.message || "No se pudo cargar el documento PDF");
      } finally {
        setLoading(false);
      }
    };

    cargarPDF();
  }, [licenciaId]);

  if (loading) {
    return (
      <div className="pdf-loading p-6 text-center bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-600">Cargando documento PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-error p-4 text-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-700 font-medium">❌ Error</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
        No hay documento disponible para previsualizar
      </div>
    );
  }

  return (
    <div className="pdf-viewer space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <div className="flex gap-2">
          <a 
            href={pdfUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
          >
            <span>🔍</span> Abrir en nueva pestaña
          </a>
          <a 
            href={pdfUrl} 
            download={filename} 
            className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-1"
          >
            <span>📥</span> Descargar
          </a>
        </div>
      </div>
      
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <iframe 
          title={`PDF-${licenciaId}`} 
          src={pdfUrl} 
          className="w-full h-96"
          style={{ border: 'none' }}
          onError={(e) => {
            console.error("Error cargando iframe PDF:", e);
            setError("Error al mostrar el documento PDF");
          }}
        />
      </div>
    </div>
  );
}