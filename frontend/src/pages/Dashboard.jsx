import React, { useEffect, useState } from "react";
import BannerSection from "../components/BannerSection";
import SummaryCards from "../components/SummaryCards";
import Announcement from "../components/Announcement";
import api from "../services/api";

export default function Dashboard() {
  const [totals, setTotals] = useState({ pendientes: 0, revisadas: 0, verificadas: 0 });
  const [lastLicense, setLastLicense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const allLicenses = await api.fetchLicenses({ limit: 1000 });
        const licenses = allLicenses.data || allLicenses.items || [];

        const calculatedTotals = {
          pendientes: licenses.filter(l => l.status === 'pendiente').length,
          revisadas: licenses.filter(l => l.status === 'revisada').length,
          verificadas: licenses.filter(l => l.status === 'verificada').length
        };

        const sortedLicenses = licenses.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
        const latest = sortedLicenses[0];

        setTotals(calculatedTotals);
        setLastLicense(latest ? {
          type: latest.title || latest.type || `Licencia #${latest.id}`,
          date: latest.date || latest.created_at
        } : null);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-100">
        <BannerSection />
        <main id="main-content" className="container mx-auto px-6 py-8" role="main">
          <div className="animate-pulse bg-white h-48 rounded-lg" />
        </main>
        <Announcement />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-100">
      <BannerSection />
      <main id="main-content" role="main">
        <SummaryCards totals={totals} lastLicense={lastLicense} />
        <Announcement />
      </main>
    </div>
  );
}