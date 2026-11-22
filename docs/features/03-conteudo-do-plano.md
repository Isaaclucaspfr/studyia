# 03 — Conteúdo dentro do plano

> Índice: [features/README.md](README.md) · Base: commit `69c99ab` · Tamanho: grande (3 PRs: 4a, 4b, 4c) · Escopos: **C** (banco, rotas, IA) + **B** (template, `app.js`) + **A** (tela nova) · **Liderança: equipe de backend.**

## 1. Objetivo

Transformar cada tarefa do plano de estudos em algo que a pessoa **estuda dentro do StudyIA**, e não só marca como feito.

- **Problema:** hoje o plano é uma lista de frases ("Leitura exploratória dos conceitos-chave (18 min)") com um checkbox que se marca e desmarca à vontade. O app diz *o que* estudar, mas não entrega o material, e o progresso não mede nada além de cliques.
- **Valor:** cada tarefa ganha um conteúdo de leitura gerado pela IA, do tamanho do tempo que a pessoa reservou, fiel ao arquivo enviado quando o plano vem de um documento. O progresso passa a significar "li o conteúdo até o fim".

## 2. Como funciona hoje

### Plano: geração e formato

| O quê | Onde | Observação |
|---|---|---|
| Criar plano (`POST /topic/<id>/plan/create`) | `app.py:480-538` | IA síncrona; `is_simulated` recebido em `:507` e **descartado** ([handoff §8](../handoff/backend-pendencias.md#8-is_simulated-descartado-ou-não-persistido)) |
| Prompt e esquema do plano | `ai_service.py:184-216` | no modo arquivo, `file_text[:20000]` (`:195`) |
| **Tarefas são strings** | `ai_service.py:207-210` | `"tasks": ["Tarefa…", "Tarefa…"]`. **Não existe campo de minutos por tarefa.** Só o dia tem `estimated_minutes` (`:211`) |
| Fallback do plano | `ai_service.py:232-263` | os minutos vão **dentro do texto** da tarefa: `"(18 min)"`, 60% e 40% do diário (`:251-252`); `topic` com "Dia N:" (`:249`, [handoff §14](../handoff/backend-pendencias.md#14-dia-n-repetido-no-título-do-dia-do-plano)) |
| "Reajustar preferências" | `plan_view.html:25` → `create_plan` | cria um **plano novo**; o antigo continua existindo |

### Plano: tela e checklist

| O quê | Onde | Observação |
|---|---|---|
| Ver plano (`GET /plan/<id>`) | `app.py:540-566` | passa `plan`, `plan_data` (JSON) e `completed_tasks` (lista de `task_key`) |
| Fórmula da `task_key` | `templates/plan_view.html:63` | `"d" ~ day.day_number ~ "_t" ~ loop.index0` → `d1_t0`, `d1_t1`, `d2_t0`… Contrato do [04 §7.4](../04-contratos-frontend.md#74-lógica-embutida-nos-templates) |
| Item da tarefa | `templates/plan_view.html:66-80` | um `<label class="task-item">` que **envolve** o `<input type="checkbox" class="plan-task-checkbox" data-plan-id data-task-key>` e o `<span id="label_{{ task_key }}" class="task-text">` |
| Instrução do card de progresso | `templates/plan_view.html:42` | "Marque as caixas abaixo conforme for cumprindo suas atividades" |
| Texto testado | `templates/plan_view.html:35` | "Progresso Geral de Execução" (`test_app.py:105`) |
| Alternar tarefa (`POST /plan/<id>/toggle-task`) | `app.py:568-618` | **alterna livremente** (`:591-596`); recalcula `progress_percent` contando as tarefas do `plan_json` (`:599-603`); grava `completed_tasks_json` e `progress_percent` (`:605-609`) |
| ⚠️ `task_key` sem validação | `app.py:573-596` | qualquer string é aceita e somada ao progresso. Um `POST` com `{"task_key": "x"}` conta como tarefa feita (o progresso pode passar de 100%). Não acontece pela interface, mas é a regra que a funcionalidade nova **precisa** validar |
| JS do checklist (fetch #2 do [04 §7.2](../04-contratos-frontend.md#72-ids-e-classes-usados-pelo-appjs)) | `static/js/app.js:144-181` | `change` → fetch → atualiza `#planProgressBar`, `#planProgressText` e o estilo inline de `#label_<task_key>` |
| Progresso na lista de planos do tópico | `templates/study_topic.html:119`, `:123` | lê a **coluna** `study_plans.progress_percent` |
| Teste do checklist | `test_app.py:110-116` | marca `d1_t0` e exige `progress_percent > 0` |

### IA, Markdown e infraestrutura

| O quê | Onde | Observação |
|---|---|---|
| Regra de fidelidade ao arquivo no chat | `ai_service.py:98-106` | "Responda EXCLUSIVAMENTE…" + `file_text[:30000]` (**30 mil** no chat × **20 mil** no plano e no seminário, `:195` e `:278`) |
| Fallback do chat no modo arquivo | `ai_service.py:146-166` | procura as palavras da pergunta no texto e devolve um trecho do documento |
| Modelos | `ai_service.py:57`, `:131`, `:219`, `:305`, `:402` | 3 tentativas em sequência, mesma lista em todas as funções |
| Renderização de Markdown | `static/js/app.js:34-40` | todo `.markdown-content[data-raw]` da página vira `innerHTML = marked.parse(raw)`, **sem sanitização** |
| XSS (B2) | `templates/study_topic.html:81` (`\| safe`) e `app.js:38`, `:112` | ver [05-achados §B2](../05-achados-frontend.md) |
| Estilo de Markdown | `static/css/style.css:1068-1131` | escopado em `.chat-bubble.assistant` (títulos, listas, código, citação, tabela) |
| Banco | `database.py:13-98` | só `CREATE TABLE IF NOT EXISTS`; **não há sistema de migração**. `PRAGMA foreign_keys = ON` (`:9`), WAL (`:10`), `timeout=30` (`:7`) |
| Deploy | `Procfile` | `web: gunicorn app:app`: worker síncrono com os padrões do gunicorn (1 worker, timeout de 30 s). ⚠️ não confirmado o que o ambiente de deploy sobrescreve |

## 3. Como deve funcionar

**No plano:**

1. Cada tarefa mostra o texto, um **indicador** de conclusão (não clicável) e o botão **"Ver conteúdo →"**.
2. O progresso no topo conta as tarefas cuja leitura foi concluída.

**Primeira abertura de uma tarefa:**

3. A pessoa clica em "Ver conteúdo →". O app chama a IA **só agora**, gera o conteúdo daquela tarefa e salva.
4. A tela de conteúdo abre com: link de volta ao plano, a posição da tarefa (sessão e tarefa), o texto da tarefa como título, o tempo previsto e o conteúdo para leitura.
5. No fim do conteúdo há o botão **"Concluí a leitura"**.

**Concluir:**

6. Ao clicar, a tarefa fica concluída **para sempre** (não desmarca). A tela mostra "Leitura concluída" e oferece **"Próxima tarefa →"** (ou, na última, a volta ao plano e o mini seminário).
7. De volta ao plano, o indicador da tarefa mostra "concluída" e o progresso subiu.

**Abrir de novo:**

8. "Ver conteúdo →" de uma tarefa que já tem conteúdo abre na hora, **sem chamar a IA**, inclusive depois de concluída (para reler).

**Concorrência:**

9. Clique duplo, ou a mesma tarefa aberta em duas abas: só **um** conteúdo é gerado. Quem chegar enquanto a geração está em andamento vê "Gerando o conteúdo…" e a página se atualiza sozinha até o conteúdo ficar pronto.

**Falha da IA:**

10. Se a IA falhar, a tela mostra o conteúdo de **demonstração**, com um aviso claro de que é conteúdo de demonstração e o botão **"Tentar gerar novamente"**. Se a nova tentativa funcionar, o conteúdo da IA substitui o de demonstração.

**Plano a partir de arquivo:**

11. O conteúdo usa **somente** o documento enviado. Se o documento não cobre o assunto da tarefa, o conteúdo diz isso em vez de inventar.

## 4. Decisões do grupo

✅ **Decidido pelo grupo:**

1. Cada tarefa do plano ganha um botão **"Ver conteúdo →"** no card.
2. O conteúdo é gerado **sob demanda**: a IA só é chamada no primeiro clique em "Ver conteúdo" daquela tarefa. O resultado fica **salvo** e as próximas aberturas não chamam a IA.
3. O conteúdo é **só leitura**. As perguntas continuam no mini seminário.
4. **Concluir = ler até o fim.** No fim do conteúdo há um botão "Concluí a leitura".
5. Depois de concluída, a tarefa fica **sempre marcada** (não desmarca), e o conteúdo continua acessível para reler.
6. O checkbox deixa de ser clicável e vira um **indicador** de conclusão.
7. **Tamanho do conteúdo:** respeitar o tempo que a pessoa escolheu (minutos da tarefa e minutos diários do plano), **sem sacrificar a qualidade mínima** necessária para entender o tema.
8. Plano criado a partir de arquivo: o conteúdo vem **somente** do documento enviado, como já acontece no chat.
9. **Não pode existir conteúdo duplicado:** clique duplo ou duas abas abertas não podem gerar dois conteúdos para a mesma tarefa.
10. **Se a IA falhar:** mostrar o conteúdo do modo demo, **informar** claramente que é conteúdo de demonstração e oferecer o botão "Tentar gerar novamente".
11. **Planos existentes:** o banco só tem dados de teste; todas as tarefas passam a exigir a leitura do conteúdo. Não é necessário migrar planos antigos.
12. **Em aberto (desejado):** o seminário usar os conteúdos lidos como base para as perguntas. Ver [§11](#11-em-aberto--futuro).

✅ **Divisão:** quem estiver mexendo implementa, mas a **equipe de backend lidera** a funcionalidade. 4a backend · 4b frontend (Renzo) · 4c em conjunto ([§10](#10-divisão-em-prs-e-responsáveis)).

## 5. Proposta técnica

> 💡 **Proposta — validar com a equipe.** Nomes de tabela, rotas e funções são sugestões.

### 5.1 Banco: tabela `plan_task_contents`

```sql
CREATE TABLE IF NOT EXISTS plan_task_contents (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id      INTEGER NOT NULL,
    user_id      INTEGER NOT NULL,
    task_key     TEXT    NOT NULL,                 -- "d{day_number}_t{indice}", mesma fórmula do plan_view.html:63
    task_text    TEXT,                             -- opcional: cópia do texto da tarefa no momento da geração
    content      TEXT,                             -- Markdown; NULL enquanto status = 'generating'
    is_simulated INTEGER NOT NULL DEFAULT 0,       -- 1 = conteúdo de demonstração (fallback)
    status       TEXT    NOT NULL DEFAULT 'generating'
                 CHECK (status IN ('generating', 'ready', 'failed')),
    read_at      TIMESTAMP,                        -- NULL = não concluída; preenchido uma vez, nunca volta a NULL
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (plan_id, task_key),
    FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)       ON DELETE CASCADE
);
```

- **Onde:** dentro de `init_db()` (`database.py:13-98`), como as outras. Por ser `CREATE TABLE IF NOT EXISTS`, ela aparece em bancos existentes sem migração.
- **`UNIQUE(plan_id, task_key)`** garante a decisão 9 **no banco**, não só no código: mesmo com duas requisições ao mesmo tempo, só uma linha existe.
- **Cascata:** excluir um tópico (`app.py:365`) apaga os planos (`database.py:74`), que apagam os conteúdos. Nada fica órfão.
- **`user_id`** é redundante com o dono do plano, mas deixa o isolamento explícito em toda consulta (`WHERE … AND user_id = ?`, o padrão do app) e apaga os conteúdos junto com o usuário.
- **Status:**
  - `generating`: linha reservada, IA em andamento;
  - `ready`: conteúdo salvo, **seja da IA ou de demonstração** (a diferença está no `is_simulated`);
  - `failed`: erro inesperado em que nem o fallback foi salvo (exceção no código, banco travado). A tela mostra erro + "Tentar gerar novamente".
- **`task_text` (opcional):** ajuda a depurar e serve à ideia futura do seminário ([§11](#11-em-aberto--futuro)). O plano não muda depois de criado (reajustar cria outro plano), então não há risco de o texto divergir.

**Reaproveitamento da `task_key`:**

- A chave já é a identidade da tarefa hoje (persistida em `completed_tasks_json`). A tabela nova usa **a mesma fórmula**, então nada muda no `plan_json` e os planos atuais ganham conteúdo sem migração.
- 💡 Criar no backend **um helper único** que percorre o `plan_json` e devolve `(task_key, day_number, índice, texto)` na mesma ordem do template. Ele valida a chave recebida na URL (existe neste plano?), calcula o total de tarefas, a próxima tarefa e a posição "tarefa M de K".
- ⚠️ Se a IA devolver dois dias com o mesmo `day_number` (o JSON não é validado, [handoff §11](../handoff/backend-pendencias.md#11-json-da-ia-sem-validação)), duas tarefas terão a mesma chave e vão **compartilhar** o conteúdo. Isso já acontece hoje com o checkbox. Validar o esquema do plano resolve.

### 5.2 Progresso

Fonte da verdade: **`read_at` preenchido** em `plan_task_contents`.

```
progresso = tarefas com read_at / total de tarefas do plan_json × 100
```

O que fazer com as colunas atuais de `study_plans`:

| Opção | O que faz | Prós | Contras |
|---|---|---|---|
| **A. Manter sincronizadas** (recomendada) | a rota de concluir recalcula e grava `progress_percent` e `completed_tasks_json` (lista das chaves com `read_at`) | `study_topic.html:119`, `:123` e o `plan_view.html` continuam funcionando sem mudança; o `view_plan` pode passar o mesmo `completed_tasks` | dado duplicado: precisa de **um** lugar que recalcula (helper) |
| B. Deixar de usar | calcular o progresso na leitura, com subconsulta, em `view_plan` e `view_topic` | uma fonte só | mexe em mais consultas e templates; colunas mortas no esquema |
| C. Remover as colunas | migração de banco | esquema limpo | não há sistema de migração; nenhum ganho para o usuário |

**Planos antigos (decisão 11):** os planos de teste podem ter tarefas marcadas pelo checkbox antigo em `completed_tasks_json`. Com a opção A, o `view_plan` passa a derivar `completed_tasks` de `read_at`, então essas marcas somem da tela, mas o `progress_percent` antigo continuaria aparecendo na lista do tópico (`study_topic.html:123`) até a primeira conclusão. 💡 Como o banco só tem dados de teste: **recriar o `studyia.db`** quando o 4c entrar (ou rodar uma vez `UPDATE study_plans SET completed_tasks_json = '[]', progress_percent = 0`).

### 5.3 Rotas

| Método | URL (sugestão) | Endpoint | Faz | Responde |
|---|---|---|---|---|
| GET | `/plan/<int:plan_id>/task/<task_key>` | `view_task_content` | mostra o conteúdo; **se não existir, gera** | HTML `task_content.html` |
| POST | `/plan/<int:plan_id>/task/<task_key>/complete` | `complete_task_content` | registra `read_at` (idempotente) e recalcula o progresso | redirect → a mesma tela (estado concluído) |
| POST | `/plan/<int:plan_id>/task/<task_key>/regenerate` | `regenerate_task_content` | gera de novo, **só se `is_simulated = 1`** | redirect → a mesma tela |
| POST | `/plan/<int:plan_id>/toggle-task` | `toggle_task` | **sai** no 4c (§5.8) | — |

Todas com `@login_required`, plano buscado com `WHERE id = ? AND user_id = ?` e `task_key` validada pelo helper (formato `^d\d+_t\d+$` **e** existência no plano). Plano ou tarefa inexistente: `flash` + redirect, como o resto do app (`app.py:552-555`).

**`GET` — gerar uma vez, mesmo com concorrência:**

```python
# pseudocódigo
row = buscar(plan_id, task_key, user_id)

if row is None:
    # tenta reservar: só UMA requisição consegue inserir (UNIQUE)
    cur = conn.execute("INSERT OR IGNORE INTO plan_task_contents "
                       "(plan_id, user_id, task_key, task_text, status) "
                       "VALUES (?, ?, ?, ?, 'generating')", (...))
    conn.commit()
    if cur.rowcount == 1:
        gerar_e_salvar(...)          # IA fora da conexão, como no resto do app
        row = buscar(...)            # agora 'ready' (ou 'failed')
    else:
        row = buscar(...)            # outra requisição reservou primeiro

if row.status == 'generating':
    if reserva_antiga(row.updated_at):       # ex.: mais de 120 s
        assumir_reserva_e_gerar(...)        # UPDATE ... WHERE status='generating' AND updated_at < ?
    else:
        return render(estado="gerando"), {"Refresh": "3"}

return render(row)                           # 'ready' ou 'failed'
```

- **Por que `INSERT OR IGNORE` + `rowcount`:** é atômico no SQLite. Um `SELECT` seguido de `INSERT` deixaria duas requisições passarem pelo `SELECT` antes de qualquer uma inserir.
- **Reserva antiga:** se o worker morrer no meio da geração (timeout do gunicorn, deploy, queda), a linha fica `generating` para sempre. Depois de um tempo maior que o timeout do worker, a próxima requisição assume a reserva (com um `UPDATE … WHERE status = 'generating' AND updated_at < ?`, que também é atômico).
- **Estado "gerando" sem JS:** o cabeçalho HTTP `Refresh: 3` faz o navegador recarregar a página a cada 3 s, até o conteúdo ficar pronto. É equivalente ao `<meta http-equiv="refresh">` e não exige bloco novo no `<head>` do `base.html` (que não tem bloco para isso, [04 §7.1](../04-contratos-frontend.md#71-herança-jinja-e-estrutura-do-basehtml)).
- **Efeito colateral num GET:** gerar no GET foge do "GET não altera estado". Fica aceitável porque o resultado é idempotente (o `UNIQUE` impede um segundo conteúdo) e a rota exige login. Alternativa: "Ver conteúdo" como `POST` que gera e redireciona, mas aí o botão do card vira um `<form>` e reabrir um conteúdo pronto também passaria por POST.

**Como a geração roda: 3 opções**

| Opção | Como | Prós | Contras |
|---|---|---|---|
| **A. Síncrona dentro do GET** (recomendada para o 4a) | a requisição que reservou chama a IA e só responde no fim | igual aos outros fluxos do app; nada de thread ou fila; fácil de testar | quem clicou fica olhando o plano "carregando" sem sinal (B4) até a IA responder; sujeita ao **timeout do gunicorn** (30 s por padrão); com 1 worker síncrono, o app inteiro espera |
| B. Thread em segundo plano + `Refresh` | o GET reserva, dispara uma `threading.Thread` e responde na hora com "gerando" | todo mundo vê o estado "gerando"; sem timeout de requisição | thread morre com o worker (a reserva antiga cobre); mais difícil de testar; a chave e os dados precisam ser lidos antes de sair do contexto da requisição |
| C. Página + `fetch` | a tela abre em "gerando" e um JS chama uma rota de geração | melhor UX | **3º `fetch`** no app (contrato novo, B3/B4 de novo); mais JS |

💡 Recomendação: **A** no 4a, com `--timeout 120` no `Procfile` (decisão de deploy da equipe de backend) e o estado "gerando" para a segunda requisição. Se o tempo de geração na prática passar de uns 20 s, migrar para **B** sem mudar rotas nem tela.

### 5.4 Regra de conclusão validada no backend

- `complete` só aceita a tarefa se existir linha com `status = 'ready'` (ou seja, o conteúdo foi gerado e servido). Sem conteúdo, responde com `flash` de erro e **não** grava nada.
- **Idempotente:** `UPDATE plan_task_contents SET read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE plan_id = ? AND task_key = ? AND user_id = ? AND status = 'ready' AND read_at IS NULL`. Chamar duas vezes não muda o `read_at` da primeira.
- **Não desmarca:** não existe rota que volte `read_at` para `NULL`; o `toggle-task` sai (§5.8).
- **Limite honesto:** o servidor não tem como provar que a pessoa *leu* até o fim. O que ele garante é "o conteúdo existia e foi entregue antes da conclusão". O "até o fim" vem da posição do botão (só no fim do texto). Exigir tempo mínimo ou rolagem seria regra nova, não decidida.
- **Regenerar depois de concluir:** mantém o `read_at` (decisão 5: a tarefa fica sempre marcada).
- ❓ **Concluir conteúdo de demonstração conta?** Não decidido. Ver [§11](#11-em-aberto--futuro).

### 5.5 IA: `generate_task_content` em `ai_service.py`

**Assinatura (sugestão):**

```python
def generate_task_content(topic_title, topic_type, file_text, plan_title, goal, level,
                          day_topic, task_text, task_minutes, daily_minutes, api_key=None):
    ...
    return markdown, is_simulated
```

**Minutos da tarefa:** o plano não tem esse campo (§2). Derivar nesta ordem:

1. o número em `"(N min)"` no texto da tarefa, se houver (o fallback escreve assim, `ai_service.py:251-252`; regex `\((\d+)\s*min\)`);
2. senão, `day.estimated_minutes / quantidade de tarefas do dia`;
3. senão, `plan.daily_minutes / quantidade de tarefas do dia`.

**Tamanho (decisão 7):**

```
palavras_alvo = limitar(minutos_da_tarefa × 100, piso = 350, teto = 1800)
```

- **Por que × 100:** a leitura de estudo em português fica em torno de 120 a 150 palavras por minuto ⚠️ (estimativa, a calibrar). Usar 100 deixa cerca de um quarto do tempo para pausas e anotações, já que a tarefa nem sempre é só leitura ("Anotação dos termos principais").
- **Piso de 350 palavras:** o mínimo para as 4 partes obrigatórias (objetivo, explicação, exemplo, resumo). Uma tarefa de 5 minutos ganha um texto curto, mas completo. É o "sem sacrificar a qualidade mínima".
- **Teto de 1800 palavras:** limita custo, tempo de geração (timeout) e cansaço de leitura. Tarefas mais longas que ~18 min ganham o teto.
- **Contexto diário:** `daily_minutes` entra no prompt só como contexto ("a sessão inteira tem N minutos"), para a IA não tratar uma tarefa de 6 minutos como a sessão toda.

**Prompt (estrutura):**

- Papel: o tutor do StudyIA preparando o material de leitura de **uma** tarefa.
- Contexto: tópico, objetivo, nível, tema do dia, texto da tarefa, minutos da tarefa e da sessão.
- Formato obrigatório, em Markdown:
  - `## Objetivo desta leitura` (1 parágrafo);
  - 2 a 4 seções `##` com a explicação;
  - `## Exemplo` (concreto, do nível escolhido);
  - `## Resumo` (lista curta com os pontos-chave).
- Regras:
  - cerca de `palavras_alvo` palavras;
  - **sem emojis** (decisão D11 da sprint 01; [handoff §15](../handoff/backend-pendencias.md#15-emojis-no-conteúdo-gerado));
  - **sem perguntas ou exercícios para responder** (decisão 3: perguntas ficam no seminário);
  - sem "Dia N" no texto ([handoff §14](../handoff/backend-pendencias.md#14-dia-n-repetido-no-título-do-dia-do-plano));
  - sem título `#` de nível 1 (a tela já mostra o título da tarefa);
  - sem HTML.
- **Modo arquivo (decisão 8):** a mesma diretriz do chat (`ai_service.py:100-104`): usar **exclusivamente** o texto do documento; se o documento não cobrir a tarefa, dizer "O material enviado não aborda este ponto" e resumir o que o documento traz de mais próximo, sem inventar. Texto com `file_text[:30000]`, o limite do chat.

**Validação da resposta:** texto vazio ou com menos de ~60% do piso conta como falha e passa para o próximo modelo (mesmo laço de 3 modelos das outras funções). Os 3 falharam: fallback.

**Fallback de demonstração (decisão 10), no mesmo formato:**

- **Modo assunto:** as mesmas 4 seções, com texto genérico montado a partir do tema do dia e da tarefa (no estilo de `ai_service.py:69-85`, sem emojis).
- **Modo arquivo:** **não pode** usar texto genérico (quebraria a decisão 8). Reaproveitar a ideia do fallback do chat (`ai_service.py:146-166`): escolher o trecho do documento com mais palavras em comum com a tarefa e apresentá-lo como "Trecho do material relacionado a esta tarefa", com o aviso de demonstração.
- Sempre devolve `is_simulated = True`.

### 5.6 Segurança

- **XSS (B2) é pré-requisito do 4b, não opcional.** O conteúdo é Markdown gerado pela IA e, no modo arquivo, pode ecoar trechos do documento enviado. Um PDF com `<img src=x onerror=…>` vira HTML executável se passar pelo `marked.parse()` sem sanitização (`app.js:38`) ou por um `| safe` (como em `study_topic.html:81`). E, diferente do chat, o conteúdo fica **salvo** e é reaberto (XSS armazenado). Opções para o PR do B2 (decisão do grupo):
  - **cliente:** DOMPurify com versão fixa depois do `marked` (CDN nova; resolve o chat junto);
  - **servidor:** renderizar Markdown no Python com um sanitizador (`markdown` + `nh3` ou `bleach`; dependências novas no `requirements.txt`).
- A tela de conteúdo **nunca** usa `| safe` no conteúdo bruto.
- **Isolamento:** toda consulta filtra por `user_id`. Teste obrigatório: o usuário B não abre, não conclui e não regenera conteúdo do plano do usuário A.
- **`regenerate` só com `is_simulated = 1`:** impede que alguém regenere em loop um conteúdo bom e gaste cota da API.
- **CSRF:** as 2 rotas POST novas herdam a falta de CSRF do app ([handoff §12](../handoff/backend-pendencias.md#12-ausência-de-csrf)). Se o CSRF entrar, os 2 forms novos precisam do campo oculto.

### 5.7 UX da tela de conteúdo (4b)

**Template novo** `templates/task_content.html` (`{% extends "base.html" %}`, blocos `title` e `content`, como os outros). Componentes da sprint 01 sempre que existirem.

| Parte | Proposta |
|---|---|
| Voltar | `.back-link` "Voltar ao plano" (padrão das outras telas) |
| Cabeçalho | `.meta-label` "Sessão N · Tarefa M de K"; título = texto da tarefa; `.meta-line` com o ícone `clock` e os minutos previstos; tema do dia como subtítulo |
| Estado "gerando…" | `.empty-state` com "Gerando o conteúdo desta tarefa. Isso pode levar alguns segundos." e indicação de que a página atualiza sozinha. Animação só se respeitar `prefers-reduced-motion`. Cruzar com o [B4](../05-achados-frontend.md): no clique em "Ver conteúdo", o link não dá sinal nenhum enquanto o servidor gera (opção A de §5.3); resolver junto com o B4 (JS) |
| Aviso de demonstração | `.notice` (o mesmo âmbar do dashboard, AA aprovado) com "Conteúdo de demonstração: a IA não respondeu desta vez." + botão **"Tentar gerar novamente"** (`<form method="POST">` para `regenerate`) |
| Falha (`failed`) | `.alert-danger` + "Tentar gerar novamente" |
| Leitura | `<article>` com a tipografia de leitura da sprint 01: `--text-base` (16 px), `--leading-relaxed` (1,6), largura `--measure` (68ch) (`tokens.css:116`, `:128`, `:133`). Os estilos de Markdown hoje escopados em `.chat-bubble.assistant` (`style.css:1068-1131`) passam a valer também para uma classe de leitura (por exemplo `.prose`), **agrupando seletores**, sem mudar a bolha do chat (contrato) |
| Concluir | no fim do texto: `<form method="POST">` para `complete` com o botão primário **"Concluí a leitura"** |
| Concluído | o botão vira um estado: ícone `check` + "Leitura concluída" (texto, não botão). ⚠️ Data de `read_at` em UTC (mesmo problema do [B8](../05-achados-frontend.md)) |
| Próxima | link **"Próxima tarefa →"** (ou "Voltar ao plano" + CTA do seminário na última tarefa) |
| Temas | só tokens semânticos: nasce pronta para o claro e o escuro ([02](02-tema-claro-escuro-dispositivo.md)) |

**Card do plano (`plan_view.html:61-82`):**

- O `<label class="task-item">` vira um contêiner comum (`<div>` ou `<li>`). Um `<label>` sem campo não faz sentido, e um link dentro de um `<label>` gera conflito de clique.
- **Indicador de conclusão:** não é mais um `<input>`. Um checkbox `disabled` seria anunciado como "caixa de seleção, indisponível", o que ainda parece um controle. Proposta: ícone do sprite (`check` num círculo de sucesso / um marcador neutro) com `aria-hidden="true"` + texto em `.sr-only` ("Concluída" / "Não concluída"). Sem borda de checkbox, sem `cursor: pointer`, sem hover, sem estado `:active`.
- **"Ver conteúdo →"**: link (`<a>`) com nome acessível único: `Ver conteúdo<span class="sr-only">: {{ task }}</span>`. Sem isso, o leitor de tela lista vários links "Ver conteúdo" iguais. Alvo de 44 px abaixo de 768 px.
- Texto do `plan_view.html:42` muda para algo como "Abra o conteúdo de cada tarefa e conclua a leitura para avançar". "Progresso Geral de Execução" (`:35`) **não muda** (teste).

### 5.8 `toggle-task` e o `app.js` (4c)

| Opção | O que faz | Prós | Contras |
|---|---|---|---|
| **A. Remover** (recomendada) | apaga a rota (`app.py:568-618`) e o bloco do checklist (`app.js:144-181`) | uma única forma de concluir (o `complete`, validado no servidor); some o fetch #2 e, com ele, o B3 do checklist e as cores inline do B11 | quebra contratos do 04 §7.2 (esperado); o `test_app.py:110-116` precisa mudar |
| B. Desativar | a rota responde `410 Gone` e o JS fica | nada quebra se algum HTML antigo chamar | código morto nos dois lados; o JS continuaria escutando checkboxes que não existem mais |
| C. Restringir | a rota só marca se `read_at` existir, e nunca desmarca | mantém a URL | duplica o `complete`; dois caminhos para a mesma regra |

**Impacto da opção A no `app.js`:**

- Sai o listener de `.plan-task-checkbox` (`:144-181`).
- `#planProgressBar` e `#planProgressText` deixam de ser atualizados por JS. A conclusão acontece na tela de conteúdo, por form, e o plano é recarregado quando a pessoa volta, então a barra já vem certa do servidor.
- Nada no `app.js` depende de outro trecho desse bloco; chat e Markdown (`:28-142`) não mudam.

**Janela de convivência:** entre o merge do 4b (tela de conteúdo no ar) e o do 4c (checkbox ainda clicável), existem **dois** jeitos de marcar uma tarefa, e o `toggle-task` recalcula o progresso só pelo `completed_tasks_json`, ignorando o `read_at`. 💡 Mergear o 4b e o 4c em sequência, sem apresentação no meio; ou, se o 4a já fizer o `view_plan` derivar `completed_tasks` do `read_at`, o checkbox antigo deixa de "grudar" ao recarregar e a inconsistência fica só visual.

### 5.9 Testes que o `test_app.py` deve ganhar

Todos com `GEMINI_API_KEY=''` (como já faz o `setUp`, `test_app.py:13`), ou seja, pelo caminho do fallback, mais um mock de `generate_task_content` para os casos que precisam de "IA funcionando":

| # | Caso | Verifica |
|---|---|---|
| 1 | **Gera uma vez** | 1º `GET` cria 1 linha `ready`; 2º `GET` não chama a IA (mock com contador = 1) e devolve o mesmo conteúdo |
| 2 | **Não duplica** | `INSERT OR IGNORE` com a linha já existente não cria outra; contagem por `(plan_id, task_key)` = 1. 💡 Teste de concorrência real com 2 threads chamando a rota |
| 3 | **Estado "gerando"** | com uma linha `generating` recente: o `GET` responde com o cabeçalho `Refresh` e não chama a IA |
| 4 | **Reserva antiga** | com uma linha `generating` com `updated_at` antigo: o `GET` assume e gera |
| 5 | **Concluir** | `POST complete` grava `read_at`, `progress_percent > 0` e a chave aparece em `completed_tasks_json` |
| 6 | **Idempotência** | 2º `POST complete` não altera o `read_at` nem o progresso |
| 7 | **Não concluir sem conteúdo** | `POST complete` numa tarefa sem linha `ready` não grava nada |
| 8 | **Não desmarcar** | não existe caminho que volte `read_at` a `NULL`; `POST /toggle-task` responde 404/405 (depois do 4c) |
| 9 | **Isolamento** | o usuário B recebe redirect/flash (ou 404) em `GET`, `complete` e `regenerate` do plano do usuário A, e nada é gravado |
| 10 | **`task_key` inválida** | `x`, `d99_t0` e `d1_t99` são recusadas |
| 11 | **Fallback demo** | sem chave: `is_simulated = 1`, a tela mostra o aviso e o botão "Tentar gerar novamente" |
| 12 | **Regenerar** | com o mock "IA funcionando": `regenerate` troca o conteúdo e zera `is_simulated`; com `is_simulated = 0`, `regenerate` é recusado; o `read_at` é mantido |
| 13 | **Modo arquivo** | num tópico de arquivo, o prompt recebido pelo mock contém o texto do documento e a regra de exclusividade; o fallback devolve um trecho do documento |
| 14 | **Sem emojis** | o fallback não contém caracteres de emoji |
| 15 | **Cascata** | excluir o tópico apaga os conteúdos |
| 16 | **Textos da tabela 7.5** | "Progresso Geral de Execu" continua no `plan_view` |

O passo 8 do teste atual (`test_app.py:110-116`, `toggle-task`) é substituído por "abrir conteúdo → concluir → progresso > 0".

## 6. Impacto por camada

| Camada | O que muda | PR |
|---|---|---|
| **Banco** | tabela `plan_task_contents` em `init_db()`; recriar o banco de teste (decisão 11) | 4a |
| **Backend** (`app.py`) | helper de tarefas do plano; helper de progresso; 3 rotas novas; `view_plan` passa a derivar `completed_tasks` do `read_at` e a enviar o estado de cada tarefa (para o indicador e o link); remover `toggle_task` | 4a (rotas, helpers), 4c (remover `toggle_task`) |
| **IA** (`ai_service.py`) | `generate_task_content` + fallback | 4a |
| **Deploy** | `--timeout` do gunicorn no `Procfile` (se a opção A de §5.3 for mantida) | 4a |
| **Templates** | novo `task_content.html`; `plan_view.html`: estrutura do item da tarefa, indicador, link, texto do `:42` | 4b (tela e link), 4c (indicador no lugar do checkbox) |
| **CSS** | tela de leitura (`.prose` agrupada com o Markdown do chat), estados (gerando, demo, concluído), indicador, `?v=` | 4b, 4c |
| **JS** (`app.js`) | remover `:144-181` | 4c |
| **Segurança** | correção do B2 antes do 4b | PR próprio |
| **Testes** | §5.9 | 4a (backend), 4c (troca do passo 8) |
| **Docs** | `docs/04` (§7); `docs/02-rotas.md` (3 rotas, `toggle-task` sai); `docs/01-arquitetura.md` (tabela nova, diagrama do plano); `docs/03-frontend-inventario.md` (template novo, fetch #2 sai); `docs/06` (componentes de leitura e indicador); `docs/05` (B3/B11 do checklist resolvidos) | cada PR atualiza o que tocou |

## 7. Contratos afetados ([docs/04](../04-contratos-frontend.md))

| Contrato | Seção do 04 | O que muda | PR |
|---|---|---|---|
| Lista de endpoints do `url_for` | §7.1 | entram `view_task_content`, `complete_task_content`, `regenerate_task_content`; sai `toggle_task` | 4a / 4c |
| URL montada à mão pelo JS (`/plan/${id}/toggle-task`) | §7.1 (nota ¹) | deixa de existir | 4c |
| `.plan-task-checkbox` + `data-plan-id` + `data-task-key` | §7.2 | saem (o checkbox vira indicador) | 4c |
| `#label_{{ task_key }}` com `style` do JS | §7.2 | deixa de ser contrato (o JS não escreve mais nele); o ID pode sair | 4c |
| `#planProgressBar` / `#planProgressText` | §7.2 | continuam no template, mas o JS não os atualiza mais; a largura inline (`style="width"`) continua sendo exceção permitida | 4c |
| `.markdown-content[data-raw]` | §7.2 | se a tela de conteúdo usar o mesmo mecanismo do chat (`app.js:34-40`), vira contrato também do `task_content.html`. Depende da solução do B2 | 4b |
| Forms POST | §7.3 | 2 forms novos, **sem campos** (`complete` e `regenerate`); precisam continuar `POST` | 4b |
| **Fórmula da `task_key`** | §7.4 | **fica ainda mais crítica:** além do `completed_tasks_json`, passa a ser chave da tabela nova e parte da URL. Precisa ser **idêntica** no template e no helper do backend; o ideal é o template receber as chaves prontas do backend | 4a / 4b |
| Estrutura `<label class="task-item">` | §7.4 (loop de tarefas) | muda para contêiner + indicador + link; o loop e a ordem das tarefas não podem mudar | 4b / 4c |
| `completed_tasks` (variável) | — (está no [03-inventário](../03-frontend-inventario.md)) | mantém o nome e o formato (lista de chaves), mas passa a vir do `read_at` | 4a |
| Textos do `test_app.py` | §7.5 | "Progresso Geral de Execu" **fica**; o teste do `toggle-task` muda | 4c |

## 8. Riscos e armadilhas

- **Timeout do gunicorn:** com a geração síncrona, um conteúdo de 1800 palavras passando por até 3 modelos pode passar de 30 s. O worker morre, a pessoa vê erro e a linha fica `generating`. Mitigações: `--timeout`, a reserva antiga (§5.3) e, se precisar, a opção B.
- **1 worker síncrono:** enquanto um conteúdo é gerado, **todas** as requisições do app esperam. Já acontece com o plano e o seminário, mas o conteúdo será gerado com muito mais frequência (uma vez por tarefa).
- **Custo e cota da API:** um plano de 5 dias com 2 tarefas = 10 chamadas a mais. Geração sob demanda (decisão 2) e o bloqueio do `regenerate` para conteúdo bom limitam isso.
- **Documento maior que 30 mil caracteres:** o conteúdo de tarefas sobre partes que ficaram fora do corte vai dizer "o material não aborda este ponto", mesmo que o documento aborde. O plano já sofre isso com 20 mil. Futuro: escolher o trecho relevante do documento por tarefa.
- **Fidelidade no modo arquivo:** a IA pode completar com conhecimento externo, apesar do prompt. O teste 13 cobre o prompt, não o comportamento do modelo. ⚠️ Validar com uma chave real.
- **XSS armazenado:** sem o B2 resolvido, o 4b não pode ir para a `main`.
- **`task_key` duplicada** por `day_number` repetido (§5.1).
- **Janela de convivência** entre o 4b e o 4c (§5.8).
- **"Ler até o fim" não é verificável** no servidor (§5.4). Deixar isso claro na apresentação do projeto.
- **Timestamps em UTC** em "Concluída em…" (B8).
- **Fallback que parece real:** o conteúdo de demonstração precisa do aviso **na tela de conteúdo**, não só no dashboard (RNF06; o `is_simulated` desta funcionalidade é persistido, ao contrário do plano, [handoff §8](../handoff/backend-pendencias.md#8-is_simulated-descartado-ou-não-persistido)).

## 9. Critérios de aceite (da funcionalidade inteira)

- [ ] Cada tarefa do plano tem "Ver conteúdo →", com nome acessível que inclui o texto da tarefa.
- [ ] A 1ª abertura gera e salva; as próximas não chamam a IA (verificável pelo log ou pelo mock).
- [ ] Clique duplo e duas abas não geram dois conteúdos (1 linha por `plan_id` + `task_key`).
- [ ] Quem chega durante a geração vê "Gerando…" e a página atualiza sozinha até o conteúdo.
- [ ] O conteúdo é Markdown com objetivo, explicação, exemplo e resumo; sem emojis; sem perguntas para responder.
- [ ] O tamanho acompanha os minutos da tarefa (curto para 5–6 min, longo para 18 min), respeitando o piso e o teto.
- [ ] Num plano de arquivo, o conteúdo usa só o documento; o fallback mostra trecho do documento.
- [ ] Com a IA indisponível: aviso de demonstração + "Tentar gerar novamente", que substitui o conteúdo quando a IA volta.
- [ ] "Concluí a leitura" fica no fim do texto; depois de clicado, a tarefa fica concluída para sempre e o conteúdo continua acessível.
- [ ] O indicador de conclusão não é focável, não parece clicável e é anunciado ("Concluída" / "Não concluída").
- [ ] O progresso conta só as tarefas com leitura concluída, no plano e na lista do tópico.
- [ ] Nenhum caminho (interface ou requisição manual) marca uma tarefa sem conteúdo nem desmarca uma concluída.
- [ ] O usuário B não acessa nem altera nada do usuário A.
- [ ] Conteúdo com HTML/script (vindo do documento ou da IA) é exibido como texto ou removido, nunca executado.
- [ ] A tela de conteúdo funciona em 375, 768 e 1440 px, nos dois temas, com teclado.
- [ ] `test_app.py` com os casos de §5.9 passando.

## 10. Divisão em PRs e responsáveis

✅ Quem estiver mexendo implementa; a **equipe de backend lidera** a funcionalidade.

### PR 4a — Backend

- **Responsável:** equipe de backend.
- **Entra:** tabela `plan_task_contents`; helpers de tarefas e de progresso; rotas `view_task_content` (com uma resposta HTML mínima ou o template provisório), `complete_task_content`, `regenerate_task_content`; `generate_task_content` + fallback; `view_plan` derivando `completed_tasks` do `read_at` e enviando o estado de cada tarefa; `--timeout` no `Procfile`; testes 1 a 7 e 9 a 15 de §5.9; docs 01 e 02.
- **Não entra:** mudanças visuais no `plan_view.html`; remoção do `toggle-task`.
- **Depende de:** passo 2 da ordem ([01](01-remover-configurar-ia.md)) estar na `main` (as duas mexem em `app.py`, e a 01 define como a chave é lida).
- **Aceite:** todos os testes do backend passam; as rotas respondem por URL direta com isolamento e idempotência; nenhuma tela existente muda de comportamento.

### PR 4b — Tela de conteúdo

- **Responsável:** Renzo (frontend).
- **Entra:** `task_content.html` com todos os estados (§5.7); estilos de leitura agrupados com o Markdown do chat; botão "Ver conteúdo →" no card do plano; texto do `plan_view.html:42`; docs 03, 04 e 06.
- **Não entra:** a troca do checkbox pelo indicador (4c).
- **Depende de:** 4a (rotas e dados); [02](02-tema-claro-escuro-dispositivo.md) (tokens escuros); **correção do B2**.
- **Aceite:** os critérios de UX de §9; telas em 375, 768 e 1440 px nos dois temas; teclado e leitor de tela; contratos do 04 conferidos; `test_app.py` passando.

### PR 4c — Regra do indicador de conclusão

- **Responsável:** definir em conjunto (backend remove a rota; frontend troca o checkbox e o JS).
- **Entra:** checkbox → indicador no `plan_view.html`; remover o bloco `app.js:144-181` e a rota `toggle_task`; trocar o passo 8 do `test_app.py`; teste 8 de §5.9; CSS do indicador; atualizar o 04 (§7.2, §7.4) e o 05 (B3 e B11 do checklist).
- **Depende de:** 4a e 4b.
- **Aceite:** não existe forma de marcar ou desmarcar fora do "Concluí a leitura"; o indicador cumpre os requisitos de §5.7; nenhum erro no console no plano; `test_app.py` passando.

## 11. Em aberto / futuro

- ❓ **Seminário baseado nos conteúdos lidos (decisão 12, desejado).**
  - **Como seria:** `generate_mini_seminar` (`ai_service.py:266`) recebe um parâmetro novo com os conteúdos lidos (`status = 'ready'`, `read_at` preenchido) dos planos do tópico, concatenados até um limite de caracteres, e o prompt manda formular as perguntas a partir desse material.
  - **Impacto:** backend (1 consulta em `create_seminar`, `app.py:624-665`, e o prompt); nenhum contrato de frontend muda. Opcional na tela: "Perguntas baseadas em N conteúdos lidos".
  - **Pontos a decidir:** o seminário é por **tópico** (`create_seminar` recebe `topic_id`) e um tópico pode ter vários planos: usar todos os conteúdos lidos, só os do plano mais recente, ou passar o `plan_id` quando o seminário é aberto pelo CTA do plano (`plan_view.html:94`)? E o que fazer quando nada foi lido (cair no comportamento atual)?
  - **Esforço estimado:** pequeno a médio, cerca de 1 PR de backend (meio dia a 1 dia de trabalho), **depois** do 4a. Risco principal: o tamanho do prompt (vários conteúdos de até 1800 palavras); exige um limite e uma regra de corte.
- ❓ **Concluir conteúdo de demonstração conta como leitura?** Se não contar, sem chave da IA ninguém avança no plano (inclusive numa apresentação offline). 💡 Recomendação: contar, mantendo o aviso de demonstração visível.
- ❓ **Modo de geração** (§5.3): A síncrona (recomendada) × B thread × C fetch.
- ❓ **Destino de `completed_tasks_json` e `progress_percent`** (§5.2): recomendação A, manter sincronizados.
- ❓ **`toggle-task`** (§5.8): recomendação A, remover.
- ❓ **Fator de tamanho** (× 100 palavras/min, piso 350, teto 1800): calibrar com conteúdo real.
- **Futuro:** minutos por tarefa no esquema do plano (`"tasks": [{"text": …, "minutes": …}]`). Muda o `plan_json` e o template (`{{ task }}` deixa de ser string); fica para quando o [handoff §11](../handoff/backend-pendencias.md#11-json-da-ia-sem-validação) for tratado.
- **Futuro:** "Gerar outra versão" para conteúdo **não** demonstrativo (não decidido; hoje a decisão 10 só prevê o retry para o demo).
- **Futuro:** escolher o trecho relevante do documento por tarefa, para arquivos acima de 30 mil caracteres.
- **Futuro:** exportar os conteúdos lidos junto com o caderno (`export_topic`, `app.py:249-284`).
