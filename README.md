# Controle de CRM — demonstração

Aplicação React + TypeScript para demonstrar o fluxo de solicitações entre
Atendimento, Enfermagem e Financeiro. Todos os registros iniciais são fictícios.

## Executar

```bash
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite. A rota inicial redireciona para
`/admin/crm`.

## O que está incluído

- Cadastro, busca, filtros e edição de solicitações de consulta e reembolso.
- Fluxo de autorização, recusa, agendamento e pagamento.
- Painel com indicadores, etapas e alertas de revisão.
- Gestão demonstrativa de usuários e papéis.
- Dados de exemplo gravados no `localStorage` do navegador.

## Limites da demonstração

Este projeto não tem servidor, autenticação ou integração com serviços externos.
As alterações ficam somente no navegador atual e podem ser apagadas limpando os
dados locais do site. Anexos são temporários e não ficam disponíveis após
recarregar a página.

**Não insira dados reais de pacientes, documentos, CPFs, chaves Pix ou outras
informações sensíveis.** A interface de papéis não é um controle de acesso:
qualquer pessoa que abra a aplicação pode acessar as telas e alterar os dados.
