import React from "react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="bg-[#048FD4] text-white text-sm py-6 mt-auto"
      aria-label={t("footer.contactTitle")}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="text-center lg:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-medium">{t("footer.contactTitle")}</span>
              <span className="text-white/90">{t("footer.contactText")}</span>
            </div>
          </div>

          <div className="text-center lg:text-right">
            <div className="flex flex-col sm:flex-row sm:justify-center lg:justify-end gap-3 items-center">
              <a
                href={`mailto:${t("footer.email")}`}
                className="inline-flex items-center gap-2 underline hover:text-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 rounded px-2 py-1"
                aria-label={t("footer.emailLabel")}
              >
                {t("footer.email")}
              </a>

              <a
                href={`tel:${t("footer.phone")}`}
                className="inline-flex items-center gap-2 underline hover:text-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 rounded px-2 py-1"
                aria-label={t("footer.phoneLabel")}
              >
                {t("footer.phone")}
              </a>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-white/70">{t("footer.copy", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
