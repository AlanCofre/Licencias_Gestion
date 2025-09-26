import React from "react";
import BannerInfo from "../components/BannerInfo.jsx";
import Footer from "../components/Footer.jsx";

function AppVisualizar() {
  const data = [
    { id: "001", fecha: "2025-09-20", razon: "Enfermedad", estado: "Verificado(X)" },
    { id: "002", fecha: "2025-09-19", razon: "Viaje", estado: "En revisión" },
    { id: "003", fecha: "2025-09-18", razon: "Curso", estado: "Verificado" },
    { id: "004", fecha: "2025-09-17", razon: "Trámite personal", estado: "En revisión" },
  ];

  const getEstadoColor = (estado) => {
    if (estado.includes("Verificado(X)")) return "text-red-600";
    if (estado.includes("En revisión")) return "text-blue-950";
    if (estado.includes("Verificado")) return "text-green-900";
    return "text-black";
  };

  return (
    <div className="w-screen min-h-screen flex flex-col bg-blue-100 overflow-x-hidden">
      {/* Banner */}
      <div className="banner relative w-full h-[500px]">
        <BannerInfo />
      </div>

      {/* Contenedor de tabla */}
      <div className="z-10 w-[90%] max-w-[100rem] bg-white rounded-lg shadow-md flex flex-col gap-6 mx-auto my-10 p-6 border border-white">
        <h2 className="text-3xl md:text-4xl font-medium font-['Work_Sans'] text-left">
          Tabla de resultados
        </h2>
        <p className="text-neutral-500 text-base md:text-xl font-medium font-['Work_Sans'] text-justify">
          En esta tabla encontrarás los resultados de tus documentos enviados en la plataforma, con 3 estados: 
          Pendiente, revisado y verificado.
          <br />
          En caso de que uno de tus documentos haya sido rechazado, contará con una X en la verificación.
        </p>

        {/* Tabla */}
        <div className="w-full bg-white rounded outline outline-1 outline-sky-500">
          {/* Headers */}
          <div className="grid grid-cols-5 bg-sky-700/20 border-b border-sky-500">
            {["N° De Identificación", "Fecha de subida", "Razón de licencia", "Estado", "Documento"].map(
              (header, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2.5 text-black text-base font-semibold font-['Work_Sans'] border-l first:border-l-0 flex items-center"
                >
                  {header}
                </div>
              )
            )}
          </div>

          {/* Filas */}
          {data.map((row, idx) => (
            <div key={idx} className="grid grid-cols-5 border-b border-sky-500">
              <div className="px-3 py-2.5 text-black text-base font-normal font-['Inter'] flex items-center">
                {row.id}
              </div>
              <div className="px-3 py-2.5 text-black text-base font-normal font-['Inter'] flex items-center">
                {row.fecha}
              </div>
              <div className="px-3 py-2.5 text-black text-base font-normal font-['Inter'] flex items-center">
                {row.razon}
              </div>
              <div
                className={`px-3 py-2.5 text-base font-normal font-['Inter'] flex items-center ${getEstadoColor(
                  row.estado
                )}`}
              >
                {row.estado}
              </div>
              <div className="px-3 py-2.5 flex justify-center items-center">
                <button className="bg-sky-500 text-white font-bold px-6 py-2 rounded shadow hover:bg-sky-600 transition">
                  Ver detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default AppVisualizar;
