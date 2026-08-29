-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ATIVO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR', 'RESPONSAVEL');

-- CreateEnum
CREATE TYPE "PeriodoTipo" AS ENUM ('BIMESTRE', 'TRIMESTRE');

-- CreateEnum
CREATE TYPE "AlunoStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "PresencaStatus" AS ENUM ('PRESENTE', 'FALTA');

-- CreateEnum
CREATE TYPE "MovimentacaoTipo" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "OcorrenciaTipo" AS ENUM ('DISCIPLINAR', 'SAUDE');

-- CreateEnum
CREATE TYPE "RecadoDestinatario" AS ENUM ('TODA_INSTITUICAO', 'TURMA', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "EventoTipo" AS ENUM ('EVENTO', 'PROVA', 'REUNIAO', 'FERIADO');

-- CreateEnum
CREATE TYPE "NotificacaoCanal" AS ENUM ('PUSH', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificacaoTipo" AS ENUM ('FALTA', 'RECADO', 'EVENTO', 'MOVIMENTACAO', 'OCORRENCIA');

-- CreateEnum
CREATE TYPE "NotificacaoStatus" AS ENUM ('PENDENTE', 'ENVIADO', 'FALHOU');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ATIVO',
    "plano" VARCHAR(40) NOT NULL,
    "logoUrl" VARCHAR(500),
    "corPrimaria" VARCHAR(7),
    "mensagensDiretasHabilitadas" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'RESPONSAVEL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "entity" VARCHAR(80) NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ip" VARCHAR(45),
    "tenantId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "serie" VARCHAR(80) NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_disciplinas" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turma_disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos_letivos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "tipo" "PeriodoTipo" NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "periodos_letivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "matricula" VARCHAR(40) NOT NULL,
    "status" "AlunoStatus" NOT NULL DEFAULT 'ATIVO',
    "turmaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aluno_responsaveis" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "parentesco" VARCHAR(40) NOT NULL,
    "podeRetirar" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aluno_responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "turmaDisciplinaId" TEXT NOT NULL,
    "periodoLetivoId" TEXT NOT NULL,
    "valor" DECIMAL(4,2) NOT NULL,
    "lancadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presencas" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "status" "PresencaStatus" NOT NULL,
    "turmaDisciplinaId" TEXT,
    "registradoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presencas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terceiros_autorizados" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "documento" VARCHAR(20) NOT NULL,
    "parentescoOuRelacao" VARCHAR(40) NOT NULL,
    "cadastradoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "terceiros_autorizados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "tipo" "MovimentacaoTipo" NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" VARCHAR(280),
    "retiradoPorTerceiroId" TEXT,
    "registradoPorId" TEXT NOT NULL,

    CONSTRAINT "movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencias" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "tipo" "OcorrenciaTipo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registradoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ocorrencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recados" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "corpo" TEXT NOT NULL,
    "destinatario" "RecadoDestinatario" NOT NULL,
    "turmaId" TEXT,
    "alunoId" TEXT,
    "autorId" TEXT NOT NULL,
    "publicadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "recados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recado_anexos" (
    "id" TEXT NOT NULL,
    "recadoId" TEXT NOT NULL,
    "nomeArquivo" VARCHAR(255) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recado_anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recado_confirmacoes_leitura" (
    "id" TEXT NOT NULL,
    "recadoId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "lidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recado_confirmacoes_leitura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" TEXT NOT NULL,
    "conversaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lidoEm" TIMESTAMP(3),

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "tipo" "EventoTipo" NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "turmaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "canal" "NotificacaoCanal" NOT NULL,
    "tipo" "NotificacaoTipo" NOT NULL,
    "referenciaId" TEXT NOT NULL,
    "status" "NotificacaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "enviadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "turmas_tenantId_anoLetivo_idx" ON "turmas"("tenantId", "anoLetivo");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_tenantId_nome_anoLetivo_key" ON "turmas"("tenantId", "nome", "anoLetivo");

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_tenantId_nome_key" ON "disciplinas"("tenantId", "nome");

-- CreateIndex
CREATE INDEX "turma_disciplinas_professorId_idx" ON "turma_disciplinas"("professorId");

-- CreateIndex
CREATE UNIQUE INDEX "turma_disciplinas_turmaId_disciplinaId_key" ON "turma_disciplinas"("turmaId", "disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_letivos_tenantId_anoLetivo_tipo_numero_key" ON "periodos_letivos"("tenantId", "anoLetivo", "tipo", "numero");

-- CreateIndex
CREATE INDEX "alunos_tenantId_turmaId_idx" ON "alunos"("tenantId", "turmaId");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_tenantId_matricula_key" ON "alunos"("tenantId", "matricula");

-- CreateIndex
CREATE INDEX "aluno_responsaveis_responsavelId_idx" ON "aluno_responsaveis"("responsavelId");

-- CreateIndex
CREATE UNIQUE INDEX "aluno_responsaveis_alunoId_responsavelId_key" ON "aluno_responsaveis"("alunoId", "responsavelId");

-- CreateIndex
CREATE INDEX "notas_turmaDisciplinaId_idx" ON "notas"("turmaDisciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "notas_alunoId_turmaDisciplinaId_periodoLetivoId_key" ON "notas"("alunoId", "turmaDisciplinaId", "periodoLetivoId");

-- CreateIndex
CREATE INDEX "presencas_turmaDisciplinaId_data_idx" ON "presencas"("turmaDisciplinaId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "presencas_alunoId_data_turmaDisciplinaId_key" ON "presencas"("alunoId", "data", "turmaDisciplinaId");

-- CreateIndex
CREATE INDEX "terceiros_autorizados_alunoId_idx" ON "terceiros_autorizados"("alunoId");

-- CreateIndex
CREATE INDEX "movimentacoes_alunoId_dataHora_idx" ON "movimentacoes"("alunoId", "dataHora");

-- CreateIndex
CREATE INDEX "ocorrencias_alunoId_dataHora_idx" ON "ocorrencias"("alunoId", "dataHora");

-- CreateIndex
CREATE INDEX "recados_tenantId_publicadoEm_idx" ON "recados"("tenantId", "publicadoEm");

-- CreateIndex
CREATE INDEX "recados_turmaId_idx" ON "recados"("turmaId");

-- CreateIndex
CREATE INDEX "recados_alunoId_idx" ON "recados"("alunoId");

-- CreateIndex
CREATE INDEX "recado_anexos_recadoId_idx" ON "recado_anexos"("recadoId");

-- CreateIndex
CREATE UNIQUE INDEX "recado_confirmacoes_leitura_recadoId_responsavelId_key" ON "recado_confirmacoes_leitura"("recadoId", "responsavelId");

-- CreateIndex
CREATE UNIQUE INDEX "conversas_tenantId_responsavelId_staffId_key" ON "conversas"("tenantId", "responsavelId", "staffId");

-- CreateIndex
CREATE INDEX "mensagens_conversaId_enviadoEm_idx" ON "mensagens"("conversaId", "enviadoEm");

-- CreateIndex
CREATE INDEX "eventos_tenantId_dataInicio_idx" ON "eventos"("tenantId", "dataInicio");

-- CreateIndex
CREATE INDEX "eventos_turmaId_idx" ON "eventos"("turmaId");

-- CreateIndex
CREATE INDEX "notificacoes_tenantId_destinatarioId_createdAt_idx" ON "notificacoes"("tenantId", "destinatarioId", "createdAt");

-- CreateIndex
CREATE INDEX "notificacoes_status_idx" ON "notificacoes"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplinas" ADD CONSTRAINT "disciplinas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_disciplinas" ADD CONSTRAINT "turma_disciplinas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_disciplinas" ADD CONSTRAINT "turma_disciplinas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_disciplinas" ADD CONSTRAINT "turma_disciplinas_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periodos_letivos" ADD CONSTRAINT "periodos_letivos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno_responsaveis" ADD CONSTRAINT "aluno_responsaveis_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno_responsaveis" ADD CONSTRAINT "aluno_responsaveis_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_turmaDisciplinaId_fkey" FOREIGN KEY ("turmaDisciplinaId") REFERENCES "turma_disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_periodoLetivoId_fkey" FOREIGN KEY ("periodoLetivoId") REFERENCES "periodos_letivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_lancadoPorId_fkey" FOREIGN KEY ("lancadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_turmaDisciplinaId_fkey" FOREIGN KEY ("turmaDisciplinaId") REFERENCES "turma_disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terceiros_autorizados" ADD CONSTRAINT "terceiros_autorizados_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terceiros_autorizados" ADD CONSTRAINT "terceiros_autorizados_cadastradoPorId_fkey" FOREIGN KEY ("cadastradoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_retiradoPorTerceiroId_fkey" FOREIGN KEY ("retiradoPorTerceiroId") REFERENCES "terceiros_autorizados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recados" ADD CONSTRAINT "recados_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recados" ADD CONSTRAINT "recados_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recados" ADD CONSTRAINT "recados_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recados" ADD CONSTRAINT "recados_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recado_anexos" ADD CONSTRAINT "recado_anexos_recadoId_fkey" FOREIGN KEY ("recadoId") REFERENCES "recados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recado_confirmacoes_leitura" ADD CONSTRAINT "recado_confirmacoes_leitura_recadoId_fkey" FOREIGN KEY ("recadoId") REFERENCES "recados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recado_confirmacoes_leitura" ADD CONSTRAINT "recado_confirmacoes_leitura_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
