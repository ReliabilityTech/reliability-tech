# ADR 0002 — Next.js no front e NestJS na API, ambos em TypeScript

- **Status:** Aceito
- **Data:** 2026-08-20

## Contexto

O ponto de partida do produto é um protótipo de interface. Precisamos de um front capaz de
reproduzir esse protótipo com fidelidade e de um backend com estrutura suficiente para um
sistema que tende a crescer em regras de negócio, perfis de acesso e integrações.

TypeScript nas duas pontas é pré-requisito para que os contratos compartilhados
([ADR 0005](0005-contratos-compartilhados-zod.md)) tenham valor.

## Decisão

- **Front:** Next.js 15 (App Router) + React 19 + Tailwind CSS v4.
- **API:** NestJS 11 sobre Express, separada do front.

## Alternativas consideradas

| Alternativa | Por que foi descartada |
| ----------- | ---------------------- |
| Next.js full-stack (Route Handlers / Server Actions, sem API separada) | Menos código no início, mas amarra a regra de negócio ao framework de UI e dificulta um cliente móvel ou integrações de terceiros depois. |
| Express/Fastify puro na API | Rápido de começar, mas a estrutura (módulos, DI, testabilidade) teria que ser inventada e mantida por nós. |
| SPA com Vite + React Router | Perde renderização no servidor, que ajuda em tempo de carga e SEO das áreas públicas. |

## Consequências

**Positivas:**

- A API pode servir outros clientes sem reescrita.
- A injeção de dependências do Nest torna os serviços testáveis sem subir servidor (ver
  `health.service.spec.ts`).
- OpenAPI é gerado a partir do código, não mantido à mão.

**Negativas / custos aceitos:**

- Dois processos para rodar em desenvolvimento (mitigado por `pnpm dev`).
- Chamada HTTP entre front e API mesmo quando rodam na mesma máquina.
- NestJS tem mais cerimônia (módulos, decorators) do que um Express mínimo.

**Quando revisitar:** se o produto permanecer estritamente web e a API nunca ganhar outro
consumidor, a separação pode ser reavaliada.
