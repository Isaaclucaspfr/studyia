# 06 — Padrões visuais

> **Status: aguardando aprovação do grupo.** Implementado na [sprint 01](sprints/sprint-01-redesign-visual.md) (branch `feat/redesign-visual`, 17/11/2026). Depois do merge do PR, este arquivo vira a referência visual do StudyIA. As decisões que levaram a cada valor (D1–D40) estão no [registro da sprint](sprints/sprint-01-redesign-visual.md#registro-de-decisões).

## Princípios

- **Mesmo stack:** HTML + Jinja + CSS puro + o `app.js` existente. **Sem React, sem Tailwind, sem build step, sem npm.** Ícones em SVG inline (sprite no `base.html`), sem biblioteca.
- **Dois arquivos de CSS**, carregados pelo `base.html` nesta ordem: `static/css/tokens.css` (só variáveis) e `static/css/style.css` (componentes e telas, mobile-first). Ao mudar qualquer um deles, subir o `?v=` dos dois `<link>` (hoje `redesign_v3`).
- **Nenhum contrato de [04-contratos-frontend.md](04-contratos-frontend.md) é quebrado.** As classes usadas pelo JS ou geradas pelo backend continuam existindo.
- **Inspiração:** a anatomia de componentes do shadcn/ui (estrutura simples, variantes por modificador, estados explícitos), feita **em CSS puro**.
- **Direção "Caderno quieto" (D1):** app de estudos calmo e legível. A cor aparece onde há progresso, nota e a ação principal; o resto é neutro. Superfícies com borda de 1 px e sem sombra em repouso; sombra só no modal. Sem gradiente, sem glass, sem borda colorida lateral, sem eyebrow, sem emoji como ícone.
- **Componentes usam só tokens semânticos** (`--color-*`, `--space-*`, `--text-*`, `--radius-*`, `--duration-*`). Nenhuma cor literal em template.

## 1. Tokens (`static/css/tokens.css`)

### Cor

Primitivos em escalas (`--neutral-*`, `--accent-*`, `--success-*`, `--warning-*`, `--danger-*`); os componentes usam os semânticos abaixo. Contrastes WCAG medidos.

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--color-bg` | `#F5F6F4` | fundo da página, área do chat | — |
| `--color-surface` | `#FFFFFF` | cards, campos, bolha da IA | — |
| `--color-surface-muted` | `#EDEFEC` | badges neutros, aviso de transparência, desabilitado | — |
| `--color-border` | `#E2E5E1` | bordas de card e divisórias | — |
| `--color-border-strong` | `#C5CBC6` | botão secundário, alternativa | — |
| `--color-border-input` | `#868F89` | borda de campo, checkbox, radio | 3,3:1 no branco (não-texto) |
| `--color-text` | `#17201C` | tinta | 16,7 (branco) · 15,4 (fundo) |
| `--color-text-secondary` | `#55605A` | texto de apoio | 6,6 · 6,0 |
| `--color-text-subtle` | `#646E68` | placeholder, hora, desabilitado | 5,3 · 4,9 · 4,6 (muted) |
| `--color-accent` | `#1E6B5C` | botão primário, progresso, links, foco | branco por cima 6,3 |
| `--color-accent-hover` / `-active` | `#18584B` / `#124538` | hover / pressionado | 8,3 / — |
| `--color-accent-soft` | `#EAF3F0` | alternativa marcada, fundo de hover | — |
| `--color-success` / `-text` / `-soft` / `-border` | `#237A4B` / `#1A5E39` / `#EBF5EF` / `#A8D1B8` | concluído, nota alta | texto/soft 7,0 |
| `--color-warning` / `-text` / `-soft` / `-border` | `#B57A10` / `#8A5A00` / `#FFF6DB` / `#EBD38A` | pendente, nota média, aviso de demo | texto/soft 5,5; `warning` só gráfico (3,7) |
| `--color-danger` / `-text` / `-soft` / `-border` | `#B42318` / `#912018` / `#FDF0EE` / `#EDABA2` | "Sair", excluir, erro, nota baixa | 6,6 · texto/soft 7,8 |
| `--color-selection` | `#D3E6E0` | `::selection` | tinta por cima 12,8 |
| `--color-scrollbar` | `#C5CBC6` | polegar das barras de rolagem | — |
| `--color-overlay` | `rgb(23 32 28 / .5)` | fundo do modal | — |
| `--color-code-bg` / `-text` | `#17201C` / `#F5F6F4` | bloco de código no chat | — |

Os aliases `--chakra-*` e `--gray-*` continuam no fim do `tokens.css` por compatibilidade, apontando para a paleta nova. **Nenhum template os usa mais**; podem sair num PR separado.

### Tipografia

- **Família:** Atkinson Hyperlegible Next (Google Fonts, 400/600/700) com fallback `system-ui`. Algarismos proporcionais por padrão; números que alinham usam `font-variant-numeric: tabular-nums`.
- **Escala:** `--text-xs` 12 (badge) · `--text-sm` 13 (metadados, botão pequeno, dica) · `--text-ui` 14 (interface) · `--text-base` 16 (leitura, campos, h3) · `--text-lg` 20 (h2, título do modal) · `--text-xl` 24 (h1, KPI) · `--text-2xl` 36 (nota).
- **Altura de linha:** 1,2 títulos · 1,35 rótulos · 1,5 interface · 1,6 leitura. Títulos com `-0.015em` e `text-wrap: balance`.
- **Caixa:** sentence case em tudo (títulos, botões, rótulos, badges), exceto os textos da [tabela 7.5](04-contratos-frontend.md#75-textos-verificados-pelo-test_apppy) e nomes próprios.

### Espaço, raio, sombra, controles

- **Espaço** (base 4 px): `--space-0-5` 2 · `-1` 4 · `-1-5` 6 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-8` 32 · `-10` 40 · `-12` 48 · `-16` 64.
- **Raio:** `--radius-xs` 4 (checkbox) · `-sm` 6 (botão, campo) · `-md` 8 (card, alerta) · `-lg` 12 (modal) · `-full` (badges, barra).
- **Sombra:** só `--shadow-overlay` (modal). Nada em repouso.
- **Layout:** `--container-max` 1200 px; `--gutter` 16 px (24 px a partir de 640); `--nav-height` 56 px.
- **Controles:** campos sempre com 44 px e fonte de 16 px (sem zoom no iOS). Botões com `--touch-min` 44 px abaixo de 768 px e `--control-h` 40 px (36 px no `.btn-sm`) a partir daí.
- **Ícones:** `--icon-sm` 16 · `--icon-md` 18 · `--icon-lg` 24, traço de 1,5 px na tela.

### Movimento

- `--duration-instant` 100 ms (pressionar) · `--duration-fast` 150 ms (cor, borda, ponto do radio) · `--duration-base` 200 ms (modal, barra, entrada de mensagem) · `--duration-slow` 300 ms (painel da nota).
- `--ease-out` `cubic-bezier(.23, 1, .32, 1)` para tudo que é interação; `--ease-in-out` `cubic-bezier(.77, 0, .175, 1)` reservado para movimento na tela.

### Breakpoints (mobile-first, sempre `min-width`)

| Nome | Media query | Uso |
|---|---|---|
| base | — | 1 coluna, gutter de 16 px, navbar só com ícones |
| `sm` | `640px` | KPIs em 3 colunas, rótulos de botão visíveis, gutter de 24 px |
| `md` | `768px` | botões de 40/36 px, painéis do tópico lado a lado, CTA em linha, cards de fluxo lado a lado |
| `lg` | `1024px` | tópico em 2 colunas (chat 2/3 + lateral 1/3), cabeçalho de página em linha |
| `xl` | `1280px` | container no máximo (1200 px) |

Validar sempre em **375 px** e **1440 px** (e 768 px). O comportamento por tela está na [D21](sprints/sprint-01-redesign-visual.md#17112026--fase-3-aprovadas-pelo-renzo).

## 2. Componentes

Nomenclatura **plana**, igual à original (`.btn`, `.card`), com variantes por classe adicional. Nenhuma classe antiga foi renomeada.

| Componente | Classes |
|---|---|
| Botão | `.btn` + `.btn-primary` · `.btn-secondary` · `.btn-purple` (= secundário, D3) · `.btn-outline` · `.btn-danger-outline` · `.btn-ghost` + `.btn-sm` · `.btn-block` · `.btn-icon` · `.btn-collapse` (+ `.btn-label-collapse`) |
| Campo | `.form-group`, `.form-control` (input, select com seta SVG, textarea, file com `::file-selector-button`), `.form-hint`, `.form-error`, `.form-actions`, `.form-submit` |
| Card | `.card`, `.card-header` (+ `--divided`), `.card-title`, `.card-subtitle`, `.card-text` |
| Página | `.page-header`, `.page-heading`, `.page-title-row`, `.page-title`, `.page-subtitle`, `.page-meta`, `.page-actions`, `.back-link`, `.narrow-page`, `.meta-label`, `.meta-line`, `.link-action` |
| Lista | `.list-item` (+ `-media`, `-body`, `-title`, `-link`, `-meta`, `-actions`, `--stack`), `.row-between`, `.item-title`, `.item-meta` |
| Badge | `.badge` + `.badge-subject` · `.badge-file` · `.badge-neutral` (neutros) · `.badge-completed` · `.badge-pending` · `.badge-danger` |
| Alerta (flash) | `.alert` + `.alert-success` · `-danger` · `-warning` · `-info` (contrato do backend); ícone por máscara SVG no `::before` |
| Avisos | `.notice` + `.notice-text` (modo demo, âmbar) · `.ai-notice` (transparência, cinza) |
| Estado vazio | `.empty-state` (+ `-icon`, `-title`, `-text`, `--compact`) |
| KPIs | `.stats`, `.stat`, `.stat-label`, `.stat-value`, `.stat-empty` |
| Progresso | `.progress-bar-container` (+ `.progress-lg`), `.progress-bar-fill`, `.progress-card`, `.progress-summary`, `.progress-label`, `.progress-value`, `.progress-foot` |
| Tarefa | `.task-list`, `.task-item` (o `<label>`), `.plan-task-checkbox` (contrato), `.task-text` (+ `.is-done`), `.plan-days`, `.plan-day-header`, `.cta-strip` |
| Chat | `.chat-window`, `.chat-header`, `.chat-title`, `.chat-count`, `.chat-messages`, `.message-row`, `.avatar-circle`, `.message-content-wrapper`, `.message-sender-name`, `.message-time`, `.chat-bubble.user/.assistant/.typing/.error`, `.chat-demo-note`, `.chat-input-area` (estrutura da bolha é contrato) |
| Seminário | `.score-panel` + `.score--high/mid/low` (≥ 70 / 50–69 / < 50, D2), `.score-head`, `.score-title`, `.score-summary`, `.score-box`, `.score-value`, `.score-label`, `.score-insights`, `.insight` (+ `--positive`, `--review`), `.question-list`, `.question-head`, `.question-title`, `.choices`, `.choice` (+ `.is-selected`, `.is-readonly`, `.is-editable`), `.choice-input`, `.choice-text`, `.feedback` (+ `--correct`, `--partial`, `--incorrect`) |
| ~~Modal~~ | removido na feature 01 (o histórico do git guarda o CSS). Os tokens `--color-overlay`, `--shadow-overlay` e `--z-modal` ficaram sem uso |
| Auth | `.auth-page`, `.auth-card`, `.auth-header`, `.auth-title`, `.auth-subtitle`, `.auth-footer` |
| Telas | `.flows`, `.flow-card`, `.flow-head`, `.topic-layout`, `.topic-side`, `.site-footer` |
| Navbar | `.navbar`, `.nav-brand`, `.brand-mark` (+ `-glyph`), `.brand-badge`, `.nav-user`, `.nav-btn-label` (sem uso; reservado para o seletor de tema), `.user-badge`, `.user-name` |
| Grade | `.container`, `.grid-2`, `.grid-3` |
| Ícone e acessibilidade | `.icon` (+ `-sm`, `-lg`), `.icon-sprite`, `.sr-only` |

## 3. Estados

| Estado | Regra |
|---|---|
| **Hover** | só em `@media (hover: hover)`; muda fundo ou borda, nunca o tamanho. Cards não clicáveis **não** têm hover (G5, D37) |
| **Pressionado** | botões: escala .98 + tom mais escuro; checkbox e radio (ou a linha deles): caixa a .9; linha da tarefa um tom mais escura |
| **Foco** | `:focus-visible` global: anel de 2 px no acento com 2 px de afastamento (5,9–6,3:1 em todos os fundos). Tarefa e alternativa: o anel envolve a linha inteira (`:has(:focus-visible)`). `#chatMessages`: anel para dentro. Bolha do usuário: anel na cor do texto. Campos: borda + anel também no clique (`:focus`) |
| **Desabilitado** | `:disabled, [aria-disabled="true"]`: texto sutil sobre `--color-surface-muted` (4,6:1), borda neutra, `cursor: not-allowed`, sem hover nem pressão. Sem opacidade (D34). `textarea` desabilitada sem alça |
| **Carregando** | ⚠️ não existe ainda: quem aplica o estado é o JS ([B4](05-achados-frontend.md)). Até lá, usar o desabilitado |
| **Vazio** | `.empty-state`: ícone, título, uma frase e uma ação |
| **Erro** | `.form-error`, `.alert-danger`, `.chat-bubble.error` (tinta, fundo e borda de perigo + ícone de alerta) |
| **Digitando** | `.chat-bubble.typing`: quadro da bolha da IA, texto secundário em 14 px e 3 pontos em onda; parados com movimento reduzido |
| **Concluído (tarefa)** | `.task-item:has(:checked) .task-text` e `.task-text.is-done`: cor sutil + riscado. Depois do clique, o inline do `app.js` vence (ver exceções) |
| **Selecionado (alternativa)** | `.choice:has(:checked)` / `.is-selected`: borda e ponto no acento, fundo `--color-accent-soft`. Com o retorno da questão: verde (correta), âmbar (parcial), vermelho (incorreta), por `.card:has(> .feedback--*)` (D35; ⚠️ depende do B1) |
| **Superfícies do navegador** | `::selection`, `caret-color`, `accent-color` e barras de rolagem (finas no chat e no modal) com a paleta |

## 4. Movimento

- Só CSS. Animar `transform` e `opacity`; a exceção é a `width` da barra de progresso, que o contrato manda controlar por `style.width`.
- Nada anima no histórico nem em listas no carregamento. As mensagens novas do chat animam porque não têm `.markdown-content` (só o `app.js` as cria).
- Saídas são instantâneas (modal fecha na hora).
- **Movimento reduzido:** `@media (prefers-reduced-motion: reduce)` zera duração de transições e animações, para os 3 pontos e remove as escalas de pressão. Tudo desligado (D6).

| O quê | Duração / easing |
|---|---|
| Pressionar botão (escala .98) | 100 ms, ease-out |
| Pressionar checkbox/radio ou a linha deles (caixa a .9) | 100 ms, ease-out |
| Marcar alternativa: ponto de opacidade 0 e escala .5 para 1 | 150 ms, ease-out |
| Cor e borda (hover, texto da tarefa) | 150 ms, ease-out |
| Entrada das mensagens novas: opacidade + 6 px | 200 ms, ease-out |
| "Digitando": 3 pontos em onda | 1 s, linear, infinito |
| Barra de progresso | 200 ms, ease-out |
| Modal: fade do overlay + card de .97 a 1 (`@starting-style`) | 200 ms, ease-out |
| Painel da nota: opacidade + 8 px, uma vez | 300 ms, ease-out |

## 5. Regra: nada de `style=""` inline

Novos estilos vão **sempre** para classes no CSS. Os 183 `style=""` originais viraram classes; restam só as exceções abaixo.

### Exceções permitidas

| Caso | Por quê |
|---|---|
| `style="width: {{ … }}%"` em `.progress-bar-fill` (`plan_view.html`, `study_topic.html`) | valor dinâmico vindo do banco. O `#planProgressBar` ainda é **atualizado pelo JS via `style.width`** (contrato) |
| ~~`style.display` no `#settingsModal`~~ | removido na feature 01 |
| `style.textDecoration` / `style.color` em `#label_<task_key>` | escrito pelo JS (`app.js:167-175`). O inline vence a classe, então, **depois do primeiro clique**, a cor do JS (`#94a3b8`, 2,45:1) prevalece sobre o CSS. Alinhar exige mudar o JS (B11) |
| HTML com `style` gerado no JS (`app.js:118`, nota de demo no chat) | só muda junto com o JS (B11) |

Para valores dinâmicos novos, prefira uma **CSS custom property** no elemento (`style="--progress: 40%"`) consumida pela classe, sem trocar o mecanismo das exceções acima sem alinhar com o JS.

## 6. Ícones

SVG inline num sprite no topo do `base.html`, traço de 1,5 px na tela, sempre `aria-hidden="true" focusable="false"`:

```html
<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-nome"></use></svg>
```

Ícones: `user`, `book`, `calendar`, `target`, `search`, `file`, `trash`, `download`, `refresh`, `lock`, `info`, `chat`, `database`, `clock`, `check`, `minus`, `x`, `alert`, `arrow-left`, `arrow-right`, `plus`. Assunto = `search`, arquivo = `file`. Botões só com ícone levam o nome em `.sr-only` ou `aria-label`. Favicon: `static/favicon.svg` (a marca: livro branco sobre o acento).
