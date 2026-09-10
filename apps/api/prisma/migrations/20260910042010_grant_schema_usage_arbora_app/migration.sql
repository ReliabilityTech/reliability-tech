-- Fix da migração `20260907165617_rls_tenant_isolation` (Fase 6.2): ela concede
-- SELECT/INSERT/UPDATE/DELETE nas tabelas, mas nunca GRANT USAGE ON SCHEMA
-- public — sem isso, `arbora_app` não consegue nem referenciar uma tabela do
-- schema, então toda query falha com "permission denied for schema public"
-- antes de qualquer política RLS entrar em jogo. Passou batido nos testes de
-- integração (Testcontainers) porque o banco efêmero de teste concede USAGE
-- em public pra PUBLIC por padrão; achado só ao rodar a API de verdade contra
-- o Postgres local (`pnpm dev`), que não concede.
GRANT USAGE ON SCHEMA public TO arbora_app;
