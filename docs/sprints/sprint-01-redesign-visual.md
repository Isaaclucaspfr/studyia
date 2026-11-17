# Sprint 01 — Redesign visual

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

- [ ] `test_app.py` passando, rodado **na branch** com o banco temporário:
  `DATABASE_PATH=/tmp/studyia-teste.db python -m unittest test_app.py`
- [ ] O checklist ["Antes de mexer em um template, confirme"](../04-contratos-frontend.md#antes-de-mexer-em-um-template-confirme) foi cumprido em **cada** template alterado. Nenhum contrato do [04](../04-contratos-frontend.md) foi quebrado.
- [ ] Cada tela validada em **375 px** e **1440 px**, sem rolagem horizontal da página e sem texto cortado.
- [ ] Nenhum `style=""` novo, fora das [exceções permitidas](../06-padroes-visuais.md#exceções-permitidas).
- [ ] Foco visível (`:focus-visible`) em todos os elementos interativos; navegação por Tab na ordem visual.
- [ ] Animações respeitam `prefers-reduced-motion`.
- [ ] Nenhum arquivo fora do escopo alterado: `git diff --stat main -- '*.py' static/js/ requirements.txt README.md doc_completo.txt .env.example` sem saída.
- [ ] Fluxos manuais executados em modo demo: cadastro → login → novo assunto → chat (2 mensagens) → plano → marcar e desmarcar 2 tarefas → seminário → enviar → upload de TXT → excluir tópico → configurar e limpar a chave → logout.
- [ ] PR revisado por pelo menos uma pessoa do grupo.

## Checklist de tarefas por tela

> Lista de escopo original, por tela. O checklist operacional, com a auditoria da Fase 1 dividida por fase, está em [Checklist por fase](#checklist-por-fase-auditoria-da-fase-1).

### Global (`style.css` + `base.html`)
- [ ] Tokens semânticos + aliases das variáveis indefinidas (A1)
- [ ] Componentes base do [06 §2](../06-padroes-visuais.md#2-componentes-base)
- [ ] Estados: hover (só com `hover: hover`), focus-visible, disabled, vazio, erro (A5)
- [ ] Media queries mobile-first (`640`, `768`, `1024`, `1280`)
- [ ] `<link>` do Google Fonts só com a fonte aprovada (A7; ver decisão D1 no [registro](#registro-de-decisões))
- [ ] Navbar: layout em 375 px; "⚙️" com `aria-hidden` e rótulo de texto (A6)
- [ ] Modal: estilos via `.modal-title`, `.modal-text`, `.modal-actions`. **Mantenha** `#settingsModal`, `#closeSettingsBtn`, `type="button"` e `display:none` inicial
- [ ] Flashes: manter `alert-{{ category }}`
- [ ] Rodapé RNF06 com classe e sem inline (A1, A8)

### `login.html` e `register.html`
- [ ] `.auth-card`, sem inline
- [ ] Manter os `name`s (`login_input`, `password` · `name`, `username`, `email`, `password`, `confirm_password`)

### `dashboard.html`
- [ ] `.page-header` + `.demo-banner` (A8). Manter `#openSettingsBtn2` e o `onclick` (mudar é B11)
- [ ] Estatísticas com `.stat` e ícones `aria-hidden`
- [ ] Cards de fluxo: manter os `name`s, o `enctype` e o `accept`
- [ ] Histórico com `.list-item` e `.empty-state`; botão 🗑️ com nome acessível (A6). Manter `method="POST"` e o `onsubmit` (mudar é B6)
- [ ] Manter o texto **"Painel de Estudos"** (título e `<h1>`)

### `study_topic.html`
- [ ] Grid responsivo (1 coluna < 1024 px), sem o inline da linha 54 (A4)
- [ ] Altura do chat via classe (`min(620px, 70dvh)` ou similar). O `#chatMessages` continua rolável (A4)
- [ ] Bolhas: só CSS. **Não** mudar a estrutura de `:67-81` (está duplicada no JS, B11)
- [ ] `.chat-bubble.typing` e `.chat-bubble.error` estilizados (A5)
- [ ] Coluna lateral: `.card-header`, `.list-item`, `.empty-state`
- [ ] Forms "gerar seminário" continuam POST

### `plan_create.html`
- [ ] Cabeçalho e form com classes; `value`s numéricos dos `<select>` intactos

### `plan_view.html`
- [ ] Barra de progresso: manter `#planProgressBar` (com `style="width"`) e `#planProgressText`
- [ ] `.task-item` com o estado de concluído via `:has(:checked)`. Manter `.plan-task-checkbox`, `data-*` e `#label_{{ task_key }}`; **não tocar** na fórmula da `task_key` nem no loop
- [ ] Manter o texto **"Progresso Geral de Execução"**
- [ ] Faixa de CTA com classe

### `seminar_view.html`
- [ ] `.score-panel` com a escala única `.score--high/mid/low` (A3, valores aprovados pelo grupo)
- [ ] `.choice` para as alternativas. Manter `name="q_{{ qid }}"` e `value="{{ opt }}"`
- [ ] `.feedback--*` para o retorno por questão. Por causa do B1 (✅ confirmado em 17/11/2026), esse bloco **não aparece** hoje: estilize pelo markup, mas não vai dar para validar visualmente até o B1 ser resolvido
- [ ] **Não** alterar o `{% set %}` / `{% for %}` das linhas 98-104 (é o B1)

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
| 2 | Fundação: tokens, fonte, componentes base, navbar, modal | ⏳ próxima |
| 3 | Telas: migração do inline para classes, tela por tela | — |
| 4 | Estados, microinterações, polish e PR | — |

Screenshots "antes" (fora do repositório): `../studyia-screenshots/fase1-antes/` (375, 768 e 1440 px, mais os estados do chat).

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

---

## Checklist por fase (auditoria da Fase 1)

IDs da auditoria entre parênteses: G = global, L = login/cadastro, DB = dashboard, T = tópico/chat, P = criar plano, V = ver plano, S = seminário, M = modal. D1–D8 são as decisões do registro acima. Severidade: **C** crítico, **A** alto, **M** médio, **B** baixo. Antes de editar qualquer template, cumprir o [checklist do 04](../04-contratos-frontend.md#antes-de-mexer-em-um-template-confirme).

### Fase 2 — Fundação (`style.css` + `base.html`)
- [ ] Verificar se a Atkinson Hyperlegible Next tem algarismos tabulares no Google Fonts (`font-variant-numeric: tabular-nums` muda a largura dos dígitos). Se não tiver, usar a Atkinson Hyperlegible original e avisar no relatório (D1)
- [ ] `<link>` do Google Fonts só com a fonte aprovada; Plus Jakarta Sans removida (A7, G12)
- [ ] Tokens semânticos da D1 (cor, tipografia, espaço, raio, movimento) + aliases dos `--chakra-*` e das variáveis indefinidas (A1, G12)
- [ ] Contraste AA em todos os pares de texto: botão primário, texto secundário, placeholder, hora do chat, avisos, "Sair" (G1 · A)
- [ ] `:focus-visible` global com anel de 2 px e offset; remover o `outline:none` sem substituto (G2 · A)
- [ ] Navbar com 56 px em linha em 375 px; rótulo da engrenagem em `.sr-only` abaixo de 640 px; sem blur; selo "PROJETO A3" discreto (G3 · A, G11, D5)
- [ ] Acento único e sem gradientes: marca, bolha do usuário, barra de progresso (G4 · M, D3)
- [ ] Cards com borda de 1 px e sem sombra em repouso; sem hover em card que não é clicável (G5 · M)
- [ ] Badges em sentence case (G6 · M)
- [ ] Utilitários `.icon` (SVG inline) e `.sr-only` (G7 · M)
- [ ] Alvos de toque ≥ 44 px abaixo de 768 px (G8 · M)
- [ ] Base mobile-first com breakpoints 640/768/1024/1280 (G9 · M)
- [ ] Transições com propriedades explícitas, `--ease-out` forte e bloco `prefers-reduced-motion` (G10 · B)
- [ ] Componentes base do [06 §2](../06-padroes-visuais.md#2-componentes-base) em CSS puro
- [ ] Modal: `.modal-title`, `.modal-text`, `.modal-actions`, overlay sólido, botões de 44 px. Manter `#settingsModal` (`display:none` por padrão, `display:flex` para abrir), `#closeSettingsBtn` com `type="button"` e a condição de sessão (M1 · M)
- [ ] Cache-busting: `?v=redesign_v1`

### Fase 3 — Telas
**Global**
- [ ] Flash: tinta clara, borda de 1 px e ícone SVG; manter `alert-{{ category }}` (G13 · B)
- [ ] Rodapé RNF06 discreto (13 px), alinhado ao grid, sem inline (G14 · B, A1, A8)
- [ ] Emojis trocados por SVG com `aria-hidden` nos templates; o botão de excluir ganha nome acessível (G7, A6)

**Login e cadastro**
- [ ] Remover a pílula "PROJETO A3 — IA PARA O COTIDIANO" (L1 · M, D4)
- [ ] Título como `h1` de 24 px, sem quebrar em 375 px (L2 · M)
- [ ] `.auth-card` com 24 px de padding no celular, sem sombra (L3 · B)

**Dashboard**
- [ ] `.notice` único (âmbar AA) no banner de demo; manter `#openSettingsBtn2` e o `onclick` (DB1 · A, A8)
- [ ] KPIs em uma faixa dividida por linhas, número de 24 px com algarismos tabulares, "—" em cinza (DB2 · M)
- [ ] Cards de fluxo com o mesmo peso; diferença só por título e ícone; manter `name`s, `enctype` e `accept` (DB3 · M)
- [ ] `::file-selector-button` estilizado (DB4 · M)
- [ ] Histórico como lista com divisórias; `aria-label` no excluir; item em 2 linhas em 375 px; manter `method="POST"` e o `onsubmit` (DB5 · M)
- [ ] Remover o eyebrow; manter "Painel de Estudos" no título e no `h1` (DB6 · B)

**Tópico e chat**
- [ ] **Sem rolagem horizontal em 375 px**: grid em classe com 1 coluna abaixo de 1024 px; `.chat-window { height: min(620px, 70dvh) }`; `#chatMessages` continua com altura limitada e `overflow-y:auto` (T1 · **C**, A4)
- [ ] Uma ação primária no cabeçalho; as outras secundárias; quebra correta em 375 px (T4 · M)
- [ ] Bolha do usuário chapada; contador de mensagens como texto secundário; estrutura da bolha intacta (T5 · M)
- [ ] Coluna lateral como painel com lista (sem cards aninhados); "+ Novo" e "+ Gerar" como `.btn-ghost` de 44 px; forms de seminário continuam POST (T6 · M)
- [ ] Input e botão do chat com a mesma altura (44 px); botão sem quebrar linha (T7 · B)
- [ ] Markdown da bolha com tipografia de leitura; `overflow-x:auto` em `pre` e `table` (T8 · B)

**Criar plano**
- [ ] Remover o eyebrow e o "(F07)" (P1 · M, D4)
- [ ] Select com seta SVG e 44 px; card padrão; `value`s numéricos intactos (P2 · B)

**Ver plano**
- [ ] Cada dia como seção, sem borda colorida; minutos como texto secundário (V1 · M)
- [ ] Tarefa concluída com cor AA via `.task-item:has(:checked)` (vale no carregamento; depois do clique, a cor inline do JS vence; ver pendências) (V2 · M)
- [ ] Linha da tarefa com foco visível (`:has(:focus-visible)`) e 44 px; manter `.plan-task-checkbox`, `data-*`, `#label_{{ task_key }}` e a fórmula da `task_key` (V3 · B)
- [ ] Manter "Progresso Geral de Execução" no HTML; `#planProgressBar` e `#planProgressText` intactos
- [ ] CTA de seminário como faixa simples com botão (V5 · B)

**Seminário**
- [ ] Escala de nota da D2 em borda, número e título (S1 · A, A3)
- [ ] Painéis "fortes" e "a revisar" com texto na cor normal e cor só no ícone e na borda (S2 · A)
- [ ] `.choice` com `:has(:checked)` e `:has(:focus-visible)`; resposta marcada legível no resultado; manter `name="q_{{ qid }}"` e `value="{{ opt }}"` (S3 · M)
- [ ] `.feedback--*` estilizado pelo markup (não validável por causa do B1)
- [ ] Sentence case; sem emoji; botão de envio com largura total no celular (S4 · B)
- [ ] **Não** alterar o `{% set %}` / `{% for %}` das linhas 98-104 (B1)

### Fase 4 — Estados e polish
- [ ] `.chat-bubble.typing`: texto atenuado e 3 pontos animados em CSS; estático com reduced-motion (T2 · A, A5)
- [ ] `.chat-bubble.error`: tinta de perigo, borda e ícone via `::before` (T3 · A, A5)
- [ ] Estado vazio do histórico com link-âncora para o campo `#title` (DB7 · B)
- [ ] Barra de progresso: transição de 200 ms com ease-out (a largura continua pelo JS) (V4 · B)
- [ ] Modal: entrada com `@starting-style` (M2 · B, D6)
- [ ] Feedback ao pressionar botões (D6)
- [ ] `::selection`, `accent-color` via token, scrollbar (G15 · B)
- [ ] Favicon SVG em `static/` + `<link rel="icon">` no `base.html` (G15, D8)
- [ ] Critérios de aceite completos (fluxo manual, 375/1440 px, `git diff --stat` fora do escopo vazio)
- [ ] Descrição do PR destacando a D2 como **pendente de validação do grupo**

---

## Pendências fora do escopo

Encontradas ou decididas na Fase 1. Nenhuma entra nesta sprint.

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

---

## Contexto para retomar

As regras da sprint (git, escopo, contratos, skills e protocolo de cada fase) estão no `CLAUDE.local.md`, carregado automaticamente. Este arquivo guarda o progresso e as decisões.

**Próxima fase: Fase 2 — Fundação.**
1. Ler o `CLAUDE.local.md`, este arquivo (principalmente o [Registro de decisões](#registro-de-decisões) e o [Checklist por fase](#checklist-por-fase-auditoria-da-fase-1)) e os SKILL.md das skills da fase.
2. Trabalhar em `feat/redesign-visual`. Arquivos da fase: `static/css/style.css` e `templates/base.html`.
3. Primeiro passo: verificar os algarismos tabulares da Atkinson Hyperlegible Next (D1).
4. Comparar com as screenshots "antes" em `../studyia-screenshots/fase1-antes/` e salvar as novas em `../studyia-screenshots/fase2/`.
