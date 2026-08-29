# ADR 0004 — Autenticação por token e papéis de acesso

- **Status:** Aceito (autenticação e papéis); SSO, MFA e retenção da auditoria seguem em aberto
- **Data:** 2026-08-20 — revisado em 2026-08-29 após importação dos RFs/RNFs

## Contexto

Os requisitos funcionais do projeto ainda não haviam sido importados quando este ADR foi aberto,
então os perfis de acesso reais eram desconhecidos. Ao mesmo tempo, praticamente todo o resto do
modelo de dados depende de saber quem é o usuário e o que ele pode fazer.

Em 2026-08-29 os RFs/RNFs foram importados (ver `docs/requisitos/`), confirmando ou corrigindo a
hipótese original.

## Decisão

1. Autenticação por **e-mail e senha**, com token de sessão assinado (JWT) de vida curta e
   renovação via **refresh token** (RF-002) e recuperação de senha por e-mail/SMS (RF-003).
2. Autorização baseada em **papéis**, escopados por tenant, mais um papel global fora do tenant:

   | Papel | Escopo | Permissão (RF relacionado) |
   | ----- | ------ | --------------------------- |
   | `super_admin` | Global, fora do tenant | Gerencia tenants: cria, ativa, suspende, gerencia planos (RF-007, RF-008) |
   | `admin_escolar` | Tenant | Administra usuários, configuração da escola, gera relatórios (RF-028) |
   | `coordenacao` | Tenant | Cadastra alunos/turmas/disciplinas/professores (RF-009), eventos (RF-025), ocorrências (RF-022), recados (RF-015) |
   | `professor` | Tenant, escopo de suas turmas | Lança notas (RF-010) e presença/falta (RF-012) |
   | `responsavel` | Tenant, escopo dos alunos vinculados | Somente leitura de boletim (RF-011), frequência, recados, agenda; confirma ciência de recados (RF-016); autoriza retirada por terceiros (RF-023) |

   Este mapeamento substitui a hipótese original (`admin`/`gestor`/`tecnico`/`leitor`), que não
   correspondia aos perfis reais do produto.
3. Senhas armazenadas com hash forte (Argon2id ou bcrypt), **nunca** o valor em claro.
4. Toda ação relevante gera uma entrada em `AuditLog`, incluindo valor anterior para alterações em
   notas e faltas (RF-029, RNF-004).
5. Um responsável pode estar vinculado a múltiplos alunos e um aluno pode ter múltiplos
   responsáveis (RF-004); o acesso do responsável é restrito aos alunos vinculados a ele (RF-005) —
   isso é uma relação N:N entre `Responsavel` e `Aluno`, não um campo único.

O que já existe no código: o enum `UserRole` em `schema.prisma` e os schemas em
`packages/contracts/src/auth.ts` — ambos precisam ser atualizados para os cinco papéis acima antes
da Fase 1 (modelagem de domínio). **O fluxo de login não está implementado** — o seed usa um hash
placeholder que deve ser substituído (roadmap 2.1).

## O que ainda precisa ser confirmado

- [x] Os papéis correspondem aos perfis reais do produto? — Sim, confirmado por RF-001 e mapeado
      acima.
- [x] O sistema é multi-tenant? — Sim, confirmado por RF-006 a RF-008. Estratégia de isolamento de
      dados decidida em [ADR 0006](0006-estrategia-multi-tenancy.md).
- [ ] Há exigência de SSO corporativo (SAML/OIDC, Microsoft Entra, Google Workspace)? — Não
      mencionado nos RFs/RNFs importados. Assumir que não, até informação em contrário.
- [ ] Há exigência de MFA? — Não mencionado nos RFs/RNFs importados. Assumir que não é obrigatório
      no MVP; reavaliar se RNF-001 (LGPD) exigir para papéis administrativos.
- [ ] Qual o prazo de retenção da trilha de auditoria? — Não especificado. Depende de roadmap 0.4
      (confirmação de conformidade LGPD e hospedagem).

## Consequências

**Positivas:** o modelo de dados pode avançar para a Fase 1 (modelagem de entidades) com papéis e
estratégia de tenant já decididos.

**Negativas / custos aceitos:** SSO, MFA e retenção de auditoria seguem sem resposta; se surgirem
como exigência tardia (ex.: cliente enterprise pedindo SSO), a Fase 2 (autenticação) precisa ser
revisitada.

**Quando revisitar:** se um novo RF confirmar SSO/MFA, ou quando o prazo de retenção de auditoria
for definido (roadmap 0.4).
