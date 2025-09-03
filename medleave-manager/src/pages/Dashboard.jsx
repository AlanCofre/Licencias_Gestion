export default function Dashboard() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Panel Principal</h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-4 shadow rounded-xl">
          <h3 className="text-lg font-semibold">Licencias Activas</h3>
          <p className="text-gray-600">12 registradas</p>
        </div>
        <div className="bg-white p-4 shadow rounded-xl">
          <h3 className="text-lg font-semibold">Usuarios</h3>
          <p className="text-gray-600">25 registrados</p>
        </div>
        <div className="bg-white p-4 shadow rounded-xl">
          <h3 className="text-lg font-semibold">Historial</h3>
          <p className="text-gray-600">Última actualización: hoy</p>
        </div>
      </div>
    </div>
  );
}
