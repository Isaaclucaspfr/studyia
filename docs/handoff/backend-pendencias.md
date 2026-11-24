# Pendências para a equipe de backend

> Levantado durante a análise do frontend (leitura do código, commit `7fbd035`). **Nenhum destes itens foi alterado.** Cada um descreve o que foi observado e o efeito na tela. As sugestões são **opcionais**: a decisão é de vocês. Depois de revisado no PR, cada item pode virar uma issue no GitHub.
>
> Status: ✅ confirmado pela leitura do código · ⚠️ não confirmado (depende de rodar o app ou de testar com a API).

> **Novas funcionalidades (especificadas em [docs/features/](../features/README.md)).** Alguns itens abaixo passam a ser tratados dentro delas. Os itens continuam aqui como estão; a especificação de cada funcionalidade diz o que muda:
>
> - [01 — Remover "Configurar IA"](../features/01-remover-configurar-ia.md): resolve o **§2** (chave em texto puro) e o **§9** (banner de demo baseado só na chave do banco), e toca o **§7** (aviso no log quando falta `GEMINI_API_KEY`).
> - [03 — Conteúdo dentro do plano](../features/03-conteudo-do-plano.md): grava `is_simulated` por conteúdo (**§8**), segue o **§15** (sem emojis) e o **§14** (sem "Dia N") no prompt novo, depende do **§11** (JSON do plano sem validação) e acrescenta 2 rotas POST ao **§12** (CSRF). Equipe de backend lidera.
> - [02 — Tema claro/escuro/dispositivo](../features/02-tema-claro-escuro-dispositivo.md): não toca o backend. **Possibilidade futura:** salvar a preferência de tema no banco, registrada no **§19**. Na revisão apareceu o **§18** (formato dos percentuais), que já existia antes.
> - [04 — Landing page](../features/04-landing-page.md): mudança **pequena** na rota `/` (`index`, `app.py:53-57`). Sem sessão, ela passa a renderizar `landing.html` em vez de redirecionar ao login (só a linha `:57` muda) e ganha 2 testes novos; nenhum teste existente acessa a `/`. Precisa do ok da equipe de backend no PR da landing. **Possibilidade futura:** cache longo para `static/vendor/` (caminhos versionados) no lugar do `SEND_FILE_MAX_AGE_DEFAULT = 0` global (`app.py:27`), e compressão gzip no deploy.

Índice: [1](#1-pergunta-do-chat-duplicada-no-prompt) · [2](#2-chave-do-gemini-gravada-em-texto-puro) · [3](#3-secret_key-com-valor-padrão-no-código) · [4](#4-logout-via-get) · [5](#5-int-sem-tratamento-no-create_plan) · [6](#6-nomes-dos-modelos-gemini-a-confirmar) · [7](#7-fallback-silencioso-só-com-print) · [8](#8-is_simulated-descartado-ou-não-persistido) · [9](#9-banner-de-demo-considera-só-a-chave-do-banco) · [10](#10-upload-acima-de-10-mb-devolve-413-cru) · [11](#11-json-da-ia-sem-validação) · [12](#12-ausência-de-csrf) · [13](#13-dependências-sem-versão-fixada) · [14](#14-dia-n-repetido-no-título-do-dia-do-plano) · [15](#15-emojis-no-conteúdo-gerado) · [16](#16-gemini-citado-como-fonte-mesmo-no-modo-demonstração) · [17](#17-sessão-de-um-usuário-que-não-existe-mais-no-banco-gera-erro-500) · [18](#18-percentuais-sempre-com-uma-casa-decimal-100) · [19](#19-sugestão-futura-preferência-de-tema-salva-no-banco)

---

### 1. Pergunta do chat duplicada no prompt
- **Onde:** `app.py:434-444` e `ai_service.py:123-126`
- **O que acontece:** ✅ `send_message` grava a pergunta em `chat_messages` e **depois** lê o histórico completo, que já inclui essa pergunta. Em seguida, `ask_assistant` adiciona `[user]: {user_message}` de novo ao final.
- **Impacto na tela:** a IA recebe a última pergunta duas vezes. ⚠️ não confirmado se isso altera as respostas, mas consome tokens e pode enviesar o contexto.
- **Sugestão (opcional):** ler o histórico antes do `INSERT` ou não reanexar a pergunta.

### 2. Chave do Gemini gravada em texto puro
> 🟡 **Parcialmente resolvido** na [feature 01](../features/01-remover-configurar-ia.md) (branch `feat/remover-configurar-ia`): a rota `update_api_key` saiu, a chave vem só do `.env` e o `init_db()` apaga as chaves já salvas. **Falta:** remover a coluna `users.gemini_api_key` num PR futuro de banco.

- **Onde:** `app.py:140-143` e `database.py:25` (`users.gemini_api_key`)
- **O que acontece:** ✅ a chave colada no modal "Configurar IA" é salva sem criptografia.
- **Impacto na tela:** nenhum direto. O risco é de vazamento de credencial de terceiros (RNF04, RNF05) se o arquivo `studyia.db` for copiado ou exposto.
- **Sugestão (opcional):** criptografar em repouso, ou aceitar a chave só via `.env` na versão de apresentação.

### 3. `SECRET_KEY` com valor padrão no código
- **Onde:** `app.py:21` (fallback `"studyia_secret_una_2026"`); o `.env.example:2` traz outro valor de exemplo
- **O que acontece:** ✅ sem a variável de ambiente, a sessão é assinada com uma chave pública, visível no repositório.
- **Impacto na tela:** nenhum visual. O risco é alguém forjar a sessão (`user_id`) e ver o histórico de outro usuário (RNF04, RNF05).
- **Sugestão (opcional):** falhar no start, ou gerar uma chave aleatória quando `SECRET_KEY` não estiver definida.

### 4. Logout via GET
- **Onde:** `app.py:131`; link em `base.html:32`
- **O que acontece:** ✅ qualquer requisição GET para `/logout` (link externo, imagem, prefetch do navegador) encerra a sessão.
- **Impacto na tela:** o usuário pode ser deslogado sem ter clicado em "Sair".
- **Sugestão (opcional):** aceitar só POST. **Se mudarem, avisem o frontend:** o "Sair" precisará virar um `<form method="POST">` (ver [04-contratos-frontend.md §7.3](../04-contratos-frontend.md#73-atributos-name-lidos-pelo-flask)).

### 5. `int()` sem tratamento no `create_plan`
- **Onde:** `app.py:497-498`
- **O que acontece:** ✅ `int(request.form.get('daily_minutes', 30))` lança `ValueError` com valor não numérico ou vazio.
- **Impacto na tela:** erro **500** genérico. Hoje os `<select>` só enviam números, mas um formulário alterado ou um campo livre no futuro quebraria.
- **Sugestão (opcional):** validar e voltar com `flash` para o formulário.

### 6. Nomes dos modelos Gemini a confirmar
- **Onde:** `ai_service.py:57`, `:131`, `:219`, `:305`, `:402` (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`)
- **O que acontece:** ⚠️ não confirmado se esses nomes existem para a chave usada. Se nenhum existir, as 3 tentativas falham e o app cai no fallback (item 7).
- **Impacto na tela:** o app rodaria **sempre em modo demo**, mesmo com uma chave válida, sem nenhum aviso.
- **Sugestão (opcional):** testar com uma chave real e registrar no README quais modelos foram validados.

### 7. Fallback silencioso, só com `print()`
> 🟡 **Tocado** na [feature 01](../features/01-remover-configurar-ia.md) (branch `feat/remover-configurar-ia`): o servidor registra um `WARNING` no log ao iniciar sem `GEMINI_API_KEY`. Os outros casos (chave inválida, rede, modelo, JSON) continuam só com `print()`.

- **Onde:** `ai_service.py:20`, `:66`, `:140`, `:143`, `:230`, `:316`, `:412`
- **O que acontece:** ✅ chave inválida, rede fora, modelo inexistente ou JSON inválido vão parar no console do servidor e o app devolve o conteúdo de demonstração.
- **Impacto na tela:** o usuário recebe conteúdo genérico apresentado como se fosse da IA (RNF06, transparência).
- **Sugestão (opcional):** usar `logging` e propagar o motivo para a camada web (ver o item 8).
- **Evidência (feature 01):** ✅ testado pelo Renzo em 2026-11-23 com uma chave **inválida**: o banner do dashboard some (esperado); no chat, a resposta vem genérica **com** a nota "Resposta de demonstração"; mas a **visão geral do tópico** foi gerada com o conteúdo genérico do fallback **sem nenhum aviso na tela**, e a faixa do tópico ainda diz "impulsionados pelo Google Gemini". Nada aparece no log além do `print()`.
- **Prioridade: 🔴 alta antes da apresentação.** O usuário vê conteúdo genérico achando que é da IA (RNF06).

### 8. `is_simulated` descartado ou não persistido
- **Onde:**
  - visão geral: `app.py:231`, valor recebido e não usado
  - plano: `app.py:507`
  - seminário: `app.py:644`
  - avaliação: `app.py:729`
  - chat: `app.py:452`, devolvido no JSON (`:471-474`), mas sem coluna em `chat_messages`
- **O que acontece:** ✅ só o chat ao vivo sabe se a resposta é de demonstração, e essa informação some ao recarregar.
- **Impacto na tela:** o frontend não consegue mostrar de forma consistente "este conteúdo é de demonstração" em planos, seminários, notas e histórico (RNF06).
- **Sugestão (opcional):** persistir um booleano por mensagem, plano e seminário, ou ao menos repassar o valor aos templates.
- **Evidência (feature 01):** ✅ testado pelo Renzo em 2026-11-23 com uma chave **inválida**: o banner do dashboard some (esperado); no chat, a resposta vem genérica **com** a nota "Resposta de demonstração"; mas a **visão geral do tópico** foi gerada com o conteúdo genérico do fallback **sem nenhum aviso na tela**, e a faixa do tópico ainda diz "impulsionados pelo Google Gemini". Só o chat avisa porque é o único lugar em que o `is_simulated` chega à tela (no JSON do `send_message`); a visão geral, o plano e o seminário descartam o valor. Sem chave nenhuma, o banner `ai_demo_mode` cobre o caso; com chave inválida, não.
- **Prioridade: 🔴 alta antes da apresentação.** O usuário vê conteúdo genérico achando que é da IA (RNF06).

### 9. Banner de demo considera só a chave do banco
> ✅ **Resolvido** na [feature 01](../features/01-remover-configurar-ia.md) (branch `feat/remover-configurar-ia`): o `has_custom_key` saiu e o banner usa `ai_demo_mode` (`context_processor`), verdadeiro quando não há `GEMINI_API_KEY` no ambiente. **Limite conhecido:** chave inválida, modelo inexistente ou rede fora ainda caem no demo sem banner (depende dos itens 7 e 8).

- **Onde:** `app.py:181-182` (`has_custom_key`); o template usa o valor em `dashboard.html:20`
- **O que acontece:** ✅ o banner "⚡ Modo Demonstração Ativo" aparece quando o usuário não salvou uma chave pela interface, **mesmo que exista `GEMINI_API_KEY` no `.env`**. E não aparece quando a chave salva é inválida.
- **Impacto na tela:** aviso errado nos dois sentidos (RNF06).
- **Sugestão (opcional):** calcular o modo efetivo (chave do usuário ou do `.env`, e se a última chamada funcionou) e expor esse valor.

### 10. Upload acima de 10 MB devolve 413 cru
- **Onde:** `app.py:26` (`MAX_CONTENT_LENGTH`); não há `@app.errorhandler(413)`
- **O que acontece:** ✅ o Flask responde com a página de erro padrão, em inglês e sem o layout do app (aparência ⚠️ não confirmada).
- **Impacto na tela:** o usuário sai do StudyIA para uma página de erro técnica (RNF09).
- **Sugestão (opcional):** um handler que faça `flash("Arquivo maior que 10 MB", "danger")` e redirecione para o dashboard. O alerta já tem estilo pronto.
- **Relacionado:** o `.env.example` declara `UPLOAD_FOLDER` e `MAX_CONTENT_LENGTH`, mas o `app.py:23` e o `:26` usam valores fixos e ignoram essas variáveis.

### 11. JSON da IA sem validação
- **Onde:** `ai_service.py:226-228` (plano), `:312-314` (seminário), `:409-410` (avaliação); consumidores em `app.py:557`, `:599-601`, `:715`, `:738`
- **O que acontece:** ✅ qualquer JSON sintaticamente válido é aceito. Exemplos: um plano sem `days`, `tasks` como string, uma pergunta sem `id`, `score` não numérico (`float()` em `app.py:738` gera 500), ou a resposta sendo uma lista em vez de um objeto (`.get` em `app.py:600` gera 500).
- **Impacto na tela:** página de plano vazia ou sem tarefas, questões que não podem ser respondidas, erro 500 ao enviar o seminário.
- **Sugestão (opcional):** validar o esquema e, se falhar, tentar o próximo modelo ou usar o fallback.

### 12. Ausência de CSRF
- **Onde:** todos os forms POST (ver a tabela em [04-contratos-frontend.md §7.3](../04-contratos-frontend.md#73-atributos-name-lidos-pelo-flask)) e os 2 `fetch` (`app.js:63`, `:153`). O `test_app.py:11` define `WTF_CSRF_ENABLED`, mas o Flask-WTF não está no `requirements.txt`.
- **O que acontece:** ✅ outro site pode submeter forms em nome do usuário logado: excluir estudos, trocar a chave, gerar conteúdo.
- **Impacto na tela:** nenhum visual hoje.
- **Sugestão (opcional):** **combinar com o frontend antes de implementar.** O token vai exigir um campo oculto em cada form e um header nos 2 `fetch`. Se entrar no meio do redesign, os forms quebram com erro 400.

### 13. Dependências sem versão fixada
- **Onde:** `requirements.txt` (todas as linhas com `>=`)
- **O que acontece:** ✅ cada instalação pode trazer uma versão diferente (o README cita Flask 3.1, mas o arquivo pede `>=3.0.0`). Nada declara que o Python precisa ser ≥ 3.12 (`ai_service.py:51`, `:195`, `:278` não rodam em versões anteriores).
- **Impacto na tela:** "funciona na minha máquina". Uma atualização do `google-genai` ou do `pypdf` pode quebrar a geração ou o upload perto da apresentação.
- **Sugestão (opcional):** fixar versões (`==`) e declarar a versão do Python (`.python-version` ou `runtime.txt`, conforme o deploy do `Procfile`).

### 14. "Dia N:" repetido no título do dia do plano
- **Onde:** `ai_service.py:249` (fallback do plano: `"topic": f"Dia {i+1}: {stage_title} em {topic_title}"`); o exemplo de JSON do prompt, em `ai_service.py:206` (`"Tema do Dia 1"`), pode induzir o mesmo padrão na IA real
- **O que acontece:** ✅ no fallback, o campo `topic` de cada dia já começa com "Dia N:". ⚠️ não confirmado com uma chave real se o Gemini repete o padrão.
- **Impacto na tela:** desde a Fase 3 da sprint 01, o `plan_view.html` mostra o número da sessão ("Sessão 1") logo abaixo do título do dia. O resultado fica redundante: "Dia 1: Fundamentos e Introdução em Fotossíntese" / "Sessão 1".
- **Sugestão (opcional):** gerar o `topic` sem o prefixo (`f"{stage_title} em {topic_title}"`) e, no prompt, pedir só o tema do dia. O número já vem em `day_number`.

### 15. Emojis no conteúdo gerado
- **Onde:** `ai_service.py:70-84` (visão geral de demonstração: 📚 🎯 🚀 🧭 💬) e `:165` (resposta de demonstração sobre arquivo: 💡); o prompt da visão geral em `ai_service.py:37-51` pede os mesmos emojis nos títulos das seções
- **O que acontece:** ✅ o texto de demonstração traz emojis nos títulos e nas chamadas. ⚠️ não confirmado com uma chave real, mas, como o prompt pede os emojis, a IA real provavelmente os repete.
- **Impacto na tela:** a sprint 01 trocou todos os emojis da interface por ícones SVG com `aria-hidden` (achado A6, decisão D11). Os emojis no conteúdo do chat destoam do resto e são lidos em voz alta pelos leitores de tela ("foguete", "bússola").
- **Sugestão (opcional):** remover os emojis do fallback e do modelo de seções do prompt, e pedir ao Gemini que não use emojis.

### 16. Gemini citado como fonte mesmo no modo demonstração
- **Onde:** `templates/study_topic.html:53` ("fundamentação didática e esclarecimento contínuo de dúvidas impulsionados pelo Google Gemini"); o mesmo padrão em `plan_create.html:68` ("O Gemini criará um cronograma…")
- **O que acontece:** ✅ o texto é fixo no template. Aparece igual com a IA real, sem chave e com chave inválida (visto na prática no teste da feature 01, junto com a evidência dos itens 7 e 8).
- **Impacto na tela:** pendência de **transparência (RNF06)**: no modo demonstração, a tela atribui ao Gemini um conteúdo que é de exemplo.
- **Sugestão (opcional):** condicionar o texto ao modo efetivo. Com `ai_demo_mode` já dá para cobrir o caso "sem chave"; o caso "chave inválida" depende do `is_simulated` por conteúdo (item 8). A mudança no template é lógica Jinja e fica para o PR que resolver o item 8. Registrado em [features/01 §11](../features/01-remover-configurar-ia.md#11-em-aberto--futuro).

### 17. Sessão de um usuário que não existe mais no banco gera erro 500
- **Onde:** `app.py:36-43` (`login_required`); o erro aparece em `app.py:206-209` (`new_subject`, `INSERT INTO study_topics (user_id, …)`), por causa do `PRAGMA foreign_keys = ON` (`database.py:9`)
- **O que acontece:** ✅ o `login_required` só confere se existe `user_id` na sessão, não se esse usuário existe no banco. Com um cookie de sessão válido de um banco anterior (outro `DATABASE_PATH`, banco apagado e recriado ou usuário removido), as páginas de leitura abrem normalmente. Ao criar um assunto, o `INSERT` falha com `sqlite3.IntegrityError: FOREIGN KEY constraint failed`. Encontrado pelo Renzo no teste da [feature 02](../features/02-tema-claro-escuro-dispositivo.md), em 23/11/2026. ⚠️ não testado nas outras rotas que gravam com o `user_id` da sessão: `upload_file` (`app.py:314`), `create_plan` (`:513`) e `create_seminar` (`:645`). Pela leitura do código, devem falhar do mesmo jeito.
- **Impacto na tela:** o dashboard aparece "logado", com o nome do usuário na navbar, mas a primeira ação que grava algo devolve um **500** genérico, fora do layout. Não há como a pessoa entender que precisa entrar de novo.
- **Prioridade: 🔴 alta.** Em produção, isso acontece se o banco for recriado (ex.: disco efêmero no deploy): todos os usuários com sessão aberta caem no 500 ao criar qualquer coisa. **Confirmar onde o SQLite fica no deploy** (disco persistente ou não).
- **Sugestão (opcional):** no `login_required`, conferir se o usuário existe; se não existir, `session.clear()`, `flash` (por exemplo, "Sua sessão expirou. Entre novamente.", categoria `warning`) e redirecionar para o login. Nas rotas JSON (`send_message`, `toggle_task`), o mesmo caso entra no [item 4 da lista abaixo](#o-que-o-frontend-precisa-de-vocês) (responder 401 em JSON em vez de redirect HTML). Relacionado ao item 3: com a `SECRET_KEY` padrão, um cookie de outra instalação também é aceito.

### 18. Percentuais sempre com uma casa decimal ("10.0%")
- **Onde:** `app.py:594` (`progress = round(…, 1)` no `toggle_task`) e `:729` (`score = float(…)` no `submit_seminar`); colunas `REAL` no banco (`database.py:71`)
- **O que acontece:** ✅ o `round(x, 1)` do Python devolve sempre `float`, então um progresso de 10 % é gravado e enviado como `10.0`. O Jinja imprime "10.0"; o JSON da rota `toggle-task` chega ao `app.js` como o número `10`, e o JS escreve "10". Encontrado na revisão da [feature 02](../features/02-tema-claro-escuro-dispositivo.md), em 23/11/2026; existe igual na `main`.
- **Impacto na tela:** o mesmo progresso aparece "10%" logo depois de marcar a tarefa e "10.0%" depois de recarregar ([05-achados B12](../05-achados-frontend.md#b12-progresso-10--100-)). A nota do seminário mostra "95.0%" no painel, no badge e no flash.
- **Sugestão (opcional):** combinar um formato único: inteiro quando não há fração (`10`, `33.3`), ou o valor já formatado para exibição. Se o formato ficar só no template (filtro Jinja), o `app.js` precisa escrever igual. Baixa prioridade: é consistência, não erro.

### 19. Sugestão futura: preferência de tema salva no banco
- **Onde:** hoje não existe; seria uma coluna em `users` (ex.: `theme TEXT DEFAULT 'system'`) e uma rota POST para gravar a escolha
- **O que acontece:** ✅ a [feature 02](../features/02-tema-claro-escuro-dispositivo.md) guarda a escolha (Claro, Escuro ou Dispositivo) **só no navegador** (`localStorage`, chave `studyia-theme`). Decisão do grupo: a funcionalidade é exclusivamente estética e não toca o backend.
- **Impacto na tela:** quem troca de computador ou de navegador volta ao padrão (Dispositivo, que segue o sistema) e precisa escolher de novo. Nada quebra.
- **Sugestão (opcional, futuro):** gravar a preferência no usuário e mandar o valor para o template (por exemplo, `data-theme` já no `<html>` renderizado pelo servidor). Cuidados: o script inline anti-flash do `<head>` continua necessário para quem não está logado (login, cadastro, landing); a rota nova entra no item 12 (CSRF); e o `theme.js` passaria a enviar a escolha ao servidor, o que é mudança de comportamento (PR próprio, com o ok do grupo).

---

## O que o frontend precisa de vocês

Itens que destravam o trabalho visual. Nenhum deles é urgente para a sprint 01, mas eles definem o que o redesign consegue exibir.

1. **Expor o modo da IA para os templates** (itens 8 e 9): um `is_simulated` por mensagem, plano e seminário, e um indicador global do modo efetivo (por exemplo, via `context_processor`). Com isso, o aviso de demonstração fica consistente em todas as telas. *(O indicador global por ausência de chave, `ai_demo_mode`, entrou na feature 01; falta o `is_simulated` por conteúdo.)*
2. **Fuso horário dos timestamps:** hoje o template recebe UTC como string e a mensagem nova usa a hora local do navegador ([05-achados B8](../05-achados-frontend.md)). Preciso saber se vocês vão converter (por exemplo, para `America/Sao_Paulo`) ou se o frontend deve converter.
3. **Erros dentro do layout:** o 413 (item 10) e os erros de validação (itens 5 e 11) voltando como `flash` + redirect, para aparecerem nos alertas já estilizados.
4. **Rotas JSON respondendo JSON quando a sessão expira** (por exemplo, 401 com `{"error": "..."}` em vez de redirect HTML). Assim o JS consegue mostrar "sessão expirada" (ver [02-rotas.md](../02-rotas.md#login_required-e-as-rotas-json)).
5. **Aviso prévio de mudanças de contrato:** nomes de endpoint, `name` de formulário, chaves JSON, método do logout e CSRF. A lista do que o frontend usa está em [04-contratos-frontend.md](../04-contratos-frontend.md).
6. **Esquema garantido do JSON da IA** (item 11): saber quais campos sempre virão (`days[].tasks` como lista, `questions[].id`, `type`, `options`) para o layout não precisar se defender de tudo.
