import { Prisma } from '@prisma/client';

import { tenantContextStorage } from '../common/tenant-context';

/**
 * Segunda camada de isolamento (ADR 0006, roadmap 6.2): antes de cada query,
 * seta `app.tenant_id`/`app.bypass_tenant_rls` na MESMA transação/conexão —
 * é o que faz as políticas RLS da migração `20260907165617_rls_tenant_isolation`
 * valerem.
 *
 * Duas formas mais óbvias foram tentadas antes desta e **não funcionam**,
 * comprovado empiricamente (um INSERT legítimo, tenant certo, chegava a ser
 * rejeitado pela própria política RLS — prova de que o `set_config` não
 * estava valendo pra query seguinte):
 * 1. `$transaction([setConfig, query(args)])` (forma em array) — não
 *    garante a mesma conexão.
 * 2. `$transaction(async (tx) => { await tx.$executeRaw\`SET...\`; return
 *    query(args); })` (forma interativa, mas ainda chamando o `query`
 *    capturado pelo `$allOperations`) — mesmo dentro do callback, a Promise
 *    que `query(args)` devolve não entra na transação de `tx`; ela carrega
 *    seu próprio dispatch interno, independente de onde é invocada.
 *
 * O que funciona: dentro do `$transaction` interativo, chamar o método
 * correspondente **do próprio `tx`** (`tx.aluno.create(...)`, indexado
 * dinamicamente pelo nome do model) em vez do `query(args)` capturado — só
 * assim a query de fato roda na mesma conexão/transação do `set_config`.
 *
 * Sem contexto nenhum (fora de uma requisição autenticada — ex.: script de
 * seed, que usa seu próprio `PrismaClient` sem esta extensão de qualquer
 * forma), roda a query normalmente: as políticas decidem o resto, e o padrão
 * delas é fail-closed (zero linha sem `app.tenant_id` setado).
 */
export function withTenantRls() {
  return Prisma.defineExtension((client) =>
    client.$extends({
      name: 'tenant-rls',
      query: {
        $allModels: {
          async $allOperations({ args, query, model, operation }) {
            const contexto = tenantContextStorage.getStore();
            if (!contexto || (contexto.tenantId === null && !contexto.bypass)) {
              return query(args);
            }

            // `query(args)` sozinho não basta: testado empiricamente que a
            // Promise que ele devolve não entra na transação aberta abaixo
            // mesmo chamada de dentro do callback — só uma chamada através
            // do próprio `tx` (delegate do model, indexado dinamicamente
            // pelo nome — `$allModels.$allOperations` só dispara pra
            // operação de model, `model` nunca é undefined aqui) garante
            // que o `set_config` valha pra query de verdade.
            return client.$transaction(async (tx) => {
              await tx.$executeRaw`SELECT set_config('app.tenant_id', ${contexto.tenantId ?? ''}, true), set_config('app.bypass_tenant_rls', ${String(contexto.bypass)}, true)`;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const txSemTipo = tx as any;
              const nomeDelegate =
                (model as string).charAt(0).toLowerCase() + (model as string).slice(1);
              return txSemTipo[nomeDelegate][operation](args);
            });
          },
        },
      },
    }),
  );
}
