# Backup — PostgreSQL

> Este documento não foi validado contra uma conta Fly/Tigris real (a sessão que escreveu isso não
> tem credencial pra testar) — os comandos seguem a documentação oficial do Fly, mas rode cada
> etapa manualmente e confirme antes de confiar no agendamento automático
> (`.github/workflows/backup.yml`). O `flyctl proxy` em CI, em especial, é a parte mais arriscada:
> funciona de forma bem estabelecida quando rodado localmente, mas o tempo de provisionar o peer
> WireGuard num runner efêmero, todo dia, não foi observado na prática.

Cobre a Fase 5.5 do roadmap: dump lógico agendado do Postgres de produção, enviado pra um bucket
S3-compatível fora do Fly, mais o passo a passo pra testar uma restauração de verdade.

## O que já está testado (sem precisar de conta Fly)

`apps/api/test/integration/backup-restore.integration-spec.ts` prova, contra um Postgres real via
Testcontainers (não mock), que o par `pg_dump`/`pg_restore` usado pelos dois scripts abaixo
preserva os dados: cria um tenant com fixtures conhecidas num banco, gera o dump, restaura num
segundo banco vazio, e compara tenant/alunos/contagens entre os dois. Roda com
`pnpm --filter @arbora/api test:integration`. O que **não** está testado nesta sessão é o
provisionamento real no Fly (túnel, bucket, papel de leitura) — só a mecânica de dump/restore em
si, que é a parte que `apps/api/scripts/backup-db.sh`/`restore-db.sh` também usam.

## Desenho

- **Automatizado** (`.github/workflows/backup.yml`, agendado todo dia às 03h de São Paulo, mais
  `workflow_dispatch` manual): builda um túnel até o Postgres do ambiente via `flyctl proxy`
  (WireGuard gerenciado pelo próprio flyctl, sem configurar VPN manualmente), roda
  `apps/api/scripts/backup-db.sh` através dele, e sobe o dump num bucket
  [Tigris](https://fly.io/docs/reference/tigris/) (S3-compatível, nativo do Fly — mesmo ecossistema
  já usado pra hospedagem, sem introduzir outro provedor).
- **Papel dedicado, só leitura**: o backup usa um usuário Postgres próprio (`BACKUP_DB_USER`), não
  o `DATABASE_URL` da API. Um secret de CI vazado não deveria conseguir escrever nem apagar dado
  nenhum — é mais seguro do que reaproveitar a credencial de produção, mesmo que isso signifique um
  secret a mais pra gerenciar.
- **Restauração**: `apps/api/scripts/restore-db.sh`, o mesmo script tanto pro ensaio manual abaixo
  quanto pra uma recuperação de emergência de verdade.

## Provisionamento (uma vez só, por ambiente)

### 1. Bucket Tigris

```bash
fly storage create   # segue o prompt interativo — cria o bucket e imprime as credenciais S3
```

Guarde o `bucket name`, o `endpoint` (`https://fly.storage.tigris.dev`) e o par
`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` que o comando imprime — não tem como recuperar a
secret key depois, só regerar.

### 2. Papel Postgres só-leitura

```bash
fly postgres connect -a reliability-tech-db-production
```

Dentro do `psql`:

```sql
CREATE ROLE backup_reader WITH LOGIN PASSWORD 'troque-por-um-valor-gerado';
GRANT CONNECT ON DATABASE <nome_do_banco_da_api> TO backup_reader;
GRANT USAGE ON SCHEMA public TO backup_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO backup_reader;
```

`<nome_do_banco_da_api>` é o banco que `fly postgres attach` criou — confirme com
`fly postgres db list -a reliability-tech-db-production`. Repita pra `-staging` se for fazer
backup de staging também.

### 3. Segredos no GitHub

Nos mesmos ambientes `staging`/`production` criados na Fase 5.3 (Settings → Environments):

- **Secret** `BACKUP_DB_USER` / `BACKUP_DB_PASSWORD` — as credenciais do `backup_reader` criado
  acima.
- **Secret** `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — as credenciais do Tigris.
- **Variable** `BACKUP_DB_NAME` — o nome do banco (o mesmo `<nome_do_banco_da_api>` de cima).
- **Variable** `BACKUP_S3_BUCKET` / `BACKUP_S3_ENDPOINT` — o bucket e endpoint do Tigris.

`FLY_API_TOKEN` já existe nesses ambientes desde a Fase 5.3 — não precisa recriar.

### 4. Retenção do bucket

Configure uma [lifecycle policy](https://fly.io/docs/reference/tigris/#lifecycle-rules) no bucket
pra apagar objetos automaticamente depois de N dias, em vez de deixar o workflow acumular backup
pra sempre (ou pior, escrever lógica de deleção na CI — errar a lógica de deleção é bem mais caro
que errar a de upload).

## Ensaio de restauração — rode isso de verdade, pelo menos uma vez

Um backup que nunca foi restaurado não é um backup, é uma esperança.

```bash
# 1. Baixa (ou já usa) um dump recente
export BACKUP_FILE=s3://<bucket>/<arquivo>.dump
export BACKUP_S3_ENDPOINT=https://fly.storage.tigris.dev
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...

# 2. Sobe um Postgres descartável local — NUNCA restaure em cima de produção
#    ou staging só pra "testar"
docker run --rm -d --name restore-drill -e POSTGRES_PASSWORD=drill -p 5433:5432 postgres:17-alpine

# 3. Restaura
export DATABASE_URL=postgresql://postgres:drill@localhost:5433/postgres
bash apps/api/scripts/restore-db.sh

# 4. Confirma que os dados batem com o que se espera (contagem de linhas,
#    um tenant específico, o que fizer sentido pro momento) antes de derrubar
psql "$DATABASE_URL" -c "select count(*) from \"Tenant\";"

# 5. Descarta o ambiente descartável
docker rm -f restore-drill
```

Repita esse ensaio periodicamente (a cada mudança grande de schema é um bom gatilho) — um dump que
restaura hoje não garante que vai restaurar depois de três migrações incompatíveis com uma versão
antiga do `pg_restore`.
