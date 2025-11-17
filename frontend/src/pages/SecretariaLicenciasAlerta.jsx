import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AlertaLicenciasAnual from "../components/AlertaLicenciasAnual";
import { useLicenciasporAño } from "../hooks/useLicenciasporAño"; // Ahora es una función normal

export default function SecretariaLicenciasAlerta() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [año, setAño] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setEstudiantes([
        {
          id: 1,
          nombre: "Ana Martínez",
          rut: "12.345.678-9",
          licencias: [
            { id: 1, fecha_emision: "2025-01-15", estado: "validada", tipo: "Médica" },
            { id: 2, fecha_emision: "2025-02-20", estado: "validada", tipo: "Médica" },
            { id: 3, fecha_emision: "2025-03-10", estado: "validada", tipo: "Médica" },
            { id: 4, fecha_emision: "2025-04-05", estado: "validada", tipo: "Médica" },
            { id: 5, fecha_emision: "2025-05-12", estado: "validada", tipo: "Médica" },
            { id: 6, fecha_emision: "2025-06-18", estado: "validada", tipo: "Médica" },
          ],
        },
        {
          id: 2,
          nombre: "Carlos Rodríguez",
          rut: "98.765.432-1",
          licencias: [
            { id: 7, fecha_emision: "2025-01-10", estado: "validada", tipo: "Médica" },
            { id: 8, fecha_emision: "2025-02-15", estado: "validada", tipo: "Médica" },
          ],
        },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  // Calcula todos los datos de una vez (sin hooks dentro)
  const { estudiantesConExceso } = useMemo(() => {
    const resultado = estudiantes.map((est) => {
      const licporAño = useLicenciasporAño(est.licencias); // Ahora es una función normal
      const cantidad = (licporAño[año] || []).length;
      return {
        ...est,
        licporAño,
        cantidad,
        excede: cantidad > 5,
      };
    });

    return {
      estudiantesConExceso: resultado.filter((e) => e.excede),
    };
  }, [estudiantes, año]);

  return (
    <div className="min-h-screen flex flex-col bg-blue-50 dark:bg-app dark:bg-none">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Monitoreo: Estudiantes con Exceso de Licencias</h1>

        <div className="mb-4 flex gap-3">
          <label className="font-medium">Año:</label>
          <select
            value={año}
            onChange={(e) => setAño(parseInt(e.target.value))}
            className="border rounded px-3 py-2"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Cargando...</div>
        ) : estudiantesConExceso.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            ✓ No hay estudiantes que superen el máximo de 5 licencias en {año}.
          </div>
        ) : (
          <div className="space-y-4">
            {estudiantesConExceso.map((est) => (
              <div key={est.id} className="bg-white dark:bg-surface rounded-lg border dark:border-app p-4">
                <div className="flex gap-3 items-start mb-3">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    {est.cantidad}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{est.nombre}</h3>
                    <p className="text-sm text-gray-600 dark:text-muted">RUT: {est.rut}</p>
                  </div>
                </div>
                <AlertaLicenciasAnual licenciasporAño={est.licporAño} año={año} />
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}