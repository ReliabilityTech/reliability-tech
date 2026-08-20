# ADR 0004 — Autenticação por token e papéis de acesso

- **Status:** ⚠️ **Provisório — precisa ser confirmado com os requisitos**
- **Data:** 2026-08-20

## Contexto

Os requisitos funcionais do projeto ainda não foram importados para o repositório, então os
perfis de acesso reais são desconhecidos. Ao mesmo tempo, praticamente todo o restante do
modelo de dados depende de saber quem é o usuário e o que ele pode fazer.

Para não bloquear o resto da fundação, registramos aqui uma **hipótese de trabalho explícita**,
em vez de deixar a decisão implícita no código.

## Decisão (hipótese)

1. Autenticação por **e-mail e senha**, com token de sessão assinado (JWT) de vida curta.
2. Autorização baseada em **papéis**, com quatro perfis iniciais:

   | Papel     | Hipótese de permissão                          |
   | --------- | ---------------------------------------------- |
   | `admin`   | administra usuários e configurações             |
   | `gestor`  | cria e aprova registros, vê relatórios          |
   | `tecnico` | cria e edita registros do seu escopo            |
   | `leitor`  | somente leitura                                 |

3. Senhas armazenadas com hash forte (Argon2id ou bcrypt), **nunca** o valor em claro.
4. Toda ação relevante gera uma entrada em `AuditLog`.

O que já existe no código: o enum `UserRole` em `schema.prisma` e os schemas em
`packages/contracts/src/auth.ts`. **O fluxo de login não está implementado** — o seed usa um
hash placeholder que deve ser substituído.

## O que precisa ser confirmado

- [ ] Os quatro papéis correspondem aos perfis reais do produto?
- [ ] O sistema é multi-tenant (uma instância servindo várias empresas)? Isso muda o modelo de
      dados inteiro e é mais barato decidir agora do que depois.
- [ ] Há exigência de SSO corporativo (SAML/OIDC, Microsoft Entra, Google Workspace)?
- [ ] Há exigência de MFA?
- [ ] Qual o prazo de retenção da trilha de auditoria?

## Consequências

**Positivas:** o resto do modelo de dados pode avançar sobre uma base declarada.

**Negativas / custos aceitos:** se a hipótese estiver errada — em especial quanto a
multi-tenancy — a migração terá custo. Por isso este ADR é `Provisório` e deve ser fechado
**antes** de o domínio ser modelado.

**Quando revisitar:** imediatamente após a importação dos requisitos funcionais.
