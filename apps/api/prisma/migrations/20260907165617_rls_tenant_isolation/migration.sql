-- Fase 6.2 do roadmap — RLS como segunda camada de isolamento entre tenants (ADR 0006).
--
-- Cria um papel restrito (`arbora_app`) pra API rodar em runtime, separado do papel que roda
-- migração (`arbora`). Isso é necessário, não cosmético: `arbora` é superusuário (bootstrap do
-- initdb), e superusuário sempre ignora RLS — nem FORCE ROW LEVEL SECURITY muda isso. Sem esse
-- papel novo, qualquer política abaixo seria só encenação.
--
-- `arbora_app` nasce NOLOGIN de propósito: a senha não entra numa migração versionada (segredo).
-- Cada ambiente roda `ALTER ROLE arbora_app WITH LOGIN PASSWORD '...' NOSUPERUSER;` à parte —
-- local dev e Testcontainers com um valor fixo não-secreto, produção com um valor gerado
-- (ver docs/deploy.md), mesmo padrão já usado pro papel `backup_reader` da Fase 5.5.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'arbora_app') THEN
    CREATE ROLE arbora_app NOLOGIN;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO arbora_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO arbora_app;

-- Escopo desta rodada: as 8 tabelas com "tenantId" obrigatório e direto — as que a RF-006/RNF-003
-- mais se importam (dado de aluno, turma, comunicado, evento, notificação). `users`/
-- `refresh_tokens` (login precisa achar o User por e-mail antes de saber o tenant) e
-- `audit_logs` (tenantId nulo é legítimo pra ação de super-admin) ficam de fora deliberadamente,
-- assim como as tabelas "filhas" sem tenantId próprio (notas, presencas, turma_disciplinas etc.
-- precisariam de política via join — dívida registrada em docs/roadmap.md pra uma rodada futura
-- usando esta mesma receita).
--
-- `current_setting('app.tenant_id', true)` devolve NULL se a variável nunca foi definida —
-- "tenantId" = NULL nunca é verdadeiro, então o padrão é fail-closed: sem contexto, zero linha.
-- `app.bypass_tenant_rls = 'true'` é o mesmo escape que `tenant.util.ts` já documenta pro
-- super-admin (RF-008), agora também em nível de banco.
DO $$
DECLARE
  tabela TEXT;
BEGIN
  FOREACH tabela IN ARRAY ARRAY['turmas', 'disciplinas', 'periodos_letivos', 'alunos', 'recados', 'conversas', 'eventos', 'notificacoes']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tabela);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tabela);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING ("tenantId" = current_setting(''app.tenant_id'', true) OR current_setting(''app.bypass_tenant_rls'', true) = ''true'') WITH CHECK ("tenantId" = current_setting(''app.tenant_id'', true) OR current_setting(''app.bypass_tenant_rls'', true) = ''true'')',
      tabela
    );
  END LOOP;
END $$;
