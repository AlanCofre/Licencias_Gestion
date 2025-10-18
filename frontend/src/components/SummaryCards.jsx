import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Card({title, value, meta, to, colorClass}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between">
      <div>
        <div className={`text-sm font-medium ${colorClass}`}>{title}</div>
        <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
        {meta && <div className="mt-2 text-xs text-gray-500">{meta}</div>}
      </div>
      <div className="mt-4">
        <Link
          to={to}
          className="inline-flex items-center gap-2 text-sm font-medium bg-blue-50 px-3 py-2 rounded hover:bg-blue-100"
        >
          Ver historial
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default function SummaryCards({ totals = {}, lastLicense = null }) {
  // totals: { pendientes, revisadas, verificadas }
  const pend = totals.pendientes ?? 3;
  const rev = totals.revisadas ?? 12;
  const ver = totals.verificadas ?? 5;
  return (
    <section className="container mx-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen rápido</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            title="Pendientes"
            value={pend}
            meta="Por revisar"
            to="/historial?status=pendiente"
            colorClass="text-yellow-600"
          />
          <Card
            title="Revisadas"
            value={rev}
            meta="Revisadas recientemente"
            to="/historial?status=revisada"
            colorClass="text-indigo-600"
          />
          <Card
            title="Verificadas"
            value={ver}
            meta="Validadas"
            to="/historial?status=verificada"
            colorClass="text-green-600"
          />
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">Última licencia</div>
              {lastLicense ? (
                <>
                  <div className="mt-2 text-base font-semibold text-gray-900">{lastLicense.type}</div>
                  <div className="mt-1 text-xs text-gray-500">Fecha: {lastLicense.date}</div>
                </>
              ) : (
                <div className="mt-2 text-base text-gray-700">No hay licencias</div>
              )}
            </div>
            <div className="mt-4">
              <Link
                to="/historial"
                className="inline-flex items-center gap-2 text-sm font-medium bg-blue-50 px-3 py-2 rounded hover:bg-blue-100"
              >
                Ir a historial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StatsCards({ total, todayCount, shown }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
      <div className="bg-yellow-50 p-4 rounded-xl text-center">
        <div>{t("stats.pending", { count: total })}</div>
        {total !== shown && <div className="text-sm text-gray-500 mt-2">{t("stats.showingFiltered", { count: shown })}</div>}
      </div>
      <div className="bg-blue-50 p-4 rounded-xl text-center">
        <div>{t("stats.pendingToday", { count: todayCount })}</div>
      </div>
    </div>
  );
}