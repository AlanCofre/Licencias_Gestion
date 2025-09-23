import React from "react";

const Footer = () => (
  <footer className="bg-[var(--blue-800)] text-white text-sm py-6 mt-8">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row md:justify-between items-center gap-2">
        <div className="text-center md:text-left text-white/90">
          ¿Necesitas ayuda? Contacta nuestro soporte:
        </div>
        <div className="text-center md:text-right">
          <a
            href="mailto:Soporte@MedLeaveManager."
            className="underline hover:text-blue-200"
          >
            Soporte@MedLeaveManager.
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;