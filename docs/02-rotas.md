# 02 — Rotas

Todas as rotas estão em `app.py`. A coluna **Endpoint** traz o nome usado em `url_for(...)` nos templates (é o nome da função Python). "IA síncrona" significa que a requisição fica bloqueada até a IA, ou o fallback, responder.

> **Feature 01 (2026-11-22):** a rota `POST /settings/api-key` (`update_api_key`) foi removida e hoje responde 404. A chave do Gemini vem só do `.env` ([features/01](features/01-remover-configurar-ia.md)). Os números de linha do `app.py` abaixo são anteriores a essa mudança.

| Método | URL | Endpoint | Linha | Recebe | Retorna | Quem consome |
|---|---|---|---|---|---|---|
| GET | `/` | `index` | `app.py:53` | — | redirect → `dashboard` (logado) ou `login` | acesso direto |
| GET, POST | `/register` | `register` | `app.py:59` | form: `name`, `username`, `email`, `password`, `confirm_password` | HTML `register.html` (GET ou erro, com flash) · redirect → `dashboard` | `register.html` |
| GET, POST | `/login` | `login` | `app.py:108` | form: `login_input` (usuário **ou** e-mail), `password` | HTML `login.html` · redirect → `dashboard` | `login.html` |
| GET | `/logout` | `logout` | `app.py:131` | — | redirect → `login` | link "Sair" em `base.html:32` |
| GET | `/dashboard` | `dashboard` | `app.py:152` | — | HTML `dashboard.html` | navbar, redirects |
| POST | `/topic/new-subject` | `new_subject` | `app.py:199` | form: `title` (obrigatório), `initial_question` | redirect → `view_topic` · **IA síncrona** | `dashboard.html:79` |
| GET | `/topic/<id>/export` | `export_topic` | `app.py:249` | — | download `text/markdown` | `study_topic.html:29` |
| POST | `/topic/upload-file` | `upload_file` | `app.py:286` | multipart: `document` (obrigatório), `custom_title` | redirect → `view_topic` (sucesso) ou `dashboard` (erro, com flash) | `dashboard.html:109` |
| POST | `/topic/<id>/delete` | `delete_topic` | `app.py:346` | — | redirect → `dashboard` | `dashboard.html:170` |
| GET | `/topic/<id>` | `view_topic` | `app.py:376` | — | HTML `study_topic.html` | dashboard e links "Voltar" |
| POST | `/topic/<id>/message` | `send_message` | `app.py:412` | **JSON** `{"message": str}` | **JSON** `{"reply": str, "is_simulated": bool}` · `{"error"}` 400 (vazia) / 404 (tópico) · **IA síncrona** | **`app.js:63` (fetch)** |
| GET, POST | `/topic/<id>/plan/create` | `create_plan` | `app.py:480` | form: `goal`, `level`, `daily_minutes` (int), `days_per_week` (int), `deadline` | GET → HTML `plan_create.html` · POST → redirect `view_plan` · **IA síncrona** | `study_topic.html:32`, `:101`, `:129`; `plan_view.html:25` |
| GET | `/plan/<id>` | `view_plan` | `app.py:540` | — | HTML `plan_view.html` | redirect pós-criação; `study_topic.html:121` |
| POST | `/plan/<id>/toggle-task` | `toggle_task` | `app.py:568` | **JSON** `{"task_key": str}` | **JSON** `{"status": "checked"\|"unchecked", "progress_percent": float, "completed_count": int, "total_tasks": int}` · `{"error"}` 400/404 | **`app.js:153` (fetch)** |
| POST | `/topic/<id>/seminar/create` | `create_seminar` | `app.py:624` | — (form sem campos) | redirect → `view_seminar` · **IA síncrona** | `study_topic.html:35`, `:138`; `plan_view.html:97`; `seminar_view.html:29` |
| GET | `/seminar/<id>` | `view_seminar` | `app.py:667` | — | HTML `seminar_view.html` | redirects; `study_topic.html:156` |
| POST | `/seminar/<id>/submit` | `submit_seminar` | `app.py:697` | form: `q_<question.id>` para cada questão | redirect → `view_seminar` (flash com a nota) · **IA síncrona** | `seminar_view.html:94` |

Arquivos estáticos: `url_for('static', filename=...)` em `base.html:7` (CSS) e `base.html:88` (JS).

## `@login_required` e as rotas JSON

O decorator (`app.py:36-57`) protege todas as rotas, exceto `/`, `/register`, `/login` e `/logout`. Sem sessão, ele **sempre** responde com `flash` e **redirect HTML para `/login`**, inclusive em `/topic/<id>/message` e `/plan/<id>/toggle-task`.

Desde a branch `fix/robustez-envio-e-sessao` ele também confere se o `user_id` da sessão **existe no banco** (sessão órfã, [handoff §17](handoff/backend-pendencias.md#17-sessão-de-um-usuário-que-não-existe-mais-no-banco-gera-erro-500)). Se não existir, limpa a sessão, faz `flash("Sua sessão expirou. Entre novamente.", "info")` e redireciona para `/login`. As rotas JSON mantêm o mesmo redirect (decisão registrada no handoff).

Na prática, o `fetch` segue o redirect, recebe o HTML da página de login com status 200, e o `response.json()` lança exceção:
- no chat, aparece a mensagem genérica "Ocorreu um erro ao conectar ao serviço de IA" (`app.js:77-80`);
- no checklist, só um `console.error`, e a caixa continua marcada na tela (`app.js:177-179`).

## Respostas de erro "silenciosas"

- Tópico, plano ou seminário de outro usuário (ou inexistente) nas rotas HTML: flash `danger` + redirect → `dashboard`. **Não há 404.**
- Upload acima de 10 MB: o Flask devolve **413** com a página de erro padrão, porque não há handler. ⚠️ não confirmado visualmente.
- `daily_minutes` ou `days_per_week` não numéricos em `POST /plan/create`: `int()` lança exceção → **500** (`app.py:497-498`). Os `<select>` atuais só enviam números.
