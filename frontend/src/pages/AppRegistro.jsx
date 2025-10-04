import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bannerLogin from "../assets/banner-login.png";

function AppRegistro() {
  const navigate = useNavigate(); // ✅ necesario para redirigir
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    setLoading(true);

    // Simulamos un registro exitoso
    setTimeout(() => {
      setLoading(false);
      alert("Registro exitoso.");
      navigate("/login"); 
    }, 1000);
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
      <h1 className="relative z-10 text-white text-center text-[clamp(2rem,8vw,8rem)] drop-shadow-[0_8px_9px_rgba(0,0,0,0.5)] mb-12 font-display font-extrabold">
        MedManager
      </h1>

      {/* Contenedor de login/registro */}
      <div className="relative z-10 w-[90%] max-w-[50.25rem] bg-white rounded-lg shadow-md py-5 flex flex-col gap-10 items-center justify-center border-white border-30">
        <h2 className="text-3xl font-semibold text-black text-center">
          Registro
        </h2>

        <div className="flex flex-col w-full px-10 gap-4">
          <div>
            <label className="block text-black font-normal mb-2">
              Nombre y Apellido:
            </label>
            <input
              type="text"
              placeholder="Ingresa tu nombre y apellido"
              className="w-full bg-gray-100 rounded-md border border-gray-300 p-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">
              Correo Electrónico:
            </label>
            <input
              type="email"
              placeholder="Ingresa tu correo electrónico"
              className="w-full bg-gray-100 rounded-md border border-gray-300 p-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">
              Contraseña:
            </label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              className="w-full bg-gray-100 rounded-md border border-gray-300 p-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-black font-normal mb-2">
              Confirmar Contraseña:
            </label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña otra vez"
              className="w-full bg-gray-100 rounded-md border border-gray-300 p-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className={`w-3/5 h-14 bg-[#00AAFF] text-white text-xl font-semibold rounded-md shadow-md hover:brightness-110 transition self-center ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </div>

      {/* Enlace al login */}
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
