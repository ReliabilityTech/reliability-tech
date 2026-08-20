# Como contribuir

## Preparar o ambiente

```bash
nvm use                       # Node 22
corepack enable               # habilita o pnpm
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm infra:up && pnpm db:migrate && pnpm db:seed
pnpm dev
```

## Fluxo de trabalho

1. **Abra uma issue** antes de começar, usando um dos templates. Mudanças arquiteturais merecem
   um [ADR](docs/adr/) antes do código.
2. **Crie a branch** a partir da `main`: `feat/descricao-curta`.
3. **Implemente com teste.** Mudança de comportamento sem teste não passa na revisão.
4. **Valide localmente:**

   ```bash
   pnpm check   # format, lint, typecheck e testes
   ```

5. **Commit** no padrão [Conventional Commits](docs/convencoes.md#commits--conventional-commits).
   Os hooks do husky validam o formato e rodam o lint no que mudou.
6. **Abra o PR** preenchendo o template, citando os requisitos atendidos.

## O que a revisão observa

- O código faz o que a descrição diz e nada além disso?
- Existe teste que falharia sem a mudança?
- Os nomes seguem o [glossário](docs/requisitos/glossario.md)?
- Erros são tratados e retornam o envelope `ApiError`?
- Alguma entrada de usuário chega ao banco sem validação por schema?
- A documentação afetada foi atualizada junto?

## Onde mexer

| Quero… | Vá para |
| ------ | ------- |
| adicionar um endpoint | `apps/api/src/<modulo>/` + schema em `packages/contracts/src/` |
| mudar o formato de um dado | `packages/contracts/src/` — **sempre primeiro** |
| adicionar uma tela | `apps/web/src/app/` |
| alterar cores ou tipografia | `apps/web/src/app/globals.css` |
| mudar o schema do banco | `apps/api/prisma/schema.prisma` + `pnpm db:migrate` |
| ajustar regras de lint | `packages/eslint-config/` |

## Adicionar dependências

```bash
pnpm --filter @arbora/api add <pacote>          # produção
pnpm --filter @arbora/web add -D <pacote>       # desenvolvimento
pnpm add -Dw <pacote>                           # ferramenta da raiz
```

Justifique dependências novas no PR: peso no bundle, manutenção do projeto e licença.
