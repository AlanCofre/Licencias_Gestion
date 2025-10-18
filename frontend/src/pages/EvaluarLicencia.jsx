import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function formatFechaHora(fechaStr) {
  if (!fechaStr) return "";
  const d = new Date(fechaStr);
  if (isNaN(d)) return fechaStr;
  // YYYY-MM-DD HH:MM
  return d.toISOString().slice(0, 16).replace("T", " ");
}
function AttachmentView({ detalle }) {
  // Busca el archivo en el detalle (puede venir como array)
  const file = detalle?.find?.(d => d.ruta_url) || detalle?.[0];
  if (!file || !file.ruta_url) return <div className="text-sm text-gray-500">Sin archivo adjunto</div>;

  const isPDF = file.tipo_mime === "application/pdf" || /\.pdf$/i.test(file.ruta_url);
  const fileUrl = file.ruta_url?.startsWith("http")
    ? file.ruta_url
    : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/licencias/${file.id_licencia}/archivo?token=${localStorage.getItem("token")}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex-1">
          <div className="font-medium text-sm">{file.ruta_url.split("/").pop()}</div>
          <div className="text-xs text-gray-500">
            {isPDF ? "Documento PDF" : file.tipo_mime}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {isPDF ? (
          <>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Previsualizar
            </a>
            <a
              href={fileUrl}
              download
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Descargar
            </a>
          </>
        ) : (
          <a
            href={fileUrl}
            download
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Descargar
          </a>
        )}
      </div>
    </div>
  );
}

export default function EvaluarLicencia() {
  const ROL_MAP = {
  1: "Profesor",
  2: "Estudiante",
  3: "Funcionario"
  };
  const { id } = useParams();
  const navigate = useNavigate();
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [accion, setAccion] = useState(null);

  useEffect(() => {
    setLoading(true);
    setMensaje("");
    const token = localStorage.getItem("token");
    fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/licencias/detalle/${id}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error al obtener detalle");
        setDetalle(data.detalle || []);
      })
      .catch(e => setMensaje(e.message))
      .finally(() => setLoading(false));
  }, [id]);


  const lic = detalle[0] || {};
  const [loadingAccion, setLoadingAccion] = useState(false);

  const decidirLicencia = async (estado) => {
    setMensaje("");
    setAccion(estado);
    const token = localStorage.getItem("token");
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    let body = {
      estado,
      id_usuario: lic.id_usuario, // ID del estudiante dueño de la licencia
    };

    if (estado === "rechazado") {
      body.motivo_rechazo = motivoRechazo;
    }
    if (estado === "aceptado") {
      body.fecha_inicio = lic.fecha_inicio;
      body.fecha_fin = lic.fecha_fin;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/licencias/${id}/decidir`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al decidir licencia");
      setMensaje(`Licencia ${estado === "aceptado" ? "aceptada" : "rechazada"} correctamente`);
      navigate("/licencias-por-revisar");
    } catch (e) {
      setMensaje(e.message);
    } finally {
      setLoadingAccion(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50 w-full overflow-x-hidden">
        <Navbar />
        <main className="flex-1 flex items-center justify-center w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Cargando licencia...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 w-full overflow-x-hidden">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-none">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
            {/* Header con navegación clara */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">Evaluación de Licencia</h1>
                <p className="text-gray-500">ID de licencia: {lic.id}</p>
              </div>
              <button 
                onClick={() => navigate("/licencias-por-revisar")}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors self-start sm:self-auto"
              >
                ← Volver a Bandeja
              </button>
            </div>

            {mensaje && <div className="mb-4 text-center text-red-600">{mensaje}</div>}

            {/* Datos completos del estudiante */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Datos del Estudiante</h2>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Nombre:</span>
                    <span className="text-gray-900">{lic.nombre}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">id_usuario:</span>
                    <span className="text-gray-900">{lic.id_usuario}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Correo:</span>
                    <span className="text-gray-900">{lic.correo_usuario}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Rol:</span>
                    <span className="text-gray-900">{lic.nombre_rol || ROL_MAP[lic.id_rol] || lic.id_rol}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Datos completos de la licencia */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Datos de la Licencia</h2>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Folio:</span>
                    <span className="text-gray-900">{lic.folio}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Fecha de emisión:</span>
                    <span className="text-gray-900">{formatFechaHora(lic.fecha_emision)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Fecha inicio:</span>
                    <span className="text-gray-900">{formatFechaHora(lic.fecha_inicio)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Fecha fin:</span>
                    <span className="text-gray-900">{formatFechaHora(lic.fecha_fin)}</span>

                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Estado:</span>
                    <span className="text-gray-900">{lic.estado}</span>
                  </div>
                  {lic.motivo_rechazo && (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-600">Motivo de rechazo:</span>
                      <span className="text-gray-900">{lic.motivo_rechazo}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Archivo adjunto con opción de previsualización */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Archivo Adjunto</h2>
              <div className="border rounded-lg p-4">
                <AttachmentView detalle={detalle} />
              </div>
            </section>

            {/* Botones para Aceptar y Rechazar */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
              <button
                onClick={() => decidirLicencia("aceptado")}
                className={`flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium cursor-pointer`}
                style={{ cursor: "pointer" }}
                type="button"
              >
                {loadingAccion ? "Procesando..." : "✓ Aceptar Licencia"}
              </button>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Motivo de rechazo (mínimo 10 caracteres)"
                  className="w-full border rounded px-3 py-2"
                  value={motivoRechazo}
                  onChange={e => setMotivoRechazo(e.target.value)}
                />
                <button
                  className={`px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium cursor-pointer`}
                  style={{ cursor: "pointer" }}
                  onClick={() => decidirLicencia("rechazado")}
                  type="button"
                  disabled={motivoRechazo.length < 10}
                >
                  {loadingAccion ? "Procesando..." : "✗ Rechazar Licencia"}
                </button>
              </div>
            </div>

            {/* Información de ayuda */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> Al aceptar o rechazar, podrás agregar comentarios que serán enviados al estudiante.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}