import React, { useState, useRef, useEffect } from "react";
import i18n from "../i18";
import { useTranslation } from "react-i18next";
import {
  UserIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  XMarkIcon,
  CursorArrowRaysIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { useAccessibility } from "../context/AccessibilityContext";

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState(
    () =>
      localStorage.getItem("lang") ||
      (navigator.language?.startsWith("en") ? "en" : "es")
  );
  const { t } = useTranslation();
  const {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    largeCursor,
    toggleLargeCursor,
    darkMode,
    toggleDarkMode,
  } = useAccessibility();
  const widgetRef = useRef(null);

  // sincroniza idioma
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
    i18n.changeLanguage(lang);
  }, [lang]);

  // cerrar si se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleLanguage = () => {
    const newLang = lang === "es" ? "en" : "es";
    setLang(newLang);
    i18n.changeLanguage(newLang);
  };

  const getFontSizeLabel = () => {
    const labels = {
      small: t("acces.small"),
      normal: t("acces.normal"),
      large: t("acces.large"),
      "extra-large": t("acces.extraLarge"),
    };
    return labels[fontSize] || t("acces.normal");
  };

  // estilos base
  const baseButton = {
    flex: 1,
    padding: "6px 8px",
    fontSize: "13px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    backgroundColor: "#f3f4f6",
    color: "#1f2937",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    transition: "all 0.2s ease",
  };

  const buttonHover = {
    backgroundColor: "#e5e7eb",
    transform: "scale(1.05)",
  };

  return (
    <>
      <div
        ref={widgetRef}
        style={{
          position: "fixed",
          top: "90px",
          right: "16px",
          zIndex: 99999,
        }}
      >
        {/* Botón flotante */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: "52px",
            height: "52px",
            backgroundColor: "#2563eb",
            color: "white",
            borderRadius: "50%",
            border: "none",
            outline: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            WebkitTapHighlightColor: "transparent",
            userSelect: "none",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#1d4ed8";
            e.target.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#2563eb";
            e.target.style.transform = "scale(1)";
          }}
          onFocus={(e) => {
            e.target.style.outline = "none";
            e.target.style.border = "none";
            e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15), 0 0 0 3px rgba(37, 99, 235, 0.3)";
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          }}
          title={t("acces.openMenu")}
          aria-label={t("acces.openMenu")}
        >
          <UserIcon style={{ width: "24px", height: "24px", pointerEvents: "none" }} />
        </button>

        {/* Panel */}
        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: "60px",
              right: "0",
              width: "320px",
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              zIndex: 99999,
              overflow: "hidden",
              maxWidth: "calc(100vw - 32px)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#eff6ff",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontWeight: "600",
                  color: "#1f2937",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "15px",
                }}
              >
                <UserIcon
                  style={{ width: "18px", height: "18px", color: "#2563eb", pointerEvents: "none" }}
                />
                {t("acces.title")}
              </h3>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={toggleLanguage}
                  title={t("acces.langSwitch")}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    backgroundColor: "white",
                    color: "#1f2937",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = "white";
                  }}
                >
                  {lang === "es" ? "ES" : "EN"}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: "4px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.backgroundColor = "#e5e7eb")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.backgroundColor = "transparent")
                  }
                  aria-label={t("acces.closeMenu")}
                >
                  <XMarkIcon
                    style={{ width: "18px", height: "18px", color: "#6b7280", pointerEvents: "none" }}
                  />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div style={{ padding: "14px", maxHeight: "450px", overflowY: "auto" }}>
              {/* Tamaño texto */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: "#f9fafb",
                  marginBottom: "12px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    fontWeight: "500",
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                  }}
                >
                  🔤 {t("acces.textSize")}
                </h4>
                
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {t("acces.current")}:{" "}
                    <span style={{ fontWeight: "500", color: "#2563eb" }}>
                      {getFontSizeLabel()}
                    </span>
                  </span>
                </div>
                
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "6px",
                  }}
                >
                  <button
                    onClick={decreaseFontSize}
                    disabled={fontSize === "small"}
                    title={t("acces.decrease")}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      fontSize: "13px",
                      fontWeight: "500",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      backgroundColor: fontSize === "small" ? "#f3f4f6" : "#f9fafb",
                      color: "#1f2937",
                      cursor: fontSize === "small" ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      if (fontSize !== "small") e.target.style.backgroundColor = "#e5e7eb";
                    }}
                    onMouseOut={(e) => {
                      if (fontSize !== "small") e.target.style.backgroundColor = "#f9fafb";
                    }}
                  >
                    A−
                  </button>
                  
                  <button
                    onClick={resetFontSize}
                    title={t("acces.reset")}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      fontSize: "13px",
                      fontWeight: "500",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      backgroundColor: "#f9fafb",
                      color: "#1f2937",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => (e.target.style.backgroundColor = "#e5e7eb")}
                    onMouseOut={(e) => (e.target.style.backgroundColor = "#f9fafb")}
                  >
                    Normal
                  </button>
                  
                  <button
                    onClick={increaseFontSize}
                    disabled={fontSize === "extra-large"}
                    title={t("acces.increase")}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      fontSize: "13px",
                      fontWeight: "500",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      backgroundColor:
                        fontSize === "extra-large" ? "#f3f4f6" : "#f9fafb",
                      color: "#1f2937",
                      cursor: fontSize === "extra-large" ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      if (fontSize !== "extra-large")
                        e.target.style.backgroundColor = "#e5e7eb";
                    }}
                    onMouseOut={(e) => {
                      if (fontSize !== "extra-large")
                        e.target.style.backgroundColor = "#f9fafb";
                    }}
                  >
                    A+
                  </button>
                </div>
              </div>
              {/* Cursor */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: "#f9fafb",
                  marginBottom: "12px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    fontWeight: "500",
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                  }}
                >
                  <CursorArrowRaysIcon
                    style={{ width: "16px", height: "16px", color: "#374151", pointerEvents: "none" }}
                  />
                  {t("acces.largeCursor")}
                </h4>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  {t("acces.state")}:{" "}
                  <span
                    style={{
                      fontWeight: "500",
                      color: largeCursor ? "#059669" : "#6b7280",
                    }}
                  >
                    {largeCursor
                      ? t("acces.activated")
                      : t("acces.deactivated")}
                  </span>
                </div>

                <button
                  onClick={toggleLargeCursor}
                  style={baseButton}
                  onMouseOver={(e) => Object.assign(e.target.style, buttonHover)}
                  onMouseOut={(e) => Object.assign(e.target.style, baseButton)}
                >
                  {largeCursor
                    ? `${t("acces.disable")} ${t("acces.largeCursor")}`
                    : `${t("acces.enable")} ${t("acces.largeCursor")}`}
                </button>
              </div>

              {/* Modo oscuro */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: "#f9fafb",
                  marginBottom: "12px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    fontWeight: "500",
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                  }}
                >
                  {darkMode ? (
                    <SunIcon
                      style={{ width: "16px", height: "16px", color: "#374151", pointerEvents: "none" }}
                    />
                  ) : (
                    <MoonIcon
                      style={{ width: "16px", height: "16px", color: "#374151", pointerEvents: "none" }}
                    />
                  )}
                  {t("acces.darkMode")}
                </h4>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  {t("acces.state")}:{" "}
                  <span
                    style={{
                      fontWeight: "500",
                      color: darkMode ? "#7c3aed" : "#6b7280",
                    }}
                  >
                    {darkMode
                      ? t("acces.activated")
                      : t("acces.deactivated")}
                  </span>
                </div>

                <button
                  onClick={toggleDarkMode}
                  style={baseButton}
                  onMouseOver={(e) => Object.assign(e.target.style, buttonHover)}
                  onMouseOut={(e) => Object.assign(e.target.style, baseButton)}
                >
                  {darkMode
                    ? `${t("acces.disable")} ${t("acces.darkMode")}`
                    : `${t("acces.enable")} ${t("acces.darkMode")}`}
                </button>
              </div>

              {/* Próximamente */}
              <div
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: "8px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  backgroundColor: "#f9fafb",
                }}
              >
                {t("acces.upcoming")}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "8px 14px",
                backgroundColor: "#f9fafb",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "10px",
                  color: "#6b7280",
                  textAlign: "center",
                }}
              >
                {t("acces.footer")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay móvil */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            zIndex: 99998,
            display: window.innerWidth < 768 ? "block" : "none",
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
