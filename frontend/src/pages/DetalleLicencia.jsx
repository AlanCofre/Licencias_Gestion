import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import samplePDF from "../assets/sample.pdf";

// Mock data de licencias
const mockDatabase = {
  "123": {
    student: {
      name: "Rumencio González",
      studentId: "20201234",
      faculty: "Ingeniería",
      email: "rgonzalez@alu.uct.cl"
    },
    dates: {
      from: "2025-10-01",
      to: "2025-10-07",
      submitted: "2025-09-28",
      emissionDate: "2025-09-27",
      restStart: "2025-10-01",
      restEnd: "2025-10-07"
    },
    attachment: {
      filename: "certificado_medico.pdf",
      mimetype: "application/pdf"
    }
  },
  "456": {
    student: {
      name: "Carlos Rodríguez",
      studentId: "20195678",
      faculty: "Ingeniería",
      email: "crodriguez@alu.uct.cl"
    },
    dates: {
      from: "2025-09-15",
      to: "2025-09-20",
      submitted: "2025-09-14",
      emissionDate: "2025-09-13",
      restStart: "2025-09-15",
      restEnd: "2025-09-20"
    },
    attachment: {
      filename: "radiografia.jpg",
      mimetype: "image/jpeg"
    }
  },
  "789": {
    student: {
      name: "Ana Martínez",
      studentId: "20221122",
      faculty: "Derecho",
      email: "amartinez@alu.uct.cl"
    },
    dates: {
      from: "2025-10-03",
      to: "2025-10-05",
      submitted: "2025-10-02",
      emissionDate: "2025-10-01",
      restStart: "2025-10-03",
      restEnd: "2025-10-05"
    },
    attachment: {
      filename: "receta_medica.pdf",
      mimetype: "application/pdf"
    }
  }
};

function AttachmentView({ file }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!file) return <div className="text-sm text-gray-500">Sin archivo adjunto</div>;

  const { filename, mimetype } = file;
  const isImage = mimetype?.startsWith?.("image/") || /\.(jpg|jpeg|png|gif)$/i.test(filename);
  const isPDF = mimetype === "application/pdf" || /\.pdf$/i.test(filename);
  const fileUrl = isPDF ? samplePDF : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
        <div className="flex-1">
          <div className="font-medium text-sm">{filename}</div>
          <div className="text-xs text-gray-500">
            {isPDF ? "Documento PDF" : isImage ? "Imagen" : "Archivo adjunto"}
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

export default function LicenciaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLicense = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockData = mockDatabase[id] || mockDatabase["123"];
      setLicense({ id: id || "123", ...mockData });
      setLoading(false);
    };
    loadLicense();
  }, [id]);

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

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">Detalle de Licencia</h1>
                <p className="text-gray-500">ID: {license.id}</p>
              </div>
              <button 
                onClick={() => navigate("/mis-licencias")}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors self-start sm:self-auto"
              >
                ← Volver a Licencias
              </button>
            </div>

            {/* Datos del estudiante */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Datos del Estudiante</h2>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Nombre:</span>
                    <span className="text-gray-900">{license.student.name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Legajo:</span>
                    <span className="text-gray-900">{license.student.studentId}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Facultad:</span>
                    <span className="text-gray-900">{license.student.faculty}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="text-gray-900">{license.student.email}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Datos de la licencia */}
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Datos de la Licencia</h2>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Fecha de emisión:</span>
                    <span className="text-gray-900">{license.dates.emissionDate}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Fecha enviada:</span>
                    <span className="text-gray-900">{license.dates.submitted}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Inicio de reposo:</span>
                    <span className="text-gray-900">{license.dates.restStart}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-600">Fin de reposo:</span>
                    <span className="text-gray-900">{license.dates.restEnd}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Archivo adjunto */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Archivo Adjunto</h2>
              <div className="border rounded-lg p-4">
                <AttachmentView file={license.attachment} />
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
