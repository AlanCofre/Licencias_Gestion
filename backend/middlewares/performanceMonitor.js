// backend/middlewares/performanceMonitor.js
export function performanceMonitor(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    
    console.log(`⏱️  ${method} ${originalUrl} - ${duration}ms`);
    
    // Alertar sobre consultas lentas
    if (duration > 1000) {
      console.warn(`🚨 CONSULTA LENTA: ${method} ${originalUrl} tomó ${duration}ms`);
    }
  });
  
  next();
}