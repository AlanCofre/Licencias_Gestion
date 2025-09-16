import React from "react";

const NavbarSecretaria = () => (
  <nav className="bg-blue-800 text-white px-8 py-4 flex items-center justify-between shadow-lg">
    {/* Logo a la izquierda */}
    <div className="flex items-center">
      <h1 className="text-2xl font-display font-bold tracking-wide">MedManager</h1>
    </div>
    
    {/* Navegación centrada */}
    <div className="flex-1 flex justify-center">
      <div className="flex space-x-8 text-sm font-medium font-sans">
        <a href="#" className="hover:underline border-r border-blue-600 pr-4">Inicio</a>
        <a href="#" className="hover:underline border-r border-blue-600 pr-4">Pendientes</a>
        <a href="#" className="hover:underline border-r border-blue-600 pr-4">Revisadas</a>
        <a href="#" className="hover:underline">Verificadas</a>
      </div>
    </div>
    
    {/* Usuario Secretaria a la derecha */}
    <div className="flex items-center space-x-4 text-sm font-sans">
      <div className="text-right">
        <div className="text-xs opacity-75">Usuario</div>
        <div className="font-semibold">Sec. Julián Pérez</div>
      </div>
      <button className="bg-blue-700 hover:bg-blue-600 p-2 rounded transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
        </svg>
      </button>
    </div>
  </nav>
);

export default NavbarSecretaria;