import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="bg-gradient-to-b from-blue-700 to-blue-800 text-white shadow-md" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 rounded-sm p-1" 
              aria-label="MedManager - Ir al inicio"
              onClick={closeMenu}
            >
              <span className="text-2xl font-bold tracking-wide font-display">MedManager</span>
            </Link>
          </div>

          {/* Navigation desktop */}
          <nav 
            className="hidden md:flex flex-1 justify-center" 
            role="navigation" 
            aria-label="Navegación principal"
          >
            <ul className="flex gap-8 text-sm font-medium items-center">
              <li>
                <Link 
                  to="/" 
                  className="px-3 py-2 hover:bg-white/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link 
                  to="/pendientes" 
                  className="px-3 py-2 hover:bg-white/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800"
                >
                  Pendientes
                </Link>
              </li>
              <li>
                <Link 
                  to="/revisadas" 
                  className="px-3 py-2 hover:bg-white/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800"
                >
                  Revisadas
                </Link>
              </li>
              <li>
                <Link 
                  to="/verificadas" 
                  className="px-3 py-2 hover:bg-white/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800"
                >
                  Verificadas
                </Link>
              </li>
            </ul>
          </nav>

          {/* User info + mobile menu button */}
          <div className="flex items-center gap-4">
            {/* User info - hidden on small screens */}
            <div className="text-right hidden sm:block">
              <div className="text-xs opacity-90">Usuario</div>
              <div className="font-semibold text-sm">Juan Pérez</div>
            </div>

            {/* Login button - shown on medium+ screens */}
            <Link
              to="/login"
              className="hidden md:inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white text-sm font-medium"
            >
              Iniciar sesión
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <nav 
          id="mobile-menu" 
          className={`md:hidden transition-all duration-200 ease-in-out overflow-hidden ${isOpen ? "max-h-96 pb-4" : "max-h-0"}`}
          aria-label="Navegación móvil"
          role="navigation"
        >
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <Link 
                to="/" 
                className="block px-4 py-3 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset"
                onClick={closeMenu}
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link 
                to="/pendientes" 
                className="block px-4 py-3 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset"
                onClick={closeMenu}
              >
                Pendientes
              </Link>
            </li>
            <li>
              <Link 
                to="/revisadas" 
                className="block px-4 py-3 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset"
                onClick={closeMenu}
              >
                Revisadas
              </Link>
            </li>
            <li>
              <Link 
                to="/verificadas" 
                className="block px-4 py-3 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset"
                onClick={closeMenu}
              >
                Verificadas
              </Link>
            </li>
            <li className="border-t border-white/20 mt-2 pt-2">
              <Link 
                to="/login" 
                className="block px-4 py-3 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset font-medium"
                onClick={closeMenu}
              >
                Iniciar sesión
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}