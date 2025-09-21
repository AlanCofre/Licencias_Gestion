import React from "react";
import BannerSection from "../components/BannerSection";
import SummaryCards from "../components/SummaryCards";
import Announcement from "../components/Announcement";

export default function Dashboard() {
  // si luego conectas con backend, reemplaza los valores estáticos por datos reales
  const totals = { pendientes: 4, revisadas: 10, verificadas: 6 };
  const lastLicense = { type: "Licencia médica (7 días)", date: "2025-08-12" };

  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <BannerSection />
      <SummaryCards totals={totals} lastLicense={lastLicense} />
      <Announcement />
    </div>
  );
}