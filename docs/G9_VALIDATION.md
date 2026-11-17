# G9 — fechamento técnico e validação local

## Estado e alcance

Implementação local no repositório oficial `nisyDev/idp-frontend`, branch `master`,
base `100b921adfa5754c03940ca5383e967fb1979694`. Os contratos consultados pertencem
ao back-end oficial G8, commit `746953066f7ee39c3902a2c3c7b45e7be98bb134`.

Fechamento em 17/11/2026: **G9 implementada e validada localmente**. ESLint sem
erros ou avisos, TypeScript da aplicação e dos testes aprovado, build Vite aprovado
e 111 testes aprovados em nove arquivos, sem falhas, erros ou ignorados na rodada
final. A revisão técnica não identificou defeitos críticos ou alteração fora do
escopo aprovado.

Os testes utilizaram HTTP simulado. Não foram iniciadas aplicações ou servidores,
nem acessados o back-end real, Neon ou PostgreSQL. O back-end permanece inalterado.
Esse resultado não comprova validação ponta a ponta ou prontidão para beta.
Este documento registra o fechamento anterior ao commit e push da G9; publicação
no GitHub e deploy são etapas distintas e dependem de autorização específica.

## Fluxo integrado

- Rascunhos próprios: criação e edição, inclusive revisões posteriores à versão 1.
- Ações: inclusão, edição e remoção na versão editável; consulta de versões
  submetidas, históricas e vigentes em modo somente leitura.
- Submissão e ressubmissão com a versão esperada.
- Consulta dos próprios submetidos, decisões, justificativa, responsável e data.
- Pendências do gestor/RH, aprovação com justificativa opcional e rejeição com
  justificativa não branca obrigatória.
- Após rejeição, o titular consulta o novo rascunho criado pelo back-end; a
  interface não clona ações nem acessa o rascunho privado pelo gestor/RH.
- Após aprovação, consulta da vigente pelo `versaoVigenteId` retornado, com suas
  ações e estados reais. A aprovação mantém a execução não iniciada.

A navegação e os novos controles reutilizam cartões, formulários, estilos e tema
existentes. O dashboard mantém a organização visual, apresentando quantidade e
progresso de PDI de forma neutra quando não há indicador real carregado. Não há
percentual de execução na API G8. Os demais módulos demonstrativos permanecem
fora desta entrega, incluindo OKRs, notícias, avaliações, organograma e SSO.

## Contratos utilizados

Todas as rotas abaixo usam o prefixo `/api/pdis`.

| Operação | Método e rota | Resposta |
|---|---|---|
| Rascunhos próprios | `GET /api/pdis` e `GET /{id}` | `PdiRascunhoResponse[]` ou objeto |
| Criação | `POST /api/pdis` | `201 PdiRascunhoResponse` |
| Edição | `PUT /{id}?versaoId={v}` | `200 PdiRascunhoResponse` |
| Ações da versão | `GET /{id}/versoes/{v}/acoes` | `200 AcaoPdiResponse[]` |
| Inclusão de ação | `POST /{id}/acoes?versaoId={v}` | `201 AcaoPdiResponse` |
| Edição de ação | `PUT /{id}/acoes/{acaoId}?versaoId={v}` | `200 AcaoPdiResponse` |
| Remoção lógica | `DELETE /{id}/acoes/{acaoId}?versaoId={v}` | `204`, sem conteúdo |
| Submissão/ressubmissão | `POST /{id}/submeter?versaoId={v}` | `200 PdiSubmetidoResponse` |
| Submetidos próprios | `GET /submetidos` | `200 PdiSubmetidoResponse[]` |
| Pendências | `GET /pendentes` | `200 PdiVersaoResponse[]` |
| Versões visíveis | `GET /{id}/versoes` | `200 PdiVersaoResponse[]` |
| Detalhe | `GET /{id}/versoes/{v}` | `200 PdiVersaoResponse` |
| Decisão | `POST /{id}/versoes/{v}/aprovar` ou `/reprovar` | `200 PdiDecisaoResponse` |

Os corpos de criação/edição de PDI contêm `titulo`, `objetivo`, `inicioPlanejado`
e `fimPlanejado`; ações incluem também `resultadoEsperado`. O PUT transmite todos
os campos editáveis. Decisões enviam `{justificativa}`; submissão não envia corpo.

`id` identifica o PDI; `versaoId`, sua versão; `numero` ou `numeroVersao` é o número
de apresentação. Em ações, `id` é a identidade da ação e `acaoVersaoId`, seu
conteúdo. Esses identificadores não são intercambiáveis. Rascunhos usam
`numeroVersao/versaoCriadaEm`; os DTOs de submissão e versão usam
`numero/criadaVersaoEm`. Os serviços validam formatos e vínculos das respostas.

`GET /{id}` consulta rascunho, não uma versão aprovada. Metadados da decisão são
consultados no detalhe da versão. A vigente é indicada por `versaoVigenteId`,
sem inferência pelo maior número. A resposta de rejeição identifica a nova revisão
sem conceder ao decisor acesso ao seu conteúdo privado.

## Segurança e consistência

- Preservado o cliente HTTP relativo com `same-origin`, cookies, `no-store`,
  cancelamento, timeout e bloqueio de redirecionamentos. O proxy continua em 8081.
- Cada escrita obtém o CSRF atual pelo fluxo existente; login, rotação da sessão
  e logout foram preservados. Não são persistidos tokens ou senhas pelo novo fluxo.
- RH_ADMIN não implica autorização efetiva: a área de pendências consulta a API e
  apresenta o `403`. O servidor revalida gestor atual, RH autorizado e autodecisão.
- Histórico e versões submetidas/aprovadas não recebem controles de edição.
- Bloqueios de envio e cancelamento de leituras obsoletas evitam duplicação de
  operações e sobrescrita da interface por respostas antigas.
- Sucesso depende da resposta validada do servidor. Erros de rede, 5xx ou resposta
  de escrita incompatível são tratados como resultado incerto, sem retry automático.
  Campos e justificativas são preservados no formulário para consulta/reconciliação
  ou fechamento intencional; consultar novamente nunca reenvia uma escrita.
- Mensagens contextualizadas para `400/401/403/404/409`, sem exibir corpo bruto,
  mensagens internas ou parâmetros sensíveis. `401` usa o callback existente de
  expiração de sessão.

## Dependências e isolamento dos testes

O repositório não possuía infraestrutura automatizada de testes. A G9 utiliza
Vitest, React Testing Library e jsdom, sem Playwright, serviços externos ou servidor
real. Foram instaladas somente as dependências declaradas necessárias ao projeto
e aos testes, usando `npm install --ignore-scripts --no-audit --no-fund --prefer-offline`.
As cinco dependências novas são exclusivamente de desenvolvimento, com versões
explícitas no `package.json`:

- `vitest` 4.1.0;
- `@testing-library/react` 16.3.0 e seu peer `@testing-library/dom` 10.4.1;
- `@testing-library/jest-dom` 6.9.1;
- `jsdom` 27.0.0.

Compatibilidade conferida nos manifestos oficiais de
[Vitest](https://github.com/vitest-dev/vitest/blob/v4.1.0/packages/vitest/package.json),
[React Testing Library](https://github.com/testing-library/react-testing-library/blob/v16.3.0/package.json)
e [jsdom](https://github.com/jsdom/jsdom/blob/v27.0.0/package.json).
Ambiente validado: Node 24.13.0, npm 11.6.2 e Vite 8.1.5. O `package-lock.json`
está sincronizado com o manifesto. A comparação com a base identificou 91 entradas
novas, todas de desenvolvimento, duas entradas opcionais de desenvolvimento
removidas (`@emnapi/core` e `@emnapi/runtime`) e nenhuma alteração nas versões
anteriormente resolvidas. As URLs resolvidas usam HTTPS no registro npm oficial,
sem credenciais. Não houve `audit fix`, atualização major ou execução de scripts
de instalação de terceiros. A correção de lint preservou o lockfile sincronizado.

`vitest.config.ts` é independente da configuração de proxy. Os testes usam HTTP
simulado; o setup bloqueia `fetch` real por padrão, executa cleanup e fornece
compatibilidade mínima para dialogs quando ausente no jsdom. Testes não iniciam
Spring, Vite, Neon ou qualquer banco. Não há retry nem paralelismo de arquivos.
As limitações de modalidade/foco do jsdom exigem validação funcional posterior.

Os testes cobrem serviços de PDI/ações, sessão/CSRF/transporte,
formulários, submissão, versões posteriores à primeira, remoção, decisões,
justificativa obrigatória, permissões, conflitos, respostas atrasadas, duplicação
e preservação dos campos diante de resultado incerto. As regressões de
autenticação, transporte e formulários existentes integram os nove arquivos.

## Correções de lint e resultados comprovados

A primeira rodada aprovou tipos, build e os 111 testes, mas encontrou nove erros
de lint: seis preexistentes e três introduzidos na G9. Após autorização, foi
aplicado um único lote de correções e executada uma única rodada final.

- `react-hooks/set-state-in-effect`: em `PdiFormulario`, `PdiRascunhosReais`,
  `PdiPendentes`, `PdiSubmetidos` e `PdiVersaoDetalhes`, o estado inicial representa
  a carga inicial. Recarga, seleção e callbacks confirmados preparam os estados
  antes da nova consulta; os effects mantêm requisição, conclusão assíncrona e
  cleanup. Chaves por identidade/perfil/versão isolam os contextos. Cancelamento,
  geração, campos, justificativa e bloqueios de resultado incerto foram preservados.
- `react-refresh/only-export-components`: o antigo `ThemeContext.tsx` foi separado
  em `theme.ts` (contexto, tipos, paletas e hook), `ThemeProvider.tsx` (componente)
  e `ThemeContext.ts` (fachada compatível). Os imports existentes e o contexto único
  foram preservados, assim como cores, preferência do sistema e alternância manual.
- Nenhuma regra foi desabilitada, nenhum agendamento artificial foi usado para
  esconder setters e nenhuma asserção foi flexibilizada.

| Verificação da rodada final | Resultado |
|---|---|
| ESLint completo | 0 erros, 0 avisos; exit 0 |
| TypeScript da aplicação (`tsc -b --pretty false`) | Aprovado; exit 0 |
| TypeScript dos testes (`npm run test:g9:types -- --pretty false`) | Aprovado; exit 0 |
| Build de produção (`vite build`, Vite 8.1.5) | Aprovado; exit 0 |
| Testes G9, nove arquivos selecionados explicitamente | 111 aprovados; 0 falhos, erros, ignorados ou TODO; exit 0 |

| Arquivo de teste | Aprovados |
|---|---:|
| `src/components/PdiFluxoRascunho.test.tsx` | 15 |
| `src/components/PdiListas.test.tsx` | 8 |
| `src/components/PdiVersaoDetalhes.test.tsx` | 11 |
| `src/pages/DashboardPage.test.tsx` | 1 |
| `src/pages/PdiPage.test.tsx` | 3 |
| `src/services/acoesPdi.test.ts` | 24 |
| `src/services/auth.test.ts` | 4 |
| `src/services/http.test.ts` | 11 |
| `src/services/pdis.test.ts` | 34 |
| **Total da rodada final** | **111** |

Não somar as duas rodadas para contar cenários: a rodada final executou novamente
os mesmos 111 testes após a correção autorizada. Nenhuma regressão foi detectada.
Os relatórios locais da rodada final estão em
`node_modules/.cache/g9-lint-fix-20261117-083128/`: `stages.json`, `lint.json` e
`tests.json`. São evidências locais ignoradas pelo Git, sem inclusão no commit.
O fechamento documental não repetiu build, lint ou testes.

## Limites e próxima validação

A simulação verifica contratos do cliente e comportamento da interface. Não
comprova cookies e CSRF em um navegador conectado ao Spring, permissões com usuários
reais, respostas do ambiente publicado ou persistência. A modalidade e o foco dos
diálogos também precisam ser conferidos em navegador real.

A validação ponta a ponta permanece para a G10, mediante autorização específica
de ambiente, usuários e gravações isoladas. Deverá percorrer colaborador → gestor
→ decisão → revisão/ressubmissão ou consulta da vigente. A G10 não foi iniciada
neste fechamento. Esses limites não impedem o versionamento do recorte G9 validado.
Commit/push e eventual deploy continuam sujeitos a autorizações próprias.

Nenhuma incompatibilidade de contrato que exija modificar a G8 foi identificada
na revisão estática. Execução de ações, evidências e métricas novas permanecem
fora do fluxo G9 aprovado. O escopo do MVP permanece congelado.

## Inventário desta implementação

O staging conferido contém 34 entradas: 14 alteradas (`M`), 19 novas (`N`) e uma
renomeada (`R`), em relação à base `100b921`. São 35 caminhos envolvidos porque
o Git reconheceu `ThemeContext.tsx` → `theme.ts` como renomeação, reunindo origem
e destino em uma entrada do diff. Somente o front-end oficial foi modificado;
o back-end, a autenticação e o proxy existentes permanecem inalterados.

```text
M .gitignore
N docs/G9_VALIDATION.md
M package-lock.json
M package.json
M README.md
M src/components/PdiAcoes.tsx
N src/components/PdiFluxoRascunho.test.tsx
M src/components/PdiFormulario.tsx
N src/components/PdiListas.test.tsx
N src/components/PdiPendentes.tsx
M src/components/PdiRascunhosReais.tsx
N src/components/PdiSubmetidos.tsx
N src/components/PdiVersaoDetalhes.test.tsx
N src/components/PdiVersaoDetalhes.tsx
N src/components/PdiVersoes.css
N src/contexts/ThemeContext.ts
N src/contexts/ThemeProvider.tsx
R src/contexts/ThemeContext.tsx -> src/contexts/theme.ts
N src/pages/DashboardPage.test.tsx
M src/pages/DashboardPage.tsx
N src/pages/PdiPage.test.tsx
M src/pages/PdiPage.tsx
N src/services/acoesPdi.test.ts
M src/services/acoesPdi.ts
N src/services/auth.test.ts
N src/services/http.test.ts
M src/services/http.ts
N src/services/pdis.test.ts
M src/services/pdis.ts
N src/test/setup.ts
M src/types/pdi.ts
M tsconfig.app.json
N tsconfig.test.json
N vitest.config.ts
```
