# Matriz de rastreabilidade

> **Pendente.** Preencher conforme os requisitos forem importados e implementados.

Liga cada requisito ao código que o implementa e ao teste que o comprova. Serve para responder
duas perguntas com precisão:

- "O requisito RF-012 está pronto?" → olhe a linha dele.
- "Posso mudar este arquivo?" → veja quais requisitos dependem dele.

| Requisito | Implementação | Teste | Status |
| --------- | ------------- | ----- | ------ |
| RF-001 | _(caminho do arquivo)_ | _(caminho do teste)_ | Pendente |

## Como manter

- Ao abrir um PR que implementa um requisito, cite o código na descrição (`Implementa RF-012`) e
  atualize a linha correspondente.
- Um requisito só vira `Concluído` quando **todos** os seus critérios de aceite têm teste
  automatizado passando no CI.
