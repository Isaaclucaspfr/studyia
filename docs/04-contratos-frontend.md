# 04 — Contratos do frontend

> **Consulte este arquivo antes de qualquer mudança em template, CSS ou markup.** Cada item abaixo é algo de que o backend (`app.py`), o JS (`app.js`) ou os testes (`test_app.py`) dependem. Se o redesign quebrar um destes pontos, alguma funcionalidade deixa de funcionar, muitas vezes **sem erro visível**.
>
> Para conferir rápido, vá direto ao [checklist no fim](#antes-de-mexer-em-um-template-confirme).

---

## 7.1 Herança Jinja e estrutura do `base.html`

- [ ] **Os 8 templates fazem `{% extends "base.html" %}`** (o 8º é o `landing.html`, PR 4) e preenchem os dois blocos obrigatórios:
  - `{% block title %}` (`base.html:6`): o texto do `<title>`.
  - `{% block content %}` (`base.html:77`): o conteúdo dentro de `<main class="container">`.
  - Renomear ou remover esses blocos quebra todas as páginas. Criar um novo é permitido, desde que os dois atuais continuem.
  - **Blocos opcionais, vazios por padrão** (só a landing preenche, exceto o `scripts_extra`): `{% block html_attrs %}` (atributos no `<html>`), `{% block head_extra %}` (no `<head>`, depois do CSS), `{% block theme_switch %}` (o padrão **é o seletor de tema**: a landing o deixa vazio), `{% block nav_extra %}` (na `.nav-actions`, entre o seletor e a `.nav-user`), `{% block footer_extra %}` (dentro do `<footer class="site-footer">`, depois do texto do RNF06; a landing põe o crédito do modelo 3D) e `{% block scripts_extra %}` (ver abaixo). As outras telas não mexem neles.
- [ ] **Ordem dos scripts no fim do `<body>`** (`base.html:87-88`): primeiro `marked`, depois `app.js`. O `app.js` usa `window.marked` no `DOMContentLoaded` (`app.js:37`, `:111`). Não mova o `app.js` para o `<head>` sem `defer` e não inverta a ordem.
- [ ] **Flashes** (`base.html:63-73`): o loop precisa continuar gerando `class="alert alert-{{ category }}"`. O backend usa exatamente as categorias **`success`, `danger`, `warning` e `info`** (`flash(..., "<categoria>")` em todo o `app.py`). Se renomear as classes do CSS, mantenha esses 4 sufixos ou faça o mapeamento no template.
- [ ] **Condição de sessão:** o nome do usuário e o "Sair" só existem com `{% if session.get('user_id') %}` (dentro da `.nav-user`). Mantenha a condição. O **seletor de tema** fica **fora** dela, na `.nav-actions`, e aparece com e sem login (decisão da [feature 02](features/02-tema-claro-escuro-dispositivo.md); a [landing](features/04-landing-page.md) depende disso). (O botão "Configurar IA" e o modal da chave saíram na [feature 01](features/01-remover-configurar-ia.md).)
- [ ] **Tema: script inline anti-flash** (feature 02): fica no `<head>` do `base.html`, **antes de qualquer `<link>` de CSS**. Ele lê a chave `studyia-theme` do `localStorage` e põe `data-theme` e a classe `js` no `<html>` antes da primeira pintura. **Tema travado (landing, PR 4):** se o `<html>` já vier do servidor com `data-theme-lock`, o script **não lê** a escolha salva (o `data-theme` do servidor vale) e só põe a classe `js`. Movido para depois do CSS, para um arquivo ou com `defer`, o tema errado pisca ao carregar. O `static/js/theme.js` entra logo depois do CSS, com `defer`, e **não depende do `app.js`** (nem o `app.js` dele): a ordem `marked` → `app.js` no fim do `<body>` não muda.
- [ ] **Tema: contrato do navegador** (feature 02), lido pelo CSS e pelo `theme.js`:
  - `data-theme` no `<html>`: `light`, `dark` ou **ausente** (= Dispositivo, segue o sistema);
  - `data-theme-lock` no `<html>` (PR 4): tema fixo vindo do servidor; hoje só a landing (`data-theme="dark" data-theme-lock`, pelo bloco `html_attrs`). Página travada nunca escreve a chave `studyia-theme`;
  - chave `studyia-theme` no `localStorage`: `light`, `dark` ou `system`;
  - classe `js` no `<html>`: sem ela o seletor fica escondido;
  - IDs do seletor usados pelo `theme.js`: `#themeToggle` (com `popovertarget="themeMenu"`), `#themeMenu` (`[popover]`), `#themeCurrent`, `#themeSystemHint` e os radios `name="studyia-theme"` com `value` `light`/`dark`/`system`. Os radios **não** estão num `<form>`: nada vai ao servidor.
- [ ] **Carregamento dos forms: `static/js/forms.js`** (B4, branch `fix/robustez-envio-e-sessao`): entra no `<head>` logo depois do `theme.js`, com `defer`, e **não depende do `app.js` nem do `theme.js`** (nem eles dele). A ordem `marked` → `app.js` no fim do `<body>` não muda. Ver [7.6](#76-estado-de-carregamento-data-loading-text).
- [ ] **Bloco `{% block scripts_extra %}`** (PR 3, `base.html`, logo depois do `<script>` do `app.js`): **vazio por padrão**; serve para scripts de uma página só. Fica **depois** do `app.js`, então a ordem `marked` → `app.js` não muda. Preenchido pelo login e pelo cadastro (`auth.js` e `neural-bg.js`, ver [7.7](#77-login-e-cadastro-olho-da-senha-e-fundo-de-rede)) e pela [landing](features/04-landing-page.md) (`neural-bg.js`, GSAP do vendor e `landing.js`, ver [7.8](#78-landing-page)).
- [ ] **`ai_demo_mode`** (variável global, `context_processor` em `app.py`): `True` quando não há `GEMINI_API_KEY` no ambiente. Controla o banner "Modo demonstração" do `dashboard.html`. Está disponível em **todos** os templates.
- [ ] **Link da marca** (`base.html:92`): vai para `dashboard` se houver sessão, senão para `index` (a landing). Mudou no PR 4: antes, sem sessão, ia para o `login`.
- [ ] **Nomes de endpoint em `url_for`** são os nomes das funções Python do `app.py`. Um erro de digitação gera `BuildError` e **derruba a página inteira**:

  `index`, `register`, `login`, `logout`, `dashboard`, `new_subject`, `export_topic`, `upload_file`, `delete_topic`, `view_topic`, `send_message`¹, `create_plan`, `view_plan`, `toggle_task`¹, `create_seminar`, `view_seminar`, `submit_seminar`, `static`.

  ¹ Hoje não são chamados via `url_for`: o `app.js` monta a URL na mão (`/topic/${id}/message`, `/plan/${id}/toggle-task`). Por isso, **o formato dessas duas URLs também é contrato**.
- [ ] **Parâmetros do `url_for`:** `topic_id=` (`view_topic`, `export_topic`, `delete_topic`, `create_plan`, `create_seminar`), `plan_id=` (`view_plan`) e `seminar_id=` (`view_seminar`, `submit_seminar`).

---

## 7.2 IDs e classes usados pelo `app.js`

| Seletor | Onde está | Uso no JS | O que não pode mudar |
|---|---|---|---|
| `.markdown-content` + `data-raw` | `study_topic.html:77` | `innerHTML = marked.parse(data-raw)` (`app.js:34-40`) | a classe e o atributo `data-raw="{{ msg.content \| e }}"`; o conteúdo interno do elemento é **substituído** pelo JS |
| `#chatForm` + `data-topic-id` | `study_topic.html:85` | submit com `preventDefault`; o ID do tópico vem de `dataset.topicId` (`app.js:29`, `:46-51`) | o ID e o atributo `data-topic-id="{{ topic.id }}"`; o form **não tem `action`**, então sem o JS ele faria GET na própria página |
| `#chatInput` | `study_topic.html:86` | `.value` lido e limpo (`app.js:30`, `:48`, `:55`) | o ID; **não tem `name`** e não precisa (vai via JSON) |
| `#chatMessages` | `study_topic.html:66` | recebe as bolhas com `appendChild` e `scrollTop = scrollHeight` (`app.js:31`, `:44`, `:128`) | o ID; precisa de **altura limitada + `overflow-y:auto`** para a rolagem automática funcionar. Hoje isso vem de `.chat-messages` (`style.css:382-390`, `flex:1; overflow-y:auto`) dentro de `.chat-window` com `height:620px` inline (`study_topic.html:58`) |
| `#sendBtn` | `study_topic.html:90` | o `app.js` pega o **botão de envio dentro do `#chatForm`** (`querySelector('button[type="submit"]')`, não pelo ID) para travar o envio: `aria-disabled`, rótulo "Respondendo…" e de volta ao original no fim (B4) | o ID é livre; o `#chatForm` precisa ter **um** `button[type="submit"]`. O conteúdo do botão é salvo e restaurado pelo JS |
| `#chatStatus` | `study_topic.html:94` | `textContent` com o anúncio do envio para leitor de tela (`app.js:26`, `:50`) | o ID, `role="status"` e `class="sr-only"`; deve existir **vazio** no carregamento (B4) |
| `.plan-task-checkbox` + `data-plan-id` + `data-task-key` | `plan_view.html:71-78` | listener de `change`; payload do fetch (`app.js:145-149`) | a classe e os dois atributos |
| `#label_{{ task_key }}` | `plan_view.html:80` | `style.textDecoration` e `style.color` alterados pelo JS (`app.js:144-149`); desde a feature 02 a cor escrita é `var(--color-text-subtle)` e segue o tema | o ID derivado da `task_key`. O JS escreve **estilo inline**, que vence qualquer classe CSS (ver [06-padroes-visuais.md](06-padroes-visuais.md#exceções-permitidas)) |
| `#planProgressBar` | `plan_view.html:39` | `style.width = "<n>%"` (`app.js:161`, `:164`) | o ID; a largura é controlada via `style.width` |
| `#planProgressText` | `plan_view.html:36` | `textContent = "<n>%"` (`app.js:162`, `:165`) | o ID; o conteúdo é sobrescrito |

### Estrutura da bolha de chat (duplicada em Jinja e JS)

A mesma estrutura é gerada **em dois lugares**: no Jinja, para o histórico (`study_topic.html:67-81`), e no JS, para as mensagens novas (`appendBubble`, `app.js:86-130`). **Se mudar uma, mude a outra**, senão as mensagens antigas e as novas ficam diferentes.

```html
<div class="message-row {user|assistant}">
  <div class="avatar-circle {user|assistant}">👤 | 🤖</div>
  <div class="message-content-wrapper">
    <div class="message-sender-name">Você | StudyIA Tutor <span class="message-time">HH:MM</span></div>
    <div class="chat-bubble {tipo} [markdown-content]" [data-raw="..."]>…</div>
  </div>
</div>
```

- No Jinja, `{tipo}` é o próprio `msg.sender` (`user` ou `assistant`), mais `markdown-content` e `data-raw`.
- No JS, `{tipo}` pode ser `user`, `assistant`, `assistant typing` ou `assistant error` (`app.js:54`, `:59`, `:73`, `:75`, `:79`). A bolha do JS **não** recebe `markdown-content`: ela já é renderizada direto.
- Quando `is_simulated` é verdadeiro, o JS acrescenta ao fim da bolha um `<div class="chat-demo-note">Resposta de demonstração: a IA não está disponível no momento.</div>` (`app.js:95-97`). A classe `.chat-demo-note` precisa continuar estilizada no CSS (sem `style=""` inline desde a [feature 01](features/01-remover-configurar-ia.md)).

---

## 7.3 Atributos `name` lidos pelo Flask

| Form | Onde | `action` / método | `name`s obrigatórios | Observações |
|---|---|---|---|---|
| Login | `login.html:18` | `POST url_for('login')` | `login_input`, `password` | `login_input` aceita usuário **ou** e-mail (`app.py:111-117`). `autocomplete`: `username` / `current-password` ([7.7](#77-login-e-cadastro-olho-da-senha-e-fundo-de-rede)) |
| Cadastro | `register.html:18` | `POST url_for('register')` | `name`, `username`, `email`, `password`, `confirm_password` | backend exige senha ≥ 6 e senhas iguais (`app.py:72-78`). `autocomplete`: `name` / `username` / `email` / `new-password` (nas duas senhas) |
| Novo assunto | `dashboard.html:79` | `POST url_for('new_subject')` | `title`, `initial_question` | `title` vazio → flash + volta ao dashboard |
| Upload | `dashboard.html:109` | `POST url_for('upload_file')` | `document` (file), `custom_title` | **`enctype="multipart/form-data"` obrigatório**; `accept=".pdf,.txt,.md"` é só uma dica, quem valida é o backend |
| Plano | `plan_create.html:24` | `POST url_for('create_plan', topic_id=…)` | `goal`, `level`, `daily_minutes`, `days_per_week`, `deadline` | `daily_minutes` e `days_per_week` passam por **`int()`**: os `value` dos `<option>` precisam ser números (`plan_create.html:44-47`, `:56-58`). `level` aparece como "Nível {{ level }}" (valores atuais: `Iniciante`, `Intermediário`, `Avançado`, `:35-37`) |
| Enviar seminário | `seminar_view.html:94` | `POST url_for('submit_seminar', seminar_id=…)` | `q_{{ q.id }}`, um por questão (`:135`, `:150`) | múltipla escolha: `<input type="radio">` com **`value="{{ opt }}"`, o texto completo** (ex. `"A) ..."`, `:136`). Esse valor é comparado pelo fallback (2 primeiros caracteres) e pelo próprio template para destacar a escolhida (`user_answers.get(qid) == opt`, `:132`, `:138`). Discursiva: `<textarea>` |
| Excluir tópico | `dashboard.html:170` | `POST url_for('delete_topic', …)` | — | |
| Gerar seminário | `study_topic.html:35`, `:138`; `plan_view.html:97`; `seminar_view.html:29` | `POST url_for('create_seminar', …)` | — | |

### Forms que PRECISAM continuar POST

As rotas abaixo só aceitam `POST`. Transformar o botão em `<a href>` gera **405 Method Not Allowed**:

- `delete_topic` (excluir estudo)
- `create_seminar` (gerar seminário, nos 4 lugares)
- `new_subject`, `upload_file`, `submit_seminar`

Podem ser links (`GET`): `create_plan` (abre o form), `view_topic`, `view_plan`, `view_seminar`, `export_topic`, `logout`, `dashboard`, `login`, `register`.

---

## 7.4 Lógica embutida nos templates

- [ ] **Fórmula da `task_key`** (`plan_view.html:67`):
  ```jinja
  {% set task_key = "d" ~ day.day_number ~ "_t" ~ loop.index0 %}
  ```
  A chave é **persistida** em `study_plans.completed_tasks_json`. Se você mudar a fórmula, o progresso de todos os planos já salvos se perde. Pelo mesmo motivo, **não reordene, filtre nem pagine** `day.tasks` antes desse loop: o `loop.index0` precisa ser o índice original. Os testes também usam `'d1_t0'` (`test_app.py:112`).
- [ ] **Fatiamento de datas** (os timestamps chegam como string `"AAAA-MM-DD HH:MM:SS"`, em UTC):
  - `t.created_at[:10]` → data (`dashboard.html:159`)
  - `topic.created_at[:16]` → data e hora (`study_topic.html:24`)
  - `msg.created_at[11:16]` → hora `HH:MM` (`study_topic.html:75`)
- [ ] **Valores literais vindos do banco:**
  - `topic_type`: **`'file'`** ou **`'subject'`** (`dashboard.html:144-156`, `study_topic.html:17`, `:46`)
  - `msg.sender`: **`'user'`** ou **`'assistant'`**, usados **direto como classe CSS** (`study_topic.html:68-69`, `:77`): `.message-row.user`, `.chat-bubble.assistant` etc.
  - `q.type == 'multiple_choice'` decide entre radio e textarea (`seminar_view.html:128`); qualquer outro valor vira discursiva.
  - `feedback_item.status`: `'correct'`, `'partial'` ou qualquer outro valor, tratado como incorreto (`seminar_view.html:113-119`, `:161`).
  - `seminar.is_completed` (0/1) alterna entre o form editável (`required`) e o resultado (`disabled`) (`:139`, `:154`, `:170`).
- [ ] **Comparação de IDs do seminário:** `q.id | string` e `fi.question_id | string` (`seminar_view.html:97`, `:101`). A IA pode devolver números ou strings, então mantenha o `|string`.
- [ ] **Limiares de nota** (`seminar_view.html:40`, `:47-48`, `:57`): são apresentação. Podem ser unificados no redesign (ver [05-achados-frontend.md](05-achados-frontend.md)), mas a variável continua sendo `seminar.score` (0–100).
- [ ] **Valores derivados no template:** `avg_score` pode ser `None` (`dashboard.html:57`); `day.estimated_minutes or plan.daily_minutes` (`plan_view.html:61`); `questions_data.instructions or '...'` (`seminar_view.html:24`).
- [ ] **`{{ messages|length }}`** (`study_topic.html:62`) é calculado só no carregamento da página.

---

## 7.5 Textos verificados pelo `test_app.py`

O teste faz `assertIn` em textos do HTML ou do flash. **Se o redesign mudar estes textos, o teste quebra:**

| Texto procurado | Onde aparece | Teste |
|---|---|---|
| `"Painel de Estudos"` | `dashboard.html:3` (`<title>`) e `:13` (`<h1>`) | `test_app.py:33` |
| título do tópico (`"Engenharia de Software e IA"`) | `study_topic.html` (`{{ topic.title }}`) | `test_app.py:41` |
| `"Caderno de Estudos"` | gerado no `app.py:264` (export), não em template | `test_app.py:69` |
| `"Apostila BD 2026"` (`custom_title`) | `study_topic.html` (`{{ topic.title }}`) | `test_app.py:83` |
| `"não consta"` | resposta do fallback (`ai_service.py:155`) | `test_app.py:94` |
| `"Progresso Geral de Execu"` | `plan_view.html:35` ("Progresso Geral de Execução:") | `test_app.py:105` |
| `"avaliado com sucesso"` | flash do `app.py:754`, renderizado por `base.html` | `test_app.py:133` |
| `"Transforme qualquer tema em"` + `href="/register"` e `href="/login"` | `landing.html` (`<h1>` e CTAs) | `LandingTestCase` (PR 4) |

O teste também envia diretamente os `name`s de formulário (`test_app.py:25-31`, `:36-39`, `:78-81`, `:97-103`, `:127-131`) e as chaves JSON `message`, `task_key`, `reply` e `progress_percent`. Esses nomes são duplamente contrato.

> Para o título do tópico ser encontrado, ele precisa aparecer **como texto** no HTML (o Jinja faz autoescape). Não o troque por imagem nem por um atributo só.

---

## 7.6 Estado de carregamento (`data-loading-text`)

Contrato do `static/js/forms.js` (B4). Todo **botão de envio de um form POST que chama a IA** leva o atributo com o texto curto do carregamento, em sentence case e sem emoji:

| Form | Onde | `data-loading-text` |
|---|---|---|
| Novo assunto | `dashboard.html:66` | `Criando estudo…` |
| Upload | `dashboard.html:94` | `Processando arquivo…` |
| Plano | `plan_create.html:73` | `Gerando plano…` |
| Gerar seminário (4×) | `study_topic.html:34`, `:148`; `plan_view.html:95`; `seminar_view.html:31` | `Gerando seminário…` |
| Enviar seminário | `seminar_view.html:171` | `Avaliando respostas…` |
| Login (PR 3) | `login.html:40` | `Entrando…` |
| Cadastro (PR 3) | `register.html:68` | `Criando conta…` |

- O atributo fica no `<button type="submit">`, não no `<form>`. Form sem o atributo (hoje só o excluir) não é tocado. Login e cadastro não chamam a IA, mas ganharam o atributo no PR 3 para o mesmo retorno visual e o anti-clique-duplo.
- No 1º envio, o JS põe `aria-busy="true"` no form e `aria-disabled="true"` no botão (**não** `disabled`: o foco continua no botão), troca o conteúdo do botão por `<span class="btn-spinner">` + o texto e escreve o anúncio em `#formsStatus` (criado pelo próprio JS no fim do `<body>`; não use esse ID em template). Os envios seguintes são cancelados.
- No `pageshow` (voltar pelo histórico), o conteúdo original do botão é restaurado e os atributos saem.
- **O CSS do estado** (`style.css`, logo depois de `.btn:disabled`): `.btn-spinner` e `form[aria-busy="true"] .btn[aria-disabled="true"]`. Usa o visual de desabilitado que já existia, com `currentColor` (segue o tema). O anel só gira com `prefers-reduced-motion: no-preference`.
- **Um form POST de IA novo precisa do atributo**, senão ele volta a aceitar clique duplo. O chat **não** usa este atributo: a guarda dele fica no `app.js` (ver 7.2).

---

## 7.7 Login e cadastro: olho da senha e fundo de rede

Entrou no PR 3 (branch `feat/login-cadastro`). Tudo aqui é **só interface**: nenhum `name`, `action`, `method` ou validação do servidor mudou.

**Olho de mostrar/ocultar senha** (`static/js/auth.js`, carregado pelo `scripts_extra` só no login e no cadastro):

| O quê | Contrato |
|---|---|
| Botão | `<button type="button" class="password-toggle" aria-controls="<id do campo>" aria-label="Mostrar senha" aria-pressed="false" hidden>`, **dentro** do `.input-with-icon` do campo, depois do `<input>` |
| Onde | `login.html:33` (`password`); `register.html:49` (`password`) e `:61` (`confirm_password`) |
| Sem JS | o botão fica `hidden` e o campo funciona como sempre. O JS só tira o `hidden` dos botões cujo `aria-controls` aponta para um `input[type="password"]` existente |
| Estado | o JS troca o `type` do campo (`password` ↔ `text`) e o `aria-pressed` (`false` ↔ `true`). **O `aria-label` é fixo** ("Mostrar senha"): o estado vai só no `aria-pressed` (decisão 6 do PR 3). O foco fica no botão |
| Ícones | `#i-eye` (`.password-toggle-show`) e `#i-eye-off` (`.password-toggle-hide`) no sprite; o CSS mostra um ou outro pelo `aria-pressed` |
| Envio | no `submit`, o campo volta a `type="password"` (o navegador não guarda a senha como texto). O valor enviado é o mesmo |

**`autocomplete`** (ajuda os gerenciadores de senha; não muda nada no servidor): login `username` e `current-password`; cadastro `name`, `username`, `email` e `new-password` nos dois campos de senha. Os campos de usuário levam também `autocapitalize="none"` e `spellcheck="false"`.

**Fundo de rede neural animada** (`static/js/neural-bg.js`, também pelo `scripts_extra`):

- O JS **cria** o `<canvas class="neural-bg" aria-hidden="true">` no fim do `<body>` e põe a classe **`neural-bg-active` no `<html>`**. O CSS usa essa classe para tirar o fundo estático (`--pattern-network`). Sem JS ou sem canvas 2D, fica o fundo estático.
- Lê do tema os tokens **`--color-accent`** e **`--network-strength`** (tokens.css, nos 3 blocos). Observa o `data-theme` do `<html>` (seletor) e o `prefers-color-scheme` (Dispositivo) para trocar a cor ao vivo.
- Independente do `app.js`, do `theme.js`, do `forms.js` e do `auth.js`. Não lê nem envia dado nenhum.
- Padrão visual e valores: [06 §9](06-padroes-visuais.md#9-telas-de-autenticação-login-e-cadastro).

**Flashes no login e no cadastro:** o loop continua no `base.html` (7.1). O alinhamento com o card é só CSS (`body:has(.auth-page) .flash-container`), então a `.auth-page` precisa continuar existindo nos dois templates.

---

## 7.8 Landing page

Entrou no PR 4 (branch `feat/landing-page`, Fases 1 e 2). Padrão visual no [06 §10](06-padroes-visuais.md#10-landing-page); decisões no [features/04 §12](features/04-landing-page.md#12-registro-da-implementação).

| O quê | Contrato |
|---|---|
| Rota | `GET /` (`index`): sem sessão → `landing.html` (200); com sessão → redirect para `dashboard`. `login_required` e logout continuam mandando para o `login` |
| Tema | `<html data-theme="dark" data-theme-lock>` pelo bloco `html_attrs`; bloco `theme_switch` vazio (sem seletor; o `theme.js` não acha o `#themeToggle` e não faz nada) |
| Arquivos só da landing | `static/css/landing.css` (pelo `head_extra`), `static/js/landing.js`, `static/js/landing-scene.js` (módulo, importado pelo `landing.js`), `static/vendor/gsap/3.15.1/*`, `static/vendor/three/0.187.0/*`, `static/vendor/models/brain/brain-v2.glb` e `static/vendor/fonts/inter-display-latin*.woff2`. **Nunca** no `base.html`: as outras telas não pagam esse peso. Three.js, cena e modelo só descem no desktop capaz |
| Vendor (contrato novo) | `static/vendor/<lib>/<versão>/`: a versão vai no caminho (no modelo 3D, no nome: `brain-v2.glb`); trocar de versão = caminho novo + atualizar o template. Origem, licença e SHA em `static/vendor/README.md` (e `static/vendor/models/brain/README.md`). Não editar nem reminificar os arquivos do GSAP e do Three.js (os avisos de copyright/licença têm que ficar). O Three.js mantém os nomes `three.module.js`/`three.core.js` (o primeiro importa o segundo pelo nome) |
| Atributos lidos pelo `landing.js` | `data-hero` (entrada do hero), `data-hero-visual` (o contêiner do cérebro), `data-scene-src` e `data-model-src` (no mesmo contêiner: URL da cena e do modelo, com o `?v=`), `data-hero-hint` (o wrapper do "role para explorar", que some ao rolar), `data-reveal` (revelação por seção), `data-step-text`/`data-step-shot` (passos) |
| Cena 3D: `<head>` da landing | no `head_extra`, **nesta ordem**: o `<script type="importmap">` (`three` → `vendor/three/0.187.0/three.module.js`, `three/addons/` → `vendor/three/0.187.0/addons/`) e o script inline "vai ter 3D?". O importmap tem que vir **antes** de qualquer módulo ou `modulepreload` (o navegador rejeita um importmap que chega depois). O script testa ≥ 768 px, `pointer: fine`, sem movimento reduzido e WebGL 2 acelerado; se passar, põe a classe `scene-3d` no `<html>` e cria os `modulepreload` (cena, Three.js, sampler) e o preload do modelo (`as="fetch"`, `crossorigin`). As URLs dos preloads têm que ser **as mesmas** do `data-scene-src`/`data-model-src` (inclusive o `?v=`) |
| Cena 3D: classes | `scene-3d` no `<html>` (desktop capaz: o CSS esconde o SVG do `.landing-visual`); no `.landing-visual`: `is-3d` (a cena na tela) e `is-fallback` (a cena falhou ou atrasou: o SVG volta). O `<canvas class="landing-scene" aria-hidden="true">` é criado pelo JS dentro do `.landing-visual` |
| Crédito do modelo 3D (CC BY 4.0) | `<p class="landing-credit">` no `footer_extra` do `landing.html`, com link para a página do modelo e para a licença. **Obrigatório** enquanto o modelo for usado |
| Sem JS | tudo visível. Só o que tem `data-hero`/`data-hero-visual` começa invisível, e só com a classe `js` + sem movimento reduzido, com a trava de 1,6 s no CSS |
| Prints do app | `static/img/landing/passo-{1,2,3}-*`: `<picture>` com AVIF e WebP (720w e 1120w) + JPEG 1120, `width="1120" height="840"`, `loading="lazy"`, `alt` descritivo. Se a tela do app mudar, refazer o print (roteiro no features/04 §12) |
| Âncora | `#como-funciona` (a seção dos passos), alvo do "role para explorar" |

---

## Antes de mexer em um template, confirme:

1. [ ] O template continua com `{% extends "base.html" %}` e o conteúdo está dentro de `{% block content %}`.
2. [ ] Nenhum ID da [tabela 7.2](#72-ids-e-classes-usados-pelo-appjs) foi renomeado, removido ou duplicado, e os atributos `data-*` continuam no mesmo elemento.
3. [ ] Todo `<input>`, `<select>` e `<textarea>` mantém o `name` da [tabela 7.3](#73-atributos-name-lidos-pelo-flask), e os `value` numéricos do plano continuam numéricos.
4. [ ] Os forms de `delete_topic`, `create_seminar`, `new_subject`, `upload_file` e `submit_seminar` continuam `method="POST"`, e o upload mantém o `enctype="multipart/form-data"`.
5. [ ] Os `url_for(...)` usam exatamente os nomes de endpoint listados em 7.1.
6. [ ] Se mexeu na bolha de chat do Jinja (`study_topic.html:67-81`), a estrutura bate com a do `appendBubble` (`app.js:86-130`), e o `data-raw` continua no elemento `.markdown-content`.
7. [ ] A fórmula da `task_key` e o loop de tarefas (`plan_view.html:66-86`) estão intactos.
8. [ ] Os textos da [tabela 7.5](#75-textos-verificados-pelo-test_apppy) continuam presentes.
9. [ ] O `#chatMessages` continua com altura limitada e `overflow-y:auto`.
10. [ ] As classes que o JS ou o backend geram dinamicamente continuam estilizadas: `.message-row.user/.assistant`, `.chat-bubble.user/.assistant`, `.chat-demo-note`, `.alert-success/-danger/-warning/-info`, **nos dois temas** (só com tokens semânticos; ver [06 §7](06-padroes-visuais.md#7-temas-claro-e-escuro)).
11. [ ] Se mexeu no `<head>` ou na navbar do `base.html`: o script inline do tema continua **antes** dos `<link>` de CSS, e o seletor de tema continua **fora** do `{% if session.get('user_id') %}`.
12. [ ] Todo botão de envio de form POST que chama a IA tem `data-loading-text` ([7.6](#76-estado-de-carregamento-data-loading-text)), e o `#chatForm` continua com um único `button[type="submit"]` e o `#chatStatus` vazio.
13. [ ] No login e no cadastro: cada `.password-toggle` continua com `hidden`, `aria-controls` apontando para o `id` do campo de senha, `aria-label="Mostrar senha"` fixo e `aria-pressed="false"`; os `autocomplete` de [7.7](#77-login-e-cadastro-olho-da-senha-e-fundo-de-rede) continuam; o `scripts_extra` carrega o `auth.js` e o `neural-bg.js`.
14. [ ] Na landing: o `html_attrs` continua com `data-theme="dark" data-theme-lock`, o `theme_switch` vazio e um único `<h1>`; os atributos de [7.8](#78-landing-page) continuam nos mesmos elementos; GSAP e `landing.js` só no `scripts_extra` do `landing.html`; o importmap continua **antes** do script "vai ter 3D?" no `head_extra`, com as URLs dos preloads iguais às do `data-scene-src`/`data-model-src`; o crédito do modelo continua no `footer_extra`.

---

## Histórico de mudanças nos contratos

| Data | Mudança | Origem |
|---|---|---|
| 2026-11-25 | **Fase 2 da landing (cena 3D). Adicionados:** o bloco vazio `{% block footer_extra %}` no `<footer>` do `base.html` (7.1); no `landing.html`, o importmap e o script inline "vai ter 3D?" no `head_extra`, os atributos `data-scene-src` e `data-model-src` no `.landing-visual` e o crédito do modelo (`.landing-credit`) no `footer_extra`; a classe `scene-3d` no `<html>` e as classes `is-3d`/`is-fallback` no `.landing-visual`; o `<canvas class="landing-scene">` criado pelo JS; o `static/js/landing-scene.js`; o `static/vendor/three/0.187.0/` (Three.js + `addons/math/MeshSurfaceSampler.js`) e o `static/vendor/models/brain/brain-v2.glb` (CC BY 4.0) ([7.8](#78-landing-page)). **Alterado:** o importmap passa a ficar no `<head>`; a entrada do hero (título e apoio em 0,5 s). **Sem mudança:** os outros blocos, a ordem `marked` → `app.js`, `login_required`, logout, rotas, textos testados. Cache: `landing.css` em `?v=landing_v11`, `landing.js` em `?v=landing_v8`, `landing-scene.js` em `?v=landing_scene_v6`. **Backend:** nenhum. | PR 4, branch `feat/landing-page`, Fase 2 ([features/04](features/04-landing-page.md) §12) |
| 2026-11-25 | **Alterados:** a rota `GET /` (`index`) renderiza o `landing.html` sem sessão (antes: redirect para o `login`); com sessão, continua indo para o `dashboard`. O **link da marca** sem sessão vai para `index` (antes: `login`). O script anti-flash respeita `data-theme-lock` no `<html>`. Os templates passam a ser **8** (o `landing.html` estende o `base.html`). **Adicionados:** os blocos vazios `html_attrs`, `head_extra`, `theme_switch` (padrão = o seletor) e `nav_extra` no `base.html` (7.1); o `templates/landing.html`, o `static/css/landing.css`, o `static/js/landing.js`, o `static/vendor/` (GSAP 3.15.1 + ScrollTrigger, Inter Display) e o `static/img/landing/` ([7.8](#78-landing-page)); os ícones `chip`, `layers`, `network`, `trophy`, `cap`, `bulb`, `chart-up`, `laptop` e `arrow-down` no sprite; o texto testado "Transforme qualquer tema em" (7.5). **Removidos:** o Lucide (`<script src="https://unpkg.com/lucide@latest">` e `lucide.createIcons()`), sem nenhum `data-lucide` no projeto ([B10](05-achados-frontend.md)). **Sem mudança:** `title`/`content`, ordem `marked` → `app.js`, condição de sessão da navbar, `login_required`, logout. Cache: `tokens.css` e `style.css` em `?v=landing_v1`; `landing.css` em `?v=landing_v7`; `landing.js` em `?v=landing_v3`. **Backend:** só a função `index` do `app.py` (+ 2 testes). | PR 4, branch `feat/landing-page` ([features/04](features/04-landing-page.md) §12) |
| 2026-11-24 | **Adicionados:** o bloco vazio `{% block scripts_extra %}` no `base.html`, depois do `app.js` (7.1); o `static/js/auth.js` (olho da senha) e o `static/js/neural-bg.js` (fundo de rede animada), carregados só no login e no cadastro por esse bloco, independentes dos outros scripts; o botão `.password-toggle` nos 3 campos de senha, com `hidden`, `aria-controls`, `aria-label` fixo e `aria-pressed` ([7.7](#77-login-e-cadastro-olho-da-senha-e-fundo-de-rede)); os `autocomplete` dos dois forms (7.3); `data-loading-text` no login ("Entrando…") e no cadastro ("Criando conta…") (7.6); o `<canvas class="neural-bg">` e a classe `neural-bg-active` no `<html>`, criados pelo JS; os tokens `--pattern-network` e `--network-strength`; os ícones `#i-eye`, `#i-eye-off`, `#i-mail` e `#i-at` no sprite. **Alterado:** textos do cadastro (título "Criar conta no StudyIA", botão "Criar conta"). **Sem mudança:** `name`, `action`, `method` e `url_for` dos dois forms; o link da marca sem sessão continua indo para o `login`; nenhum texto da tabela 7.5. Cache: `tokens.css` e `style.css` em `?v=auth_v1`; `auth.js` em `?v=auth_v1`, `neural-bg.js` em `?v=auth_v2`. | PR 3, branch `feat/login-cadastro` ([features/04](features/04-landing-page.md), decisões 6 e 7 do rebrand) |
| 2026-11-24 | **Adicionados:** o `static/js/forms.js` (`defer`, no `<head>` depois do `theme.js`, independente do `app.js` e do `theme.js`); o atributo `data-loading-text` nos 9 botões de envio dos forms POST de IA ([7.6](#76-estado-de-carregamento-data-loading-text)); os estados `aria-busy` no form e `aria-disabled` no botão durante o envio; o ID `#formsStatus` (criado pelo JS); o `<p id="chatStatus" role="status">` no `#chatForm`; as classes `.btn-spinner` e a regra `form[aria-busy="true"] .btn[aria-disabled="true"]` no CSS. **Alterado:** o envio do chat no `app.js` (guarda `isSending`, botão travado e rótulo "Respondendo…" até a resposta, de volta no `finally`); o `app.js` passa a usar o `button[type="submit"]` do `#chatForm`. **Sem mudança:** payload, URL e resposta do `fetch`, estrutura da bolha, `name`/`action`/`method` dos forms. Cache: `style.css` e `app.js` em `?v=robustez_v1`. **Backend:** o `login_required` agora trata a sessão órfã (redirect + flash `info`); as rotas JSON mantêm o redirect. | branch `fix/robustez-envio-e-sessao` (B4 + [handoff §17](handoff/backend-pendencias.md#17-sessão-de-um-usuário-que-não-existe-mais-no-banco-gera-erro-500)) |
| 2026-11-23 | **Adicionados:** o seletor de tema na navbar, **fora** da condição de sessão (`.nav-actions` › `.theme-switch`); o script inline anti-flash no `<head>`, antes do CSS; o `static/js/theme.js` (`defer`, independente do `app.js`); o contrato `data-theme` no `<html>` (`light`/`dark`/ausente), a chave `studyia-theme` no `localStorage` (`light`/`dark`/`system`), a classe `js` no `<html>` e os IDs `#themeToggle`, `#themeMenu`, `#themeCurrent` e `#themeSystemHint`. **Alterado:** a cor que o `app.js` escreve em `#label_<task_key>` (`#94a3b8` → `var(--color-text-subtle)`); o ID e o mecanismo não mudaram. **Nenhum contrato existente removido.** | [feature 02](features/02-tema-claro-escuro-dispositivo.md) |
| 2026-11-22 | **Removidos:** `#openSettingsBtn`, `#settingsModal`, `#closeSettingsBtn`, `#openSettingsBtn2` (e o `onclick` inline), o form "Chave Gemini" (`gemini_api_key`), o endpoint `update_api_key` (rota `POST /settings/api-key`) e o item 9 do checklist sobre o modal. **Adicionados:** a variável global `ai_demo_mode` (no lugar do `has_custom_key`) e a classe `.chat-demo-note` gerada pelo `app.js`. | [feature 01](features/01-remover-configurar-ia.md) |
