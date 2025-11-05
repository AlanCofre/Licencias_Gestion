import React, { useState } from "react";
import bannerLogin from "../assets/banner-login.png";
import logo from "../assets/logo.svg"; 
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function AppRegistro() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (contrasena !== confirmar) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);
      const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
      const res = await fetch(`${base}/usuarios/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          correo_usuario: correo,
          contrasena,
          rol: "estudiante",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Usuario creado correctamente");
        navigate("/login");
      } else {
        toast.error(data.error || "Error al registrar usuario");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center py-12">
      <img
        src={bannerLogin}
        alt="Fondo"
        className="fixed inset-0 w-full h-full object-cover z-0"
      />

      <div className="relative z-10 flex w-[90%] max-w-[50rem] bg-white rounded-lg shadow-md overflow-hidden">
        {/* Logo */}
        <div className="hidden md:flex md:w-1/3 bg-[#00AAFF] flex-col items-center justify-center p-6">
          <img src={logo} alt="Logo" className="w-38 h-auto" />
          <span className="text-white text-4xl font-bold mt-3 text-center">MedManager</span>
        </div>

        {/* Formulario */}
        <div className="w-full md:w-2/3 p-8 flex flex-col gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-black text-center mb-4">
            Registro
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-black font-medium mb-1 text-sm">Nombre y Apellido:</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ingresa tu nombre y apellido"
                className="w-full bg-[#E0F2FF] rounded-md p-3 text-black text-sm"
              />
            </div>

            <div>
              <label className="block text-black font-medium mb-1 text-sm">Correo Electrónico:</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="Ingresa tu correo electrónico"
                className="w-full bg-[#E0F2FF] rounded-md p-3 text-black text-sm"
              />
            </div>

            <div>
              <label className="block text-black font-medium mb-1 text-sm">Contraseña:</label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full bg-[#E0F2FF] rounded-md p-3 text-black text-sm"
              />
            </div>

            <div>
              <label className="block text-black font-medium mb-1 text-sm">Confirmar Contraseña:</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Ingresa tu contraseña otra vez"
                className="w-full bg-[#E0F2FF] rounded-md p-3 text-black text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#00AAFF] text-white text-sm font-semibold rounded-md shadow-md hover:brightness-110 mt-2"
            >
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </form>

          <div className="mt-4 text-center text-black text-sm">
            <span>¿Ya tienes una cuenta? </span>
            <span
              className="text-[#76F1FF] font-bold cursor-pointer hover:underline"
              onClick={() => navigate("/login")}
            >
              Inicia sesión aquí.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppRegistro;
