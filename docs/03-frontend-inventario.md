# 03 — Inventário do frontend

> Os contratos (o que não pode mudar) estão em [04-contratos-frontend.md](04-contratos-frontend.md). Este arquivo só descreve o que existe.

## Templates (`templates/`)

Todos os 7 templates de página fazem `{% extends "base.html" %}` e preenchem **apenas** `{% block title %}` e `{% block content %}`.

| Template | O que mostra | Variáveis do backend | Rota |
|---|---|---|---|
| `base.html` | `<head>` (CSS, fontes, Lucide); navbar (`:18-35`) com marca, nome e "Sair" (o "Configurar IA" e o modal da chave saíram na feature 01); flashes (`:63-73`); `<main class="container">` (`:76-78`); rodapé de transparência RNF06 (`:81-84`); scripts (`:87-93`) | `session.user_id`, `session.name`, `get_flashed_messages(with_categories=true)`; `url_for`: `dashboard`, `login`, `logout`, `static`; `ai_demo_mode` (global) | — |
| `login.html` | card centralizado com o form de login e link para cadastro | — | `login` |
| `register.html` | card centralizado com o form de cadastro e link para login | — | `register` |
| `dashboard.html` | cabeçalho + banner "Modo Demonstração" (`:20-25`); 3 estatísticas (`:30-62`); cards "Pesquisar Assunto" (`:67-94`) e "Estudo de Arquivo" (`:97-124`); histórico (`:128-185`) com "Abrir Estudo" e excluir | `topics[]` (`id`, `title`, `topic_type`, `file_name`, `created_at`, `plans_count`, `seminars_count`), `total_topics`, `total_plans`, `total_seminars`, `avg_score` (ou `None`); o banner usa `ai_demo_mode` (global, no lugar do antigo `has_custom_key`) | `dashboard` |
| `study_topic.html` | "← Voltar"; título + badge de modo; botões Exportar / Gerar Plano / Iniciar Seminário (`:28-40`); `.ai-notice` de modo (`:45-51`); grid de 2 colunas (`:54`): chat (`:57-92`) e coluna lateral com planos (`:98-132`) e seminários (`:135-169`) | `topic` (`id`, `title`, `topic_type`, `file_name`, `created_at`), `messages[]` (`sender`, `content`, `created_at`), `plans[]` (`id`, `level`, `daily_minutes`, `progress_percent`), `seminars[]` (`id`, `is_completed`, `score`) | `view_topic` |
| `plan_create.html` | form de preferências (F07): objetivo, nível, minutos/dia, dias/semana, prazo; aviso de IA; Cancelar / Gerar | `topic` (`id`, `title`) | `create_plan` (GET) |
| `plan_view.html` | "← Voltar"; título, nível e overview; "Reajustar Preferências"; card de progresso (`:33-45`); um card por dia com checkboxes (`:49-90`); CTA de seminário (`:92-102`) | `plan` (`id`, `topic_id`, `topic_title`, `level`, `daily_minutes`, `days_per_week`, `progress_percent`), `plan_data` (JSON do plano), `completed_tasks` (lista de `task_key`) | `view_plan` |
| `seminar_view.html` | "← Voltar"; título + badge de status; "Realizar Novo Seminário" (se concluído); painel de resultado (`:38-91`): nota, resumo, fortes e a revisar; form de questões (`:94-177`) com radios ou textarea e feedback por questão | `seminar` (`id`, `topic_id`, `topic_title`, `is_completed`, `score`), `questions_data`, `user_answers` (dict `qid → resposta`), `feedback_data` (dict ou `None`) | `view_seminar` |

## `static/`

Só existem dois arquivos.

### `static/css/style.css` (549 linhas)

| Bloco | Linhas | Conteúdo |
|---|---|---|
| Tokens | `:6-89` | `--chakra-colors-{gray,teal,purple,blue,green,yellow,orange,red}-*`, `--chakra-fonts-*`, `--chakra-radii-*`, `--chakra-shadows-*` |
| Reset/base | `:92-105` | `* { box-sizing; margin:0; padding:0 }`, `body` |
| Navbar | `:108-160` | `.navbar`, `.nav-brand`, `.brand-badge`, `.nav-user`, `.user-badge` |
| Layout | `:163-174`, `:324-334` | `.container`, `.flash-container`, `.grid-2`, `.grid-3` |
| Alertas | `:176-191` | `.alert`, `.alert-success`, `.alert-danger`, `.alert-warning`, `.alert-info` |
| Botões | `:194-272` | `.btn`, `.btn-primary`, `.btn-purple`, `.btn-secondary`, `.btn-outline`, `.btn-danger-outline`, `.btn-sm` |
| Card, badge, stat | `:275-321` | `.card`, `.badge`, `.badge-subject`, `.badge-file`, `.badge-completed`, `.badge-pending`, `.stat-box`, `.stat-icon` |
| Formulário | `:337-369` | `.form-group`, `.form-control` |
| Chat | `:372-490` | `.chat-window`, `.chat-messages`, `.message-row(.user)`, `.avatar-circle(.assistant/.user)`, `.message-content-wrapper`, `.message-sender-name`, `.message-time`, `.chat-bubble(.assistant/.user)` + estilos de Markdown dentro de `.chat-bubble.assistant`, `.chat-input-area` |
| Progresso | `:493-506` | `.progress-bar-container`, `.progress-bar-fill` |
| Aviso de IA | `:509-520` | `.ai-notice` |
| ~~Modal~~ | — | removido na feature 01 |
| Responsivo | `:545-549` | **única media query**, `@media (max-width: 768px)`: `.grid-2` em 1 coluna, navbar em coluna, `.chat-bubble` com max-width 95% |

**Não há** regras para `.chat-bubble.typing` nem `.chat-bubble.error`, embora o JS gere essas classes.

### `static/js/app.js` (182 linhas, tudo dentro de `DOMContentLoaded`)

| Bloco | Linhas | O que faz |
|---|---|---|
| ~~1. Modal da chave~~ | — | removido na feature 01 (o bloco `:4-26` foi apagado; as linhas abaixo são anteriores a essa mudança) |
| 2. Markdown | `:33-40` | Para cada `.markdown-content`, troca o `innerHTML` por `marked.parse(data-raw)` |
| 3. Chat | `:28-31`, `:42-142` | Submit do `#chatForm` → fetch → `appendBubble()` (`:86-130`) monta a bolha; `escapeHTML()` (`:132-142`) é usado só no indicador "digitando" ou sem `marked` |
| 4. Checklist do plano | `:144-181` | `change` em `.plan-task-checkbox` → fetch → atualiza a barra, o texto do % e o label |

## Chamadas `fetch()`

Existem **só duas**. Todo o resto do app usa forms HTML com POST e redirect.

### 1. Chat (`app.js:46-83`)

| Item | Valor |
|---|---|
| Endpoint | `POST /topic/${chatForm.dataset.topicId}/message` |
| Headers | `Content-Type: application/json` |
| Payload | `{"message": "<texto do #chatInput, trim>"}` |
| Resposta esperada | `{"reply": str, "is_simulated": bool}` ou `{"error": str}` |
| DOM lido | `#chatForm[data-topic-id]`, `#chatInput.value`, `#chatMessages` |
| DOM escrito | adiciona ao `#chatMessages` (1) a bolha do usuário, (2) a bolha "typing", removida ao fim, (3) a resposta, ou uma bolha `assistant error`; limpa `#chatInput`; ajusta `#chatMessages.scrollTop` |
| Não faz | não checa `response.ok`; não desabilita o botão ou o input durante a espera; não atualiza o contador "N mensagens salvas no banco" (`study_topic.html:62`) |

### 2. Checklist do plano (`app.js:145-181`)

| Item | Valor |
|---|---|
| Endpoint | `POST /plan/${cb.dataset.planId}/toggle-task` |
| Headers | `Content-Type: application/json` |
| Payload | `{"task_key": "<data-task-key>"}`, por exemplo `"d1_t0"` |
| Resposta esperada | `{"status": "checked"\|"unchecked", "progress_percent": number, "completed_count", "total_tasks"}` |
| DOM lido | `.plan-task-checkbox[data-plan-id][data-task-key]`, `#label_<task_key>` |
| DOM escrito | `#planProgressBar.style.width`, `#planProgressText.textContent`, `#label_<task_key>.style.textDecoration` / `.style.color` (`#94a3b8` ou `inherit`) |
| Não faz | não checa `response.ok`; em caso de erro, não desfaz a marcação do checkbox |

## CDNs e cache-busting

| Recurso | Onde | Versão | Uso real |
|---|---|---|---|
| Google Fonts: Inter **e** Plus Jakarta Sans | `base.html:9-11` | — | Só **Inter** é usada (`style.css:68-69`). Plus Jakarta Sans é baixada à toa |
| Lucide (ícones) | `base.html:13` + `lucide.createIcons()` em `:89-93` | `lucide@latest` (**sem versão fixa**) | **Nenhum** elemento usa `data-lucide`: código morto |
| marked (Markdown) | `base.html:87` | `cdn.jsdelivr.net/npm/marked/marked.min.js` (**sem versão**, pega a última) | Usado pelo `app.js:37`, `:112` |
| `style.css`, `app.js` | `base.html:7`, `:88` | `?v=chakra_modern_ui_2026` (string fixa) | Cache-busting **manual**: precisa mudar a string a cada deploy para forçar o recarregamento. Em desenvolvimento, `SEND_FILE_MAX_AGE_DEFAULT=0` (`app.py:27`) já evita o cache |

Sem internet (por exemplo, numa banca offline), o `marked` não carrega. ⚠️ não confirmado: nesse caso, as mensagens do histórico aparecem como texto com `<br>` (`study_topic.html:78`) e as novas passam pelo caminho de `escapeHTML` (`app.js:114`).
