import React from "react";
import bannerImg from "../assets/banner-inicio.png";

const BannerSection = () => (
  <section className="relative bg-gradient-to-r from-blue-500 to-blue-400 rounded-b-lg shadow-md overflow-hidden min-h-[260px] flex flex-col justify-center">
    <img
      src={bannerImg}
      alt="Licencia Médica"
      className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-30 pointer-events-none"
    />
    <div className="relative z-10 px-8 py-12 md:py-20 max-w-4xl">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
        Gestión de licencias<br />medicas
      </h1>
      <div className="flex flex-col md:flex-row gap-4 mt-8">
        <button className="bg-white text-blue-700 font-semibold px-6 py-3 rounded shadow hover:bg-blue-50 transition flex items-center gap-2">
          <span>¿Cómo se usa?</span>
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button className="bg-white text-blue-700 font-semibold px-6 py-3 rounded shadow hover:bg-blue-50 transition flex items-center gap-2">
          <span>Generar Revisión</span>
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button className="bg-white text-blue-700 font-semibold px-6 py-3 rounded shadow hover:bg-blue-50 transition flex items-center gap-2">
          <span>Verificar Resultados</span>
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </section>
);

export default BannerSection;