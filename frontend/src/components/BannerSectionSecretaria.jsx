import React from "react";
import bannerImg from "../assets/banner-inicio.png";

const BannerSectionSecretaria = () => (
  <section className="relative bg-gradient-to-r from-blue-500 to-blue-400 h-[450px] overflow-hidden">
    {/* Imagen de fondo */}
    <div 
      className="absolute inset-0 bg-cover bg-center opacity-40"
      style={{
        backgroundImage: `url(${bannerImg})`,
        backgroundPosition: 'right center'
      }}
    />
    
    <div className="relative z-10 h-full flex flex-col justify-between container mx-auto px-8">
      {/* Título arriba */}
      <div className="pt-16">
        <h1 className="text-5xl md:text-6xl font-sans font-bold text-white leading-tight max-w-2xl">
          Gestión de licencias<br />
          medicas
        </h1>
      </div>
      
      {/* Botones específicos para Secretaria */}
      <div className="pb-16">
        <div className="flex flex-wrap gap-6 max-w-4xl">
          <button className="bg-white text-gray-700 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 font-sans font-medium">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>¿Cómo se usa?</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="bg-white text-gray-700 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 font-sans font-medium">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span>Gestionar</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="bg-white text-gray-700 px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 font-sans font-medium">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>Historial</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
);

export default BannerSectionSecretaria;