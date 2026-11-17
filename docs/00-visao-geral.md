# 00 — Visão geral

> Requisitos (F01–F15, RNF01–RNF10), integrantes e contexto acadêmico estão no [README](../README.md) e no [doc_completo.txt](../doc_completo.txt). Este arquivo só resume e corrige o que importa para o desenvolvimento.

## O sistema em 5 frases

1. O StudyIA é um app Flask monolítico. Após login e senha, o usuário cria um **tópico de estudo**, que pode ser um *assunto geral* ou um *arquivo* PDF/TXT/MD enviado.
2. Cada tópico tem um **chat** com a IA, salvo no SQLite. No modo arquivo, o prompt instrui a IA a responder só com o texto extraído do documento.
3. A partir do tópico, o usuário gera **planos de estudo**: a IA devolve um JSON com dias e tarefas, que vira um checklist com percentual de progresso.
4. Também gera **mini seminários**: perguntas de múltipla escolha e discursivas, corrigidas pela IA com nota, feedback, pontos fortes e pontos a revisar.
5. Sem chave do Gemini, ou quando a chamada falha, o `ai_service.py` usa um **fallback determinístico** (o "modo demo") que devolve conteúdo no mesmo formato.

## Funcionalidades e onde estão

| Funcionalidade | Tela (template) | Rota principal |
|---|---|---|
| Cadastro, login e logout | `login.html`, `register.html` | `/register`, `/login`, `/logout` |
| Painel com estatísticas e histórico | `dashboard.html` | `/dashboard` |
| Novo estudo por assunto | `dashboard.html` → `study_topic.html` | `POST /topic/new-subject` |
| Estudo de arquivo | `dashboard.html` → `study_topic.html` | `POST /topic/upload-file` |
| Chat com a IA | `study_topic.html` | `POST /topic/<id>/message` (**fetch**) |
| Exportar caderno (.md) | link em `study_topic.html` | `GET /topic/<id>/export` |
| Plano de estudos e checklist | `plan_create.html`, `plan_view.html` | `/topic/<id>/plan/create`, `/plan/<id>`, `POST /plan/<id>/toggle-task` (**fetch**) |
| Mini seminário | `seminar_view.html` | `POST /topic/<id>/seminar/create`, `/seminar/<id>`, `POST /seminar/<id>/submit` |
| Configurar a chave do Gemini | modal em `base.html` | `POST /settings/api-key` |
| Excluir estudo | `dashboard.html` | `POST /topic/<id>/delete` |

Detalhes em [02-rotas.md](02-rotas.md).

## Stack (corrigida)

| Camada | Tecnologia | Observação |
|---|---|---|
| Linguagem | **Python ≥ 3.12 (obrigatório)** | `ai_service.py:51`, `:195` e `:278` usam `\n` dentro de expressões de f-string, o que só funciona a partir do 3.12 (PEP 701) |
| Web | Flask | `requirements.txt` pede `flask>=3.0.0`, **sem fixar** a 3.1 citada no README |
| Banco | SQLite 3 (`database.py`) | WAL e `foreign_keys=ON`; o banco é criado no **import** de `app.py` (`app.py:30`) |
| IA | Google Gemini via `google-genai` + fallback offline | ver [01-arquitetura.md](01-arquitetura.md) |
| Arquivos | `pypdf` e leitura UTF-8 | `file_processor.py` |
| Frontend | Templates Jinja + CSS próprio + JS puro | **Só 2 pontos usam `fetch()`**: o chat e o checklist do plano. O resto é form HTML clássico (POST → redirect → página renderizada pelo Jinja) |
| CDNs | Google Fonts, `marked` (Markdown), `lucide` (ícones) | sem versão fixa; ver [03-frontend-inventario.md](03-frontend-inventario.md#cdns-e-cache-busting) |

## Como rodar

Siga o [README, seção "Como Executar o Projeto"](../README.md#-como-executar-o-projeto).

> ⚠️ `python app.py` **e** `python -m unittest test_app.py` criam o `studyia.db` na raiz, porque `database.init_db()` roda no import (`app.py:30`). O teste também grava arquivos em `uploads/`. Os dois caminhos estão no `.gitignore`, mas rode só dentro de uma branch de trabalho. Sugestão para não sujar o banco local: `DATABASE_PATH=/tmp/studyia-teste.db python -m unittest test_app.py` (o `database.py:4` lê essa variável).

## Modo demo, para quem usa o app

- **O que é:** sem uma chave do Google Gemini, o StudyIA continua funcionando, mas as respostas, os planos, os seminários e as notas vêm de **modelos prontos**. O conteúdo é genérico, apenas com o nome do assunto inserido.
- **Como ativar a IA real:** clique em **"⚙️ Configurar IA"** na barra superior, cole a chave do Google AI Studio e clique em **Salvar Chave**. Outra opção é o administrador definir `GEMINI_API_KEY` no `.env`.
- **Cuidado:** o campo da chave sempre abre vazio. Se você salvar com ele vazio, **apaga** a chave já gravada.
- **Como saber se está em demo:**
  - O aviso "⚡ Modo Demonstração Ativo" no painel considera **só** a chave salva pela interface. Ele não leva em conta a chave do `.env` nem detecta uma chave inválida.
  - No chat, as respostas de demo trazem a nota "⚡ Modo Demonstração Didática", que **some ao recarregar a página**.
  - Planos, seminários e a explicação inicial **não indicam** se vieram do modo demo.
- **Quando o app cai em demo sem avisar:** chave inválida, falha de rede ou resposta da IA em formato inválido. Ver [01-arquitetura.md](01-arquitetura.md#quando-o-app-cai-no-fallback-modo-demo).
