import React from "react";
import { Link } from "react-router-dom";
import bannerImg from "../assets/banner-inicio.png";

const BannerInfo = () => (
  <section className="relative bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-400)] h-[480px] overflow-hidden">
    {/* Imagen de fondo */}
    <div
      className="absolute inset-0 bg-cover bg-right opacity-40 pointer-events-none"
      style={{ backgroundImage: `url(${bannerImg})`, backgroundPosition: "right center" }}
    />

    <div className="relative z-10 h-full flex flex-col justify-between container mx-auto px-8">
        
      {/* Título */}
      <br />
      <div className="pt-20">
        <h1 className="text-5xl md:text-6xl font-display font-bold text-white leading-tight max-w-2xl">
          Verificación de<br />resultados
        </h1>
      </div>

      {/* Botones */}
      <div className="pb-12">
        <div className="flex flex-wrap gap-6 max-w-4xl items-center">

          {/* Volver al inicio */}
          <Link to="/dashboard" className="inline-flex no-underline">
            <button className="bg-white text-gray-700 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 font-sans font-medium">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                {/* Icono casa */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1h-5a1 1 0 01-1-1v-5.25a1 1 0 00-1-1h-4a1 1 0 00-1 1V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
                </svg>
              </div>
              <span>Volver al inicio</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Link>

          {/* ¿Cómo se usa? */}
          <Link to="/como-usar" className="inline-flex no-underline">
            <button className="bg-white text-gray-700 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 font-sans font-medium">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                {/* Icono interrogación */}
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>¿Cómo se usa?</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Link>

          {/* Generar Revisión */}
          <Link to="/generar-revision" className="inline-flex no-underline">
            <button className="bg-white text-gray-700 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 font-sans font-medium">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                {/* Icono documento */}
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span>Generar Revisión</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Link>

        </div>
      </div>
    </div>
  </section>
);

export default BannerInfo;
