import React from "react";

export default function LicensePreview({ file }) {
  if (!file) return <div className="text-sm text-gray-500">Sin archivo adjunto</div>;

  const { url, filename, mimetype } = file;
  const isImage = mimetype?.startsWith?.("image/") || /\.(jpg|jpeg|png|gif)$/i.test(filename);
  const isPDF = mimetype === "application/pdf" || /\.pdf$/i.test(filename);

  return (
    <div className="space-y-3">
      <div className="border rounded overflow-hidden">
        {isPDF ? (
          <iframe title={filename} src={url} className="w-full h-80" />
        ) : isImage ? (
          <img src={url} alt={filename} className="w-full object-contain max-h-80" />
        ) : (
          <div className="p-4 text-sm">{filename}</div>
        )}
      </div>

      <div className="flex gap-2">
        <a href={url} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-600 text-white rounded">Previsualizar</a>
        <a href={url} download={filename} className="px-3 py-2 bg-gray-100 rounded">Descargar</a>
      </div>
    </div>
  );
}// frontend/src/components/LicensePreview.jsx
import React, { useState, useEffect } from "react";
import { licenciasRealService } from "../services/licenciasRealService"; // ← Nuevo servicio

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
        const response = await licenciasRealService.getUrlArchivo(licenciaId);
        
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
        />
      </div>
    </div>
  );
}