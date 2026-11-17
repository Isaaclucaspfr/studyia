# 06 — Padrões visuais

> **Status: PROPOSTA — aguardando aprovação do grupo.** Nada aqui está implementado. Depois de aprovado, este arquivo vira a referência do redesign.

## Princípios

- **Mesmo stack:** HTML + Jinja + CSS puro + o `app.js` existente. **Sem React, sem Tailwind, sem build step, sem npm.**
- **Tudo no `static/css/style.css`.** Se o arquivo crescer demais, ele pode ser dividido em mais arquivos `.css` carregados pelo `base.html`, ainda sem build.
- **Nenhum contrato de [04-contratos-frontend.md](04-contratos-frontend.md) é quebrado.** As classes atuais usadas pelo JS ou geradas pelo backend continuam existindo.
- **Inspiração:** a anatomia de componentes do shadcn/ui (estrutura simples, variantes por modificador, estados explícitos), feita **em CSS puro**.

## 1. Tokens

### Estratégia de compatibilidade

1. Criar **tokens semânticos** novos (`--color-*`, `--space-*`, `--radius-*` etc.).
2. **Manter** os `--chakra-*` atuais durante a transição, porque os 183 estilos inline ainda dependem deles. Os novos tokens apontam para a paleta existente, sem mudar as cores de partida.
3. **Definir os tokens que hoje faltam** (`--gray-*`, `--chakra-colors-red-200`, `--chakra-colors-purple-300`) como aliases, o que corrige o achado [A1](05-achados-frontend.md) sem tocar no markup.
4. À medida que cada tela sai do estilo inline, ela passa a usar só tokens semânticos. Quando nenhum template usar mais `--chakra-*`, os aliases podem ser removidos num PR separado.

```css
:root {
  /* Cores semânticas (inicialmente = paleta atual) */
  --color-bg:           var(--chakra-colors-gray-50);
  --color-surface:      #fff;
  --color-surface-muted:var(--chakra-colors-gray-50);
  --color-border:       var(--chakra-colors-gray-200);
  --color-text:         var(--chakra-colors-gray-800);
  --color-text-strong:  var(--chakra-colors-gray-900);
  --color-text-muted:   var(--chakra-colors-gray-500);
  --color-primary:      var(--chakra-colors-teal-500);
  --color-primary-hover:var(--chakra-colors-teal-600);
  --color-primary-soft: var(--chakra-colors-teal-50);
  --color-accent:       var(--chakra-colors-purple-500);   /* modo arquivo / seminário */
  --color-accent-soft:  var(--chakra-colors-purple-50);
  --color-success:      var(--chakra-colors-green-500);
  --color-warning:      var(--chakra-colors-orange-500);
  --color-danger:       var(--chakra-colors-red-500);
  --color-focus-ring:   rgba(49, 151, 149, 0.4);

  /* Espaço (escala de 4px) */
  --space-1: .25rem; --space-2: .5rem; --space-3: .75rem; --space-4: 1rem;
  --space-5: 1.25rem; --space-6: 1.5rem; --space-8: 2rem; --space-10: 2.5rem;

  /* Tipografia */
  --font-sans: var(--chakra-fonts-body);
  --text-xs: .75rem; --text-sm: .875rem; --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.25rem; --text-2xl: 1.5rem; --text-3xl: 1.875rem;

  /* Raio, sombra, movimento */
  --radius-sm: var(--chakra-radii-md); --radius-md: var(--chakra-radii-lg); --radius-lg: var(--chakra-radii-xl);
  --shadow-sm: var(--chakra-shadows-sm); --shadow-md: var(--chakra-shadows-md);
  --duration-fast: 120ms; --duration-base: 180ms;
  --ease-out: cubic-bezier(.2, .8, .2, 1);

  /* Aliases para variáveis hoje indefinidas (achado A1) */
  --gray-200: var(--chakra-colors-gray-200);
  --gray-500: var(--chakra-colors-gray-500);
  --gray-600: var(--chakra-colors-gray-600);
  --gray-900: var(--chakra-colors-gray-900);
  --chakra-colors-red-200: #feb2b2;
  --chakra-colors-purple-300: #b794f4;
}
```

**Escala de nota única** (achado A3; os valores precisam ser aprovados pelo grupo): `≥ 70` sucesso (verde), `50–69` atenção (laranja), `< 50` revisar (vermelho). Título, borda e número passam a usar a mesma escala, via classes `.score--high`, `.score--mid` e `.score--low` calculadas uma única vez no template.

## 2. Componentes base

Nomenclatura **plana, igual à atual** (`.btn`, `.card`), com variantes por classe adicional. As classes existentes são mantidas. As novas são aditivas.

| Componente | Classes | Substitui (achado A2) |
|---|---|---|
| Botão | `.btn` + `.btn-primary` / `.btn-accent` (alias de `.btn-purple`) / `.btn-secondary` / `.btn-outline` / `.btn-danger-outline` / `.btn-ghost` + `.btn-sm` / `.btn-block` | `style="width:100%; padding..."` nos botões |
| Card | `.card`, `.card-header`, `.card-title`, `.card-body` | cabeçalhos de card inline |
| Cabeçalho de página | `.page-header`, `.page-title`, `.page-subtitle`, `.page-actions` | blocos `display:flex; justify-content:space-between` |
| Link de voltar | `.back-link` | 4 links "← Voltar" inline |
| Eyebrow | `.eyebrow` (+ `.eyebrow-accent`) | rótulos em caixa alta inline |
| Badge | `.badge` + variantes atuais + `.badge-neutral`, `.badge-danger` | badges com `style` |
| Campo | `.form-group`, `.form-label`, `.form-control`, `.form-hint`, `.form-error` | `<small style=...>` |
| Alerta / aviso | `.alert-*` (atuais), `.ai-notice`, `.demo-banner` | banner de demo inline |
| Lista | `.list`, `.list-item`, `.list-item-media`, `.list-item-actions` | itens do histórico, planos e seminários |
| Estado vazio | `.empty-state`, `.empty-state-title` | 3 estados vazios inline |
| Estatística | `.stat`, `.stat-value`, `.stat-label` (+ `.stat-box` atual) | números do dashboard |
| Progresso | `.progress-bar-container`, `.progress-bar-fill` (atuais) | — |
| Tarefa | `.task-item` (o `<label>`), `.task-text` | `plan_view.html:70-85` |
| Opção de resposta | `.choice`, `.choice-input`, `.choice-text` | `seminar_view.html:132-142` |
| Painel de nota | `.score-panel`, `.score-value`, `.score--high/mid/low` | `seminar_view.html:40-89` |
| Feedback | `.feedback`, `.feedback--correct/partial/incorrect` | `seminar_view.html:161` |
| Auth | `.auth-card` | `login.html` e `register.html` |
| Modal | `.modal-overlay`, `.modal-content` (atuais) + `.modal-title`, `.modal-text`, `.modal-actions` | inline em `base.html:41-53` |
| Ícone decorativo | `.icon` + `aria-hidden="true"`; texto alternativo em `.sr-only` | emojis sem rótulo (A6) |

## 3. Estados visuais

Todo componente interativo precisa definir estes estados:

| Estado | Regra |
|---|---|
| **Hover** | só em `@media (hover: hover)`, para não "grudar" no toque; muda fundo ou borda, nunca o tamanho do elemento |
| **Focus** | `:focus-visible` com anel `0 0 0 3px var(--color-focus-ring)`. **Nunca** `outline: none` sem substituto (hoje `.btn` tem `outline:none` em `style.css:207`) |
| **Disabled** | `:disabled, [aria-disabled="true"]`: opacidade .55, `cursor: not-allowed`, sem hover |
| **Loading** | `.is-loading` / `[aria-busy="true"]`: spinner via `::after` e texto mantido; largura estável. ⚠️ O CSS pode ficar pronto (A), mas **quem aplica a classe é o JS**, que é escopo [B4](05-achados-frontend.md) e depende do grupo |
| **Vazio** | `.empty-state`: ícone, título, uma frase e uma ação |
| **Erro** | `.form-error`, `.alert-danger`, `.chat-bubble.error` (achado A5) |
| **Digitando** | `.chat-bubble.typing` com aparência de "rascunho" (texto atenuado, 3 pontos animados) (A5) |
| **Concluído (tarefa)** | `.task-item:has(.plan-task-checkbox:checked) .task-text { text-decoration: line-through; color: var(--color-text-muted); }`. Funciona sem alterar o JS, mas ver a [exceção](#exceções-permitidas) |

## 4. Breakpoints (mobile-first)

O CSS atual é *desktop-first* (`max-width: 768px`). A proposta é escrever a base para celular e ampliar com `min-width`:

| Nome | Media query | Uso |
|---|---|---|
| base | — | 1 coluna, gutters de 16 px, navbar compacta |
| `sm` | `@media (min-width: 640px)` | formulários em 2 colunas (`.grid-2`) |
| `md` | `@media (min-width: 768px)` | navbar em linha; 3 estatísticas lado a lado |
| `lg` | `@media (min-width: 1024px)` | tela de estudo em 2 colunas (chat + lateral) |
| `xl` | `@media (min-width: 1280px)` | `.container` com largura máxima de 1200 px |

Validar sempre em **375 px** e **1440 px** (critério da [sprint 01](sprints/sprint-01-redesign-visual.md)).

**Chat responsivo** (achado A4): a altura sai do inline e vai para uma classe, por exemplo `.chat-window { height: min(620px, 70dvh); }`. Isso mantém a altura limitada que o `#chatMessages` exige.

## 5. Movimento

- Animar só `transform` e `opacity`. Duração entre 120 e 200 ms, com `--ease-out`.
- Nada de animação em elementos que se repetem muito (mensagens do histórico, itens de lista no carregamento).
- Toda animação dentro de:
  ```css
  @media (prefers-reduced-motion: no-preference) { /* animações aqui */ }
  ```
  ou, no mínimo, com um bloco `@media (prefers-reduced-motion: reduce)` que zere `animation` e `transition`.
- O `.btn:active { transform: scale(0.98) }` atual pode continuar (é sutil), dentro da mesma regra.

## 6. Regra: nada de `style=""` inline

Novos estilos vão **sempre** para classes no CSS. Em templates tocados pelo redesign, o `style=""` existente é migrado para classes.

### Exceções permitidas

| Caso | Por quê |
|---|---|
| `style="width: {{ p.progress_percent }}%"` em `.progress-bar-fill` (`plan_view.html:39`, `study_topic.html:115`) | valor dinâmico vindo do banco. O `#planProgressBar` ainda é **atualizado pelo JS via `style.width`** (contrato) |
| `style.display` no `#settingsModal` | escrito pelo JS (contrato); o CSS só define o estado inicial `display:none` |
| `style.textDecoration` / `style.color` em `#label_<task_key>` | escrito pelo JS (`app.js:167-175`). Estilo inline vence a classe, então, **depois do primeiro clique**, a cor do JS (`#94a3b8` / `inherit`) prevalece sobre o CSS. Alinhar isso exige mudar o JS (B11) |
| HTML com `style` gerado no JS (`app.js:118`) | só muda junto com o JS (B) |

Para valores dinâmicos novos, prefira uma **CSS custom property** no elemento (`style="--progress: 40%"`) consumida pela classe. Mas não troque o mecanismo das exceções acima sem alinhar com o JS.
