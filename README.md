# TalentSynk Frontend

Interface web da plataforma **TalentSynk**, desenvolvida em React.

Este repositório contém exclusivamente a aplicação Front-end responsável pela experiência do usuário da plataforma.

> Para conhecer a visão de negócio, arquitetura da solução, modelagem de dados e demais documentações, consulte o repositório **TalentSynk-Docs**.

---

## Objetivo

O objetivo deste projeto é fornecer uma interface moderna, intuitiva e responsiva para acompanhamento do Plano de Desenvolvimento Individual (PDI), permitindo que colaboradores, gestores e RH acompanhem a evolução profissional de forma contínua.

---

## Tecnologias

Atualmente o projeto utiliza:

- React
- TypeScript
- Vite
- React Router *(quando aplicável)*
- Tailwind CSS *(quando aplicável)*

> A stack poderá evoluir conforme novas necessidades surgirem durante o desenvolvimento.

---

## Estrutura do Projeto

```text
src/
├── 📁 assets/          # Recursos estáticos (imagens, fontes, estilos globais)
├── 📁 components/      # Componentes reutilizáveis (botões, cards, modais)
├── 📁 hooks/           # Hooks customizados do React
├── 📁 layouts/          # Layouts estruturais das páginas
├── 📁 pages/            # Páginas e views da aplicação
├── 📁 routes/           # Configuração de rotas da aplicação
├── 📁 services/         # Integração e comunicação com APIs externas
├── 📁 types/            # Definições de tipos e interfaces (TypeScript)
├── 📁 utils/            # Funções utilitárias e helpers gerais
└── 📄 App.tsx           # Ponto de entrada e componente raiz
```

A organização da estrutura poderá evoluir conforme o crescimento da aplicação.

---

## Como executar

### Pré-requisitos

- Node.js
- npm

Ambiente da validação local G9: Node.js 24.13.0 e npm 11.6.2.

### Instalação

```bash
git clone https://github.com/nisyDev/idp-frontend.git

cd idp-frontend

npm ci --ignore-scripts --no-audit --no-fund
```

### Executando a aplicação

```bash
npm run dev
```

Por padrão, a aplicação será disponibilizada em:

```
http://127.0.0.1:5173
```

---

## Configuração

A aplicação usa chamadas relativas a `/api`, com cookies de sessão e CSRF.
No desenvolvimento, o proxy existente em `vite.config.ts` encaminha essas chamadas
para `http://127.0.0.1:8081`, correspondente ao perfil `auth-local` do back-end.
A variável `VITE_API_URL` não é utilizada pelo cliente atual.

O login utiliza a identidade retornada por `/api/auth/me`. As credenciais são
informadas somente no formulário local; não devem ser gravadas neste repositório.
Inicialização de aplicações e qualquer operação com banco exigem autorização
própria. O proxy de desenvolvimento não representa uma configuração de deploy.

---

## Integração

Esta aplicação consome os serviços disponibilizados pelo projeto **TalentSynk Backend**.

A documentação das APIs encontra-se no repositório de documentação do projeto.

---

## Status

G9 implementada localmente sobre o front-end `100b921`, utilizando os contratos
da G8 do back-end `746953066f7ee39c3902a2c3c7b45e7be98bb134`.
Fechamento técnico local em 17/11/2026: ESLint com zero erros e avisos, TypeScript
da aplicação e dos testes aprovado, build Vite aprovado e 111 testes aprovados em
nove arquivos, sem falhas, erros ou ignorados. Os resultados são da rodada final
após as correções de lint, sem somar tentativas anteriores.

Os testes usam HTTP simulado, sem aplicações ou bancos reais. A validação ponta a
ponta com as APIs reais permanece pendente de autorização específica. Este estado
documenta a preparação anterior ao commit e push da G9; publicação no GitHub e
deploy são operações distintas e dependem de autorização.

O fluxo de PDI inclui rascunhos, ações, submissão, decisões, revisões após rejeição
e consulta de versões e da vigente. Os indicadores fictícios de PDI do dashboard
foram substituídos por apresentação neutra. Os demais módulos mantêm seu escopo.

As dependências de teste declaradas foram instaladas de forma controlada, com
scripts de instalação desabilitados. O `package-lock.json` está sincronizado,
sem alteração das versões anteriormente resolvidas. A correção de lint preservou
o lockfile, as asserções e as regras do ESLint.

Consulte [G9 — fechamento e validação local](docs/G9_VALIDATION.md) para contratos,
resultados, limites da simulação e inventário de versionamento.

---

## Documentação

A documentação completa do projeto encontra-se no repositório **TalentSynk-Docs**, incluindo:

- Visão de Negócio
- Arquitetura
- Modelagem de Dados
- Documentação da API
- Roadmap
- Decisões Arquiteturais
- Estado Atual do Projeto

---

## Repositórios Relacionados

- TalentSynk-Docs
- TalentSynk-Backend

---

## Licença

Projeto desenvolvido para fins de estudo, evolução técnica e demonstração de arquitetura e desenvolvimento de software.
