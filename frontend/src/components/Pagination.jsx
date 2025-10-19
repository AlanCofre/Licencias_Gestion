import React from "react";
import { useTranslation } from "react-i18next";

export default function Pagination({ onPrev, onNext }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2 justify-center">
      <button onClick={onPrev} className="px-3 py-1 bg-white border rounded">
        {t("pagination.prev")}
      </button>
      <button onClick={onNext} className="px-3 py-1 bg-white border rounded">
        {t("pagination.next")}
      </button>
    </div>
  );
}