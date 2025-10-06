import React, { useState } from "react";
import bannerLogin from "../assets/banner-login.png";
import { useNavigate } from "react-router-dom";

function AppRegistro() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (contrasena !== confirmar) {
      setMensaje("Las contraseñas no coinciden");
      return;
    }

    try {
      const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const res = await fetch(`${base}/usuarios/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          correo_usuario: correo,
          contrasena,
          rol: "estudiante", // fijo por defecto
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // redirigir al login tras registro exitoso
        navigate("/login");
      } else {
        setMensaje(data.error || "Error al registrar usuario");
      }
    } catch (error) {
      setMensaje("Error de conexión con el servidor");
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-start py-12">
      {/* Fondo */}
      <img
        src={bannerLogin}
        alt="Fondo"
        className="fixed inset-0 w-full h-full object-cover z-0"
      />

      {/* Título principal */}
      <h1 className="relative z-10 text-white text-center text-[clamp(2rem,8vw,8rem)] drop-shadow-[0_8px_9px_rgba(0,0,0,0.5)] mb-12 font-extrabold">
        MedManager
      </h1>

      {/* Contenedor de registro */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-[90%] max-w-[50.25rem] bg-white rounded-lg shadow-md py-5 flex flex-col gap-10 items-center justify-center border-white border-30"
      >
        <h2 className="text-3xl font-semibold text-black text-center">Registro</h2>

        <div className="flex flex-col w-full px-10 gap-4">
          <div>
            <label className="block text-black font-normal mb-2">Nombre y Apellido:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre y apellido"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">Correo Electrónico:</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingresa tu correo electrónico"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">Contraseña:</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Ingresa tu contraseña"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">Confirmar Contraseña:</label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Ingresa tu contraseña otra vez"
              className="w-full bg-[#95B5C4] rounded-md border-none p-4 text-black"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-3/5 h-14 bg-[#00AAFF] text-white text-xl font-semibold rounded-md shadow-md hover:brightness-110 transition self-center"
        >
          Registrarse
        </button>

        {mensaje && <p className="text-center text-red-600">{mensaje}</p>}
      </form>

      {/* Link a login */}
      <div className="relative z-10 mt-10 text-center text-black text-base">
        <span>¿Ya tienes una cuenta? </span>
        <span
          className="text-[#76F1FF] font-bold cursor-pointer hover:underline"
          onClick={() => navigate("/login")}
        >
          Inicia sesión aquí.
        </span>
      </div>
    </div>
  );
}

export default AppRegistro;
