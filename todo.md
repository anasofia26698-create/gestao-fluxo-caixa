# Ajustes solicitados — fluxo de caixa

- [x] Inspecionar o arquivo Excel anexado e confirmar o cabeçalho e a estrutura das quatro colunas.
- [x] Atualizar o modelo de importação para: Data de operação, Crédito, Débito e Saldo.
- [x] Fazer o processamento do fluxo usando apenas Data de operação, Crédito e Débito; ignorar demais colunas caso apareçam no arquivo.
- [x] Remover a área de contas a receber e manter somente Contas a Pagar.
- [x] Adicionar data de referência/editável na aba Fluxo de Caixa, com opção de usar a data de hoje.
- [x] Fazer o simulador considerar a data de referência para informar saldo do dia e possibilidade de compra.
- [x] Atualizar a importação e o modelo para aceitar arquivos Excel/CSV de forma consistente.
- [x] Validar cálculos, mensagens de risco e visual responsivo.
- [x] Salvar checkpoint da versão revisada e entregar ao usuário.

## Revisão: somente débitos

- [x] Remover créditos dos tipos, dados iniciais, importação e cálculos.
- [x] Remover cards, colunas, campos e textos de crédito da interface.
- [x] Atualizar o modelo de importação para usar Data de operação, Débito e Saldo.
- [x] Manter o saldo diário como saldo anterior menos débito.
- [x] Validar a simulação de compra e o indicador de risco usando somente débitos.
- [x] Salvar checkpoint e entregar a versão final sem créditos.

## Nova especificação: fluxo simples com limites de compra

- [x] Redesenhar o site com fundo cinza claro, textos pretos e somente duas abas.
- [x] Remover saldo projetado e qualquer seção de crédito/contas a receber.
- [x] Implementar fluxo diário agrupado por data, com total de débitos por dia e total geral.
- [x] Implementar limites de compra de R$ 50.000 nos dias 05, 10, 15, 20 e 25; R$ 75.000 nos demais dias.
- [x] Adicionar alerta claro quando os débitos do dia ultrapassarem o limite.
- [x] Recriar a importação com modelo Excel de exatamente quatro colunas, ignorando Crédito e Saldo.
- [x] Exibir resumo da importação: lançamentos, período e total de débitos.
- [x] Recriar o simulador com data de hoje, valor, prazo, data prevista, valor do dia, limite e decisão de compra.
- [x] Exibir sempre a observação dos dias críticos de pagamento.
- [x] Validar responsividade, localStorage e formatação brasileira.
- [x] Salvar checkpoint da nova versão e entregar ao usuário.

## Revisão: simulador ampliado e lançamentos temporários

- [x] Mover o simulador para a esquerda, aumentá-lo e aumentar a escala tipográfica.
- [x] Remover o card de lançamentos processados.
- [x] Exibir débitos por dia abaixo do simulador e das informações principais.
- [x] Aceitar prazos múltiplos, especialmente 30, 60 e 90 dias.
- [x] Dividir o valor total da compra pelo número de prazos informados.
- [x] Calcular, para cada cenário, data prevista, prazo, valor já existente, valor da compra, limite e decisão.
- [x] Criar gráfico horizontal preenchido com todas as datas e o volume de débitos versus limite disponível.
- [x] Marcar lançamentos manuais com data de registro e excluir seu efeito após 7 dias.
- [x] Fazer prevalecer no fluxo os dados importados após a expiração do lançamento manual.
- [x] Validar layout, cálculos, localStorage e responsividade.
- [x] Salvar checkpoint da versão revisada e entregar ao usuário.

## Correção: estilos duplicados do editor visual

- [x] Inspecionar o erro de recarga do Home.tsx e localizar propriedades JSX duplicadas.
- [x] Remover estilos inline duplicados sem perder a intenção de aumentar a legibilidade.
- [x] Validar TypeScript, build e renderização da página.
- [x] Salvar checkpoint corrigido.

## Nova revisão: simulação lateral e fluxo enxuto

- [x] Mostrar a simulação à direita do simulador somente após clicar em Simular compra.
- [x] Mover Datas críticas para baixo do simulador e da simulação.
- [x] Remover Data de hoje, Total a pagar dia e Dias com limite ultrapassado da tela de fluxo.
- [x] Exibir Débitos por dia para todas as datas importadas do Excel.
- [x] Aumentar letras e números para a faixa de 15 a 20px.
- [x] Validar responsividade, interação e compilação.
- [x] Salvar checkpoint da nova revisão.

## Verificação de tipografia aplicada pelo editor visual

- [x] Inspecionar estilos duplicados no Home.tsx e identificar a origem do erro JSX.
- [x] Reaplicar a escala tipográfica por CSS, preservando os tamanhos visualmente desejados.
- [x] Validar TypeScript, servidor e renderização responsiva.
- [x] Salvar checkpoint da tipografia revisada.

## Nova revisão: moeda brasileira e fontes ampliadas

- [x] Aceitar entrada do valor total no simulador em formato brasileiro, como 40.000,00.
- [x] Exibir e revisar a aba Importar Planilha com fontes ampliadas.
- [x] Ampliar as fontes das informações em 5x de forma responsiva e legível.
- [x] Validar parsing monetário, importação, TypeScript e renderização.
- [x] Salvar checkpoint da nova revisão.

## Limpeza da base para nova importação

- [x] Remover valores de demonstração das datas do fluxo.
- [x] Resetar os lançamentos armazenados localmente sem alterar a lógica de importação.
- [x] Validar que o fluxo inicia vazio e aceita uma nova planilha.
- [x] Salvar checkpoint da base limpa.

## Migração full-stack e armazenamento de arquivos

- [x] Resolver o conflito do upgrade preservando o Home.tsx funcional do fluxo de caixa.
- [x] Sincronizar o schema e a base full-stack com migração segura.
- [x] Criar metadados de arquivos e procedimentos protegidos de upload/listagem.
- [x] Integrar a aba de importação com armazenamento persistente de planilhas.
- [x] Escrever e executar testes Vitest para o fluxo de arquivos, incluindo rejeição, upload bem-sucedido e listagem por usuário.
- [x] Validar build de produção, autenticação protegida, upload e renderização.
- [x] Salvar checkpoint da versão full-stack.

## Atualização diária e confirmação temporária de compras

- [x] Fazer a importação mais recente substituir todos os débitos importados anteriores, desconsiderando a base de hoje e datas antigas.
- [x] Adicionar botão para confirmar compras nos prazos simulados.
- [x] Reprocessar o fluxo com os valores confirmados nas datas previstas.
- [x] Persistir confirmações temporárias e removê-las automaticamente após 7 dias.
- [x] Validar nova importação, confirmação, expiração e responsividade.
- [x] Salvar checkpoint da atualização diária.
