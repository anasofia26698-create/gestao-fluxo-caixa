# Ajustes solicitados — fluxo de caixa

- [x] Inspecionar o arquivo Excel anexado e confirmar o cabeçalho e a estrutura das quatro colunas.
- [x] Atualizar o modelo de importação para: Data de operação, Crédito, Débito e Saldo.
- [x] Fazer o processamento do fluxo usando apenas Data de operação, Crédito e Débito; ignorar demais colunas caso apareçam no arquivo.
- [x] Remover a área de contas a receber e manter somente Contas a Pagar.
- [x] Adicionar data de referência/editável na aba Fluxo de Caixa, com opção de usar a data de hoje.
- [x] Fazer o simulador considerar a data de referência para informar saldo do dia e possibilidade de compra.
- [x] Atualizar a importação e o modelo para aceitar arquivos Excel/CSV de forma consistente.
- [x] Validar cálculos, mensagens de risco e visual responsivo.
- [ ] Salvar checkpoint da versão revisada e entregar ao usuário.

## Revisão: somente débitos

- [x] Remover créditos dos tipos, dados iniciais, importação e cálculos.
- [x] Remover cards, colunas, campos e textos de crédito da interface.
- [x] Atualizar o modelo de importação para usar Data de operação, Débito e Saldo.
- [x] Manter o saldo diário como saldo anterior menos débito.
- [x] Validar a simulação de compra e o indicador de risco usando somente débitos.
- [ ] Salvar checkpoint e entregar a versão final sem créditos.
