import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  es: {
    translation: {
      acces: {
        title: "Accesibilidad",
        textSize: "Tamaño de Texto",
        current: "Actual",
        small: "Pequeña",
        normal: "Normal",
        large: "Grande",
        extraLarge: "Extra Grande",
        decrease: "Disminuir tamaño de texto",
        reset: "Restablecer tamaño normal de texto",
        increase: "Aumentar tamaño de texto",
        largeCursor: "Cursor Grande",
        state: "Estado",
        activated: "Activado",
        deactivated: "Desactivado",
        enable: "Activar",
        disable: "Desactivar",
        darkMode: "Modo Oscuro",
        upcoming: "Próximamente: Más opciones de accesibilidad",
        footer: "♿ Mejorando la accesibilidad para todos",
        openMenu: "Abrir menú de accesibilidad",
        closeMenu: "Cerrar menú",
        langSwitchTitle: "Cambiar a Inglés",
        langSwitchTitleEn: "Switch to Spanish",
        normalBtn: "Normal",
      },

      // 🧩 ConfirmModal
      confirmModal: {
        rejectMsg: "Escribe la razón del rechazo (obligatorio):",
        noteMsg: "Agrega una nota u observación (opcional):",
        rejectPlaceholder: "Motivo del rechazo...",
        notePlaceholder: "Notas (opcional)...",
        errorNote: "Debe ingresar una razón para rechazar.",
      },

      // 🧩 Botones comunes
      btn: {
        cancel: "Cancelar",
        submit: "Enviar",
        confirm: "Confirmar",
        reject: "Rechazar",
        loading: "Procesando...",
      },

      // 🧩 Evaluación
      evaluar: {
        title: "Evaluar solicitud",
      },

      // 🧩 Announcement
      announcement: {
        prefixSec: "Sec.",
        userFallback: "Usuario",
        secretaryTitle: "Bienvenida, {{name}}",
        secretaryParagraph1:
          "Este es tu panel de trabajo. Desde aquí puede revisar las licencias pendientes, generar revisiones cuando falte documentación y consultar el historial de acciones.",
        secretaryParagraph2:
          'Accede rápidamente a "Pendientes" para atender nuevos casos o a "Historial" para revisar gestiones anteriores. Usa "Generar Revisión" para solicitar información adicional.',
        teachTitle: "Bienvenido, Prof. {{name}}",
        teachParagraph1: "Aquí puede revisar las licencias médicas asignadas a tus estudiantes y consultar el historial de acciones realizadas.",
        teachParagraph2: 'Para mas informacion, entra a la pestaña "Como usar". Aqui se explica a detalle el funcionamiento del sistema.',
        userTitleLine1: "La nueva manera de verificar",
        userTitleLine2: "tus licencias médicas.",
        userParagraph1:
          "Ahora puedes verificar el estado de tus licencias médicas. Gracias a esto, puedes saber si fueron validadas, rechazadas o si aún están en proceso de revisión.",
        userParagraph2:
          "Para más información, solo basta con darle click a este anuncio.",
        altText: "Verificación",

      },

      // 🧩 BannerSection
      banner: {
        titleLine1: "Gestión de licencias",
        titleLine2: "médicas",
        btnHowUse: "¿Cómo se usa?",
        btnManage: "Gestionar",
        btnGenerate: "Generar Revisión",
        btnHistory: "Historial",
        btnResults: "Verificar Resultados",
      },

      // 🧩 Footer
      footer: {
        contactTitle: "¿Necesitas ayuda?",
        contactText: "Contacta nuestro soporte:",
        emailLabel: "Enviar correo a soporte",
        phoneLabel: "Llamar a soporte",
        email: "Soporte@MedLeaveManager.com",
        phone: "+56 123 456 789",
        copy: "© {{year}} MedLeaveManager. Todos los derechos reservados."
      },

      // 🧩 Navbar
      nav: {
        home: "Inicio",
      },
      user: {
        label: "Usuario",
        defaultName: "Usuario",
        guest: "Invitado",
      },
      prefix: {
        secretary: "Sec."
      },
      notifications: {
        empty: "No hay notificaciones disponibles.",
        read: "Leer",
        viewMore: "Ver más",
        newLicense: "Nueva licencia subida por {{name}}",
        newLicenseDesc: "Licencia médica nueva. Revisar documentos y confirmar recepción.",
        licensePending: "Licencia de {{name}} pendiente",
        licensePendingDesc: "Licencia médica requiere revisión.",
        allergyLicense: "Licencia de alergias en revisión",
        allergyLicenseDesc: "Tu solicitud de licencia está en proceso de evaluación.",
        covidAccepted: "Licencia Covid aceptada",
        covidAcceptedDesc: "Licencia revisada y aceptada. Tu ausencia queda registrada.",
        systemMaintenance: "Mantenimiento del sistema programado",
        systemMaintenanceDesc: "Habrá mantenimiento en el servidor mañana a las 22:00 hrs. El sistema no estará disponible durante una hora.",
        type: {
          pendiente: "Pendiente",
          revision: "En revisión",
          verificada: "Verificada",
          soporte: "Soporte",
        },
      },
      "roles.student": "Alumno",
      "roles.studentDesc": "Solicitar y gestionar licencias médicas",
      "roles.secretary": "Secretaria",
      "roles.secretaryDesc": "Gestionar licencias y asistir a usuarios",
      "roles.teacher": "Profesor",
      "roles.teacherDesc": "Gestionar licencias y consultar informes",
      "roles.admin": "Administrador",
      "roles.adminDesc": "Gestión completa del sistema",
    },
  },

  en: {
    translation: {
      acces: {
        title: "Accessibility",
        textSize: "Text Size",
        current: "Current",
        small: "Small",
        normal: "Normal",
        large: "Large",
        extraLarge: "Extra Large",
        decrease: "Decrease text size",
        reset: "Reset to normal text size",
        increase: "Increase text size",
        largeCursor: "Large Cursor",
        state: "State",
        activated: "Enabled",
        deactivated: "Disabled",
        enable: "Enable",
        disable: "Disable",
        darkMode: "Dark Mode",
        upcoming: "Coming soon: More accessibility options",
        footer: "♿ Improving accessibility for everyone",
        openMenu: "Open accessibility menu",
        closeMenu: "Close menu",
        langSwitchTitle: "Switch to English",
        langSwitchTitleEn: "Cambiar a Español",
        normalBtn: "Normal",
      },

      // 🧩 ConfirmModal
      confirmModal: {
        rejectMsg: "Please provide the reason for rejection (required):",
        noteMsg: "Add a note or observation (optional):",
        rejectPlaceholder: "Reason for rejection...",
        notePlaceholder: "Notes (optional)...",
        errorNote: "You must enter a reason to reject.",
      },

      // 🧩 Buttons
      btn: {
        cancel: "Cancel",
        submit: "Submit",
        confirm: "Confirm",
        reject: "Reject",
        loading: "Processing...",
      },

      // 🧩 Evaluation
      evaluar: {
        title: "Evaluate request",
      },

      // 🧩 Announcement
      announcement: {
        prefixSec: "Sec.",
        userFallback: "User",
        secretaryTitle: "Welcome, {{name}}",
        secretaryParagraph1:
          "This is your workspace. From here you can review pending licenses, generate reviews when documentation is missing, and consult the action history.",
        secretaryParagraph2:
          'Quickly access "Pending" to handle new cases or "History" to review previous actions. Use "Generate Review" to request additional information.',
        teachTitle: "Welcome Prof. {{name}}",
        teachParagraph1: "Here you can review the medical licenses assigned to your students and consult the history of actions taken.",
        teachParagraph2: 'For more information, go to the "How to use" tab. Here the system functionality is explained in detail.',
        userTitleLine1: "The new way to verify",
        userTitleLine2: "your medical licenses.",
        userParagraph1:
          "Now you can check the status of your medical licenses. Thanks to this, you can know if they were validated, rejected, or are still under review.",
        userParagraph2:
          "For more information, just click on this announcement.",
        altText: "Verification",
      },

      // 🧩 BannerSection
        banner: {
        titleLine1: "Medical license",
        titleLine2: "management",
        btnHowUse: "How to use?",
        btnManage: "Manage",
        btnGenerate: "Generate Review",
        btnHistory: "History",
        btnResults: "Check Results",
      },

      // 🧩 Footer
      footer: {
        contactTitle: "Need help?",
        contactText: "Contact our support:",
        emailLabel: "Send email to support",
        phoneLabel: "Call support",
        email: "Soporte@MedLeaveManager.com",
        phone: "+56 123 456 789",
        copy: "© {{year}} MedLeaveManager. All rights reserved."
      },

      // 🧩 Navbar
      nav: {
        home: "Home",
      },
      user: {
        label: "User",
        defaultName: "User",
        guest: "Guest",
      },
      prefix: {
        secretary: "Sec."
      },
      notifications: {
        empty: "No notifications available.",
        read: "Mark as read",
        viewMore: "View more",
        newLicense: "New license uploaded by {{name}}",
        newLicenseDesc: "New medical license. Check documents and confirm receipt.",
        licensePending: "License from {{name}} pending",
        licensePendingDesc: "Medical license requires review.",
        allergyLicense: "Allergy license under review",
        allergyLicenseDesc: "Your license request is being evaluated.",
        covidAccepted: "Covid license accepted",
        covidAcceptedDesc: "License reviewed and accepted. Your absence is recorded.",
        systemMaintenance: "Scheduled system maintenance",
        systemMaintenanceDesc: "There will be server maintenance tomorrow at 10 PM. System unavailable for one hour.",
        type: {
          pendiente: "Pending",
          revision: "Under review",
          verificada: "Verified",
          soporte: "Support",
        },
      },
      "roles.teacher": "Teacher",
      "roles.teacherDesc": "Manage licenses and view reports",
      "roles.admin": "Administrator",
      "roles.adminDesc": "Full system management",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng:
    localStorage.getItem("lang") ||
    (navigator.language?.startsWith("en") ? "en" : "es"),
  fallbackLng: "es",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
