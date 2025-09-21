import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => (
  <header className="bg-gradient-to-b from-[var(--blue-600)] to-[var(--blue-700)] text-white shadow-sm">
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between h-20"> {/* altura mayor */}
        
        {/* Logo a la izquierda */}
        <div className="flex items-center">
          <h1 className="text-2xl font-display font-bold tracking-wide">MedManager</h1>
        </div>
        
        {/* Navegación centrada */}
        <div className="flex-1 flex justify-center">
          <div className="flex space-x-8 text-sm font-medium font-sans">
            <Link to="/" className="hover:underline border-r border-blue-600 pr-4">Inicio</Link>
            <Link to="/pendientes" className="hover:underline border-r border-blue-600 pr-4">Pendientes</Link>
            <Link to="/revisadas" className="hover:underline border-r border-blue-600 pr-4">Revisadas</Link>
            <Link to="/verificadas" className="hover:underline">Verificadas</Link>
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
    </div>
  </header>
);

export default Navbar;
