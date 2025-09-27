import React from "react";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="bg-[#048FD4]  text-white text-sm py-6 mt-auto"
      aria-label="Información de contacto y soporte"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          {/* Contact info */}
          <div className="text-center lg:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-medium">¿Necesitas ayuda?</span>
              <span className="text-white/90">Contacta nuestro soporte:</span>
            </div>
          </div>

          {/* Contact methods */}
          <div className="text-center lg:text-right">
            <div className="flex flex-col sm:flex-row sm:justify-center lg:justify-end gap-3 items-center">
              <a
                href="mailto:Soporte@MedLeaveManager.com"
                className="inline-flex items-center gap-2 underline hover:text-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 rounded px-2 py-1"
                aria-label="Enviar correo a soporte"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Soporte@MedLeaveManager.com
              </a>

              <a
                href="tel:+56123456789"
                className="inline-flex items-center gap-2 underline hover:text-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 rounded px-2 py-1"
                aria-label="Llamar a soporte"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                +56 123 456 789
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-white/70">
            © 2025 MedManager. Sistema de gestión de licencias médicas.
          </p>
        </div>
      </div>
    </footer>
  );
}