// Normalizar base: si env no incluye "/api", añadirlo
let BASE = import.meta.env.VITE_API_BASE_URL ?? "/api"; // puede venir como "http://localhost:3000" o "http://localhost:3000/api"
if (!BASE.endsWith("/api")) {
  BASE = BASE.replace(/\/+$/, "") + "/api";
}

export async function getMiPerfil() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No autorizado");
  const res = await fetch(`${BASE}/perfil/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Error al obtener perfil");
  }
  return res.json();
}

function mapFrontendToBackend(body) {
  if (!body) return {};
  const raw = body.telefono ?? "";
  // quitar espacios, paréntesis, guiones, puntos
  const digits = raw.replace(/\D+/g, "");
  // si son 9 dígitos móviles chilenos -> E.164 +56
  let telefonoNormalized = null;
  if (digits.length === 9) {
    telefonoNormalized = `+56${digits}`;
  } else if (digits.length === 11 && digits.startsWith("56")) {
    telefonoNormalized = `+${digits}`;
  } else if (raw.startsWith("+")) {
    telefonoNormalized = raw; // ya está en E.164
  } else if (digits.length > 0) {
    // por defecto enviar sólo dígitos
    telefonoNormalized = digits;
  }

  return {
    // FE -> BE (ajusta si el backend cambia nombres)
    email_alt: body.correoAlternativo ?? null,
    numero_telef: telefonoNormalized ?? null,
    direccion: body.direccion ?? null,
  };
}

export async function updateMiPerfil(bodyObj, file) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No autorizado");
  const mapped = mapFrontendToBackend(bodyObj);
  let res;
  if (file) {
    const fd = new FormData();
    Object.keys(mapped).forEach((k) => {
      if (mapped[k] !== undefined && mapped[k] !== null) fd.append(k, mapped[k]);
    });
    fd.append("foto", file);
    res = await fetch(`${BASE}/perfil/me`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
  } else {
    res = await fetch(`${BASE}/perfil/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(mapped),
    });
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Error guardando perfil");
  }
  return res.json();
}