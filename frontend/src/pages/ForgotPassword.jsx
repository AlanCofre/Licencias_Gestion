import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/toast";
import { useRequestReset } from "../hooks/usePasswordReset"; // Asegúrate de que la ruta sea correcta

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [timer, setTimer] = useState(0);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const { requestReset, loading, error } = useRequestReset();

  // Mostrar errores del hook
  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error" });
    }
  }, [error]);

  // Temporizador para bloquear reenvío
  useEffect(() => {
    let countdown;
    if (timer > 0) {
      countdown = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(countdown);
  }, [timer]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRequestCode = async () => {
    if (!isValidEmail(email)) {
      setToast({ message: "Por favor ingresa un correo válido", type: "error" });
      return;
    }

    try {
      const result = await requestReset(email);
      
      setTimer(60);
      setToast({ 
        message: result.message || "Se envió un código a tu correo.", 
        type: "success" 
      });

      // Navega a ResetPassword pasando el email como estado
      setTimeout(() => navigate("/reset-password", { 
        state: { email } 
      }), 1000);
    } catch (err) {
      // El error ya se maneja automáticamente en el hook y se muestra en el useEffect
      console.error("Error al solicitar código:", err);
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
            disabled={loading || timer > 0}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              loading || timer > 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading
              ? "Enviando..."
              : timer > 0
              ? `Reenviar en ${timer}s`
              : "Recuperar contraseña"}
          </button>
        </div>
      </main>

      <Footer />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}