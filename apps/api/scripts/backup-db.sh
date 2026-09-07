#!/usr/bin/env bash
# Dump lógico do Postgres (pg_dump --format=custom) enviado pra um bucket
# S3-compatível. Usado tanto pelo workflow agendado (.github/workflows/backup.yml)
# quanto manualmente por um humano — um script só, sem duplicar a lógica.
#
# Requer na PATH: pg_dump (mesma major version do servidor, ver docs/backup.md),
# aws-cli v2. Variáveis obrigatórias:
#   DATABASE_URL       — string de conexão do banco de origem
#   BACKUP_S3_BUCKET    — nome do bucket de destino
#   BACKUP_S3_ENDPOINT  — endpoint S3-compatível (ex.: Tigris no Fly.io)
# Opcional:
#   BACKUP_LABEL        — entra no nome do arquivo (ex.: "staging", "production")
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL não definido}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET não definido}"
: "${BACKUP_S3_ENDPOINT:?BACKUP_S3_ENDPOINT não definido}"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILENAME="arbora-${BACKUP_LABEL:-backup}-${TIMESTAMP}.dump"
TMPFILE="$(mktemp)"
trap 'rm -f "$TMPFILE"' EXIT

echo "Gerando dump ($FILENAME)..."
# --no-owner: o papel que restaura (RDS-like, Tigris, ambiente local) quase
# nunca é o mesmo que o de produção — sem isso, pg_restore falha tentando
# GRANT/ALTER OWNER pra um papel que não existe no destino.
pg_dump --format=custom --no-owner --file="$TMPFILE" "$DATABASE_URL"

echo "Enviando pra s3://${BACKUP_S3_BUCKET}/${FILENAME}..."
aws s3 cp "$TMPFILE" "s3://${BACKUP_S3_BUCKET}/${FILENAME}" --endpoint-url "$BACKUP_S3_ENDPOINT"

echo "Backup concluído: ${FILENAME}"
