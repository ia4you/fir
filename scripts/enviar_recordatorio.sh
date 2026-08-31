#!/bin/sh
# Envío diario del recordatorio de racha. Pensado para cron dentro del
# contenedor de producción (ver instrucciones de despliegue del cron en el
# host, que hace `docker exec` a este script). La lógica real vive en
# enviar-recordatorio.mjs porque necesita `pg` y `fetch`.
set -e
cd "$(dirname "$0")/.."
node scripts/enviar-recordatorio.mjs
