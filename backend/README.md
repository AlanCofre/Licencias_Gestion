# Conexión Backend a MySQL (Sequelize) By Alan

## Requisitos
- Node 18+
- npm
- .env con:
  DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, PORT

## Arranque
npm run dev
# http://localhost:3000

## Endpoints
- GET /db/health   -> verifica conexión (sequelize.authenticate)
- GET /licencias   -> listado básico (si hay datos)

## Estado actual
- Código y estructura OK.
- Conexión remota rechazada: ECONNREFUSED 3306 (bloqueo de red/infra).
- Soluciones propuestas:
  1) VPN o whitelist de IP hacia mysql.inf.uct.cl
  2) Túnel SSH local->remoto (127.0.0.1:3307 -> mysql.inf.uct.cl:3306)
  3) MySQL local para desarrollo (cambiar .env)

## Notas
- No se exponen secretos (.env ignorado).
- Para ambientes con SSL, usar DB_SSL=true y configurar dialectOptions.
- Hecho: Conexión a MySQL por Sequelize implementada; endpoints de verificación y listado, variables por entorno, logs y documentación.
- Resultado: Servidor operativo; conexión remota rechazada por políticas de red (ECONNREFUSED).
- Bloqueante externo: Requiere VPN/whitelist o túnel SSH.
- Siguiente paso: Infra (TI) o aplicar túnel; como alternativa, desarrollar contra MySQL local y luego apuntar a remoto.