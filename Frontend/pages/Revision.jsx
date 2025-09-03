import Navbar from "../components/Navbar";

export default function Revision() {
  return (
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Generar revisión de licencia</h2>
        <div className="flex gap-4">
          <input type="text" placeholder="Nombre médico" className="px-4 py-2 border rounded w-1/3" />
          <input type="date" className="px-4 py-2 border rounded w-1/3" />
          <input type="file" className="px-4 py-2 border rounded w-1/3" />
        </div>
        <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Enviar</button>
      </div>
    </div>
  );
}
