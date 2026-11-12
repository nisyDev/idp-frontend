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

### Instalação

```bash
git clone <url-do-repositorio>

cd talentsynk-frontend

npm install
```

### Executando a aplicação

```bash
npm run dev
```

Por padrão, a aplicação será disponibilizada em:

```
http://localhost:5173
```

---

## Configuração

A comunicação com o Back-end é realizada através de variáveis de ambiente.

Exemplo:

```env
VITE_API_URL=http://localhost:8080
```

---

## Integração

Esta aplicação consome os serviços disponibilizados pelo projeto **TalentSynk Backend**.

A documentação das APIs encontra-se no repositório de documentação do projeto.

---

## Status

🚧 Projeto em desenvolvimento.

As funcionalidades estão sendo implementadas de forma incremental conforme a evolução da arquitetura da plataforma.

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
