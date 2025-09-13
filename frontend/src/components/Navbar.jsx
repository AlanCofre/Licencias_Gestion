import React from "react";

const Navbar = () => (
  <nav className="bg-blue-800 text-white px-6 py-3 flex items-center justify-between shadow">
    <div className="flex items-center space-x-8">
      <span className="text-2xl font-bold tracking-wide">MedManager</span>
      <ul className="flex space-x-6 text-lg">
        <li><a href="#" className="hover:underline">Inicio</a></li>
        <li><a href="#" className="hover:underline">Pendientes</a></li>
        <li><a href="#" className="hover:underline">Revisadas</a></li>
        <li><a href="#" className="hover:underline">Verificadas</a></li>
      </ul>
    </div>
    <div className="flex items-center space-x-2">
      <span className="font-semibold">Usuario:</span>
      <span>Juan Pérez</span>
      <button className="ml-2 text-white hover:text-blue-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
        </svg>
      </button>
    </div>
  </nav>
);

export default Navbar;