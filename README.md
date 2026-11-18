# CRM Saúde

**CRM Saúde** é uma demonstração de front-end em React para gestão de solicitações de saúde, construída com TypeScript e Vite. O projeto simula os fluxos de atendimento, enfermagem e financeiro em uma interface administrativa organizada por solicitações, usuários e painel de acompanhamento.

> Este repositório é apenas uma demonstração local. Não representa um sistema hospitalar autorizado para uso com dados reais.

## Funcionalidades

- Cadastro e consulta de solicitações de consulta e reembolso.
- Busca, filtros e edição de registros.
- Fluxo de atendimento com autorização, recusa, agendamento e pagamento.
- Painel com indicadores, etapas e alertas de revisão.
- Gestão demonstrativa de usuários e papéis.
- Assistente integrado para apoiar o uso da interface.
- Dados iniciais fictícios armazenados no `localStorage` do navegador.

## Tecnologias

- React 19
- TypeScript
- Vite
- React Router DOM
- CSS
- Oxlint

## Como executar

### Pré-requisitos

- Node.js
- npm

### Instalação e desenvolvimento

```bash
npm install
npm run dev
```

Abra no navegador o endereço exibido pelo Vite. Normalmente, o terminal mostrará algo como `http://localhost:5173`.

A aplicação inicia na página inicial e pode ser aberta diretamente nas seguintes rotas:

| Rota | Conteúdo |
| --- | --- |
| `/` | Página inicial |
| `/login` | Tela demonstrativa de acesso |
| `/cadastro` | Cadastro demonstrativo |
| `/crm` | Área principal de solicitações |
| `/admin/crm` | Área administrativa de solicitações |
| `/admin/crm/painel` | Painel de indicadores |
| `/admin/crm/usuarios` | Gestão demonstrativa de usuários |

## Comandos disponíveis

```bash
npm run dev      # inicia o servidor de desenvolvimento
npm run build    # gera a versão de produção em dist/
npm run lint     # executa a análise estática
npm run preview  # serve localmente a versão construída
npm run deploy   # publica dist/ no GitHub Pages
```

## Estrutura do projeto

```text
src/
├── components/  # Componentes reutilizáveis da interface
├── data/        # Dados e estruturas de demonstração
├── pages/       # Páginas e áreas administrativas
├── utils/       # Funções auxiliares
├── App.tsx      # Configuração das rotas
├── auth.ts      # Regras simuladas de autenticação
├── routes.ts    # Constantes das rotas
└── main.tsx     # Entrada da aplicação React
```

## Persistência e limitações

A aplicação não possui servidor, banco de dados ou integração com serviços externos. As alterações são mantidas apenas no navegador por meio do `localStorage` e podem ser removidas ao limpar os dados locais do site.

Anexos enviados na demonstração são temporários e não ficam disponíveis após recarregar a página.

- Não insira dados reais de pacientes, documentos, CPFs, chaves Pix ou outras informações sensíveis.
- Os registros, usuários e permissões são fictícios.
- A tela de papéis não representa controle de acesso real: qualquer pessoa com acesso à aplicação pode visualizar e alterar os dados disponíveis.
- Este projeto não atende, por si só, a requisitos legais ou técnicos de sistemas clínicos ou de saúde.

## Licença

Nenhuma licença de uso foi definida para este projeto. Consulte o autor antes de reutilizar ou distribuir o código.