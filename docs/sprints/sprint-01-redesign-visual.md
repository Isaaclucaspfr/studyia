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

### Global (`style.css` + `base.html`)
- [ ] Tokens semânticos + aliases das variáveis indefinidas (A1)
- [ ] Componentes base do [06 §2](../06-padroes-visuais.md#2-componentes-base)
- [ ] Estados: hover (só com `hover: hover`), focus-visible, disabled, vazio, erro (A5)
- [ ] Media queries mobile-first (`640`, `768`, `1024`, `1280`)
- [ ] `<link>` do Google Fonts só com Inter (A7)
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
- [ ] `.feedback--*` para o retorno por questão. ⚠️ Por causa do B1, esse bloco provavelmente **não aparece** hoje: estilize pelo markup, mas não vai dar para validar visualmente até o B1 ser resolvido
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

## Contexto para retomar

Cole o bloco abaixo no início de uma nova sessão do Claude Code:

```text
Projeto: StudyIA (A3 de IA, em grupo). Flask + Jinja + CSS puro + JS puro (app.js), SQLite, Gemini com fallback "modo demo".
Meu papel: SOMENTE a parte visual do frontend (HTML/CSS e apresentação nos templates Jinja).
Estou na Sprint 01 — redesign visual: docs/sprints/sprint-01-redesign-visual.md (escopo = itens A1–A8 de docs/05-achados-frontend.md).

ANTES de editar qualquer template, leia docs/04-contratos-frontend.md e cumpra o checklist do final.
Siga as convenções de docs/06-padroes-visuais.md (tokens, componentes, estados, mobile-first, sem style="" inline salvo as exceções).

Regras de git (não negociáveis):
- Trabalhar em branch criada a partir da main atualizada: git checkout main && git pull && git checkout -b <branch>
- Você PODE criar branches e rodar git status e git diff.
- Você NÃO PODE rodar git add, commit, push, merge ou rebase. Eu faço os commits e os pushes. Nada vai direto para a main: PR → revisão do grupo → merge.
- No fim, me entregue os comandos git add/commit separados por grupo de arquivos, com mensagens curtas.

Restrições:
- Não alterar *.py, static/js/app.js, requirements.txt, README.md, doc_completo.txt, .env.example.
- Não mudar o stack: sem React, Tailwind, build step ou novas CDNs.
- Itens de comportamento (categoria B) e de backend (categoria C) são só documentados, nunca corrigidos sem aprovação do grupo.
- Não rodar o app nem os testes fora de branch (database.init_db() roda no import e cria studyia.db).
  Testes: DATABASE_PATH=/tmp/studyia-teste.db python -m unittest test_app.py
- Validar as telas em 375px e 1440px.
- Marcar como "⚠️ não confirmado" o que não foi verificado rodando o app.

Docs: docs/README.md (índice), docs/04-contratos-frontend.md, docs/06-padroes-visuais.md, docs/05-achados-frontend.md.
```
