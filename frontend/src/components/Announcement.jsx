import React from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import anuncioImg from "../assets/banner-generar.png";

const Announcement = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const role = String(user?.role || "").toLowerCase();
  const isSecretary = role === "secretaria" || role === "secretary";
  const isTeacher = role === "profesor" || role === "teacher";
  const isAdmin = role === "admin" || role === "administrator";

  // usar el nombre que venga del login; anteponer "Sec." si es secretaria
  const rawName = String(user?.name || "").trim();
  const cleanName = rawName.replace(/^Sec\.?\s*/i, "");
  const displayName = isSecretary
    ? cleanName
      ? `${t("announcement.prefixSec")} ${cleanName}`
      : `${t("announcement.prefixSec")} ${t("announcement.userFallback")}`
    : rawName || t("announcement.userFallback");

  return (
    <div className="container mx-auto px-8 py-20">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch">
          <div className="lg:col-span-2 p-16 lg:p-20">
            {isAdmin ? (
              <>
                <h2 className="text-4xl lg:text-5xl font-sans font-bold text-gray-800 mb-6 leading-tight">
                  {t("announcement.adminTitle", { name: displayName })}
                </h2>
                <div className="space-y-6 text-gray-600 leading-relaxed text-xl lg:text-lg font-sans">
                  <p>{t("announcement.adminParagraph1")}</p>
                  <p className="text-base text-gray-500 max-w-xl">
                    {t("announcement.adminParagraph2")}
                  </p>
                </div>
              </>
            ) : isSecretary ? (
              <>
                <h2 className="text-4xl lg:text-5xl font-sans font-bold text-gray-800 mb-6 leading-tight">
                  {t("announcement.secretaryTitle", { name: displayName })}
                </h2>
                <div className="space-y-6 text-gray-600 leading-relaxed text-xl lg:text-lg font-sans">
                  <p>{t("announcement.secretaryParagraph1")}</p>
                  <p className="text-base text-gray-500 max-w-xl">
                    {t("announcement.secretaryParagraph2")}
                  </p>
                </div>
              </>
            ) : isTeacher ? (
              // anuncio específico para profesor
              <>
                <h2 className="text-4xl lg:text-5xl font-sans font-bold text-gray-800 mb-6 leading-tight">
                  {t("announcement.teachTitle", { name: displayName })}
                </h2>
                <div className="space-y-6 text-gray-600 leading-relaxed text-xl lg:text-lg font-sans">
                  <p>{t("announcement.teachParagraph1")}</p>
                  <p className="text-base text-gray-500 max-w-xl">
                    {t("announcement.teachParagraph2")}
                  </p>
                </div>
              </>
            ) : (
              // anuncio para estudiante
              <>
                <h2 className="text-4xl lg:text-5xl font-sans font-bold text-gray-800 mb-6 leading-tight">
                  {t("announcement.userTitleLine1")}
                  <br />
                  {t("announcement.userTitleLine2")}
                </h2>
                <div className="space-y-6 text-gray-600 leading-relaxed text-xl lg:text-lg font-sans">
                  <p>{t("announcement.userParagraph1")}</p>
                  <p className="text-base text-gray-500 max-w-xl">
                    {t("announcement.userParagraph2")}
                  </p>
                </div>
              </>
            )}
          </div>

          <figure className="lg:w-96 lg:col-span-1">
            <div className="w-full h-full bg-gradient-to-r from-white/50 to-[var(--blue-50)] flex items-center">
              <img
                src={anuncioImg}
                alt={t("announcement.altText")}
                className="w-full h-full object-cover min-h-[320px] lg:min-h-[380px]"
              />
            </div>
          </figure>
        </div>
      </div>
    </div>
  );
};

export default Announcement;
