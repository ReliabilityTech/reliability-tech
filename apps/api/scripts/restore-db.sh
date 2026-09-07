#!/usr/bin/env bash
# Restaura um dump gerado por backup-db.sh no banco de DATABASE_URL. Aceita
# um arquivo local ou uma chave s3://bucket/arquivo (baixa antes de restaurar).
# Ver docs/backup.md pro ensaio de restauração completo, passo a passo.
#
# Requer na PATH: pg_restore, aws-cli v2 (só se BACKUP_FILE for s3://...).
# Variáveis obrigatórias:
#   DATABASE_URL — string de conexão do banco de DESTINO (será sobrescrito)
#   BACKUP_FILE  — caminho local do dump, ou s3://bucket/chave
# Opcional (só se BACKUP_FILE for s3://...):
#   BACKUP_S3_ENDPOINT — endpoint S3-compatível
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL não definido (banco de destino)}"
: "${BACKUP_FILE:?BACKUP_FILE não definido (caminho local ou s3://bucket/chave)}"

LOCAL_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == s3://* ]]; then
  : "${BACKUP_S3_ENDPOINT:?BACKUP_S3_ENDPOINT não definido pra baixar de S3}"
  LOCAL_FILE="$(mktemp)"
  trap 'rm -f "$LOCAL_FILE"' EXIT
  echo "Baixando ${BACKUP_FILE}..."
  aws s3 cp "$BACKUP_FILE" "$LOCAL_FILE" --endpoint-url "$BACKUP_S3_ENDPOINT"
fi

echo "Restaurando em ${DATABASE_URL%%@*}@... (credenciais omitidas)"
# --clean --if-exists: dropa cada objeto antes de recriar, então funciona
# tanto num banco vazio quanto sobrescrevendo um banco existente — sem
# --if-exists, o primeiro restore num banco vazio falharia tentando DROP algo
# que não existe ainda.
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$LOCAL_FILE"

echo "Restauração concluída."
