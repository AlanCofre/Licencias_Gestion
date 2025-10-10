import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // agregar useLocation
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useConfirmReset } from "../hooks/usePasswordReset"; // agregado

export default function ResetPassword() {
  const location = useLocation();
  const prefilledEmail = location?.state?.email || "";
  const [email, setEmail] = useState(prefilledEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLocal, setLoadingLocal] = useState(false);
  const navigate = useNavigate();

  const { confirmReset } = useConfirmReset();

  const handleReset = async () => {
    if (!email || !code || !password) {
      alert("Completa todos los campos.");
      return;
    }

    try {
      setLoadingLocal(true);
      await confirmReset(email, code, password);
      alert("Tu contraseña fue restablecida correctamente.");
      navigate("/login");
    } catch (err) {
      alert(err?.message || "No se pudo restablecer la contraseña.");
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Restablecer contraseña
          </h2>
          <p className="text-gray-600 mb-6">
            Ingresa el código que recibiste y tu nueva contraseña.
          </p>

          {/* permitir editar el email si no vino prellenado */}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Código de verificación"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleReset}
            disabled={loadingLocal}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              loadingLocal
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loadingLocal ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
