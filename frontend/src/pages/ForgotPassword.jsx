import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRequestReset } from "../hooks/usePasswordReset"; // agregado

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [timer, setTimer] = useState(0);
  const [loadingLocal, setLoadingLocal] = useState(false); // local spinner while hook runs
  const navigate = useNavigate();

  const { requestReset, loading, error } = useRequestReset();

  // Temporizador para bloquear reenvío
  useEffect(() => {
    let countdown;
    if (timer > 0) {
      countdown = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(countdown);
  }, [timer]);

  // Función para validar formato de correo
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRequestCode = async () => {
    if (!isValidEmail(email)) {
      alert("Por favor ingresa un correo válido");
      return;
    }

    try {
      setLoadingLocal(true);
      await requestReset(email);
      // El backend imprime el código en la terminal local (dev). Indica al usuario que revise la consola del servidor.
      alert("Si el correo existe, se generó un código. Revisa la consola del servidor para copiarlo en desarrollo.");
      setTimer(60);
      // Pasar email a la ruta de ResetPassword
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      // mostrar mensaje genérico o el error si lo desea
      alert(err?.message || "No se pudo solicitar el código. Intenta más tarde.");
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4">
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recuperar contraseña</h2>
          <p className="text-gray-600 mb-6">
            Ingresa tu correo y te enviaremos un código de verificación para restablecer tu contraseña.
          </p>

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleRequestCode}
            disabled={loadingLocal || timer > 0}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              loadingLocal || timer > 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loadingLocal
              ? "Enviando..."
              : timer > 0
              ? `Reenviar en ${timer}s`
              : "Recuperar contraseña"}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
