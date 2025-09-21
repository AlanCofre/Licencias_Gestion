import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SkeletonList from "../components/SkeletonList";
import Pagination from "../components/Pagination";
import api from "../services/api";

export default function Historial() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const qStatus = search.get("status") || "";
  const qPage = parseInt(search.get("page") || "1", 10);

  const [status, setStatus] = useState(qStatus);
  const [page, setPage] = useState(qPage);
  const [limit] = useState(10);
  const [data, setData] = useState({ items: [], page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // sync state -> URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (page) params.set("page", String(page));
    navigate({ pathname: "/historial", search: params.toString() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    api
      .fetchLicenses({ page, limit, status })
      .then((res) => {
        if (!mounted) return;
        // support different backend shapes
        const items = res.data ?? res.items ?? res;
        const p = res.page ?? res.currentPage ?? page;
        const totalPages = res.totalPages ?? res.lastPage ?? 1;
        const total = res.total ?? (Array.isArray(items) ? items.length : 0);
        setData({ items, page: p, totalPages, total });
      })
      .catch((err) => {
        if (err.status === 403) setError({ code: 403, message: "No tienes permisos para ver esto." });
        else if (err.status === 404) setError({ code: 404, message: "Recurso no encontrado." });
        else setError({ code: err.status || 500, message: err.message || "Error al cargar" });
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [page, limit, status]);

  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <Navbar />
      <main className="container mx-auto px-6 py-12 flex-grow" id="main-content">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Historial</h1>
            <div className="flex gap-3 items-center">
              <select
                value={status}
                onChange={(e) => { setPage(1); setStatus(e.target.value); }}
                className="px-3 py-2 rounded bg-white"
                aria-label="Filtrar por estado"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="revisada">Revisadas</option>
                <option value="verificada">Verificadas</option>
              </select>
            </div>
          </div>

          {loading && <SkeletonList rows={Math.min(5, limit)} />}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded">
              {error.code === 403 ? (
                <div>
                  <strong>403 — Acceso denegado.</strong>
                  <div>{error.message}</div>
                </div>
              ) : (
                <div>
                  <strong>{error.code}</strong>
                  <div>{error.message}</div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                {data.items.length === 0 ? (
                  <div className="text-gray-600">No hay resultados.</div>
                ) : (
                  data.items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between">
                      <div>
                        <Link to={`/licencias/${it.id}`} className="font-semibold text-blue-700 hover:underline">
                          {it.title ?? it.type ?? `Licencia #${it.id}`}
                        </Link>
                        <div className="text-xs text-gray-500">Fecha: {it.date ?? it.created_at}</div>
                      </div>
                      <div className="text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs ${it.status === "pendiente" ? "bg-yellow-100" : it.status === "verificada" ? "bg-green-100" : "bg-indigo-100"}`}>
                          {it.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => setPage(p)} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}