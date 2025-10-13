// src/pages/HistorialLicencias.js
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import samplePDF from "../assets/sample.pdf";

// Mock de licencias procesadas (aceptadas y rechazadas)
const mockHistorial = [
  {
    id: "HIST-001",
    estado: "Aceptada",
    color: "green",
    student: {
      name: "Rumencio González",
      studentId: "20201234",
      faculty: "Ingeniería",
      email: "rgonzalez@alu.uct.cl",
    },
    dates: {
      emissionDate: "2025-09-27",
      submitted: "2025-09-28",
      restStart: "2025-10-01",
      restEnd: "2025-10-07",
      reviewed: "2025-09-29",
    },
    attachment: {
      filename: "certificado_medico.pdf",
      mimetype: "application/pdf",
    },
    comentario: "Licencia válida, documento médico legible.",
  },
  {
    id: "HIST-002",
    estado: "Rechazada",
    color: "red",
    student: {
      name: "Carlos Rodríguez",
      studentId: "20195678",
      faculty: "Ingeniería",
      email: "crodriguez@alu.uct.cl",
    },
    dates: {
      emissionDate: "2025-09-13",
      submitted: "2025-09-14",
      restStart: "2025-09-15",
      restEnd: "2025-09-20",
      reviewed: "2025-09-15",
    },
    attachment: {
      filename: "radiografia.jpg",
      mimetype: "image/jpeg",
    },
    comentario:
      "Documento incompleto, faltan datos del médico tratante. Solicitar reenvío.",
  },
  {
    id: "HIST-003",
    estado: "Aceptada",
    color: "green",
    student: {
      name: "Ana Martínez",
      studentId: "20221122",
      faculty: "Derecho",
      email: "amartinez@alu.uct.cl",
    },
    dates: {
      emissionDate: "2025-10-01",
      submitted: "2025-10-02",
      restStart: "2025-10-03",
      restEnd: "2025-10-05",
      reviewed: "2025-10-04",
    },
    attachment: {
      filename: "receta_medica.pdf",
      mimetype: "application/pdf",
    },
    comentario: "Reposo breve, documentación completa.",
  },
];

function AttachmentView({ file }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!file) {
    return <div className="text-sm text-gray-500">Sin archivo adjunto</div>;
  }

  const { filename, mimetype } = file;
  const isPDF =
    mimetype === "application/pdf" || /\.pdf$/i.test(filename);
  const fileUrl = isPDF ? samplePDF : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex-1">
          <div className="font-medium text-sm">{filename}</div>
          <div className="text-xs text-gray-500">
            {isPDF ? "Documento PDF" : "Imagen"}
          </div>
        </div>
      </div>

      {isPDF ? (
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Previsualizar
          </button>
          <a
            href={fileUrl}
            download={filename}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Descargar
          </a>
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          * Este tipo de archivo no se puede previsualizar
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="relative bg-white w-11/12 h-5/6 rounded-lg overflow-hidden shadow-lg">
            <iframe src={fileUrl} title={filename} className="w-full h-full" />
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-900"
            >
              ✕
            </button>
            <a
              href={fileUrl}
              download={filename}
              className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            >
              Descargar
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistorialLicencias() {
  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const loadLicencias = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLicencias(mockHistorial);
      setLoading(false);
    };

    loadLicencias();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Cargando historial...</p>
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <h1 className="text-2xl font-bold mb-6">Historial de Licencias Médicas</h1>

            {licencias.map((lic) => (
              <div
                key={lic.id}
                className="mb-10 border border-gray-200 rounded-lg p-6 bg-gray-50"
              >
                {/* Estado de la licencia */}
                <div
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white bg-${lic.color}-600 mb-4`}
                >
                  {lic.estado}
                </div>

                {/* Datos del estudiante */}
                <section className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Datos del Estudiante
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Nombre:</strong> {lic.student.name}
                    </div>
                    <div>
                      <strong>Legajo:</strong> {lic.student.studentId}
                    </div>
                    <div>
                      <strong>Facultad:</strong> {lic.student.faculty}
                    </div>
                    <div>
                      <strong>Email:</strong> {lic.student.email}
                    </div>
                  </div>
                </section>

                {/* Fechas de licencia */}
                <section className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Fechas
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Emisión:</strong> {lic.dates.emissionDate}
                    </div>
                    <div>
                      <strong>Enviado:</strong> {lic.dates.submitted}
                    </div>
                    <div>
                      <strong>Inicio reposo:</strong> {lic.dates.restStart}
                    </div>
                    <div>
                      <strong>Fin reposo:</strong> {lic.dates.restEnd}
                    </div>
                    <div className="sm:col-span-2">
                      <strong>Revisado el:</strong> {lic.dates.reviewed}
                    </div>
                  </div>
                </section>

                {/* Archivo adjunto */}
                <section className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Archivo Adjunto
                  </h2>
                  <AttachmentView file={lic.attachment} />
                </section>

                {/* Comentario de revisión */}
                <section>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Comentario del Revisor
                  </h2>
                  <div className="bg-white border p-4 rounded text-sm text-gray-700">
                    {lic.comentario}
                  </div>
                </section>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
