const BASE = "/api"; // ajustar si tu backend usa otra base

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const signal = controller.signal;
  const init = { credentials: "include", headers: {}, signal, ...opts };

  const res = await fetch(url, init);
  if (res.status === 403) {
    const err = new Error("forbidden");
    err.status = 403;
    throw err;
  }
  if (res.status === 404) {
    const err = new Error("not_found");
    err.status = 404;
    throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || "request_failed");
    err.status = res.status;
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  // for attachments return blob
  const blob = await res.blob();
  return blob;
}

// Mock data para probar sin backend
const MOCK_LICENSES = [
  {
    id: 1,
    title: "Licencia médica por gripe",
    type: "Licencia médica",
    status: "pendiente",
    date: "2025-01-15",
    created_at: "2025-01-15",
    summary: "Licencia por enfermedad común, gripe estacional con reposo de 3 días.",
    note: "Paciente presenta síntomas de gripe común.",
    attachments: [
      { id: 1, name: "certificado_medico.pdf", filename: "certificado_medico.pdf", type: "application/pdf", mime: "application/pdf", path: "cert1.pdf" },
      { id: 2, name: "receta_medica.jpg", filename: "receta_medica.jpg", type: "image/jpeg", mime: "image/jpeg", path: "receta1.jpg" }
    ]
  },
  {
    id: 2,
    title: "Licencia por cirugía menor",
    type: "Licencia quirúrgica",
    status: "revisada",
    date: "2025-01-10",
    created_at: "2025-01-10",
    summary: "Licencia post-operatoria para recuperación tras cirugía menor ambulatoria.",
    note: "Procedimiento exitoso, requiere reposo de 5 días.",
    attachments: [
      { id: 3, name: "informe_quirurgico.pdf", filename: "informe_quirurgico.pdf", type: "application/pdf", mime: "application/pdf", path: "informe1.pdf" }
    ]
  },
  {
    id: 3,
    title: "Licencia por maternidad",
    type: "Licencia maternal",
    status: "verificada",
    date: "2025-01-05",
    created_at: "2025-01-05",
    summary: "Licencia maternal pre y post parto según normativa vigente.",
    note: "Documentación completa y validada.",
    attachments: [
      { id: 4, name: "certificado_embarazo.pdf", filename: "certificado_embarazo.pdf", type: "application/pdf", mime: "application/pdf", path: "embarazo1.pdf" },
      { id: 5, name: "ecografia.jpg", filename: "ecografia.jpg", type: "image/jpeg", mime: "image/jpeg", path: "eco1.jpg" }
    ]
  },
  {
    id: 4,
    title: "Licencia por accidente laboral",
    type: "Licencia laboral",
    status: "pendiente",
    date: "2024-12-28",
    created_at: "2024-12-28",
    summary: "Licencia por accidente en el lugar de trabajo, lesión en mano derecha.",
    note: "Pendiente de revisión por parte del área de riesgos laborales.",
    attachments: [
      { id: 6, name: "parte_accidente.pdf", filename: "parte_accidente.pdf", type: "application/pdf", mime: "application/pdf", path: "accidente1.pdf" }
    ]
  },
  {
    id: 5,
    title: "Licencia por estrés laboral",
    type: "Licencia psicológica",
    status: "revisada",
    date: "2024-12-20",
    created_at: "2024-12-20",
    summary: "Licencia por diagnóstico de estrés laboral y ansiedad.",
    note: "Requiere seguimiento psicológico.",
    attachments: [
      { id: 7, name: "informe_psicologico.pdf", filename: "informe_psicologico.pdf", type: "application/pdf", mime: "application/pdf", path: "psico1.pdf" }
    ]
  },
  {
    id: 6,
    title: "Licencia por fisioterapia",
    type: "Licencia terapéutica",
    status: "verificada",
    date: "2024-12-15",
    created_at: "2024-12-15",
    summary: "Licencia para sesiones de fisioterapia por lesión muscular.",
    note: "Tratamiento completado exitosamente.",
    attachments: []
  },
  {
    id: 7,
    title: "Licencia por COVID-19",
    type: "Licencia médica",
    status: "pendiente",
    date: "2024-12-10",
    created_at: "2024-12-10",
    summary: "Licencia por diagnóstico positivo de COVID-19, aislamiento obligatorio.",
    note: "Pendiente resultado de segunda PCR.",
    attachments: [
      { id: 8, name: "pcr_positiva.pdf", filename: "pcr_positiva.pdf", type: "application/pdf", mime: "application/pdf", path: "covid1.pdf" }
    ]
  }
];

// Generate mock PDF blob
function createMockPDF(filename = "document.pdf") {
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 44 >> stream
BT /F1 12 Tf 100 700 Td (Mock PDF - ${filename}) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000366 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
444
%%EOF`;
  return new Blob([content], { type: "application/pdf" });
}

// Generate mock image blob
function createMockImage(filename = "image.jpg") {
  // 1x1 pixel transparent PNG
  const content = atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==");
  const bytes = new Uint8Array(content.length);
  for (let i = 0; i < content.length; i++) bytes[i] = content.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

// Simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

async function mockRequest(path, opts = {}) {
  await delay(300 + Math.random() * 200); // realistic delay

  // Simulate random 403/404 errors (uncomment to test error handling)
  // if (Math.random() < 0.1) {
  //   const err = new Error(Math.random() < 0.5 ? "forbidden" : "not_found");
  //   err.status = Math.random() < 0.5 ? 403 : 404;
  //   throw err;
  // }

  return { mockPath: path, mockOpts: opts };
}

export async function fetchLicenses({ page = 1, limit = 10, status = "" } = {}) {
  await mockRequest(`/licenses?page=${page}&limit=${limit}&status=${status}`);
  
  // Filter by status
  let filtered = status ? MOCK_LICENSES.filter(l => l.status === status) : MOCK_LICENSES;
  
  // Paginate
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const items = filtered.slice(start, end);

  return {
    data: items,
    items: items,
    page: page,
    totalPages: totalPages,
    total: total,
    currentPage: page,
    lastPage: totalPages
  };
}

export async function fetchLicenseById(id) {
  await mockRequest(`/licenses/${id}`);
  
  const license = MOCK_LICENSES.find(l => l.id == id);
  if (!license) {
    const err = new Error("not_found");
    err.status = 404;
    throw err;
  }

  return {
    data: license,
    ...license
  };
}

export async function fetchAttachment(path) {
  await mockRequest(`/attachments/${path}`);
  
  // Return appropriate mock file based on extension
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
  const isPDF = /\.pdf$/i.test(path);
  
  if (isImage) {
    return createMockImage(path);
  } else if (isPDF) {
    return createMockPDF(path);
  } else {
    // Default to PDF
    return createMockPDF(path);
  }
}

export default { 
  request: mockRequest, 
  fetchLicenses, 
  fetchLicenseById, 
  fetchAttachment 
};