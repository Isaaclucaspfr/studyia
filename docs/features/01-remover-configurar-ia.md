# 01 — Remover "Configurar IA"

> Índice: [features/README.md](README.md) · Base: commit `69c99ab` · Tamanho: pequeno (1 PR) · Escopos: **A + B + C**

## 1. Objetivo

Tirar da interface o botão "Configurar IA" e o modal em que cada usuário colava a própria chave do Gemini.

- **Problema:** a chave do Gemini já está vinculada ao sistema pela variável de ambiente `GEMINI_API_KEY`. O modal pede ao usuário algo que ele não precisa (e, num app de estudos, não deveria) ter, guarda a chave em texto puro no banco ([handoff §2](../handoff/backend-pendencias.md#2-chave-do-gemini-gravada-em-texto-puro)) e ocupa espaço na navbar.
- **Valor:** navbar mais limpa (o espaço vai para o seletor de tema, [02](02-tema-claro-escuro-dispositivo.md)), nenhuma credencial de terceiros no banco e um aviso de modo demonstração que diz a verdade.

## 2. Como funciona hoje

### Pontos de entrada

| O quê | Onde | Observação |
|---|---|---|
| Botão "Configurar IA" (`#openSettingsBtn`) | `templates/base.html:56-59` | só com sessão (`base.html:54`); classe `.nav-settings-btn`, rótulo `.nav-btn-label` |
| Modal (`#settingsModal`) | `templates/base.html:69-92` | só com sessão (`base.html:70`); form `POST url_for('update_api_key')` em `:77`; campo `name="gemini_api_key"` em `:80`; dica "Se deixada em branco, o StudyIA operará no modo de demonstração…" em `:81-83` |
| Botão "Cancelar" (`#closeSettingsBtn`) | `templates/base.html:86` | `type="button"` |
| Banner "Modo demonstração ativo" + botão "Configurar chave Gemini" (`#openSettingsBtn2`) | `templates/dashboard.html:14-19` | o botão abre o modal por `onclick` inline: `document.getElementById('settingsModal').style.display='flex'` (`:17`) |
| Rota `POST /settings/api-key` (`update_api_key`) | `app.py:137-146` | grava o campo em `users.gemini_api_key` sem criptografia; valor vazio apaga a chave |
| Coluna `users.gemini_api_key` | `database.py:25` | `TEXT DEFAULT ''` |
| `get_current_user_api_key()` | `app.py:41-47` | **prefere a chave do banco** (`:45-46`) e só depois usa `GEMINI_API_KEY`. Chamada em `app.py:210`, `:451`, `:506`, `:643` e `:728` |
| `has_custom_key` | `app.py:180-182`, passado ao template em `:192` | `True` só se o usuário salvou uma chave pela interface |
| Fallback do cliente | `ai_service.py:12-21` | `get_gemini_client` repete o fallback para `GEMINI_API_KEY` (`:13`); sem chave, devolve `None` e o app usa o modo demo |
| JS do modal | `static/js/app.js:4-26` | abrir, fechar e clicar fora |
| Nota de demo no chat | `static/js/app.js:117-119` | texto "⚡ Modo Demonstração Didática (**Chave Gemini pode ser configurada**)" com estilo inline |
| CSS do modal | `static/css/style.css:1134-1193` | `.modal-overlay`, `.modal-content`, `@starting-style`, `.modal-title`, `.modal-text`, `.modal-actions` |
| CSS do botão | `static/css/style.css:200-212` (+ media queries a partir de `:214`) | `.nav-btn-label`, `.nav-settings-btn` |
| README do projeto | `README.md:70` | manda o usuário usar o botão "⚙️ Configurar IA" |

### ⚠️ Armadilha 1 — o `app.js` quebra sem o HTML do modal? **Não se confirma.**

Verificado no código:

```js
// static/js/app.js
5   const settingsBtn = document.getElementById('openSettingsBtn');
6   const settingsModal = document.getElementById('settingsModal');
7   const closeSettingsBtn = document.getElementById('closeSettingsBtn');
9   if (settingsBtn && settingsModal) { ... }        // checa null
15  if (closeSettingsBtn && settingsModal) { ... }   // checa null
22  window.addEventListener('click', (e) => {
23      if (e.target === settingsModal) { ... }      // com settingsModal = null, a comparação é sempre false
26  });
```

- Removendo `#openSettingsBtn`, `#settingsModal` e `#closeSettingsBtn`, nenhuma linha lança exceção. O `DOMContentLoaded` segue e o chat (`:28-84`) e o checklist (`:144-181`) continuam funcionando.
- **Onde há risco de verdade:** o `onclick` inline de `dashboard.html:17`. Se alguém remover o modal e **esquecer o `#openSettingsBtn2`**, o clique nele gera `TypeError: Cannot read properties of null` (só no clique, sem afetar o resto da página). Os dois precisam sair no mesmo PR.
- **Ajuste necessário:** nenhum para evitar erro. **Limpeza recomendada (B):** apagar `app.js:4-26`, que vira código morto (o listener de `click` no `window` continuaria rodando a cada clique sem motivo).

### ⚠️ Armadilha 2 — o banner de demo aparece sempre. **Confirmada.**

- `app.py:181-182`: `has_custom_key = bool(user['gemini_api_key'] ...)`, ou seja, só olha a chave salva no banco.
- `dashboard.html:14`: `{% if not has_custom_key %}` mostra "Modo demonstração ativo".
- Sem o modal, ninguém salva chave. O banner apareceria **para todo mundo, sempre**, mesmo com `GEMINI_API_KEY` funcionando no `.env`. É o [handoff §9](../handoff/backend-pendencias.md#9-banner-de-demo-considera-só-a-chave-do-banco) piorado: hoje o aviso já erra, e passaria a errar em 100% dos casos.

### ⚠️ Armadilha 3 — chaves antigas continuam valendo. **Confirmada.**

- `get_current_user_api_key()` usa a chave do banco **antes** da do ambiente (`app.py:45-46`).
- Se a rota e o modal saírem e a função continuar igual, quem já salvou uma chave (inclusive uma inválida ou vencida) continua usando essa chave para sempre, **sem nenhum jeito de apagá-la pela interface**, e a chave do `.env` nunca é usada para essa pessoa.
- Com uma chave inválida, todas as chamadas dessa pessoa caem no modo demo em silêncio ([handoff §7](../handoff/backend-pendencias.md#7-fallback-silencioso-só-com-print)).

### Deploy sem a variável de ambiente

- `Procfile`: `web: gunicorn app:app`. `load_dotenv()` (`app.py:18`) só carrega o `.env` se o arquivo existir no servidor.
- Sem `GEMINI_API_KEY`: `get_gemini_client` devolve `None` (`ai_service.py:13-15`) e **todas** as funções de IA devolvem o fallback com `is_simulated=True`, sem log nenhum (nem `print`, porque não há exceção). O app sobe normalmente e parece funcionar.
- Depois desta funcionalidade, o usuário não tem mais como "consertar" isso pela interface: a única correção é configurar a variável no servidor. Por isso o aviso precisa ser correto (Armadilha 2) e o servidor deveria avisar no log (proposta abaixo).

## 3. Como deve funcionar

1. O usuário entra no app. A navbar mostra a marca, o seletor de tema (quando a [02](02-tema-claro-escuro-dispositivo.md) entrar; até lá, nada no lugar), o nome e "Sair". Não há "Configurar IA".
2. No dashboard:
   - **Com `GEMINI_API_KEY` configurada:** nenhum banner de demonstração.
   - **Sem a variável:** banner "Modo demonstração" **sem botão**, com um texto que explica o que isso significa (conteúdo de exemplo, não gerado pela IA).
3. No chat, uma resposta de demonstração continua marcada como tal, mas o texto não manda mais "configurar a chave".
4. O rodapé continua transparente sobre o uso de IA e passa a citar o modo demonstração (RNF06).
5. Ninguém consegue mais enviar uma chave: `POST /settings/api-key` deixa de existir (ou responde 404/405, conforme a decisão abaixo).

## 4. Decisões do grupo

- ✅ **Decidido:** o botão "Configurar IA" sai, porque a chave do Gemini já está vinculada ao sistema (variável de ambiente).
- ✅ **Decidido:** o espaço liberado na navbar vai para o seletor de tema ([02](02-tema-claro-escuro-dispositivo.md)).
- ✅ **Decidido:** quem estiver mexendo implementa (o PR toca `app.py`, templates e, opcionalmente, `app.js`).

## 5. Proposta técnica

> 💡 **Proposta — validar com a equipe.**

### 5.1 Destino da rota, da função e da coluna

| Opção | O que faz | Prós | Contras |
|---|---|---|---|
| **A. Remover tudo agora** | apaga a rota, a função passa a ler só o ambiente, `ALTER TABLE users DROP COLUMN gemini_api_key` | código e banco limpos; nenhuma chave em texto puro sobra | **mexe no banco**: o `init_db()` (`database.py:13-98`) só faz `CREATE TABLE IF NOT EXISTS`, então bancos existentes mantêm a coluna até alguém rodar uma migração. `DROP COLUMN` exige SQLite ≥ 3.35 (a máquina de teste tem 3.45.1, o servidor ⚠️ não confirmado). Não existe sistema de migração no projeto |
| **B. Manter sem uso** | só tira o HTML; rota, função e coluna ficam | zero risco no banco; reversível | **cai na Armadilha 3**: chaves salvas continuam valendo e em texto puro; rota órfã aceitando POST; código morto |
| **C. Remover a rota e parar de ler a coluna agora; apagar a coluna depois** (recomendada) | apaga a rota; `get_current_user_api_key()` passa a devolver só `os.environ.get("GEMINI_API_KEY", "")` (ou é removida, já que `ai_service.get_gemini_client` já faz esse fallback); um `UPDATE users SET gemini_api_key = ''` único limpa as chaves salvas; a coluna sai num PR de banco futuro | resolve as Armadilhas 2 e 3 e o [handoff §2](../handoff/backend-pendencias.md#2-chave-do-gemini-gravada-em-texto-puro) sem migração de esquema; o PR fica pequeno | a coluna vazia fica no esquema por um tempo; o `UPDATE` de limpeza precisa rodar uma vez (no `init_db` ou à mão) |

Detalhes da opção C:

- **Limpeza das chaves:** como o banco só tem dados de teste (mesmo motivo da [decisão 11 da 03](03-conteudo-do-plano.md#4-decisões-do-grupo)), apagar o `studyia.db` também resolve. Num banco de deploy, rodar o `UPDATE` uma vez.
- **Assinaturas:** as 5 chamadas (`app.py:210`, `:451`, `:506`, `:643`, `:728`) podem continuar passando `api_key=get_current_user_api_key()`, agora vindo só do ambiente. Isso evita mexer em `ai_service.py`.

### 5.2 Correção do banner (Armadilha 2)

Calcular o modo efetivo no backend e expô-lo para **todos** os templates, não só para o dashboard:

```python
# app.py (proposta)
@app.context_processor
def inject_ai_mode():
    return {"ai_demo_mode": not os.environ.get("GEMINI_API_KEY")}
```

- `dashboard.html:14` troca `{% if not has_custom_key %}` por `{% if ai_demo_mode %}`, e o `has_custom_key` sai de `app.py:180-182` e `:192`.
- **Limite conhecido:** isso só detecta "não há chave". Chave inválida, modelo inexistente ([handoff §6](../handoff/backend-pendencias.md#6-nomes-dos-modelos-gemini-a-confirmar)) ou rede fora continuam caindo no demo sem banner. Para esses casos, o caminho é o `is_simulated` por conteúdo ([handoff §8](../handoff/backend-pendencias.md#8-is_simulated-descartado-ou-não-persistido)); a [03](03-conteudo-do-plano.md) já grava `is_simulated` para o conteúdo das tarefas.
- **Log no start:** se `GEMINI_API_KEY` estiver vazia, `app.logger.warning("GEMINI_API_KEY não definida: o StudyIA vai rodar em modo demonstração")` logo depois do `load_dotenv()`. Quem faz o deploy vê o problema no log, e não só quem abre o dashboard.

### 5.3 Textos de transparência (RNF06)

| Lugar | Hoje | Proposta |
|---|---|---|
| Banner do dashboard (`dashboard.html:15-18`) | "Modo demonstração ativo" + botão "Configurar chave Gemini" | **"Modo demonstração"** + texto: "A IA não está configurada neste servidor. Explicações, planos e seminários usam conteúdo de exemplo." Sem botão. Visual: o `.notice` atual (âmbar, contraste já aprovado na sprint 01). |
| Nota no chat (`app.js:118`) | "⚡ Modo Demonstração Didática (Chave Gemini pode ser configurada)" | "Resposta de demonstração: a IA não está disponível no momento." **Muda o `app.js` (B).** Aproveitar para trocar o `style=""` inline por uma classe (por exemplo `.chat-demo-note`, só CSS), o que resolve também a cor `#718096` do [B11](../05-achados-frontend.md) e prepara o tema escuro ([02 §5.5](02-tema-claro-escuro-dispositivo.md#55-cores-inline-do-appjs-b11)). |
| Rodapé (`base.html:115`) | "Transparência (RNF06): as respostas, planos e seminários são gerados com apoio de inteligência artificial e devem ser revisados pelo usuário." | Acrescentar: "Quando a IA não está disponível, o StudyIA mostra conteúdo de demonstração e avisa na tela." |

### 5.4 Limpeza de CSS (A)

Depois que o HTML sair, ficam sem uso: `.modal-overlay`, `.modal-content`, `.modal-title`, `.modal-text`, `.modal-actions` e o `@starting-style` do modal (`style.css:1134-1193`), mais `.nav-settings-btn`/`.nav-btn-label` (`style.css:200-212` e as regras dos breakpoints). 💡 Recomendação: **manter `.nav-btn-label`** (o seletor de tema pode reaproveitar o padrão "só ícone abaixo de 640 px") e remover o resto do modal. Se o grupo quiser um modal no futuro, o histórico do git guarda o CSS.

## 6. Impacto por camada

| Camada | O que muda |
|---|---|
| **Backend** (`app.py`) | remover `update_api_key` (`:137-146`); `get_current_user_api_key` (`:41-47`) lê só o ambiente; `has_custom_key` (`:180-182`, `:192`) sai; novo `context_processor` com `ai_demo_mode`; aviso no log quando falta a variável |
| **Banco** (`database.py`) | opção C: nenhuma mudança de esquema; um `UPDATE` de limpeza. Opção A: `DROP COLUMN` + migração |
| **Templates** | `base.html`: remover `:56-59` (botão) e `:69-92` (modal); ajustar o rodapé (`:115`). `dashboard.html`: `:14-19` com a nova condição e sem o `#openSettingsBtn2` |
| **CSS** | remover o CSS do modal (5.4); ajustar o espaçamento da `.nav-user` sem o botão; subir o `?v=` dos dois `<link>` (`base.html:13-14`, hoje `redesign_v3`) |
| **JS** (`app.js`, B) | opcional mas recomendado: apagar `:4-26`; trocar o texto (e o inline) de `:118` |
| **Testes** | o `test_app.py` não usa a rota nem o modal: continua passando. Acrescentar: `POST /settings/api-key` → 404/405; dashboard **sem** o banner com `GEMINI_API_KEY` definida e **com** o banner sem ela; um usuário com `gemini_api_key` preenchida no banco não usa essa chave |
| **Docs** | `docs/04` (ver §7); `docs/02-rotas.md` (linha da rota); `docs/01-arquitetura.md` ("Chave do Gemini: ordem de resolução"); `docs/05` (B5 deixa de existir; B11 perde a nota do demo se o inline sair); `docs/handoff` (§2 e §9 resolvidos). **`README.md:70` cita o botão** e está fora do que o frontend pode editar: quem tiver permissão precisa atualizar |

## 7. Contratos afetados ([docs/04](../04-contratos-frontend.md))

| Contrato | Seção do 04 | O que acontece |
|---|---|---|
| Condição de sessão do "Configurar IA" e do modal | §7.1 | some (o botão e o modal saem); a condição continua valendo para nome e "Sair" |
| Endpoint `update_api_key` na lista de `url_for` | §7.1 | sai da lista |
| `#openSettingsBtn`, `#settingsModal`, `#closeSettingsBtn`, `#openSettingsBtn2` | §7.2 | as 4 linhas saem da tabela |
| Form "Chave Gemini" (`gemini_api_key`) | §7.3 | sai da tabela e da lista "Forms que PRECISAM continuar POST" |
| Checklist: itens 4 (`update_api_key` POST) e 9 (`#settingsModal` oculto e com `display:flex`) | checklist final | o item 9 fica só com o `#chatMessages`; o 4 perde o `update_api_key` |
| `has_custom_key` (variável do template) | não está no 04 (está no [03-inventário](../03-frontend-inventario.md)) | trocada por `ai_demo_mode` (global) |

Nenhum contrato de chat, plano, seminário ou dos textos do `test_app.py` (§7.5) muda.

## 8. Riscos e armadilhas

- **Remover só o modal e esquecer o `#openSettingsBtn2`:** erro no clique (ver Armadilha 1). Remover os dois juntos.
- **Remover o HTML sem mexer no backend:** banner sempre visível (Armadilha 2) e chaves antigas presas (Armadilha 3). **O PR precisa ter as duas partes.**
- **Deploy sem `GEMINI_API_KEY`:** o app sobe em demo sem erro. Mitigação: o banner correto, o log no start e um item no checklist de deploy.
- **Mudança de esquema sem migração:** se o grupo escolher a opção A, combinar como os bancos existentes vão perder a coluna (script único ou recriar o banco).
- **Texto do `app.js:118`:** se o JS não for alterado, a nota do chat continua mandando "configurar a chave", o que passa a ser impossível. Decidir junto com este PR.
- **Saída do `has_custom_key` com cache de template:** o Flask sem debug guarda templates em cache; reiniciar o servidor ao testar (registrado na sprint 01).

## 9. Critérios de aceite

- [ ] Não existe "Configurar IA" na navbar em 375, 768 e 1440 px.
- [ ] Não existe `#settingsModal`, `#openSettingsBtn`, `#openSettingsBtn2` nem `#closeSettingsBtn` em nenhuma página (`grep` no `templates/`).
- [ ] O console do navegador não mostra erros no dashboard, no tópico (chat) e no plano (checklist). Enviar uma mensagem no chat e marcar uma tarefa continuam funcionando.
- [ ] `POST /settings/api-key` não grava nada (404 ou 405).
- [ ] Com `GEMINI_API_KEY` definida: o dashboard **não** mostra o banner de demonstração.
- [ ] Sem `GEMINI_API_KEY`: o dashboard mostra o banner, sem botão, com o texto explicativo; o servidor registra o aviso no log ao iniciar.
- [ ] Um usuário que tinha `gemini_api_key` preenchida no banco passa a usar a chave do ambiente (ou a coluna está vazia para todos).
- [ ] O rodapé cita o modo demonstração.
- [ ] Se o `app.js` foi alterado: a nota do chat não fala mais em configurar a chave e não tem `style=""` inline.
- [ ] `DATABASE_PATH=/tmp/studyia-teste.db python -m unittest test_app.py` passa.
- [ ] `docs/04`, `docs/02`, `docs/01` e o handoff atualizados no mesmo PR.

## 10. Divisão em PRs e responsáveis

Um PR só (passo 2 da [ordem](README.md#ordem-de-implementação--decidido)). ✅ Quem estiver mexendo implementa.

| Parte | Escopo | Depende de |
|---|---|---|
| Backend: rota, função, `context_processor`, log, limpeza das chaves | C | — |
| Templates: navbar, modal, banner, rodapé | A/B (a condição do banner é lógica Jinja) | backend no mesmo PR |
| CSS: remover o modal, ajustar a navbar, `?v=` | A | templates |
| `app.js:4-26` e `:118` | B | decisão do grupo (§11) |
| Docs: 01, 02, 04, 05, handoff | — | — |

## 11. Em aberto / futuro

- ❓ **Destino da coluna:** opção A, B ou C (§5.1). Recomendação: C.
- ❓ **Mexer no `app.js` neste PR?** Recomendação: sim, para apagar `:4-26` e corrigir o texto/inline de `:118`. Sem isso, a nota do chat fica com uma instrução impossível.
- **Futuro:** detectar o demo "de fato" (chave inválida, cota estourada) e não só a ausência da chave. Depende do [handoff §7 e §8](../handoff/backend-pendencias.md#8-is_simulated-descartado-ou-não-persistido).
- **Futuro:** PR de banco para remover a coluna `gemini_api_key` de vez (opção C, segunda etapa).
- **Fora do escopo do frontend:** atualizar o `README.md:70`.
