# Pendências para a equipe de backend

> Levantado durante a análise do frontend (leitura do código, commit `7fbd035`). **Nenhum destes itens foi alterado.** Cada um descreve o que foi observado e o efeito na tela. As sugestões são **opcionais**: a decisão é de vocês. Depois de revisado no PR, cada item pode virar uma issue no GitHub.
>
> Status: ✅ confirmado pela leitura do código · ⚠️ não confirmado (depende de rodar o app ou de testar com a API).

> **Novas funcionalidades (especificadas em [docs/features/](../features/README.md)).** Alguns itens abaixo passam a ser tratados dentro delas. Os itens continuam aqui como estão; a especificação de cada funcionalidade diz o que muda:
>
> - [01 — Remover "Configurar IA"](../features/01-remover-configurar-ia.md): resolve o **§2** (chave em texto puro) e o **§9** (banner de demo baseado só na chave do banco), e toca o **§7** (aviso no log quando falta `GEMINI_API_KEY`).
> - [03 — Conteúdo dentro do plano](../features/03-conteudo-do-plano.md): grava `is_simulated` por conteúdo (**§8**), segue o **§15** (sem emojis) e o **§14** (sem "Dia N") no prompt novo, depende do **§11** (JSON do plano sem validação) e acrescenta 2 rotas POST ao **§12** (CSRF). Equipe de backend lidera.
> - [02 — Tema claro/escuro/dispositivo](../features/02-tema-claro-escuro-dispositivo.md): não toca o backend. **Possibilidade futura:** salvar a preferência de tema no banco (coluna em `users` + rota), para valer em outros dispositivos. Hoje fica só no navegador.
> - [04 — Landing page](../features/04-landing-page.md): mudança **pequena** na rota `/` (`index`, `app.py:53-57`). Sem sessão, ela passa a renderizar `landing.html` em vez de redirecionar ao login (só a linha `:57` muda) e ganha 2 testes novos; nenhum teste existente acessa a `/`. Precisa do ok da equipe de backend no PR da landing. **Possibilidade futura:** cache longo para `static/vendor/` (caminhos versionados) no lugar do `SEND_FILE_MAX_AGE_DEFAULT = 0` global (`app.py:27`), e compressão gzip no deploy.

Índice: [1](#1-pergunta-do-chat-duplicada-no-prompt) · [2](#2-chave-do-gemini-gravada-em-texto-puro) · [3](#3-secret_key-com-valor-padrão-no-código) · [4](#4-logout-via-get) · [5](#5-int-sem-tratamento-no-create_plan) · [6](#6-nomes-dos-modelos-gemini-a-confirmar) · [7](#7-fallback-silencioso-só-com-print) · [8](#8-is_simulated-descartado-ou-não-persistido) · [9](#9-banner-de-demo-considera-só-a-chave-do-banco) · [10](#10-upload-acima-de-10-mb-devolve-413-cru) · [11](#11-json-da-ia-sem-validação) · [12](#12-ausência-de-csrf) · [13](#13-dependências-sem-versão-fixada) · [14](#14-dia-n-repetido-no-título-do-dia-do-plano) · [15](#15-emojis-no-conteúdo-gerado)

---

### 1. Pergunta do chat duplicada no prompt
- **Onde:** `app.py:434-444` e `ai_service.py:123-126`
- **O que acontece:** ✅ `send_message` grava a pergunta em `chat_messages` e **depois** lê o histórico completo, que já inclui essa pergunta. Em seguida, `ask_assistant` adiciona `[user]: {user_message}` de novo ao final.
- **Impacto na tela:** a IA recebe a última pergunta duas vezes. ⚠️ não confirmado se isso altera as respostas, mas consome tokens e pode enviesar o contexto.
- **Sugestão (opcional):** ler o histórico antes do `INSERT` ou não reanexar a pergunta.

### 2. Chave do Gemini gravada em texto puro
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
- **Onde:** `ai_service.py:20`, `:66`, `:140`, `:143`, `:230`, `:316`, `:412`
- **O que acontece:** ✅ chave inválida, rede fora, modelo inexistente ou JSON inválido vão parar no console do servidor e o app devolve o conteúdo de demonstração.
- **Impacto na tela:** o usuário recebe conteúdo genérico apresentado como se fosse da IA (RNF06, transparência).
- **Sugestão (opcional):** usar `logging` e propagar o motivo para a camada web (ver o item 8).

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

### 9. Banner de demo considera só a chave do banco
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

---

## O que o frontend precisa de vocês

Itens que destravam o trabalho visual. Nenhum deles é urgente para a sprint 01, mas eles definem o que o redesign consegue exibir.

1. **Expor o modo da IA para os templates** (itens 8 e 9): um `is_simulated` por mensagem, plano e seminário, e um indicador global do modo efetivo (por exemplo, via `context_processor`). Com isso, o aviso de demonstração fica consistente em todas as telas.
2. **Fuso horário dos timestamps:** hoje o template recebe UTC como string e a mensagem nova usa a hora local do navegador ([05-achados B8](../05-achados-frontend.md)). Preciso saber se vocês vão converter (por exemplo, para `America/Sao_Paulo`) ou se o frontend deve converter.
3. **Erros dentro do layout:** o 413 (item 10) e os erros de validação (itens 5 e 11) voltando como `flash` + redirect, para aparecerem nos alertas já estilizados.
4. **Rotas JSON respondendo JSON quando a sessão expira** (por exemplo, 401 com `{"error": "..."}` em vez de redirect HTML). Assim o JS consegue mostrar "sessão expirada" (ver [02-rotas.md](../02-rotas.md#login_required-e-as-rotas-json)).
5. **Aviso prévio de mudanças de contrato:** nomes de endpoint, `name` de formulário, chaves JSON, método do logout e CSRF. A lista do que o frontend usa está em [04-contratos-frontend.md](../04-contratos-frontend.md).
6. **Esquema garantido do JSON da IA** (item 11): saber quais campos sempre virão (`days[].tasks` como lista, `questions[].id`, `type`, `options`) para o layout não precisar se defender de tudo.
