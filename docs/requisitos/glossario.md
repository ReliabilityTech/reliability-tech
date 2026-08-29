# Glossário

Linguagem ubíqua do Arbora: o vocabulário do domínio usado **igualmente** em conversas,
requisitos, código e banco de dados. Quando um termo entra aqui, ele passa a ser o nome usado
em classes, tabelas e endpoints.

| Termo | Definição | Usado no código como |
| ----- | --------- | -------------------- |
| Arbora | Nome do produto. | `arbora` (pacotes `@arbora/*`) |
| Tenant | Uma instituição de ensino, isolada das demais (RF-006). Não usamos "Escola" no código para não confundir com a entidade `Aluno.turma` (a "escola" já é o próprio tenant). | `Tenant`, `tenants`, `tenantId` |
| Super-admin | Papel global, fora de qualquer tenant, que gerencia o ciclo de vida das escolas (RF-008). | `UserRole.SUPER_ADMIN` |
| Admin escolar | Papel que administra usuários e configurações de uma escola (RF-001). | `UserRole.ADMIN_ESCOLAR` |
| Coordenação | Papel de secretaria/coordenação: cadastra alunos, turmas, eventos e ocorrências (RF-001, RF-009). | `UserRole.COORDENACAO` |
| Professor | Papel que lança notas e presença nas turmas em que leciona (RF-001, RF-010, RF-012). | `UserRole.PROFESSOR` |
| Responsável | Pai/mãe/tutor de um aluno; pode haver mais de um por aluno (RF-004). Não tem cadastro próprio de "pessoa" — é um `User` com papel `RESPONSAVEL`. | `UserRole.RESPONSAVEL` |
| Aluno | Estudante matriculado em uma turma. Não autentica no sistema — apenas responsáveis, professores e staff têm login (RF-001, RF-009). | `Aluno`, `alunos` |
| Turma | Agrupamento de alunos por série e ano letivo (ex.: "5º Ano A", 2026) (RF-009). | `Turma`, `turmas` |
| Disciplina | Matéria lecionada (ex.: Matemática) (RF-009). | `Disciplina`, `disciplinas` |
| Período letivo | Bimestre ou trimestre de um ano letivo, usado para agrupar notas (RF-010). | `PeriodoLetivo`, `periodos_letivos` |
| Nota | Avaliação de um aluno em uma disciplina/turma, dentro de um período letivo (RF-010, RF-011). | `Nota`, `notas` |
| Presença | Registro de presença/falta de um aluno, por aula ou por dia letivo (RF-012, RF-013, RF-014). | `Presenca`, `presencas` |
| Recado | Comunicado da escola para toda a instituição, uma turma ou um aluno específico (RF-015 a RF-018). | `Recado`, `recados` |
| Movimentação | Registro de entrada/saída do aluno na instituição (RF-020, RF-021). | `Movimentacao`, `movimentacoes` |
| Terceiro autorizado | Pessoa não cadastrada como responsável, mas pré-autorizada a retirar um aluno (RF-023). | `TerceiroAutorizado`, `terceiros_autorizados` |
| Ocorrência | Registro disciplinar ou de saúde sobre um aluno, visível ao responsável (RF-022). | `Ocorrencia`, `ocorrencias` |
| Evento | Item do calendário escolar: prova, reunião, feriado ou evento geral (RF-024, RF-025). | `Evento`, `eventos` |

## Regras de nomenclatura

- **Conceitos de domínio** ficam em português, como no glossário.
- **Termos técnicos** de framework permanecem em inglês (`Controller`, `Service`, `Module`).
- Uma vez definido aqui, o termo não tem sinônimo no código.
