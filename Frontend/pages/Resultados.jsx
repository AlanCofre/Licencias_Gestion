import Navbar from "../components/Navbar";

export default function Resultados() {
  return (
    <div>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Verificación de resultados</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-blue-100">
              <th className="p-2 border">Licencia</th>
              <th className="p-2 border">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border">12345</td>
              <td className="p-2 border text-green-600 font-bold">Aprobada</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
