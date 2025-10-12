import React, { useState, useRef, useEffect } from "react";
import { 
  UserIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  XMarkIcon,
  CursorArrowRaysIcon,
  MoonIcon,
  SunIcon
} from "@heroicons/react/24/outline";
import { useAccessibility } from "../context/AccessibilityContext";

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    fontSize, 
    increaseFontSize, 
    decreaseFontSize, 
    resetFontSize,
    largeCursor,
    toggleLargeCursor,
    darkMode,
    toggleDarkMode
  } = useAccessibility();
  const widgetRef = useRef(null);

  console.log("AccessibilityWidget renderizando, fontSize:", fontSize, "largeCursor:", largeCursor, "darkMode:", darkMode); // Debug

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Función para obtener el label del tamaño de fuente
  const getFontSizeLabel = () => {
    const labels = {
      small: "Pequeña",
      normal: "Normal", 
      large: "Grande",
      "extra-large": "Extra Grande"
    };
    return labels[fontSize] || "Normal";
  };

  return (
    <>
      {/* Botón flotante con ícono de persona */}
      <div 
        ref={widgetRef}
        style={{
          position: 'fixed',
          top: '90px',
          right: '16px',
          zIndex: 99999
        }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '52px',
            height: '52px',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#1d4ed8';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#2563eb';
            e.target.style.transform = 'scale(1)';
          }}
          title="Opciones de accesibilidad"
          aria-label="Abrir menú de accesibilidad"
        >
          <UserIcon style={{ width: '24px', height: '24px' }} />
        </button>

        {/* Panel de opciones */}
        {isOpen && (
          <div 
            style={{
              position: 'absolute',
              top: '60px',
              right: '0',
              width: '320px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              zIndex: 99999,
              overflow: 'hidden',
              maxWidth: 'calc(100vw - 32px)',
              transform: window.innerWidth < 360 ? 'translateX(-20px)' : 'none'
            }}
          >
            {/* Header del panel */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#eff6ff'
            }}>
              <h3 style={{
                margin: 0,
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '15px'
              }}>
                <UserIcon style={{ width: '18px', height: '18px', color: '#2563eb' }} />
                Accesibilidad
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
                aria-label="Cerrar menú"
              >
                <XMarkIcon style={{ width: '18px', height: '18px', color: '#6b7280' }} />
              </button>
            </div>

            {/* Contenido del panel */}
            <div style={{ padding: '14px', maxHeight: '450px', overflowY: 'auto' }}>
              {/* Ajuste de tamaño de fuente */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px',
                backgroundColor: '#f9fafb',
                marginBottom: '12px'
              }}>
                <h4 style={{
                  margin: '0 0 10px 0',
                  fontWeight: '500',
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px'
                }}>
                  <span style={{ fontSize: '16px' }}>🔤</span>
                  Tamaño de Texto
                </h4>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Actual: <span style={{ fontWeight: '500', color: '#2563eb' }}>{getFontSizeLabel()}</span>
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={decreaseFontSize}
                    disabled={fontSize === "small"}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '5px',
                      backgroundColor: fontSize === "small" ? '#f3f4f6' : 'white',
                      color: fontSize === "small" ? '#9ca3af' : '#374151',
                      cursor: fontSize === "small" ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (fontSize !== "small") {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (fontSize !== "small") {
                        e.target.style.backgroundColor = 'white';
                      }
                    }}
                    title="Disminuir tamaño de texto"
                  >
                    <MinusIcon style={{ width: '14px', height: '14px' }} />
                    A-
                  </button>
                  
                  <button
                    onClick={resetFontSize}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      padding: '6px 8px',
                      fontSize: '12px',
                      backgroundColor: '#dbeafe',
                      border: '1px solid #bfdbfe',
                      color: '#1e40af',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#bfdbfe';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#dbeafe';
                    }}
                    title="Restablecer tamaño normal de texto"
                  >
                    <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
                    Normal
                  </button>
                  
                  <button
                    onClick={increaseFontSize}
                    disabled={fontSize === "extra-large"}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      padding: '6px 8px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '5px',
                      backgroundColor: fontSize === "extra-large" ? '#f3f4f6' : 'white',
                      color: fontSize === "extra-large" ? '#9ca3af' : '#374151',
                      cursor: fontSize === "extra-large" ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (fontSize !== "extra-large") {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (fontSize !== "extra-large") {
                        e.target.style.backgroundColor = 'white';
                      }
                    }}
                    title="Aumentar tamaño de texto"
                  >
                    <PlusIcon style={{ width: '14px', height: '14px' }} />
                    A+
                  </button>
                </div>
              </div>

              {/* Cursor grande toggle */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px',
                backgroundColor: '#f9fafb',
                marginBottom: '12px'
              }}>
                <h4 style={{
                  margin: '0 0 10px 0',
                  fontWeight: '500',
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px'
                }}>
                  <CursorArrowRaysIcon style={{ width: '16px', height: '16px', color: '#374151' }} />
                  Cursor Grande
                </h4>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Estado: <span style={{ fontWeight: '500', color: largeCursor ? '#059669' : '#6b7280' }}>
                      {largeCursor ? "Activado" : "Desactivado"}
                    </span>
                  </span>
                </div>
                
                <button
                  onClick={toggleLargeCursor}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid ' + (largeCursor ? '#059669' : '#d1d5db'),
                    borderRadius: '6px',
                    backgroundColor: largeCursor ? '#ecfdf5' : 'white',
                    color: largeCursor ? '#059669' : '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (largeCursor) {
                      e.target.style.backgroundColor = '#d1fae5';
                    } else {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (largeCursor) {
                      e.target.style.backgroundColor = '#ecfdf5';
                    } else {
                      e.target.style.backgroundColor = 'white';
                    }
                  }}
                  title={largeCursor ? "Desactivar cursor grande" : "Activar cursor grande"}
                >
                  <CursorArrowRaysIcon style={{ width: '16px', height: '16px' }} />
                  {largeCursor ? "Desactivar" : "Activar"} Cursor Grande
                </button>
              </div>

              {/* Modo oscuro toggle */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px',
                backgroundColor: '#f9fafb',
                marginBottom: '12px'
              }}>
                <h4 style={{
                  margin: '0 0 10px 0',
                  fontWeight: '500',
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px'
                }}>
                  {darkMode ? (
                    <SunIcon style={{ width: '16px', height: '16px', color: '#374151' }} />
                  ) : (
                    <MoonIcon style={{ width: '16px', height: '16px', color: '#374151' }} />
                  )}
                  Modo Oscuro
                </h4>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Estado: <span style={{ fontWeight: '500', color: darkMode ? '#7c3aed' : '#6b7280' }}>
                      {darkMode ? "Activado" : "Desactivado"}
                    </span>
                  </span>
                </div>
                
                <button
                  onClick={toggleDarkMode}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid ' + (darkMode ? '#7c3aed' : '#d1d5db'),
                    borderRadius: '6px',
                    backgroundColor: darkMode ? '#f3e8ff' : 'white',
                    color: darkMode ? '#7c3aed' : '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (darkMode) {
                      e.target.style.backgroundColor = '#e9d5ff';
                    } else {
                      e.target.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (darkMode) {
                      e.target.style.backgroundColor = '#f3e8ff';
                    } else {
                      e.target.style.backgroundColor = 'white';
                    }
                  }}
                  title={darkMode ? "Desactivar modo oscuro" : "Activar modo oscuro"}
                >
                  {darkMode ? (
                    <SunIcon style={{ width: '16px', height: '16px' }} />
                  ) : (
                    <MoonIcon style={{ width: '16px', height: '16px' }} />
                  )}
                  {darkMode ? "Desactivar" : "Activar"} Modo Oscuro
                </button>
              </div>

              {/* Placeholder para futuras opciones */}
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                fontStyle: 'italic',
                textAlign: 'center',
                padding: '8px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: '#f9fafb'
              }}>
                Próximamente: Más opciones de accesibilidad
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '8px 14px',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #e5e7eb'
            }}>
              <p style={{
                margin: 0,
                fontSize: '10px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                ♿ Mejorando la accesibilidad para todos
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay para móviles */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            zIndex: 99998,
            display: window.innerWidth < 768 ? 'block' : 'none'
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}