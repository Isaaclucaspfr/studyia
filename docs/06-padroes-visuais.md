# 06 — Padrões visuais

> **Status: aguardando aprovação do grupo.** Implementado na [sprint 01](sprints/sprint-01-redesign-visual.md) (branch `feat/redesign-visual`, 17/11/2026). Depois do merge do PR, este arquivo vira a referência visual do StudyIA. As decisões que levaram a cada valor (D1–D40) estão no [registro da sprint](sprints/sprint-01-redesign-visual.md#registro-de-decisões).
>
> **Rebrand azul (24/11/2026, branch `feat/rebrand-azul`):** a identidade verde-petróleo "Caderno quieto" foi trocada pela identidade azul tecnológica, com logo novo. Mudaram os **valores** dos tokens, o logo, o favicon e o botão primário (gradiente); os nomes dos tokens, os componentes e o comportamento continuam os mesmos. Detalhes em [§8](#8-identidade-azul-rebrand).

## Princípios

- **Mesmo stack:** HTML + Jinja + CSS puro + o `app.js` existente. **Sem React, sem Tailwind, sem build step, sem npm.** Ícones em SVG inline (sprite no `base.html`), sem biblioteca.
- **Dois arquivos de CSS**, carregados pelo `base.html` nesta ordem: `static/css/tokens.css` (só variáveis) e `static/css/style.css` (componentes e telas, mobile-first). Ao mudar qualquer um deles, subir o `?v=` dos dois `<link>` (hoje `rebrand_v1`; o favicon também leva `?v=`).
- **Nenhum contrato de [04-contratos-frontend.md](04-contratos-frontend.md) é quebrado.** As classes usadas pelo JS ou geradas pelo backend continuam existindo.
- **Inspiração:** a anatomia de componentes do shadcn/ui (estrutura simples, variantes por modificador, estados explícitos), feita **em CSS puro**.
- **Direção (D1, com a identidade azul do rebrand):** app de estudos calmo e legível, com cara de tecnologia **só onde a marca aparece**. A cor aparece onde há progresso, nota e a ação principal; o resto é neutro (neutros levemente azulados). Superfícies com borda de 1 px e sem sombra em repouso; sombra só no que flutua (o painel do tema). **Um único gradiente:** o do botão primário (decisão do grupo no rebrand). Fora dele: sem gradiente, sem brilho/glow, sem glass, sem borda colorida lateral, sem eyebrow, sem emoji como ícone. O "tecnológico" fica no logo e, depois, na cena 3D da landing.
- **Componentes usam só tokens semânticos** (`--color-*`, `--space-*`, `--text-*`, `--radius-*`, `--duration-*`). Nenhuma cor literal em template, CSS de componente ou JS. Primitivos (`--neutral-*`, `--accent-*`…) também não: eles só têm o valor claro e quebram o tema escuro (ver [§7](#7-temas-claro-e-escuro)).
- **Dois temas** (feature 02): claro e escuro, com os mesmos tokens semânticos. Toda cor nova precisa de valor nos dois ([§7](#7-temas-claro-e-escuro)).

## 1. Tokens (`static/css/tokens.css`)

### Cor

Primitivos em escalas (`--neutral-*`, `--accent-*`, `--success-*`, `--warning-*`, `--danger-*`), **só do tema claro**; os componentes usam os semânticos abaixo, que têm um valor em cada tema. Contrastes WCAG medidos (claro · escuro). Como o tema é aplicado: [§7](#7-temas-claro-e-escuro).

| Token | Claro | Escuro | Uso | Contraste (claro · escuro) |
|---|---|---|---|---|
| `--color-bg` | `#F4F7FB` | `#00152B` | fundo da página, área do chat | — |
| `--color-surface` | `#FFFFFF` | `#061E39` | cards, campos, bolha da IA, navbar | — |
| `--color-surface-muted` | `#E9EFF6` | `#102D4D` | badges neutros, aviso de transparência, desabilitado, hover neutro | — |
| `--color-surface-raised` / `-hover` | `#FFFFFF` / `#E9EFF6` | `#0B2645` / `#133353` | o que flutua sobre a página (painel do tema) e o hover dentro dele | sutil por cima: 5,5 / 4,8 · 5,9 / 5,0 |
| `--color-border` | `#DCE3EC` | `#18385B` | bordas de card, divisórias, trilho da barra de progresso | — |
| `--color-border-strong` | `#C1CCDA` | `#24486F` | botão secundário, alternativa, painel flutuante, separador do logo | — |
| `--color-border-input` | `#7D8CA1` | `#5C84AF` | borda de campo, checkbox, radio | 3,4 · 4,3 (não-texto) |
| `--color-text` | `#0B1A2E` | `#E8F1FB` | tinta | 17,5 · 14,7 (na superfície) |
| `--color-text-secondary` | `#475A71` | `#A8BDD5` | texto de apoio | 7,1 · 8,7 |
| `--color-text-subtle` | `#596A80` | `#8CA4C0` | placeholder, hora, desabilitado, tarefa concluída | 5,5 · 6,5 (4,8 · 5,4 no muted) |
| `--color-text-inverse` | `#FFFFFF` | `#00152B` | texto sobre fundo invertido | — |
| `--color-accent` | `#0B5FCC` | `#38D1FF` | progresso, foco, checkbox e radio marcados, links, contorno, fantasma, "IA" e cérebro do logo | texto por cima 6,0 · 10,3 |
| `--color-accent-hover` / `-active` | `#0A50AD` / `#08418E` | `#6ADDFF` / `#93E7FF` | hover / pressionado (no escuro clareia) | 7,6 · 11,7 / 9,7 · 13,2 |
| `--color-on-accent` | `#FFFFFF` | `#00152B` | texto e ✓ sobre o acento | ver acento |
| `--color-link` / `--color-focus` | `#0B5FCC` | `#38D1FF` | links / anel de foco | 6,0 · 9,4 |
| `--color-accent-soft` | `#EAF2FE` | `#072F4B` | alternativa marcada, fundo de hover | acento por cima 5,3 · 7,7 |
| `--color-accent-soft-active` | `#D3E4FC` | `#0C3C5E` | pressionado do contorno e do fantasma | acento por cima 4,6 · 6,4 |
| `--color-accent-soft-border` | `#A7C9F5` | `#1C5F86` | borda da alternativa marcada e do botão de contorno | — |
| `--color-primary` | `#0B5FCC` | igual | **novo (rebrand):** bolha do usuário (chapada) e cor de fundo de reserva do botão primário | branco por cima 6,0 |
| `--color-on-primary` | `#FFFFFF` | igual | **novo:** texto do botão primário e da bolha do usuário | ver gradiente |
| `--gradient-primary` (`-hover`, `-active`) | `135deg, #0874D9 → #1F4FD1` (hover `#0767C2 → #1A44B5`, pressionado `#065AA8 → #163A9C`) | igual | **novo:** fundo do `.btn-primary`. O único gradiente da interface | branco no ponto mais claro: 4,7 (hover 5,6, pressionado 6,9); no mais escuro: 6,8 |
| `--color-success` / `-text` / `-soft` / `-border` | `#18794E` / `#105C3A` / `#EAF6F0` / `#A5D5BD` | `#4FD39C` / `#80E2B8` / `#06292A` / `#1E5E50` | concluído, nota alta | cor/superfície 5,4 · 8,9; texto/soft 7,2 · 9,9 |
| `--color-warning` / `-text` / `-soft` / `-border` | `#B26E00` / `#8A5300` / `#FFF5DB` / `#EECF89` | `#F2B649` / `#F7CC78` / `#2A2410` / `#5E4A1C` | pendente, nota média, aviso de demo | texto/soft 5,8 · 10,2; `warning` só gráfico no claro (4,1) |
| `--color-danger` / `-text` / `-soft` / `-border` | `#C0262D` / `#9B1B21` / `#FDEFEF` / `#F0AEB1` | `#FF8A8F` / `#FFA9AC` / `#311626` / `#6E2F45` | "Sair", excluir, erro, nota baixa | 5,9 · 7,4; texto/soft 7,3 · 9,0 |
| `--color-danger-soft-active` | `#FBE2E3` | `#432033` | pressionado do "Sair" e do excluir | "Sair" por cima 4,8 · 6,2 |
| `--color-selection` | `#D3E4FC` | `#12406A` | `::selection` | tinta por cima 13,5 · 9,4 |
| `--color-scrollbar` | `#C1CCDA` | `#24486F` | polegar das barras de rolagem | — |
| `--color-code-bg` / `-text` | `#0B1A2E` / `#F4F7FB` | `#000C1A` / `#E8F1FB` | bloco de código no chat (no escuro, mais fundo que a página) | 16,3 · 17,2 |
| `--icon-select-arrow` | SVG com traço `#475A71` | SVG com traço `#A8BDD5` | seta do `<select>` (imagem; o `<select>` não aceita `::before`) | 7,1 · 8,7 |

Primitivos novos no rebrand: `--accent-400` (início do gradiente), `--accent-450` e `--accent-550` (inícios do hover e do pressionado) e a escala `--electric-500/600/700` (fim do gradiente). A sombra flutuante do claro passou a usar a tinta azul (`rgb(11 26 46 / …)`).

**Removidos na feature 02:** os aliases `--chakra-*` (66) e `--gray-*` (4), sem uso desde a sprint 01, e os tokens do modal (`--color-overlay`, `--shadow-overlay`, `--z-modal`), sem uso desde a feature 01.

### Tipografia

- **Família:** Atkinson Hyperlegible Next (Google Fonts, 400/600/700) com fallback `system-ui`. É a fonte de **todo** o texto do app.
- **Wordmark do logo (rebrand):** Inter 600, −0,03em (`--font-brand`, `--tracking-brand`), num subconjunto local só com os 7 glifos de "StudyIA" (`static/vendor/fonts/inter-wordmark-600.woff2`, 1,3 KB, licença em `Inter-OFL.txt`, pré-carregado no `base.html`). A família se chama `"Inter Wordmark"` para não colidir com a Inter completa dos títulos da landing (PR 4). Sem a fonte, o wordmark cai na Atkinson. Algarismos proporcionais por padrão; números que alinham usam `font-variant-numeric: tabular-nums`.
- **Escala:** `--text-xs` 12 (badge) · `--text-sm` 13 (metadados, botão pequeno, dica) · `--text-ui` 14 (interface) · `--text-base` 16 (leitura, campos, h3) · `--text-lg` 20 (h2) · `--text-xl` 24 (h1, KPI) · `--text-2xl` 36 (nota).
- **Altura de linha:** 1,2 títulos · 1,35 rótulos · 1,5 interface · 1,6 leitura. Títulos com `-0.015em` e `text-wrap: balance`.
- **Caixa:** sentence case em tudo (títulos, botões, rótulos, badges), exceto os textos da [tabela 7.5](04-contratos-frontend.md#75-textos-verificados-pelo-test_apppy) e nomes próprios.

### Espaço, raio, sombra, controles

- **Espaço** (base 4 px): `--space-0-5` 2 · `-1` 4 · `-1-5` 6 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-8` 32 · `-10` 40 · `-12` 48 · `-16` 64.
- **Raio:** `--radius-xs` 4 (checkbox) · `-sm` 6 (botão, campo) · `-md` 8 (card, alerta) · `-lg` 12 (reservado para superfície flutuante grande) · `-full` (badges, barra).
- **Sombra:** só `--shadow-floating` (painel do tema), com um valor por tema (mais densa no escuro). Nada em repouso.
- **Layout:** `--container-max` 1200 px; `--gutter` 16 px (24 px a partir de 640); `--nav-height` 56 px.
- **Controles:** campos sempre com 44 px e fonte de 16 px (sem zoom no iOS). Botões com `--touch-min` 44 px abaixo de 768 px e `--control-h` 40 px (36 px no `.btn-sm`) a partir daí.
- **Ícones:** `--icon-sm` 16 · `--icon-md` 18 · `--icon-lg` 24, traço de 1,5 px na tela.

### Movimento

- `--duration-instant` 100 ms (pressionar) · `--duration-fast` 150 ms (cor, borda, ponto do radio) · `--duration-base` 200 ms (barra, entrada de mensagem) · `--duration-slow` 300 ms (painel da nota).
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
| ~~Modal~~ | removido na feature 01 (o histórico do git guarda o CSS). Os tokens `--color-overlay`, `--shadow-overlay` e `--z-modal` saíram na feature 02 |
| Auth | `.auth-page`, `.auth-card`, `.auth-header`, `.auth-title`, `.auth-subtitle`, `.auth-footer` |
| Telas | `.flows`, `.flow-card`, `.flow-head`, `.topic-layout`, `.topic-side`, `.site-footer` |
| Navbar | `.navbar`, `.nav-brand`, `.brand-mark` (+ `.brand-mark-node`), `.brand-name` (+ `.brand-name-accent`, o "IA"), `.brand-sep` (separador vertical, ≥ 640 px), `.brand-badge`, `.nav-actions` (seletor + `.nav-user`), `.nav-user`, `.nav-btn-label` (rótulo que some abaixo de 640 px), `.user-badge`, `.user-name` |
| Seletor de tema | `.theme-switch` (só aparece com a classe `js` no `<html>`), `.theme-toggle` (+ `.theme-icon--light/--dark/--system`), `.theme-menu` (`[popover]`), `.theme-options`, `.theme-option` (+ `-input`, `-text`, `-hint`, `-check`), `.theme-switching` (no `<html>` durante a troca). Detalhes no [§7](#seletor-de-tema) |
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
| **Superfícies do navegador** | `::selection`, `caret-color`, `accent-color` e barras de rolagem (finas no chat) com a paleta. `color-scheme` (claro/escuro) faz os controles nativos acompanharem o tema: lista do `<select>`, botão do input de arquivo, barras de rolagem |

## 4. Movimento

- Só CSS. Animar `transform` e `opacity`; a exceção é a `width` da barra de progresso, que o contrato manda controlar por `style.width`.
- Nada anima no histórico nem em listas no carregamento. As mensagens novas do chat animam porque não têm `.markdown-content` (só o `app.js` as cria).
- Saídas são instantâneas (o painel do tema fecha na hora).
- **Troca de tema sem transição:** o `theme.js` põe a classe `.theme-switching` no `<html>` por um quadro, e ela zera as transições. Sem isso, cada botão e cada borda mudariam de cor no seu próprio tempo (efeito "onda").
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
| Painel do tema: opacidade + de .97 e 4 px acima para 1, a partir do canto do botão (`@starting-style`) | 150 ms, ease-out |
| Painel da nota: opacidade + 8 px, uma vez | 300 ms, ease-out |

## 5. Regra: nada de `style=""` inline

Novos estilos vão **sempre** para classes no CSS. Os 183 `style=""` originais viraram classes; restam só as exceções abaixo.

### Exceções permitidas

| Caso | Por quê |
|---|---|
| `style="width: {{ … }}%"` em `.progress-bar-fill` (`plan_view.html`, `study_topic.html`) | valor dinâmico vindo do banco. O `#planProgressBar` ainda é **atualizado pelo JS via `style.width`** (contrato) |
| ~~`style.display` no `#settingsModal`~~ | removido na feature 01 |
| `style.textDecoration` / `style.color` em `#label_<task_key>` | escrito pelo JS (`app.js:144-149`). Desde a feature 02 a cor é `var(--color-text-subtle)`: o inline segue o tema e é igual à do `.is-done` do CSS. O mecanismo (inline no JS) continua; unificar com a classe é o [B11](05-achados-frontend.md#b11-duplicações-) |
| ~~HTML com `style` gerado no JS (`app.js:118`, nota de demo)~~ | resolvido na feature 01: a nota usa a classe `.chat-demo-note` |

Para valores dinâmicos novos, prefira uma **CSS custom property** no elemento (`style="--progress: 40%"`) consumida pela classe, sem trocar o mecanismo das exceções acima sem alinhar com o JS.

## 6. Ícones

SVG inline num sprite no topo do `base.html`, traço de 1,5 px na tela, sempre `aria-hidden="true" focusable="false"`:

```html
<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-nome"></use></svg>
```

Ícones: `user`, `book`, `calendar`, `target`, `search`, `file`, `trash`, `download`, `refresh`, `lock`, `info`, `chat`, `database`, `clock`, `check`, `minus`, `x`, `alert`, `arrow-left`, `arrow-right`, `plus`, `sun`, `moon`, `monitor` (os 3 últimos do seletor de tema). Assunto = `search`, arquivo = `file`. Botões só com ícone levam o nome em `.sr-only` ou `aria-label`. Favicon: `static/favicon.svg` (versão simplificada do cérebro: um traço por hemisfério, em ciano `#38D1FF` sobre um quadrado marinho `#00152B`; funciona nas abas claras e escuras). O `i-book` continua no sprite: é o ícone de "Tópicos de estudo" e do estado vazio, não a marca.

## 7. Temas (claro e escuro)

Entrou na [feature 02](features/02-tema-claro-escuro-dispositivo.md). A pessoa escolhe **Claro**, **Escuro** ou **Dispositivo** (o padrão, que segue o sistema operacional) no seletor da navbar. A escolha fica **só no navegador**: nada vai ao servidor.

### Tokens semânticos: a regra que sustenta os dois temas

Os componentes não sabem qual tema está ativo. Eles leem só tokens semânticos (`--color-bg`, `--color-text`, `--color-accent`…), e é o `tokens.css` que dá um valor diferente a cada token em cada tema. Por isso:

- **Nunca** use cor literal (`#hex`, `rgb()`, `white`) num componente, no template ou no JS. No escuro ela fica igual à do claro, e quase sempre ilegível.
- **Nunca** use um primitivo (`--neutral-500`, `--accent-100`…) direto num componente. Os primitivos só existem com o valor claro; o escuro não os redefine.
- No JS, se precisar escrever uma cor, escreva o token: `label.style.color = 'var(--color-text-subtle)'` (como o `app.js` faz no checklist).
- Ícone em SVG de dados (`url("data:image/svg+xml,…")`) não herda `currentColor`. Use o SVG como **máscara** e pinte com `background-color: var(--token)` (padrão do ✓ do checkbox e dos ícones dos alertas). Onde não houver `::before` (a seta do `<select>`), crie um token de imagem por tema (`--icon-select-arrow`).

### Os dois temas

| | Claro | Escuro |
|---|---|---|
| Fundo · superfície · muted | `#F4F7FB` · `#FFFFFF` · `#E9EFF6` | `#00152B` · `#061E39` · `#102D4D` |
| Elevação (o que flutua) | igual à superfície, separada pela sombra | `#0B2645`, um tom acima dos cards (a sombra quase não aparece no escuro) |
| Tinta | `#0B1A2E` | `#E8F1FB` |
| Acento | azul `#0B5FCC`, texto branco por cima; hover **escurece** | ciano `#38D1FF`, texto marinho (`#00152B`) por cima; hover **clareia** |
| Botão primário e bolha do usuário | gradiente `#0874D9 → #1F4FD1` / azul `#0B5FCC`, texto branco | **iguais ao claro** (azul com texto branco, como na referência) |
| Estados (sucesso, atenção, perigo) | tinta escura sobre fundo suave claro | tinta clara sobre fundo suave escuro, mesma lógica |
| Código no chat | bloco escuro na página clara | bloco **mais escuro** que a página, para não sumir |
| `color-scheme` | `light` | `dark` (controles nativos e barras de rolagem escuros) |

Hierarquia de superfícies no escuro: **fundo < superfície < elevada < muted**, sempre com a borda de 1 px. Sem sombra em repouso nos dois temas; no escuro a separação vem do tom e da borda.

### Como o mecanismo funciona

| `data-theme` no `<html>` | Sistema claro | Sistema escuro |
|---|---|---|
| ausente (Dispositivo) | claro (`:root`) | escuro (bloco **4a**) |
| `light` | claro | claro |
| `dark` | escuro (bloco **4b**) | escuro (bloco **4b**) |

1. **`tokens.css`:** a seção 2 define os semânticos no `:root` (claro). A seção 4 redefine **os mesmos nomes** com os valores escuros, em dois blocos **idênticos**:
   - **4a:** `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` (Dispositivo com o sistema escuro);
   - **4b:** `:root[data-theme="dark"] { … }` (Escuro escolhido).

   Sem build step não dá para escrever o bloco uma vez só (`light-dark()` foi descartado no doc 02 §5.2). Mudou um, mude o outro.
2. **Script inline no `<head>` do `base.html`, antes de qualquer `<link>`:** lê a chave `studyia-theme` do `localStorage` e põe o `data-theme` no `<html>` antes da primeira pintura (sem flash). Também põe a classe `js`, que faz o seletor aparecer. **Não mover** para depois do CSS nem para um arquivo com `defer`.
3. **`static/js/theme.js` (`defer`):** cuida só do seletor (abrir, fechar, teclado, gravar a escolha, dica "Segue o sistema (claro/escuro)" ao vivo). Não usa nada do `app.js`, e o `app.js` não usa nada dele.
4. **Dispositivo ao vivo:** sem `data-theme`, quem troca a paleta é o próprio `@media` quando o sistema muda; o `theme.js` só desliga as transições nesse quadro e atualiza a dica.
5. **Sem JavaScript:** o seletor some (`.js .theme-switch`) e a página segue o sistema.

### Seletor de tema

- `.theme-toggle`: botão de 44 × 44 px na navbar, **fora** do `{% if session.get('user_id') %}` (aparece também no login e no cadastro). O ícone mostra a escolha (sol, lua ou monitor) e vem só do CSS, pelo `data-theme`, sem esperar o JS. O rótulo "Tema" some abaixo de 640 px (`.nav-btn-label`), e o nome acessível é "Tema: <escolha>".
- `.theme-menu`: painel `[popover]` (top layer; Esc e clique fora são do navegador), na superfície elevada, com borda forte e `--shadow-floating`. Fallback com `[hidden]` para navegador sem `popover`.
- `.theme-option`: um `<label>` de 44 px com um radio nativo escondido. Setas trocam o tema ao vivo com o painel aberto; Enter escolhe e fecha; clique escolhe e fecha. Escolhida: semibold e ✓ no acento. Foco: anel na linha inteira. Hover: `--color-surface-raised-hover`.

### Como adicionar uma cor nova (nos dois temas)

1. **Procure um token que já sirva** na [tabela de cor](#cor). Reaproveitar é o caminho preferido.
2. **Crie o token semântico** na seção 2 do `tokens.css`, com o nome pelo **papel** (`--color-<papel>`, nunca pela cor: `--color-highlight`, não `--color-yellow`). O valor claro aponta para um primitivo (crie o primitivo na seção 1, se faltar).
3. **Dê o valor escuro nos DOIS blocos**, 4a e 4b, com o mesmo valor e o mesmo comentário. Para conferir que os blocos continuam iguais (bash):

   ```bash
   diff <(sed -n '/^@media (prefers-color-scheme: dark)/,/^}/p' static/css/tokens.css | sed 's/^  //' | grep -- '--') \
        <(sed -n '/^:root\[data-theme="dark"\]/,/^}/p' static/css/tokens.css | grep -- '--') && echo "4a == 4b"
   ```
4. **Meça o contraste nos dois temas** contra o fundo em que a cor vai aparecer (texto ≥ 4,5:1; texto grande, ícone e borda de campo ≥ 3:1) e anote no comentário do token. No escuro, cores claras e pouco saturadas funcionam melhor que a versão clara da paleta com o brilho aumentado.
5. **Use só o token** no `style.css`: `color: var(--color-<papel>)`.
6. **Suba o `?v=`** dos dois `<link>` do `base.html`.
7. **Confira na tela** nos dois temas, em 375 e 1440 px: pelo seletor, ou no DevTools (Ctrl+Shift+P → "Rendering" → `prefers-color-scheme`).
8. **Acrescente a linha** na tabela de cor do §1, com os dois valores e os dois contrastes.

Exemplo:

```css
/* tokens.css, seção 2 (claro) */
--color-highlight: var(--warning-50);
/* tokens.css, blocos 4a E 4b (escuro) */
--color-highlight: #2A2313;  /* tinta por cima: 12,9 */

/* style.css */
.mark-highlight { background-color: var(--color-highlight); }
```

## 8. Identidade azul (rebrand)

Entrou no PR `feat/rebrand-azul` (24/11/2026), a partir da referência de tela de login aprovada pelo grupo. **✅ Aprovado pelo Renzo em 24/11/2026:** a paleta dos dois temas, o logo com circuito, o favicon (versão simplificada com um traço por hemisfério), o wordmark em Inter 600 com −0,03em e o gradiente de 135° do botão primário. Testado no navegador nos temas Claro, Escuro e Dispositivo, com o favicon conferido numa aba real. É a primeira de 4 entregas até a apresentação (rebrand → correções rápidas → login/cadastro → landing), para que as telas novas já nasçam com a identidade.

### Da referência para os tokens

A referência foi usada como **direção**, não como valores exatos: vários pares dela reprovam no AA.

| Referência | Uso na referência | Problema | Como ficou |
|---|---|---|---|
| `#00152B` marinho | fundo | nenhum (branco por cima: 18,4) | `--color-bg` do escuro, **sem ajuste** |
| `#102D4D` | fundo de campo | nenhum | `--color-surface-muted` do escuro, **sem ajuste**. Os campos continuam na `--color-surface` (`#061E39`), um tom abaixo, para o campo não se confundir com o badge e o desabilitado |
| borda azul clara | borda de campo | — | `--color-border-input` `#5C84AF` (4,3:1, não-texto) |
| `#00CFFF` ciano | destaques, ícones | branco por cima: **1,8** | acento do escuro `#38D1FF` (um pouco mais claro), **com texto marinho por cima** (10,3). No claro o ciano não tem contraste sobre branco (1,8), então o acento claro é o azul `#0B5FCC` |
| `#007BFF` azul elétrico | botões, gradiente | branco por cima: **4,0** | gradiente `#0874D9 → #1F4FD1`: o início é um azul mais profundo e puxado para o ciano (4,7) e o fim, o azul elétrico escurecido (6,8). Mesmo botão nos dois temas |
| branco | texto | ofusca em leitura longa | tinta `#E8F1FB` (16,1 no fundo) |

O tema claro é a mesma família em versão clara: neutros levemente azulados, tinta marinho `#0B1A2E` (o fundo do escuro, clareado só o bastante para ler) e o azul `#0B5FCC` como acento. As cores de estado (sucesso, atenção, perigo) e a escala de nota (D2) continuam semânticas, com tons levemente ajustados para conviver com o azul.

### Logo

- **Marca:** cérebro visto de cima, em linhas (traço de 1,5 px em 24 px), com trilhas de circuito saindo da fissura central e terminando em 4 nós cheios: a rede neural. Na cor do acento: azul no claro, ciano no escuro. SVG inline no `base.html` (`.brand-mark`), sem `<rect>` de fundo.
- **Wordmark:** "Study" na tinta + "IA" no acento, em Inter 600 com −0,03em (5,9:1 no claro, 9,4:1 no escuro).
- **Separador + "Projeto A3":** linha vertical de 1 px (`--color-border-strong`) e o texto secundário em 13 px. Os dois somem abaixo de 640 px, como o selo já fazia (D13).
- **Favicon:** versão simplificada (um traço por hemisfério, 2 nós), ciano sobre um quadrado marinho, legível em 16 px nas abas claras e escuras. É o único lugar com hex fora do `tokens.css`: um SVG avulso não lê variáveis CSS.
- **Fonte do wordmark:** a Inter foi escolhida para o wordmark (e não a Atkinson) porque a Atkinson Next não tem serifa no "I" maiúsculo, então não ganha em legibilidade no "IA", e a Inter amarra o logo aos títulos da landing (PR 4).

### Regras

- O **gradiente é exclusivo do `.btn-primary`**. Nada de gradiente em card, fundo, texto ou borda; nada de brilho/glow em lugar nenhum.
- O botão primário e a bolha do usuário **não mudam com o tema** (`--color-primary*`, `--gradient-primary*` só no `:root`, fora dos blocos 4a/4b). O resto do acento muda: azul no claro, ciano no escuro.
- O `.btn-primary` usa `background-origin: border-box`, para o gradiente cobrir a borda transparente do `.btn`, e o desabilitado zera o `background-image`.
- O hover e o pressionado do primário trocam o gradiente sem transição (gradiente não interpola). A escala de pressão (.98) continua.

