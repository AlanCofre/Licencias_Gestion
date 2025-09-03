import Navbar from "../components/Navbar";

export default function ComoUsar() {
  return (
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">¿Cómo usar el gestor de licencias?</h2>
        <p className="text-gray-700">
          1. Inicia sesión <br />
          2. Sube tu licencia médica <br />
          3. Espera la verificación automática
        </p>
      </div>
    </div>
  );
}
