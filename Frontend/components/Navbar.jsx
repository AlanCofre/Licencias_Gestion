import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center shadow">
      <h1 className="text-xl font-bold">MedLeave Manager</h1>
      <div className="space-x-4">
        <Link to="/home" className="hover:underline">Inicio</Link>
        <Link to="/como-usar" className="hover:underline">Cómo usar</Link>
        <Link to="/revision" className="hover:underline">Generar revisión</Link>
        <Link to="/resultados" className="hover:underline">Resultados</Link>
      </div>
    </nav>
  );
}
