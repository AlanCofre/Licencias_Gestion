// Cambia de hook a función normal (sin useMemo)
export function useLicenciasporAño(licencias = []) {
  const porAño = {};
  
  licencias.forEach((lic) => {
    // Filtra solo licencias validadas
    if (lic.estado !== "validada" && lic.estado !== "aceptada") return;
    
    const año = new Date(lic.fecha_emision).getFullYear();
    if (!porAño[año]) {
      porAño[año] = [];
    }
    porAño[año].push(lic);
  });

  return porAño;
}