import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import bannerImg from "../assets/banner-inicio.png";

const BannerSection = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const role = String(user?.role || "").toLowerCase();
  const isSecretary = role === "funcionario" || role === "funcionario";

  return (
    <>
      {/* Banner */}
      <section className="relative bg-gradient-to-r from-[var(--blue-600)] to-[var(--blue-400)] h-[300px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-right opacity-100 pointer-events-none"
          style={{
            backgroundImage: `url(${bannerImg})`,
            backgroundPosition: "right center",
          }}
        />

        <div className="relative z-10 h-full flex flex-col justify-center container mx-auto px-8">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white leading-tight max-w-2xl">
            {t("banner.titleLine1")}
            <br />
            {t("banner.titleLine2")}
          </h1>
        </div>
      </section>

      {/* Botones */}
      <div className="relative z-20 container mx-auto px-8 -mt-7 flex flex-wrap justify-center gap-8">
        {/* Botón: ¿Cómo se usa? */}
        <Link to="/como-usar" className="inline-flex no-underline">
          <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span>{t("banner.btnHowUse")}</span>
            </div>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </Link>

        {/* Botón intermedio (depende del rol) */}
        {isSecretary ? (
          <Link to="/licencias-por-revisar" className="inline-flex no-underline">
            <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span>{t("banner.btnManage")}</span>
              </div>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </Link>
        ) : (
          <Link to="/generar-revision" className="inline-flex no-underline">
            <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span>{t("banner.btnGenerate")}</span>
              </div>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </Link>
        )}

        {/* Botón final (depende del rol) */}
        {isSecretary ? (
          <Link to="/historial" className="inline-flex no-underline">
            <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span>{t("banner.btnHistory")}</span>
              </div>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </Link>
        ) : (
          <Link to="/mis-licencias" className="inline-flex no-underline">
            <button className="bg-white text-gray-700 px-6 py-3 min-w-[260px] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between font-sans font-medium">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span>{t("banner.btnResults")}</span>
              </div>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </Link>
        )}
      </div>
    </>
  );
};

export default BannerSection;
