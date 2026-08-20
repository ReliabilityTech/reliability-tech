# Política de segurança

## Reportar uma vulnerabilidade

**Não abra uma issue pública.** Envie os detalhes por e-mail para a pessoa responsável pelo
repositório, incluindo:

- descrição da vulnerabilidade e do impacto;
- passos para reproduzir;
- versão ou commit afetado.

O recebimento é confirmado em até 3 dias úteis.

## Práticas obrigatórias no desenvolvimento

- **Segredos nunca entram no git.** Apenas `.env.example` é versionado, sempre com valores
  fictícios. Um segredo commitado é um segredo comprometido: rotacione-o, não basta remover o
  commit.
- **Toda entrada externa é validada** por um schema de `@arbora/contracts` antes de qualquer uso.
- **Consultas parametrizadas.** O Prisma faz isso por padrão; em `$queryRaw`, use sempre
  interpolação por template tag, nunca concatenação de strings.
- **Erros não vazam detalhes internos.** O `AllExceptionsFilter` já garante isso — não o
  contorne devolvendo mensagens de exceção cruas.
- **Nada sensível nos logs.** `authorization`, `cookie` e `password` são redigidos; ao registrar
  um objeto novo, verifique o que ele carrega.
- **Variáveis `NEXT_PUBLIC_*` são públicas.** Elas vão para o bundle do browser — nunca coloque
  segredo nelas.
- **Dependências novas são justificadas** no PR.

## Controles já implementados

Ver a tabela em [`docs/requisitos/nao-funcionais.md`](docs/requisitos/nao-funcionais.md#baseline-já-implementado).

## Pendências de segurança

Rastreadas nas fases 2 e 5 do [roadmap](docs/roadmap.md):

- [ ] Hash de senha com Argon2id (hoje há um placeholder apenas no seed de desenvolvimento)
- [ ] Autenticação e autorização por papéis
- [ ] Gravação efetiva da trilha de auditoria
- [ ] Gestão de segredos em produção
- [ ] Varredura automatizada de dependências
