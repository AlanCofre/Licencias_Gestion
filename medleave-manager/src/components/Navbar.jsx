export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold">Gestión de Licencias</h1>
      <ul className="flex gap-6">
        <li><a href="#" className="hover:text-gray-200">Inicio</a></li>
        <li><a href="#" className="hover:text-gray-200">Licencias</a></li>
        <li><a href="#" className="hover:text-gray-200">Usuarios</a></li>
      </ul>
    </nav>
  );
}
