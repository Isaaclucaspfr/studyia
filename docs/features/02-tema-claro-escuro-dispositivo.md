# 02 — Tema claro / escuro / dispositivo

> Índice: [features/README.md](README.md) · Base: commit `69c99ab` · Tamanho: médio (1 PR) · Escopos: **A** (tokens, CSS, markup) + **B** (um JS novo e, se aprovado, 3 linhas do `app.js`) · **Não toca o backend.**

## 1. Objetivo

Permitir que a pessoa escolha entre tema **Claro**, **Escuro** ou **Dispositivo** (segue o sistema operacional).

- **Problema:** hoje o StudyIA só tem o tema claro. Quem estuda à noite ou usa o sistema no modo escuro recebe uma tela clara no meio de tudo escuro. O tema escuro ficou explicitamente fora da sprint 01 ([pendências da sprint](../sprints/sprint-01-redesign-visual.md#pendências-fora-do-escopo)).
- **Valor:** conforto de leitura em sessões longas (a [03](03-conteudo-do-plano.md) vai trazer textos mais longos para ler), respeito à preferência do sistema por padrão e nenhuma mudança de comportamento.
- **Natureza:** a funcionalidade é **EXCLUSIVAMENTE ESTÉTICA**. Não muda rota, dado, fluxo nem regra, e **não mexe no backend** (nenhum `.py`, nenhuma tabela). O único JS novo serve para aplicar e lembrar o tema.

## 2. Como funciona hoje

| O quê | Onde | Situação |
|---|---|---|
| Tokens de cor | `static/css/tokens.css:15-104` | só a paleta clara ("Caderno quieto", D1/D9 da sprint 01); primitivos em `:18-59`, semânticos em `:63-104` |
| `color-scheme` | `static/css/tokens.css:13` | `color-scheme: light` fixo: controles nativos (select, file, scrollbars) sempre claros |
| Aliases `--chakra-*` e `--gray-*` | `static/css/tokens.css:202-288` | sem uso: nenhum template nem o `style.css` os referencia (verificado com `grep`) |
| Carga do CSS | `templates/base.html:13-14` | `tokens.css` antes do `style.css`, ambos com `?v=redesign_v3` |
| Scripts | `templates/base.html:16` (Lucide, no `<head>`), `:119` (`marked`), `:120` (`app.js`), `:121-125` | nenhum script de tema; ordem `marked` → `app.js` é contrato |
| Navbar | `templates/base.html:47-67` | `.navbar` é `position: sticky` (`style.css:129`); a área `.nav-user` só existe com sessão (`base.html:54`) |
| Preferência do usuário | — | não existe; nada em `localStorage` |
| `prefers-color-scheme` | — | não aparece em nenhum CSS |

### Auditoria de prontidão: o que quebra no escuro

Cores que **não** passam pelos tokens semânticos, ou tokens que não fariam sentido no escuro. Contrastes medidos contra a superfície escura proposta em §5.2 (`#18201C`).

| # | Onde | O quê | Problema no escuro | Correção proposta | Escopo |
|---|---|---|---|---|---|
| 1 | `tokens.css:13` | `color-scheme: light` | selects, input de arquivo, barras de rolagem e o autofill continuam claros | `light` no tema claro, `dark` no escuro (§5.3) | A |
| 2 | `tokens.css:103` | `--color-code-bg: var(--neutral-900)` (aponta para o **primitivo**, `#17201C`) | o bloco de código fica igual à superfície escura (1,0:1): some | valor escuro próprio (`#0A0E0C`, §5.2) | A |
| 3 | `tokens.css:102`, `:161` | `--color-overlay` e `--shadow-overlay` com `rgb(23 32 28 / …)` literal | só o modal usa; o modal sai na [01](01-remover-configurar-ia.md) | nada, se a 01 entrar antes; senão, valor escuro | A |
| 4 | `tokens.css:202-288` | aliases `--chakra-*`/`--gray-*` com valores claros | não quebram nada hoje (sem uso), mas seriam uma armadilha para quem os usar depois | remover no mesmo PR (a sprint 01 já previa) | A |
| 5 | `style.css:458` | `.btn-ghost:active` com `var(--accent-100)` (primitivo) | ao pressionar, o fundo pisca `#D3E6E0` (claro) sob texto claro: 1,08:1 | trocar por um token semântico (ex.: `--color-accent-soft-active`) | A |
| 6 | `style.css:459` | `.btn-danger-outline:active` com `var(--danger-100)` (primitivo) | mesmo problema, em vermelho claro | idem (`--color-danger-soft-active`) | A |
| 7 | `style.css:665` | seta do `select` em data-URI com `stroke='%2355605A'` fixo | `#55605A` sobre `#18201C`: **2,54:1** (mínimo não-texto: 3:1) | desenhar a seta com `mask` + `background-color: currentColor`, como os ícones do `.alert` (`style.css:279-299`) | A |
| 8 | `style.css:726` | ✓ do checkbox do plano em data-URI com `stroke='white'` | o acento escuro é claro (`#5DB8A2`); branco sobre ele: **2,37:1** | `mask` + `--color-on-accent`. A [03](03-conteudo-do-plano.md) troca o checkbox por um indicador; se a 03 vier antes, o item cai | A |
| 9 | `static/js/app.js:118` | nota de demo do chat com `color: #718096` inline | 4,14:1 no escuro, 4,02:1 no claro: **abaixo de AA nos dois** | ver §5.5 | B |
| 10 | `static/js/app.js:170` | tarefa concluída com `color: #94a3b8` inline | 6,49:1 no escuro, mas ≈ 2,5:1 no claro (já registrado na sprint 01) e fora da paleta | ver §5.5 | B |
| 11 | `static/js/app.js:173` | `color = 'inherit'` | nenhum | — | — |

**Conferido e sem problema:**

- `base.html:49`: a marca usa `fill="currentColor"` (acento) e o traço do livro usa `--color-on-accent` (`style.css:1663-1667`).
- `style.css:279`, `:305`, `:313`, `:320`, `:1042-1050`: ícones dos alertas e do erro do chat em data-URI com `stroke='black'`, mas usados como **máscara** com `background-color: currentColor`. Seguem a cor do texto.
- Todos os fundos com `--color-accent` (`style.css:390`, `:725`, `:793`, `:989`) já usam `--color-on-accent` como cor do texto.
- `accent-color` (`style.css:21`), `scrollbar-color` (`:22`, `:910`, `:1156`), `::selection` (`:26-29`) e `caret-color` (`:624`) usam tokens.
- Templates: os únicos `style=""` restantes são as larguras da barra de progresso (`plan_view.html:39`, `study_topic.html:119`), sem cor.
- `static/favicon.svg`: cores fixas (`#1E6B5C` e branco), mas é o ícone da aba, um quadrado sólido que funciona nos dois temas do navegador.
- Avatares em emoji (`study_topic.html:73`, `app.js:95`): não dependem do tema.
- Não há imagens no app.

## 3. Como deve funcionar

1. Na primeira visita, o tema é **Dispositivo**: claro ou escuro conforme o sistema operacional.
2. Na navbar, no lugar do antigo "Configurar IA", há um botão de tema de 44 px, **em todas as páginas**: com sessão (dashboard, tópico, plano, seminário) e sem sessão (login, cadastro e a landing page da [04](04-landing-page.md)). Ele mostra o ícone do tema em uso e, a partir de 640 px, o rótulo "Tema".
3. A pessoa clica no botão, que abre um painel com **Claro**, **Escuro** e **Dispositivo**, e escolhe uma opção. A troca é imediata, sem recarregar a página.
4. A escolha fica salva no navegador. Recarregar, mudar de página, fechar e abrir de novo: o tema continua o escolhido, **sem piscar** o tema errado durante o carregamento.
5. Com **Dispositivo**, se o sistema trocar de claro para escuro (por exemplo, no horário automático), a página acompanha na hora, sem recarregar.
6. Com o JavaScript desligado, a página segue o sistema operacional e o controle de tema não aparece (um controle que não funciona não deve ser exibido).
7. Nada além da aparência muda: mesmas rotas, mesmos dados, mesmos fluxos.

## 4. Decisões do grupo

- ✅ **Decidido:** 3 opções: Claro, Escuro e Dispositivo. O Dispositivo segue o sistema operacional e acompanha mudanças ao vivo. **Padrão: Dispositivo.**
- ✅ **Decidido:** a funcionalidade é **EXCLUSIVAMENTE ESTÉTICA**. Não muda nenhuma rota, dado, fluxo ou comportamento e **não mexe no backend**.
- ✅ **Decidido:** a preferência fica salva **no navegador**. Salvar no banco é possibilidade futura (registrada no [handoff](../handoff/backend-pendencias.md)).
- ✅ **Decidido:** sem flash do tema errado ao carregar (anti-FOUC).
- ✅ **Decidido:** o seletor fica na navbar, no espaço liberado pelo "Configurar IA" ([01](01-remover-configurar-ia.md)).
- ✅ **Decidido (padrão do seletor):** um **botão de 44 × 44 px** que abre um **painel** com as 3 opções (Claro, Escuro, Dispositivo). É a opção A de §5.6.
- ✅ **Decidido (onde aparece):** o seletor fica **fora** do `{% if session.get('user_id') %}` (`base.html:54`) e aparece também no **login**, no **cadastro** e na **landing page** ([04](04-landing-page.md)). O nome do usuário e o "Sair" continuam dentro da condição.
- ✅ **Decidido (cores inline do `app.js`):** trocar **só os hex** por `var(--color-text-subtle)`, sem mudar nenhuma lógica. É uma mudança puramente estética, a opção 3 de §5.5.

## 5. Proposta técnica

> 💡 **Proposta — validar com a equipe.** Tudo abaixo mantém o stack (CSS puro + JS puro, sem build step, sem CDN nova).

### 5.1 Como o tema é aplicado

| Estado salvo | Atributo no `<html>` | Quem decide a paleta |
|---|---|---|
| nada salvo ou `"system"` | **nenhum** `data-theme` | `@media (prefers-color-scheme: dark)` no CSS |
| `"light"` | `data-theme="light"` | o CSS, ignorando o sistema |
| `"dark"` | `data-theme="dark"` | o CSS, ignorando o sistema |

Com isso, o modo **Dispositivo** acompanha o sistema **ao vivo sem nenhum JS**: quem troca a paleta é a media query. O JS só entra quando a pessoa escolhe Claro ou Escuro.

### 5.2 Tokens escuros em `tokens.css`

Só os **tokens semânticos** (`tokens.css:63-104`) ganham valores escuros. Os componentes não mudam, porque já usam só os semânticos (exceto os itens 5 e 6 da auditoria, que precisam ser corrigidos antes).

```css
/* tokens.css (proposta de estrutura) */
:root { color-scheme: light; /* tokens claros atuais */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { color-scheme: dark; /* tokens escuros */ }
}
:root[data-theme="dark"] { color-scheme: dark; /* tokens escuros (mesma lista) */ }
```

- **Custo:** o bloco de tokens escuros aparece **duas vezes** (na media query e no `[data-theme="dark"]`). São cerca de 40 linhas. Sem build step, não há como evitar sem usar `light-dark()` (alternativa abaixo).
- **Alternativa:** a função CSS `light-dark()` com `color-scheme: light dark` evita a duplicação (`--color-bg: light-dark(#F5F6F4, #111714)`), mas exige navegadores de 2024 em diante (Chrome 123, Firefox 120, Safari 17.5) e, em navegadores antigos, invalida **todas** as cores (variável inválida no momento do cálculo), não só o tema escuro. Exigiria um `@supports`. 💡 Recomendação: a duplicação, que é simples e funciona em qualquer navegador.

**Rascunho da paleta escura** ("Caderno quieto" à noite: neutros esverdeados, acento verde-petróleo clareado). Contrastes WCAG **medidos** com o script de contraste usado na sprint 01; ⚠️ a aparência ainda não foi conferida no app.

| Token | Claro (atual) | Escuro (proposta) | Contraste no escuro |
|---|---|---|---|
| `--color-bg` | `#F5F6F4` | `#111714` | — |
| `--color-surface` | `#FFFFFF` | `#18201C` | — |
| `--color-surface-muted` | `#EDEFEC` | `#222B27` | — |
| `--color-border` | `#E2E5E1` | `#2E3833` | — |
| `--color-border-input` | `#868F89` | `#727D77` | 3,9:1 na superfície (não-texto, mín. 3:1) |
| `--color-text` | `#17201C` | `#E6EBE8` | 15,1 (fundo) · 13,8 (superfície) |
| `--color-text-secondary` | `#55605A` | `#AAB4AE` | 8,5 · 7,8 |
| `--color-text-subtle` | `#646E68` | `#8E9993` | 6,2 · 5,7 · 4,9 (muted) |
| `--color-accent` (botão, progresso, links) | `#1E6B5C` | `#5DB8A2` | 7,0:1 como texto na superfície |
| `--color-on-accent` (texto sobre o acento) | `#FFFFFF` | `#0B1F1A` | 7,2:1 sobre o acento |
| `--color-accent-hover` | `#18584B` | `#77C7B3` | 8,7:1 com `on-accent` |
| `--color-accent-soft` | `#EAF3F0` | `#173029` | 11,7:1 com o texto |
| `--color-success-text` / `-soft` | `#1A5E39` / `#EBF5EF` | `#86D3A5` / `#15281D` | 8,8 |
| `--color-warning-text` / `-soft` | `#8A5A00` / `#FFF6DB` | `#E9C46F` / `#2A2313` | 9,3 |
| `--color-danger-text` / `-soft` | `#912018` / `#FDF0EE` | `#F3A59B` / `#301B18` | 8,2 |
| `--color-danger` ("Sair") | `#B42318` | `#F08A7E` | 6,9 na superfície |
| `--color-code-bg` / `-text` | `#17201C` / `#F5F6F4` | `#0A0E0C` / `#E6EBE8` | 16,1 |
| `--color-selection` | `#D3E6E0` | `#24493F` | 8,3 com o texto |
| barra de progresso / trilho | `#1E6B5C` / `#E2E5E1` | `#5DB8A2` / `#2E3833` | 5,1 (não-texto) |

Os demais semânticos (`-border-strong`, `-accent-active`, `-*-border`, `-scrollbar`, `-focus`, `-link`) seguem a mesma lógica e entram no PR com contraste medido. Superfícies continuam **sem sombra**; no escuro, a hierarquia vem da diferença entre `bg` e `surface` e da borda (D1).

### 5.3 Anti-FOUC: script inline mínimo no `<head>`

Um script **inline**, **antes** dos `<link>` de CSS (`base.html:13`), que roda antes da primeira pintura:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem("studyia-theme");
      if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
    } catch (e) {}
    document.documentElement.classList.add("js");
  })();
</script>
```

- `try/catch`: `localStorage` lança exceção em modo privado de alguns navegadores e com cookies bloqueados; nesse caso vale o Dispositivo.
- Sem nada salvo (ou `"system"`), não escreve atributo: a media query resolve.
- A classe `js` permite esconder o seletor quando não há JavaScript (§3, passo 6).
- O CSS no `<head>` já bloqueia a renderização, então o atributo está no lugar antes da primeira pintura.
- **Por que inline:** um `<script src>` no `<head>` custaria uma requisição bloqueante a mais; com `defer`, rodaria depois da pintura e o tema piscaria. Se o projeto adotar CSP no futuro, este script vai precisar de `nonce` ou hash.

### 5.4 `static/js/theme.js` (novo, independente do `app.js`)

Responsável só pela interação com o seletor:

- lê o estado salvo e marca a opção atual;
- na troca: grava `"light"`, `"dark"` ou `"system"` em `localStorage` (com `try/catch`), aplica ou remove `data-theme` no `<html>` e atualiza o ícone e o nome acessível do botão;
- 💡 opcional: escuta o evento `storage` para sincronizar outras abas abertas;
- 💡 opcional: atualiza `<meta name="theme-color">`, para a barra do navegador no celular acompanhar o tema.

Carregado com `<script src=".../theme.js" defer>`. **Não mexe na ordem `marked` → `app.js`** (contrato do [04 §7.1](../04-contratos-frontend.md#71-herança-jinja-e-estrutura-do-basehtml)): pode ficar no `<head>` com `defer` ou depois do `app.js`. Não depende de nada do `app.js`, e o `app.js` não depende dele.

### 5.5 Cores inline do `app.js` (B11)

> ✅ **Decidido:** opção **3**, trocar só os hex por `var(--color-text-subtle)`, sem mudar a lógica. A tabela fica como registro das alternativas.

O `app.js` escreve cor inline em 2 lugares (auditoria, itens 9 e 10). Inline vence o CSS, então o tema não alcança essas cores.

| Opção | Como | Prós | Contras |
|---|---|---|---|
| 1. Deixar e documentar | nada | zero mudança no JS | `#718096` fica abaixo de AA nos **dois** temas; `#94a3b8` continua ≈ 2,5:1 no claro |
| 2. Sobrescrever via CSS | `.task-text { color: … !important }` e `.chat-bubble [style*="718096"] { … !important }` | não toca o JS | `!important` contra o inline e um seletor por **conteúdo do atributo**: frágil, quebra se o JS mudar um caractere |
| **3. Trocar só os hex por `var(--token)`** (✅ decidida) | `app.js:170`: `label.style.color = 'var(--color-text-subtle)'`; `app.js:118`: `color: var(--color-text-subtle)` dentro do `style` | 2 strings trocadas, nenhuma lógica alterada; os dois temas ficam AA (5,3:1 no claro e 5,7:1 no escuro, na superfície); a cor bate com a do template (`style.css:766-770`) | é mudança no `app.js` (B), já aprovada |

- A [01](01-remover-configurar-ia.md#4-decisões-do-grupo) já reescreve o texto do `app.js:118` e troca o `style=""` dessa linha por uma classe (✅ decidido lá). Como a 01 entra antes, o item 9 se resolve na 01 e aqui sobra só o `app.js:170` (`'#94a3b8'` → `'var(--color-text-subtle)'`). Se por algum motivo a 01 atrasar, a mesma troca de hex vale para o `:118`.
- A [03 (PR 4c)](03-conteudo-do-plano.md#pr-4c--trava-da-conclusão-antes-ou-junto-do-4b) provavelmente apaga o bloco do checklist (`app.js:144-181`), e o `:170` some junto. A opção 3 é barata o bastante para valer até lá.

### 5.6 Seletor na navbar

> ✅ **Decidido:** botão de 44 px que abre um painel com as 3 opções (opção A abaixo), **fora** da condição de sessão. O resto desta seção (`popover`, radios, fallback) continua 💡 proposta.

Requisitos (acessibilidade visual tem prioridade sobre estética, como na sprint 01):

- alvo de **44 × 44 px** (`--touch-min`), inclusive em cada opção;
- operável só com teclado (Tab até o controle, Enter/Espaço para abrir, setas entre as opções, Esc para fechar);
- **nome acessível** que inclui o estado: "Tema: Dispositivo";
- estado atual anunciado pelo leitor de tela e visível (ícone + marcação da opção);
- ícones SVG no sprite (`base.html:21-44`), no padrão da D11 (traço de 1,5 px): 3 novos, `sun`, `moon` e `monitor`;
- abaixo de 640 px, só o ícone (o `.nav-btn-label` atual, `style.css:200-208`, já faz isso).

**Cabe na navbar?** Em 375 px, a navbar tem cerca de 343 px úteis (estimativa pela leitura do CSS; ⚠️ medir no PR). Marca (≈ 110 px) + nome (até 96 px, `style.css:189-197`) + "Sair" (≈ 60 px) + espaçamentos deixam ≈ 50 px: cabe **um** botão de 44 px, mas **não** três botões lado a lado (132 px). Por isso o controle precisa abrir um painel.

| Opção | Como | Prós | Contras |
|---|---|---|---|
| **A. Botão + painel `popover` com 3 radios** (✅ decidido o botão + painel; `popover` e radios são a proposta de implementação) | `<button popovertarget="themeMenu">` + `<div id="themeMenu" popover>` com um `<fieldset>` de 3 `<input type="radio" name="theme">` | abrir, fechar, Esc e clicar fora são **nativos** (sem JS); radios nativos dão as setas e o "selecionado, 1 de 3" ao leitor de tela; o `theme.js` só escuta `change` | `popover` é de 2024 (Chrome 114, Firefox 125, Safari 17); navegadores mais antigos precisam de um fallback (o `theme.js` alterna `hidden`). Sem anchor positioning, o painel é posicionado com `position: fixed` abaixo da navbar, que já é sticky |
| B. Botão que alterna em ciclo | cada clique passa para o próximo tema | o mais simples; 1 botão de 44 px | até 2 cliques para chegar a uma opção; trocar para "Dispositivo" pode manter o mesmo visual e parecer que o clique não fez nada |
| C. `<select>` nativo | `<select>` com 3 `<option>` | acessível sem esforço | aparência de campo de formulário na navbar; precisa de cerca de 120 px em 375 px |

**Onde fica (✅ decidido):** hoje a `.nav-user` (onde estava o "Configurar IA") só existe com sessão (`base.html:54-66`). O seletor sai dessa condição e vira um irmão da `.nav-user` dentro da `.navbar` (`base.html:47-67`), visível em todas as páginas que estendem o `base.html`, inclusive a landing ([04](04-landing-page.md), que estende o `base.html` na proposta dela). Estrutura proposta:

```html
<nav class="navbar">
  <a class="nav-brand">…</a>
  <div class="nav-actions">
    <!-- seletor de tema: SEMPRE presente (fora do if) -->
    {% if session.get('user_id') %}
    <div class="nav-user">… nome · Sair …</div>
    {% endif %}
  </div>
</nav>
```

- **Não é lógica nova:** o `{% if %}` continua igual e envolve as mesmas coisas (nome e "Sair"). Só o seletor fica do lado de fora.
- **Sem sessão**, a navbar fica com a marca + o seletor (e, na landing, os links de entrada da [04](04-landing-page.md)). Conferir o alinhamento à direita nos dois casos.

## 6. Impacto por camada

| Camada | O que muda |
|---|---|
| **Backend** | **nada** (decisão do grupo) |
| **Banco** | nada |
| **Templates** | `base.html`: script inline no `<head>` antes do `:13`; `<script src="theme.js" defer>`; o seletor na navbar, **fora** do `{% if session.get('user_id') %}` (`:54`), no espaço de `:56-59` que a [01](01-remover-configurar-ia.md) libera; 3 ícones novos no sprite; opcional `<meta name="theme-color">`. Com isso o seletor aparece também no `login.html`, no `register.html` e no futuro `landing.html` ([04](04-landing-page.md)) **sem mexer nesses templates**, porque todos estendem o `base.html`. Nenhum outro template muda |
| **CSS** | `tokens.css`: `color-scheme` e o bloco escuro (duas vezes); remover aliases `--chakra-*`/`--gray-*`. `style.css`: itens 5 a 8 da auditoria; estilos do seletor e do painel; subir o `?v=` (próximo: `redesign_v4`) |
| **JS** | novo `static/js/theme.js`; `app.js:170` (e `:118`, se a 01 não resolver) com a opção 3 |
| **Testes** | o `test_app.py` não é afetado (o tema não muda HTML de resposta, só um atributo aplicado no navegador). Teste manual: §9 |
| **Docs** | `docs/06-padroes-visuais.md` (tokens escuros, seletor, estados); `docs/04` (novo `theme.js`, `data-theme`, ordem dos scripts); `docs/03-frontend-inventario.md` (novo JS) |

## 7. Contratos afetados ([docs/04](../04-contratos-frontend.md))

| Contrato | Seção do 04 | O que acontece |
|---|---|---|
| Ordem dos scripts `marked` → `app.js` | §7.1 | **mantida.** Entra um script inline no `<head>` e o `theme.js` com `defer`, sem relação com os dois |
| Blocos `title` e `content` | §7.1 | intactos; nenhum bloco novo é necessário |
| Condição de sessão da navbar | §7.1 | **muda de forma controlada** (✅ decidido): o seletor fica **fora** do `{% if session.get('user_id') %}`; o nome do usuário e o "Sair" continuam **dentro**. O 04 §7.1 passa a listar o seletor como elemento sem condição de sessão |
| `#label_{{ task_key }}` com `style.color` do JS | §7.2 | o valor escrito pelo JS passa a ser `var(--color-text-subtle)` (opção 3). O ID e o mecanismo não mudam |
| `#planProgressBar` com `style.width` | §7.2 | intacto (a cor vem do token) |
| Classes geradas pelo JS (`.chat-bubble.*`, `.alert-*`) | checklist item 10 | precisam de estilo nos **dois** temas; como usam tokens, herdam o escuro |
| **Novo contrato** | — | `data-theme` no `<html>` com `light`/`dark` ou ausente; chave `studyia-theme` no `localStorage` com `light`/`dark`/`system`; classe `js` no `<html>`. Quem mexer no `<head>` não pode mover o script inline para depois do CSS |

## 8. Riscos e armadilhas

- **Flash do tema errado:** acontece se o script inline sair do `<head>`, for para depois dos `<link>` ou virar um arquivo com `defer`. Deixar um comentário no `base.html` explicando.
- **Cor nova fora dos tokens:** qualquer `#hex` novo num componente quebra o escuro. A regra do [06 §5](../06-padroes-visuais.md#5-regra-nada-de-style-inline) vale também para o CSS: só tokens semânticos.
- **Primitivos usados direto** (itens 5 e 6): quem copiar esse padrão quebra o escuro. Corrigir antes e citar no 06.
- **Conteúdo Markdown da IA** (chat e, depois, a 03): tabelas, código e citações precisam ser conferidos nos dois temas.
- **Bloco de tokens duplicado:** mudar um token escuro em um bloco e esquecer o outro. Mitigação: comentário "manter igual ao bloco X" nos dois e conferência no PR.
- **`popover` em navegador antigo:** sem fallback, o botão não abre nada. Decidir se o fallback entra (custa poucas linhas no `theme.js`).
- **Contraste medido não é contraste visto:** a paleta de §5.2 foi medida, mas ⚠️ não conferida na tela. Validar com screenshots em 375 e 1440 px nos dois temas.

## 9. Critérios de aceite

- [ ] **3 modos:** Claro, Escuro e Dispositivo aplicam a paleta certa em todas as 7 telas (login, cadastro, dashboard, tópico/chat, criar plano, ver plano, seminário).
- [ ] **Seletor em todas as páginas:** o botão de tema aparece **com e sem sessão** (login e cadastro incluídos) e abre o painel com as 3 opções. Quando a [04](04-landing-page.md) entrar, aparece também na landing.
- [ ] **Backend intacto:** o PR não altera nenhum `.py`.
- [ ] **Padrão:** sem nada salvo, o tema segue o sistema operacional.
- [ ] **Persistência:** a escolha sobrevive a recarregar (Ctrl+Shift+R), a navegar entre páginas e a fechar e reabrir o navegador.
- [ ] **Sem flash:** com Escuro escolhido e o sistema claro (e vice-versa), recarregar não mostra o outro tema nem por um quadro (conferir com a gravação de performance do DevTools ou com a rede em "Slow 3G").
- [ ] **Dispositivo ao vivo:** com Dispositivo escolhido, trocar o tema do sistema (ou emular no DevTools: Rendering → `prefers-color-scheme`) muda a página sem recarregar.
- [ ] **Sem JS:** a página segue o sistema e o seletor não aparece.
- [ ] **`localStorage` bloqueado:** a página não quebra e segue o sistema.
- [ ] **AA nos dois temas:** texto ≥ 4,5:1, texto grande e elementos não-texto (bordas de campo, ícones informativos, barra de progresso) ≥ 3:1. Itens 7 a 10 da auditoria resolvidos.
- [ ] **Controles nativos:** select, input de arquivo e barras de rolagem acompanham o tema (`color-scheme`).
- [ ] **Teclado:** o seletor é alcançável por Tab, abre com Enter/Espaço, troca com as setas, fecha com Esc e tem anel de foco visível nos dois temas.
- [ ] **Leitor de tela:** o botão anuncia "Tema: <atual>" e as opções anunciam o estado selecionado.
- [ ] **Alvo de toque:** botão e opções com pelo menos 44 × 44 px.
- [ ] **Movimento:** se a troca de tema tiver transição, ela some com `prefers-reduced-motion: reduce`.
- [ ] **Comportamento intacto:** chat (enviar mensagem), plano (marcar tarefa ou, depois da 03, concluir leitura) e seminário funcionam igual nos dois temas.
- [ ] `DATABASE_PATH=/tmp/studyia-teste.db python -m unittest test_app.py` passa.
- [ ] **Nenhum contrato do [04](../04-contratos-frontend.md) quebrado** (checklist final do 04).

## 10. Divisão em PRs e responsáveis

Um PR (passo 3 da [ordem](README.md#ordem-de-implementação--decidido)), **frontend (Renzo)**. Depende da [01](01-remover-configurar-ia.md) por causa do espaço na navbar.

**Dependência com a [04](04-landing-page.md) (landing page):** a landing vem **depois** deste PR e depende dele: ela usa os tokens escuros, o script anti-FOUC e o seletor fora da condição de sessão. Por isso este PR não pode deixar o seletor dentro da `.nav-user`, nem colocar o script anti-FOUC num lugar que um template sem sessão não herde.

| Parte | Escopo | Observação |
|---|---|---|
| Correções da auditoria (itens 2, 4 a 8) | A | podem ir primeiro, num commit separado, porque não mudam o tema claro |
| Tokens escuros + `color-scheme` | A | |
| Script inline + `theme.js` + seletor fora da condição de sessão | B (JS novo) | aprovado pelo grupo ao decidir a funcionalidade |
| `app.js:170` (e `:118`, se a 01 atrasar) | B | ✅ decidido: só o hex vira `var(--color-text-subtle)` (§5.5) |
| Docs 06, 04, 03 | — | |

## 11. Em aberto / futuro

- 💡 **Fallback para navegador sem `popover`** (detalhe de implementação, não é decisão do grupo): recomendação: sim, com poucas linhas no `theme.js`. Decidir no PR.
- **Futuro:** salvar a preferência no banco (coluna em `users` + rota), para valer em outros dispositivos. Registrado no [handoff](../handoff/backend-pendencias.md).
- **Futuro:** favicon com variante escura (hoje não precisa).
