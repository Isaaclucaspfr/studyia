# Sprint 01 — Redesign visual

> **Status: concluída — aguardando revisão** (4 fases fechadas em 17/11/2026; PR `feat/redesign-visual` → `main` em revisão pelo grupo).
> Responsável: Renzo (frontend visual). Revisão: grupo, via PR.
> Pré-requisito: [06-padroes-visuais.md](../06-padroes-visuais.md) aprovado pelo grupo.

## Objetivo

Deixar a interface do StudyIA consistente, responsiva (375 px a 1440 px) e acessível no nível visual, **sem alterar comportamento**. Para isso: migrar os estilos inline para um conjunto de classes e tokens e corrigir os defeitos puramente visuais levantados na análise.

## Escopo: somente a categoria A

| Item | Descrição | Detalhes |
|---|---|---|
| A1 | Definir as variáveis CSS que faltam (`--gray-*`, `red-200`, `purple-300`) | [05 §A1](../05-achados-frontend.md) |
| A2 | Migrar os 183 `style=""` para classes, nos padrões repetidos | [05 §A2](../05-achados-frontend.md), [06 §2](../06-padroes-visuais.md#2-componentes-base) |
| A3 | Cores via tokens; escala de nota única (**valores combinados com o grupo**) | [05 §A3](../05-achados-frontend.md) |
| A4 | Tela de estudo responsiva (grid + altura do chat via classe) | [05 §A4](../05-achados-frontend.md) |
| A5 | Estilos de `.chat-bubble.typing` e `.chat-bubble.error` | [05 §A5](../05-achados-frontend.md) |
| A6 | Emojis decorativos com `aria-hidden` e texto alternativo nos botões só com ícone | [05 §A6](../05-achados-frontend.md) |
| A7 | Remover a Plus Jakarta Sans do `<link>` do Google Fonts | [05 §A7](../05-achados-frontend.md) |
| A8 | Visual único para os avisos de demo e de transparência (banner e rodapé) | [05 §A8](../05-achados-frontend.md) |

Arquivos que podem mudar: `templates/*.html` (só markup e classes) e `static/css/style.css` (ou novos `.css` carregados pelo `base.html`).

## Fora do escopo

- **Categoria B (comportamento do frontend):** B1 a B11 em [05-achados-frontend.md](../05-achados-frontend.md#b-comportamento-do-frontend-documentar-e-decidir-com-o-grupo). Inclui o bug do feedback do seminário, o XSS, o loading e o anti-clique-duplo, a acessibilidade do modal (foco e Esc), o `confirm()`, a validação de upload, o fuso horário, as CDNs e as duplicações. Cada item só entra com aprovação do grupo e em PR próprio. B4, B5, B6 e B7 são candidatos a uma sprint seguinte.
- **Categoria C (backend):** [handoff/backend-pendencias.md](../handoff/backend-pendencias.md).
- Qualquer alteração em `*.py`, `static/js/app.js`, `requirements.txt`, `README.md`, `doc_completo.txt` ou `.env.example`.
- Novas dependências, CDNs, frameworks (React, Tailwind) ou build step.
- Tema escuro.

## Critérios de aceite

- [x] `test_app.py` passando, rodado **na branch** com o banco temporário:
  `DATABASE_PATH=/tmp/studyia-teste.db python -m unittest test_app.py`
- [x] O checklist ["Antes de mexer em um template, confirme"](../04-contratos-frontend.md#antes-de-mexer-em-um-template-confirme) foi cumprido em **cada** template alterado. Nenhum contrato do [04](../04-contratos-frontend.md) foi quebrado.
- [x] Cada tela validada em **375 px** e **1440 px** (e 768 px), sem rolagem horizontal da página e sem texto cortado.
- [x] Nenhum `style=""` novo, fora das [exceções permitidas](../06-padroes-visuais.md#exceções-permitidas) (restam só os 2 `width` das barras).
- [x] Foco visível (`:focus-visible`) em todos os elementos interativos; navegação por Tab na ordem visual (7 telas, 375 e 1440 px, 0 elemento sem anel).
- [x] Animações respeitam `prefers-reduced-motion` (tudo desligado; conferido com a emulação do Chromium).
- [x] Nenhum arquivo fora do escopo alterado: `git diff --stat main -- '*.py' static/js/ requirements.txt README.md doc_completo.txt .env.example` sem saída.
- [x] Fluxos manuais executados em modo demo: cadastro → login → novo assunto → chat (2 mensagens) → plano → marcar e desmarcar 2 tarefas → seminário → enviar → upload de TXT → excluir tópico → configurar e limpar a chave → logout. (Playwright, Fase 4; sem erro de JS no console.)
- [ ] PR revisado por pelo menos uma pessoa do grupo.

## Checklist de tarefas por tela

> Lista de escopo original, por tela. O checklist operacional, com a auditoria da Fase 1 dividida por fase, está em [Checklist por fase](#checklist-por-fase-auditoria-da-fase-1).

### Global (`style.css` + `base.html`)
- [x] Tokens semânticos + aliases das variáveis indefinidas (A1) — Fase 2, `static/css/tokens.css`
- [x] Componentes base do [06 §2](../06-padroes-visuais.md#2-componentes-base) — genéricos na Fase 2, de tela na Fase 3 (lista na D24)
- [x] Estados: hover (só com `hover: hover`), focus-visible, disabled, vazio, erro (A5) — erro e digitando do chat entraram na Fase 4
- [x] Media queries mobile-first (`640`, `768`, `1024`, `1280`); referência em `--bp-*` no `tokens.css`
- [x] `<link>` do Google Fonts só com a fonte aprovada (A7; ver decisão D1 no [registro](#registro-de-decisões))
- [x] Navbar: layout em 375 px; "⚙️" com `aria-hidden` e rótulo de texto (A6)
- [x] Modal: estilos via `.modal-title`, `.modal-text`, `.modal-actions`. **Mantenha** `#settingsModal`, `#closeSettingsBtn`, `type="button"` e `display:none` inicial
- [x] Flashes: manter `alert-{{ category }}`
- [x] Rodapé RNF06 com classe e sem inline (A1, A8)

### `login.html` e `register.html`
- [x] `.auth-card`, sem inline
- [x] Manter os `name`s (`login_input`, `password` · `name`, `username`, `email`, `password`, `confirm_password`)

### `dashboard.html`
- [x] `.page-header` + `.notice` (o `.demo-banner` do 06 virou `.notice`) (A8). Manter `#openSettingsBtn2` e o `onclick` (mudar é B11)
- [x] Estatísticas com `.stat` e ícones `aria-hidden`
- [x] Cards de fluxo: manter os `name`s, o `enctype` e o `accept`
- [x] Histórico com `.list-item` e `.empty-state`; botão 🗑️ com nome acessível (A6). Manter `method="POST"` e o `onsubmit` (mudar é B6)
- [x] Manter o texto **"Painel de Estudos"** (título e `<h1>`)

### `study_topic.html`
- [x] Grid responsivo (1 coluna < 1024 px), sem o inline da linha 54 (A4)
- [x] Altura do chat via classe (`min(620px, 70dvh)`, mínimo de 22rem). O `#chatMessages` continua rolável (A4)
- [x] Bolhas: só CSS. **Não** mudar a estrutura de `:67-81` (está duplicada no JS, B11)
- [x] `.chat-bubble.typing` e `.chat-bubble.error` estilizados (A5) — Fase 4
- [x] Coluna lateral: `.card-header`, `.list-item`, `.empty-state`
- [x] Forms "gerar seminário" continuam POST

### `plan_create.html`
- [x] Cabeçalho e form com classes; `value`s numéricos dos `<select>` intactos

### `plan_view.html`
- [x] Barra de progresso: manter `#planProgressBar` (com `style="width"`) e `#planProgressText`
- [x] `.task-item` com o estado de concluído via `:has(:checked)`. Manter `.plan-task-checkbox`, `data-*` e `#label_{{ task_key }}`; **não tocar** na fórmula da `task_key` nem no loop
- [x] Manter o texto **"Progresso Geral de Execução"**
- [x] Faixa de CTA com classe

### `seminar_view.html`
- [x] `.score-panel` com a escala única `.score--high/mid/low` (A3; valores aprovados pelo Renzo, pendentes do grupo — D2)
- [x] `.choice` para as alternativas. Manter `name="q_{{ qid }}"` e `value="{{ opt }}"`
- [x] `.feedback--*` para o retorno por questão. Por causa do B1 (✅ confirmado em 17/11/2026), esse bloco **não aparece** hoje: estilize pelo markup, mas não vai dar para validar visualmente até o B1 ser resolvido
- [x] **Não** alterar o `{% set %}` / `{% for %}` das linhas 98-104 (é o B1)

## Riscos

| Risco | Mitigação |
|---|---|
| Quebrar um contrato sem erro visível (ID, `name`, método) | checklist do [04](../04-contratos-frontend.md) em cada template; fluxo manual completo antes do PR |
| Erro de Jinja (`url_for` errado) só aparece ao abrir a página | abrir **todas** as telas, inclusive o seminário concluído e o estado vazio |
| O JS escreve estilo inline (`#label_*`, `#settingsModal`, nota de demo) e vence o CSS | aceitar a limitação nesta sprint; registrado em B11 |
| O feedback por questão não aparece (B1) | estilizar pelo código e marcar como "não validado" no PR |
| Conteúdo da IA com tamanho variável (títulos longos, Markdown com tabelas e código) | testar com textos longos e quebra de palavra; `overflow-x:auto` em `pre` e `table` dentro da bolha |
| Mudança de texto quebrar o `test_app.py` | não alterar os textos da [tabela 7.5](../04-contratos-frontend.md#75-textos-verificados-pelo-test_apppy) |
| Conflito com colegas mexendo nos mesmos templates | avisar no grupo antes de cada PR; PRs pequenos, um por tela |
| Validar só em modo demo | o layout precisa aguentar respostas reais mais longas; testar com uma chave real se o grupo tiver |

**Ordem sugerida de PRs:** (1) tokens + aliases + fonte (A1, A7), de baixo risco; (2) componentes base no CSS, sem tocar em template; (3) um PR por tela, começando por login e cadastro.

---

## Progresso

A sprint roda em uma branch só, `feat/redesign-visual`, dividida em 4 fases. Cada fase termina com commits por grupo de arquivos, feitos pelo Renzo. O PR para a main é aberto ao fim da Fase 4. A "ordem sugerida de PRs" acima fica como referência de risco.

| Fase | Conteúdo | Status |
|---|---|---|
| 1 | Versão atual, auditoria e direção visual (sem código) | ✅ concluída em 17/11/2026 |
| 2 | Fundação: tokens, fonte, componentes base, navbar, modal | ✅ concluída em 17/11/2026 |
| 3 | Telas: migração do inline para classes, tela por tela (**começa pelo T1**) | ✅ concluída em 17/11/2026 |
| 4 | Estados, microinterações, polish e PR | ✅ concluída em 17/11/2026 — aguardando revisão do PR |

Screenshots "antes" (fora do repositório): `../studyia-screenshots/fase1-antes/` (375, 768 e 1440 px, mais os estados do chat). Fase 2: `../studyia-screenshots/fase2/` (375 e 1440 px). Fase 3: `../studyia-screenshots/fase3/` (todas as telas em 375, 768 e 1440 px, mais o modal e os estados vazios; medições em `../studyia-screenshots/fase3-report.json`). Fase 4: `../studyia-screenshots/fase4-base/` (estado antes da fase) e `../studyia-screenshots/fase4/` (todas as telas em 375, 768 e 1440 px, estados do chat, modal, foco, movimento reduzido e as simulações `simulacao-*` de B1 corrigido e de botão desabilitado; medições em `../studyia-screenshots/fase4-report.json`).

---

## Registro de decisões

Onde estas decisões divergirem da proposta do [06-padroes-visuais.md](../06-padroes-visuais.md), valem as decisões abaixo.

### 17/11/2026 — Fase 1 (aprovadas pelo Renzo)

**D1. Direção visual: "Caderno quieto".** Um app de estudos calmo e legível. A cor aparece onde há progresso, nota e a ação principal; o resto é neutro.

| Papel | Valor |
|---|---|
| Fundo da página | `#F5F6F4` |
| Superfície (cards) | `#FFFFFF` |
| Tinta (texto principal) | `#17201C` |
| Texto secundário | `#55605A` (≥ 4,5:1 sobre o fundo e sobre branco) |
| Borda | `#E2E5E1` |
| Acento único (botão primário, progresso, links) | verde-petróleo `#1E6B5C` (texto branco ≥ 4,5:1) |
| Sucesso | `#237A4B` |
| Atenção | texto `#8A5A00` sobre `#FFF6DB` |
| Perigo | `#B42318` |

- **Fonte:** Atkinson Hyperlegible Next (Google Fonts, pesos 400/600/700), com fallback `system-ui`. **Condição:** se ela não tiver algarismos tabulares no Google Fonts, usar a Atkinson Hyperlegible original e avisar no relatório da Fase 2. Trocar a família no Google Fonts não é CDN nova.
- **Raio:** 8 px nos cards, 6 px nos controles; pílula só em badges.
- **Densidade:** média. Corpo de leitura com 16 px, interface com 14 px; títulos 24/20/16 px.
- **Superfícies:** borda de 1 px, sem sombra em repouso; sombra só no modal. Sem gradiente, sem glass (`backdrop-filter`), sem borda colorida lateral ou superior.
- **Ícones:** SVG inline com traço de 1,5 px, em cinza, `aria-hidden="true"`. Botões só com ícone ganham `aria-label` ou texto em `.sr-only`.

**D2. Escala de nota única.** ⚠️ **Aprovado pelo Renzo, pendente de validação do grupo no PR.** Muda o veredito exibido; **destacar na descrição do PR (Fase 4)**.

| Faixa | Cor | Título exibido |
|---|---|---|
| ≥ 70 | sucesso (verde) | "Domínio sólido" |
| 50–69 | atenção (âmbar) | "Em consolidação" |
| < 50 | perigo (vermelho) | "Revisão recomendada" |

- A mesma escala vale para a borda do painel, o número da nota e o título (hoje são 70/50 nas cores e 80/60 no título). A questão com status "parcial" usa o âmbar.
- Implementação: só os números e as cores dos `{% if %}` que **já existem** em `seminar_view.html` mudam, com as cores inline trocadas por classes (`.score--high/mid/low`). Nenhum `{% set %}` ou `{% if %}` novo.
- Os títulos novos não têm emoji.

**D3. Acento único.** O roxo deixa de ser o segundo acento. "Arquivo" e "assunto" passam a se diferenciar por ícone e rótulo; os botões de seminário viram secundários. Classes antigas (`.btn-purple`, `.badge-file`) continuam existindo com o visual novo.

**D4. Ajustes de texto visível aprovados.** Remover eyebrows, emojis dos títulos, o código "(F07)", a pílula "PROJETO A3 — IA PARA O COTIDIANO" e os ":" dos labels. Os textos da [tabela 7.5](../04-contratos-frontend.md#75-textos-verificados-pelo-test_apppy) e os `name`s não mudam.

**D5. Selo "PROJETO A3".** Fica na navbar como texto discreto ao lado da marca, sem pílula com gradiente.

**D6. Microinterações (Fase 4).** Feedback ao pressionar botões; entrada do modal com `@starting-style` (escala de .97 para 1 e opacidade, cerca de 200 ms, sem mexer no `display` controlado pelo JS); 3 pontos no "digitando"; transição da barra de progresso. Nada em listas nem no histórico. Tudo desligado com `prefers-reduced-motion: reduce`.

**D7. Itens que não entram nesta sprint.** Ver [Pendências fora do escopo](#pendências-fora-do-escopo).

**D8. Favicon.** Entra na Fase 4: SVG em `static/` e `<link rel="icon">` no `base.html`. Hoje `/favicon.ico` dá 404 no console.

### 17/11/2026 — Fase 2 (aprovadas pelo Renzo)

**Condição da D1 cumprida:** a Atkinson Hyperlegible Next servida pelo Google Fonts tem `tnum` (também `pnum` e `frac`; eixo `wght` 200–800). Os algarismos padrão são proporcionais, então números que precisam alinhar usam `font-variant-numeric: tabular-nums`. A Next fica.

**D9. Paleta final** (tokens em `static/css/tokens.css`; contraste WCAG medido):

| Par | Hex | Contraste |
|---|---|---|
| Tinta / fundo · superfície | `#17201C` / `#F5F6F4` · `#FFFFFF` | 15,4 · 16,7 |
| Secundário / fundo · superfície | `#55605A` | 6,0 · 6,6 |
| Sutil (placeholder, hora) / fundo · superfície | `#646E68` | 4,9 · 5,3 |
| Branco / acento (botão) · hover | `#1E6B5C` · `#18584B` | 6,3 · 8,3 |
| Acento como link / superfície · fundo | `#1E6B5C` | 6,3 · 5,9 |
| Sucesso: texto / fundo claro | `#1A5E39` / `#EBF5EF` | 7,0 |
| Atenção: texto / fundo claro | `#8A5A00` / `#FFF6DB` | 5,5 |
| Perigo: texto / fundo claro · "Sair" / branco | `#912018` / `#FDF0EE` · `#B42318` | 7,8 · 6,6 |
| Borda de campo / branco (não-texto, mín. 3:1) | `#868F89` | 3,3 |
| Barra de progresso / trilho (não-texto) | `#1E6B5C` / `#E2E5E1` | 4,8 |

- O "sutil" da D1 foi ajustado de `#6B756F` (4,40:1 no fundo, reprovado) para `#646E68`.
- Os aliases `--chakra-*` apontam para a paleta nova: roxo e azul viram o acento (D3), as sombras viram `none` (D1) e os cinzas 400/500 usados como texto foram escurecidos para AA (de 2,3:1 para 4,9:1).

**D10. Escala tipográfica.** 12 (badge) · 13 (metadados, botão pequeno, dica) · 14 (interface) · 16 (leitura, campos, h3) · 20 (h2, título do modal) · 24 (h1, KPI) · 36 (nota). Pesos 400/600/700. Altura de linha 1,2 nos títulos, 1,35 em rótulos, 1,5 na interface e 1,6 na leitura. Títulos com −0,015em.

**D11. Ícones.** 19 SVGs desenhados à mão num sprite no `base.html` (`<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-nome"></use></svg>`), com traço de 1,5 px na tela (`.icon` 18 px, `.icon-sm` 16 px, `.icon-lg` 24 px). Ícones: `settings` (sliders), `user`, `book`, `calendar`, `target`, `search`, `file`, `trash`, `download`, `refresh`, `lock`, `info`, `chat`, `database`, `clock`, `check`, `minus`, `x`, `alert`. Um ícone por tipo: assunto = `search`, arquivo = `file`.

**D12. Marca.** Livro aberto em branco sobre um quadrado verde-petróleo, ao lado de "StudyIA". Candidata a favicon na Fase 4 (D8).

**D13. Selo.** "Projeto A3" em texto cinza depois do nome; some abaixo de 640 px.

**D14. `.btn-purple` = visual de botão secundário** (D3). O "Processar e Estudar Arquivo" troca para `.btn-primary` na Fase 3 (DB3).

**D15. Alertas.** Fundo claro, borda de 1 px e ícone desenhado no CSS (máscara SVG, sem mudar o Jinja). `.alert-info` é neutro: fundo branco, borda e ícone no acento.

**D16. Badges de assunto e de arquivo neutros (cinza).** Só concluído (verde), pendente (âmbar) e perigo (vermelho) têm cor.

**D17. Classes novas** (nenhuma antiga foi renomeada): `.btn-ghost`, `.btn-block`, `.btn-icon`, `.badge-neutral`, `.badge-danger`, `.form-hint`, `.form-error`, `.task-item`, `.task-text`, `.empty-state` (+ `-icon`, `-title`, `-text`), `.modal-title`, `.modal-text`, `.modal-actions`, `.icon` (+ `-sm`, `-lg`), `.icon-sprite`, `.sr-only`, `.brand-mark`, `.nav-settings-btn`, `.nav-btn-label`, `.user-name`.

**D18. Raio de 12 px no modal** (`--radius-lg`), como exceção aos 8 px dos cards: dá hierarquia a uma superfície que flutua.

**D19. Tamanhos de controle.** Campos sempre com 44 px e fonte de 16 px (evita zoom no iOS). Botões com 44 px abaixo de 768 px e 40 px (36 px no `.btn-sm`) a partir daí.

**D20. Escopo da Fase 2.** Entraram a navbar numa linha em 375 px, os alvos de toque de 44 px e as grades `.grid-2`/`.grid-3` sem estouro (fazem parte do `base.html` ou dos componentes). No modal, só foram acrescentadas as classes e o `aria-describedby` do campo; o inline sai na Fase 3. O layout das telas não foi tocado.

### 17/11/2026 — Fase 3 (aprovadas pelo Renzo)

**D21. Comportamento no mobile, por tela.**

| Tela | < 640 px | 640–1023 px | ≥ 1024 px |
|---|---|---|---|
| Navbar | só o ícone da engrenagem; nome cortado com "…" | rótulos visíveis | igual |
| Login/cadastro | card com 24 px de padding; botão com largura total | 32 px de padding | igual |
| Dashboard | aviso de demo abaixo do título; KPIs como lista (rótulo à esquerda, número à direita); cards de fluxo empilhados; item do histórico em 2 linhas, sem ícone, com as ações embaixo à direita | KPIs em 3 colunas | cabeçalho em linha com o aviso à direita; cards de fluxo lado a lado (a partir de 768) |
| Tópico | "Gerar Plano" sozinho na 1ª linha; "Mini Seminário" + Exportar só com ícone na 2ª; chat com `min(620px, 70dvh)`; painéis empilhados embaixo | botões em linha; os 2 painéis lado a lado abaixo do chat (a partir de 768) | chat 2/3 + lateral 1/3 |
| Criar plano | campos em 1 coluna; Cancelar e Gerar empilhados, nessa ordem (bate com a ordem do Tab) | botões lado a lado, à direita | igual |
| Ver plano | "Reajustar" com largura total; CTA empilhado com botão de largura total | igual | CTA em linha (a partir de 768) |
| Seminário | a nota vem antes do título (`order`; não há nada focável dentro); fortes e a revisar empilhados; enviar com largura total | igual | nota à direita; envio centralizado |

**D22. Ações do tópico.** Ordem: Gerar Plano (primário) → Mini Seminário → Exportar, para o primário vir primeiro no celular e no Tab. Abaixo de 640 px, o "Exportar" fica só com o ícone (`.btn-collapse` + `.btn-label-collapse`; o nome acessível continua).

**D23. Sem a classe `.eyebrow`.** A D4 e o craft-floor proíbem eyebrow. O que carrega dado virou `.meta-label`, em sentence case: "Questão N" fica na linha do badge de status; "Sessão N" desceu para baixo do título do dia, junto dos minutos (`.meta-line`). Os eyebrows decorativos foram removidos.

**D24. Classes de padrão e de tela** (aditivas; só `.stat-box` e `.stat-icon`, provisórias da Fase 2, foram removidas):
- **Página:** `.page-header`, `.page-heading`, `.page-title-row`, `.page-title`, `.page-subtitle`, `.page-meta`, `.page-actions`, `.back-link`, `.btn-collapse` + `.btn-label-collapse`, `.meta-label`, `.meta-line`, `.link-action`.
- **Card e lista:** `.card-header` (+ `--divided`), `.card-title`, `.card-subtitle`, `.card-text`, `.list-item` (+ `-media`, `-body`, `-title`, `-link`, `-meta`, `-actions`, `--stack`), `.row-between`, `.item-title`, `.item-meta`, `.empty-state--compact`.
- **Avisos, auth e forms:** `.notice` (+ `.notice-text`), `.auth-page`, `.auth-card`, `.auth-header`, `.auth-title`, `.auth-subtitle`, `.auth-footer`, `.narrow-page`, `.form-actions`, `.form-submit`, `.site-footer`, `.brand-mark-glyph`.
- **KPIs:** `.stats`, `.stat`, `.stat-label`, `.stat-value`, `.stat-empty`.
- **Tópico e plano:** `.flows`, `.flow-card`, `.flow-head`, `.topic-layout`, `.topic-side`, `.chat-header`, `.chat-title`, `.chat-count`, `.progress-card`, `.progress-summary`, `.progress-label`, `.progress-value`, `.progress-lg`, `.progress-foot`, `.plan-days`, `.plan-day-header`, `.task-list`, `.cta-strip`.
- **Seminário:** `.score-panel`, `.score-head`, `.score-title`, `.score-summary`, `.score-box`, `.score-value`, `.score-label`, `.score--high/mid/low`, `.score-insights`, `.insight` (+ `--positive`, `--review`), `.question-list`, `.question-head`, `.question-title`, `.choices`, `.choice`, `.choice-input`, `.choice-text`, `.feedback` (+ `--correct`, `--partial`, `--incorrect`).
- **Estados:** `.is-done`, `.is-selected`, `.is-readonly`, `.is-editable`.

**D25. Inline condicional vira classe, sem lógica nova.** `{% if is_checked %}` → `.is-done`; `{% if user_answers.get(qid) == opt %}` → `.is-selected` (os 2 `if`s idênticos, de borda e de fundo, viraram 1 emissão de classe); o `if` do cursor → `.is-readonly` / `.is-editable`. Os 3 `if`s da nota emitem `.score--*`.

**D26. Painel da nota.** Borda inteira de 1 px na cor da faixa (saiu a faixa colorida de 5 px no topo), número colorido, título na cor da tinta. Fortes e a revisar com texto normal; a cor fica só no ícone e na borda (S2).

**D27. Textos.** Novo: "Começar pelo primeiro assunto" (botão do estado vazio do histórico, leva ao `#title`). Sentence case aplicado só no seminário nesta fase (S4). **Aprovado estender o sentence case a todas as telas na Fase 4, exceto os textos da [tabela 7.5](../04-contratos-frontend.md#75-textos-verificados-pelo-test_apppy)**, que ficam exatamente como estão.

**D28. Login e cadastro alinhados à esquerda** (antes, centralizados); título de `h2` para `h1` (L2).

**D29. KPIs mantêm um ícone cinza de 16 px** ao lado do rótulo, sem fundo.

**D30. Seminário continua como botão secundário** em todos os lugares, inclusive no CTA do plano (D3).

**D31. Glifos viram ícones.** "←", "→" e "+" trocados por 3 SVGs novos no sprite (`arrow-left`, `arrow-right`, `plus`), com o mesmo traço da D11.

### 17/11/2026 — Fase 4 (aprovadas pelo Renzo)

**D32. Animações** (só CSS; easing `--ease-out` = `cubic-bezier(.23, 1, .32, 1)`; tudo desligado com `prefers-reduced-motion: reduce`):

| O quê | Duração / easing |
|---|---|
| Pressionar botão: escala .98 (já existia) | 100 ms, ease-out |
| Pressionar checkbox ou radio (ou a linha deles): caixa a .9; a linha da tarefa escurece um tom | 100 ms, ease-out |
| Marcar alternativa: o ponto (`::before`) vai de opacidade 0 e escala .5 para 1 | 150 ms, ease-out |
| Cor do texto da tarefa ao marcar (vale também para a cor inline do `app.js`) | 150 ms, ease-out |
| Entrada das mensagens novas do chat: opacidade + 6 px de subida. Só as criadas pelo `app.js` (sem `.markdown-content`); o histórico não anima | 200 ms, ease-out |
| "Digitando": 3 pontos em onda (um ponto + 2 `box-shadow`) | ciclo de 1 s, linear, infinito |
| Barra de progresso (`width`, que continua vindo do `style.width`) | 200 ms, ease-out |
| Modal: fade do overlay + card de .97 a 1, via `@starting-style` (o `display` continua com o JS); saída instantânea | 200 ms, ease-out |
| Painel da nota: opacidade + 8 px de subida, uma vez ao carregar o resultado | 300 ms, ease-out |

**D33. Barra de progresso com 200 ms** (antes 300 ms, da Fase 2), como previsto na V4 e na D6.

**D34. Desabilitado com cores, não com opacidade.** `.btn:disabled` / `[aria-disabled="true"]`: texto sutil sobre `--color-surface-muted` (4,6:1), borda neutra, `cursor: not-allowed` (antes: `opacity: .5`, da Fase 2). `.btn-ghost` desabilitado fica sem fundo. Hoje nenhum botão fica desabilitado; o estado está pronto para o B4.

**D35. Certo ou errado na alternativa escolhida.** Só CSS: `.card:has(> .feedback--correct|partial|incorrect) .choice.is-selected` pinta a alternativa marcada de verde, âmbar ou vermelho (anel, ponto, borda e fundo). Lê o `.feedback--*` que o Jinja já emite; nenhuma lógica nova. ⚠️ Só aparece quando o B1 for corrigido (validado por simulação: `simulacao-B1-certo-errado-1440.png`).

**D36. "Digitando" com o mesmo quadro da bolha da IA** (branca, borda), texto secundário em 14 px. O sinal de espera vem dos 3 pontos, não de um fundo de "rascunho". **Erro**: tinta, fundo e borda de perigo, com o ícone de alerta do `.alert-danger` no `::before`.

**D37. Cards continuam sem hover (G5).** "Hover em cards" vale para as linhas clicáveis (tarefa e alternativa), que já tinham hover de borda e ganharam pressão.

**D38. Anel de foco mantido em 2 px com 2 px de afastamento (G2)**, 5,9–6,3:1 contra todos os fundos. Dentro do `#chatMessages` (que tem `overflow`) o anel vai para dentro (`outline-offset: -2px`); dentro da bolha do usuário usa a cor do texto.

**D39. Sentence case (D27) aplicado.** Também no texto das `<option>` do plano (os `value` não mudam) e no `<title>` da tela de criar plano; minúscula depois de ":" no aviso do tópico e no rodapé; "Inteligência Artificial" fica maiúsculo como nome da unidade curricular e minúsculo no texto de transparência; "StudyIA — Assistente Inteligente de Estudos" e "StudyIA Tutor" (também gerado pelo `app.js`) não mudam. Textos da [tabela 7.5](../04-contratos-frontend.md#75-textos-verificados-pelo-test_apppy) intactos.

**D40. Polish da Fase 4:** `::selection`, `caret-color` e barras de rolagem com a paleta (tokens `--color-selection` e `--color-scrollbar`); favicon SVG (D8, `static/favicon.svg`); link do título no histórico com alvo de 44 px abaixo de 768 px (padding + margem negativa, sem mexer no layout); 1ª linha do rodapé sem quebra no "(Projeto A3)"; `textarea` desabilitada sem alça de redimensionar; cache-busting `?v=redesign_v3`.

---

## Checklist por fase (auditoria da Fase 1)

IDs da auditoria entre parênteses: G = global, L = login/cadastro, DB = dashboard, T = tópico/chat, P = criar plano, V = ver plano, S = seminário, M = modal. D1–D8 são as decisões do registro acima. Severidade: **C** crítico, **A** alto, **M** médio, **B** baixo. Antes de editar qualquer template, cumprir o [checklist do 04](../04-contratos-frontend.md#antes-de-mexer-em-um-template-confirme).

### Fase 2 — Fundação (`style.css` + `base.html`) — ✅ concluída em 17/11/2026
- [x] Verificar se a Atkinson Hyperlegible Next tem algarismos tabulares no Google Fonts: **tem `tnum`**; a Next fica (D1)
- [x] `<link>` do Google Fonts só com a fonte aprovada; Plus Jakarta Sans e Inter removidas (A7, G12)
- [x] Tokens semânticos da D1 (cor, tipografia, espaço, raio, sombra, layout, movimento) em `static/css/tokens.css` + aliases dos `--chakra-*` e das variáveis indefinidas (A1, G12)
- [x] Contraste AA em todos os pares de texto: botão primário, texto secundário, placeholder, hora do chat, avisos, "Sair" (G1 · A; ver D9)
- [x] `:focus-visible` global com anel de 2 px e offset; o `outline:none` do `.btn` foi removido (G2 · A)
- [x] Navbar com 56 px em linha em 375 px; rótulo da engrenagem oculto (com nome acessível) abaixo de 640 px; sem blur; selo "Projeto A3" discreto (G3 · A, G11, D5, D13)
- [x] Acento único e sem gradientes: marca, bolha do usuário, barra de progresso (G4 · M, D3)
- [x] Cards com borda de 1 px e sem sombra em repouso; sem hover (G5 · M). As sombras inline viraram `none` pelos aliases
- [x] Badges em sentence case (G6 · M)
- [x] Utilitários `.icon` (sprite SVG inline) e `.sr-only` (G7 · M, D11)
- [x] Alvos de toque ≥ 44 px abaixo de 768 px (G8 · M, D19)
- [x] Base mobile-first com breakpoints 640/768/1024/1280 nos componentes (G9 · M). As telas ficam para a Fase 3
- [x] Transições com propriedades explícitas, `--ease-out` forte e bloco `prefers-reduced-motion` (G10 · B)
- [x] Componentes base em CSS puro: `.btn` (todas as variantes + `-ghost`/`-block`/`-icon`), `.form-control` (+ select com seta, `.form-hint`, `.form-error`), `.card`, `.badge` (+ `-neutral`/`-danger`), `.alert-*`, modal, barra de progresso, checkbox do checklist + `.task-item`, `.empty-state`, chat e `.ai-notice`. Os de tela (`.page-header`, `.back-link`, `.list-item`, `.stat`, `.choice`, `.score-panel`, `.feedback`, `.auth-card`, `.notice`) entram na Fase 3
- [x] Modal: `.modal-title`, `.modal-text`, `.modal-actions` aplicadas, overlay sólido, botões de 44 px, raio de 12 px (D18). `#settingsModal`, `#closeSettingsBtn` e a condição de sessão intactos. **O inline do modal sai na Fase 3**
- [x] Emojis que funcionam como ícone trocados por SVG com `aria-hidden` (navbar, botões, cards, stats, avisos, badges); o botão de excluir ganhou "Excluir estudo" em `.sr-only` (A6). Ficam os avatares do chat (B11) e os títulos da nota (D2, Fase 3)
- [x] Cache-busting: `?v=redesign_v1` em `tokens.css` e `style.css`

### Fase 3 — Telas — ✅ concluída em 17/11/2026

- [x] **T1: rolagem horizontal da tela do tópico em 375 px.** Grid em `.topic-layout` (1 coluna abaixo de 1024 px) e `.chat-window { height: min(620px, 70dvh) }`. Estouro medido: 0 px em 375, 768 e 1440 px, em todas as telas. O `#chatMessages` rola e recebe mensagens novas (Playwright: `overflow-y:auto`, rolado até o fim). ✅ confirmado também pelo Renzo no navegador (T1 · **C**, A4)

**Restos de inline encontrados na Fase 2**
- [x] Eyebrows e labels dos stats em caixa alta: removidos (D4, D23, DB2, DB6)
- [x] Bordas coloridas de 4 px nos stats, nos cards de fluxo, nos dias do plano e no painel da nota: removidas (G5, V1, S1)
- [x] Quadradinhos coloridos atrás dos ícones: ícone cinza, sem fundo (D1)
- [x] Borda tracejada do CTA de seminário (V5)
- [x] Checkbox do plano com 20 px e `<label class="task-item">` + `.task-text` (V2, V3)
- [x] Badge "N registros" sem corte em 375 px: `.card-header` quebra linha (DB5)
- [x] Radios do seminário com `.choice` (S3)
- [x] "Processar e Estudar Arquivo" com `.btn-primary` (D14, DB3)
- [x] Modal sem inline (M1, D20)

**Global**
- [x] Flash mantendo `alert-{{ category }}`; o container some quando não há mensagem (G13)
- [x] Rodapé RNF06 em `.site-footer`, 13 px, alinhado ao grid (G14, A1, A8)
- [x] 183 `style=""` → 2, as duas [exceções permitidas](../06-padroes-visuais.md#exceções-permitidas) (`width` das barras de progresso). Nenhuma cor hardcoded nos templates
- [x] Cache-busting: `?v=redesign_v2`

**Login e cadastro**
- [x] Pílula "PROJETO A3 — IA PARA O COTIDIANO" removida (L1, D4)
- [x] Título como `h1` de 24 px, sem quebrar em 375 px (L2)
- [x] `.auth-card` com 24 px de padding no celular, sem sombra (L3)

**Dashboard**
- [x] `.notice` âmbar no banner de demo; `#openSettingsBtn2` e `onclick` intactos (DB1, A8)
- [x] KPIs em faixa dividida, número de 24 px com algarismos tabulares, "—" em cinza (DB2)
- [x] Cards de fluxo com o mesmo peso; `name`s, `enctype` e `accept` intactos (DB3)
- [x] `::file-selector-button` estilizado (DB4)
- [x] Histórico como lista com divisórias, item em 2 linhas em 375 px; `method="POST"` e `onsubmit` intactos (DB5)
- [x] Eyebrow removido; "Painel de Estudos" mantido (DB6)
- [x] Estado vazio do histórico com link-âncora para `#title` (DB7, adiantado da Fase 4)

**Tópico e chat**
- [x] Uma ação primária no cabeçalho; quebra correta em 375 px (T4, D22)
- [x] Bolha do usuário chapada; contador como texto secundário; estrutura da bolha intacta (T5)
- [x] Coluna lateral como painel com lista; "Novo" e "Gerar" como `.btn-ghost`; forms de seminário em POST (T6)
- [x] Input e botão do chat com 44 px; botão sem quebra (T7)
- [x] Markdown da bolha: `overflow-x:auto` em `pre` e `table` (T8)
- [x] Estados vazios de planos e de seminários (`.empty-state--compact`)

**Criar plano**
- [x] Eyebrow e "(F07)" removidos (P1, D4)
- [x] Select com seta SVG e 44 px; `value`s numéricos intactos (P2)

**Ver plano**
- [x] Cada dia como card sem borda colorida; minutos como texto secundário (V1)
- [x] Tarefa concluída via `:has(:checked)` e `.is-done` (vale no carregamento; depois do clique, o inline do JS vence — B11) (V2)
- [x] Linha da tarefa com foco visível e 44 px; contratos e `task_key` intactos (V3)
- [x] "Progresso Geral de Execução" mantido; `#planProgressBar` e `#planProgressText` intactos
- [x] CTA de seminário como `.cta-strip` (V5)

**Seminário**
- [x] Escala de nota da D2 na borda, no número e no título (S1, A3)
- [x] Fortes e a revisar com texto na cor normal (S2)
- [x] `.choice` com `:has(:checked)` e `:has(:focus-visible)`; resposta marcada legível no resultado (S3)
- [x] `.feedback--*` estilizado pelo markup (⚠️ não validado visualmente por causa do B1)
- [x] Sem emoji; sentence case no seminário; envio com largura total no celular (S4)
- [x] `{% set %}` / `{% for %}` do B1 intocados

### Fase 4 — Estados e polish — ✅ concluída em 17/11/2026
- [x] `.chat-bubble.typing`: texto atenuado e 3 pontos animados em CSS; estático com reduced-motion (T2 · A, A5; D36)
- [x] `.chat-bubble.error`: tinta de perigo, borda e ícone via `::before` (T3 · A, A5; D36)
- [x] Estado vazio do histórico com link-âncora para o campo `#title` (DB7 · B) — adiantado na Fase 3
- [x] Barra de progresso: transição de 200 ms com ease-out (a largura continua pelo JS) (V4 · B; D33)
- [x] Modal: entrada com `@starting-style` (M2 · B, D6; D32). Abre pelos 2 botões, fecha por Cancelar e pelo clique fora
- [x] Feedback ao pressionar botões, checkbox, radio e linhas de tarefa/alternativa (D6; D32)
- [x] Entrada das mensagens novas do chat (só as do `app.js`) e do painel da nota (D32)
- [x] Foco visível conferido com Tab em todas as telas; anel interno no `#chatMessages` (D38)
- [x] Desabilitado legível, sem opacidade (D34)
- [x] Certo/errado na alternativa escolhida, por `:has` (D35; ⚠️ depende do B1)
- [x] `::selection`, `caret-color`, `accent-color` via token, scrollbar (G15 · B; D40)
- [x] Favicon SVG em `static/` + `<link rel="icon">` no `base.html` (G15, D8). O 404 do `/favicon.ico` sumiu do console
- [x] **Sentence case em todas as telas** (D27, D39). Textos da [tabela 7.5](../04-contratos-frontend.md#75-textos-verificados-pelo-test_apppy), `value`s e `name`s intactos; `test_app.py` passando
- [x] Auditoria de contraste AA (nenhum texto abaixo) e de alvos de toque (0 abaixo de 44 px em 375 px; o link do histórico tinha 22 px) (D40)
- [x] Cache-busting: `?v=redesign_v3`
- [x] Critérios de aceite completos (fluxo manual, 375/768/1440 px, `git diff --stat` fora do escopo vazio)
- [x] Descrição do PR destacando a D2 como **pendente de validação do grupo** (entregue ao Renzo; o PR é aberto por ele)

---

## Pendências fora do escopo

Encontradas ou decididas nas Fases 1 a 4. Nenhuma entra nesta sprint.

| Pendência | Por que fica de fora | Categoria |
|---|---|---|
| Emojis dos avatares do chat (🤖/👤) | O `app.js` gera o avatar das mensagens novas; mudar só no Jinja deixaria o histórico diferente | B (B11) |
| Cor da tarefa concluída depois do clique (`#94a3b8`, 2,45:1) | Estilo inline aplicado pelo `app.js` vence o CSS | B (B11) |
| Nota de demo dentro da bolha do chat (`#718096`, estilo inline) | HTML com estilo gerado pelo `app.js` | B (B11) |
| Cor da nota no badge da lista de seminários do tópico (hoje sempre verde) | Exige um `{% if %}` novo em `study_topic.html` | Lógica Jinja |
| Nota exibida com decimal ("61.7%") | Exige um filtro Jinja (`round`/`int`) | Lógica Jinja |
| Plural de "1 registros" no histórico | Exige lógica Jinja | Lógica Jinja |
| Texto "No file chosen" do input de arquivo | Texto do navegador; traduzir exige JS | B |
| Feedback por questão do seminário não aparece | Escopo de variável no Jinja ([B1](../05-achados-frontend.md), ✅ confirmado) | B |
| "Piso" de imagens e de animações do taste-skill | Vale para landing pages, não para telas de app | — |
| Tema escuro | Fora do escopo da sprint | — |
| "Dia N:" repetido no título do dia do plano, logo acima de "Sessão N" (D23) | Texto gerado pelo fallback do `ai_service.py:249`; ver [backend-pendencias §14](../handoff/backend-pendencias.md#14-dia-n-repetido-no-título-do-dia-do-plano) | C |
| Emojis no conteúdo do chat (📚 🎯 🚀 🧭 💬 💡) | Texto gerado pelo `ai_service.py` (fallback e modelo do prompt); ver [backend-pendencias §15](../handoff/backend-pendencias.md#15-emojis-no-conteúdo-gerado) | C |
| Script `unpkg.com/lucide@latest` no `base.html`: **carregado e não usado — remover junto com a revisão das CDNs** | Nenhum template usa `data-lucide` e os ícones agora são SVG inline (D11). Remover mexe em CDN | B (versões de CDN) |
| Texto do "digitando" já termina em "..." (`app.js:59`); os 3 pontos animados (D36) ficam antes dele, e a mensagem é longa para uma bolha de espera | Mudar o texto é mudar o `app.js` | B (Fase 4) |
| Desabilitar o "Perguntar à IA" (`#sendBtn`) durante o envio do chat; o CSS do desabilitado (D34) está pronto | Exige o `app.js` aplicar `disabled`/`aria-busy` | B (B4; Fase 4) |
| Saída animada do modal (hoje só a entrada anima, D32) | Exige o JS aplicar uma classe e esperar a transição antes do `display:none` | B (B5; Fase 4) |
| Nome acessível do `#chatMessages`: o Chrome o põe na ordem do Tab (área rolável) e o leitor de tela anuncia só o conteúdo | `aria-label`/`role="log"` entram junto com os itens de acessibilidade do grupo | B (B5; Fase 4) |
| Certo/errado na alternativa escolhida (D35) não aparece | Depende do `feedback_item` que o B1 deixa `None` | B (B1; Fase 4) |

---

## Contexto para retomar

As regras da sprint (git, escopo, contratos, skills e protocolo de cada fase) estão no `CLAUDE.local.md`, carregado automaticamente. Este arquivo guarda o progresso e as decisões.

**A sprint 01 está concluída — aguardando revisão.** As 4 fases foram fechadas; o próximo passo é o PR `feat/redesign-visual` → `main`, aberto pelo Renzo.

1. **Revisão do PR pelo grupo.** Pontos que precisam de validação explícita: a **D2** (escala de nota ≥ 70 / 50–69 / < 50 e os títulos novos, "pendente de validação do grupo"), as animações da D32 e o sentence case da D39.
2. **Se a revisão pedir ajustes:** trabalhar na mesma branch, rodar `DATABASE_PATH=<arquivo temporário> .venv/bin/python -m unittest test_app.py`, subir o `?v=` (próximo: `redesign_v4`) e repetir o passeio de `../studyia-screenshots/fase4/`. Para testar no navegador sem tocar no `studyia.db`: `DATABASE_PATH=<arquivo temporário> .venv/bin/flask --app app run --port 5055` (o Flask sem debug guarda os templates em cache: reiniciar depois de editar um template).
3. **Depois do merge:** o [06-padroes-visuais.md](../06-padroes-visuais.md) vira a referência (hoje "aguardando aprovação do grupo"); os aliases `--chakra-*` do `tokens.css` podem sair num PR separado, porque nenhum template os usa mais.
4. **Próxima sprint (candidatos, dependem do grupo):** os itens B das [Pendências fora do escopo](#pendências-fora-do-escopo), começando por B1 (feedback do seminário; destrava a D35), B4 (loading e anti-clique-duplo; o CSS do desabilitado já está pronto), B5 (modal acessível, nome do `#chatMessages`, saída animada) e B11 (avatares e cores inline do `app.js`). Do backend, os itens 8, 9, 14 e 15 de [handoff/backend-pendencias.md](../handoff/backend-pendencias.md) são os que mais afetam o visual.
