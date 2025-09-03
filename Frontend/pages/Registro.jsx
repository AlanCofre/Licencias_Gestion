import { Link } from "react-router-dom";

export default function Registro() {
  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-r from-blue-400 to-blue-700">
      <div className="bg-white p-8 rounded-2xl shadow w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Registro</h2>
        <input type="text" placeholder="Nombre" className="w-full mb-3 px-4 py-2 border rounded" />
        <input type="email" placeholder="Correo" className="w-full mb-3 px-4 py-2 border rounded" />
        <input type="password" placeholder="Contraseña" className="w-full mb-3 px-4 py-2 border rounded" />
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Registrar</button>
        <p className="text-sm mt-4 text-center">
          ¿Ya tienes cuenta? <Link to="/" className="text-blue-600">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
