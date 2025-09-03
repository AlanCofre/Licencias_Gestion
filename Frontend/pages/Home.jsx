import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Gestión de licencias médicas</h2>
        <p className="text-gray-700">
          La nueva manera de verificar tus licencias médicas de forma rápida y segura.
        </p>
      </div>
    </div>
  );
}
