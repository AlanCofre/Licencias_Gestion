import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-r from-blue-400 to-blue-700">
      <div className="bg-white p-8 rounded-2xl shadow w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Iniciar sesión</h2>
        <input type="text" placeholder="Usuario" className="w-full mb-3 px-4 py-2 border rounded" />
        <input type="password" placeholder="Contraseña" className="w-full mb-3 px-4 py-2 border rounded" />
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Ingresar</button>
        <p className="text-sm mt-4 text-center">
          ¿No tienes cuenta? <Link to="/registro" className="text-blue-600">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
