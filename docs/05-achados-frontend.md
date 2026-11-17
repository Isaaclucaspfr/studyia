# 05 — Achados no frontend

Problemas encontrados na leitura do código que tocam o frontend, classificados pelo [escopo](README.md#legenda-de-escopo):

- **A — Visual:** entra no redesign ([sprint 01](sprints/sprint-01-redesign-visual.md)).
- **B — Comportamento do frontend:** código de template ou JS que muda o que a página faz. **Só documentado.** Precisa de decisão do grupo e de PR próprio.
- **C — Backend:** fora deste arquivo. Ver [handoff/backend-pendencias.md](handoff/backend-pendencias.md).

Status: ✅ confirmado pela leitura do código · ⚠️ não confirmado (depende de rodar o app ou de inspeção visual).

---

## A. Visual (escopo do redesign)

### A1. Variáveis CSS usadas, mas nunca definidas ✅ (efeito visual ⚠️ não confirmado)
- **Onde:**
  - `--gray-900` em `base.html:41` (título do modal), `--gray-600` em `:42` (texto do modal), `--gray-500` em `:49` (dica do campo) e `:81` (rodapé), `--gray-200` em `:81` (borda do rodapé). O `style.css` só define `--chakra-colors-gray-*`.
  - `--chakra-colors-red-200` em `style.css:260` (`.btn-danger-outline`).
  - `--chakra-colors-purple-300` em `style.css:421` (`.avatar-circle.user`).
- **Impacto:** a declaração com `var()` indefinida é descartada. O texto do modal e do rodapé herda a cor do `body` em vez do cinza pretendido, a borda superior do rodapé some, e o botão "Sair" e o 🗑️ ficam sem borda vermelha, assim como o avatar do usuário fica sem borda roxa.
- **Requisito:** RNF01 (interface clara).

### A2. 183 atributos `style=""` inline ✅
- **Onde:** `dashboard.html` (50), `study_topic.html` (38), `seminar_view.html` (35), `plan_view.html` (27), `login.html` (9), `register.html` (9), `plan_create.html` (9), `base.html` (6).
- **Padrões repetidos que viram classes:**

  | Padrão | Ocorrências |
  |---|---|
  | Link "← Voltar" | `study_topic.html:7`, `plan_create.html:7`, `plan_view.html:7`, `seminar_view.html:7` |
  | Eyebrow (rótulo pequeno em caixa alta) | `dashboard.html:9`, `plan_create.html:13`, `plan_view.html:53`, `seminar_view.html:43`, `:109` |
  | Cabeçalho de página (título + ações, com `flex-wrap`) | `dashboard.html:7`, `study_topic.html:11`, `plan_view.html:11`, `seminar_view.html:11` |
  | Card de autenticação centralizado + selo | `login.html:6-11`, `register.html:6-11` |
  | Cabeçalho de card (título + ação à direita) | `dashboard.html:129`, `study_topic.html:99`, `:136` |
  | Item de lista com borda | `dashboard.html:142`, `study_topic.html:107`, `:146` |
  | Estado vazio | `dashboard.html:180-183`, `study_topic.html:127-130`, `:164-167` |
  | Estatística (número + legenda) | `dashboard.html:31-61` |
  | Item de tarefa (checkbox + texto) | `plan_view.html:70-85` |
  | Opção de múltipla escolha | `seminar_view.html:132-142` |
  | Caixa de feedback / painéis "fortes" e "a revisar" | `seminar_view.html:68-89`, `:161-163` |
  | Faixa de CTA tracejada | `plan_view.html:92` |
  | Banner de modo demo | `dashboard.html:21` |
- **Impacto:** estilo inline não pode ser sobrescrito por media query, o que trava a responsividade (ver A4). Além disso, cada tela fica com espaçamentos e tamanhos ligeiramente diferentes.
- **Requisito:** RNF01, RNF02.
- **Cuidado de contrato:** a largura da barra de progresso (`plan_view.html:39`, `study_topic.html:115`) é inline de propósito. Ver as [exceções](06-padroes-visuais.md#exceções-permitidas).

### A3. Cores hardcoded e limiares de nota inconsistentes ✅
- **Cores fora dos tokens:** `#ffffff`/`#fff` em `dashboard.html:142`, `study_topic.html:107`, `:146`, `plan_view.html:92` e `seminar_view.html:132`. Também no JS: `#718096` (`app.js:118`) e `#94a3b8` (`app.js:170`), que não bate com o `gray-400` `#a0aec0` usado pelo template em `plan_view.html:81`. Alterar o JS é escopo B.
- **Limiares de nota em `seminar_view.html`:**
  - Borda do painel (`:40`): ≥ 70 verde, ≥ 50 **amarelo**, senão vermelho.
  - Número da nota (`:57`): ≥ 70 verde, ≥ 50 **laranja**, senão vermelho.
  - Título (`:47-48`): ≥ **80** "Excelente", ≥ **60** "Bom Domínio", senão "Revisão Recomendada".
  - Exemplo: uma nota de 65 aparece como "Bom Domínio Conceitual! 👍" com borda amarela e número laranja; uma nota de 55 aparece como "Revisão Recomendada" com o mesmo amarelo e laranja.
  - Status "parcial": badge `.badge-pending` (texto laranja) em `:116` e borda **amarela** na caixa de feedback (`:161`).
- **Impacto:** a mensagem e a cor se contradizem.
- **Requisito:** RNF01.
- **Observação:** trocar os limiares é apresentação (A), mas os valores escolhidos devem ser **combinados com o grupo**, porque mudam o "veredito" exibido.

### A4. Layout fixo da tela de estudo quebra a responsividade ✅ (confirmado rodando o app em 17/11/2026)
- **Onde:** `study_topic.html:54`, com `grid-template-columns: 2fr 1fr` inline, e `study_topic.html:58`, com `height: 620px` inline. A media query `style.css:545-549` não alcança estilos inline.
- **Impacto:** em 375 px, o chat ocupa cerca de 2/3 de uma tela já estreita e a coluna de planos e seminários fica espremida ao lado.
- **Medido:** em 375 px, a página do tópico fica com **578 px de largura** (`document.documentElement.scrollWidth`), com rolagem horizontal; o placeholder do `#chatInput` aparece cortado.
- **Requisito:** RNF02.
- **Cuidado de contrato:** ao tornar responsivo, o `#chatMessages` precisa continuar com **altura limitada** e `overflow-y:auto` (ver [04 §7.2](04-contratos-frontend.md#72-ids-e-classes-usados-pelo-appjs)).

### A5. `.chat-bubble.typing` e `.chat-bubble.error` sem estilo ✅ (confirmado rodando o app em 17/11/2026)
- **Onde:** o JS gera as classes `assistant typing` (`app.js:59`) e `assistant error` (`app.js:75`, `:79`). O `style.css` não tem regra para nenhuma delas.
- **Impacto:** o texto "StudyIA está analisando sua pergunta…" e as mensagens de erro parecem respostas normais do tutor.
- **Medido:** com a resposta do servidor atrasada e depois com a rede cortada, as duas bolhas aparecem com o mesmo fundo branco, a mesma borda e a mesma tipografia de uma resposta comum.
- **Requisito:** RNF03 (indicar que a solicitação está em andamento e informar falhas).
- **Por que é A:** basta adicionar regras CSS para classes que o JS **já gera**. Não muda o JS.

### A6. Emojis como ícones, sem rótulo acessível ✅
- **Onde (exemplos):** botão 🗑️ de excluir só com `title` (`dashboard.html:171-173`); ícones das estatísticas (`dashboard.html:33`, `:43`, `:53`); dos cards (`:69`, `:99`); do histórico (`:145`); botões de `study_topic.html:30`, `:33` e `:37`; avatares 🤖/👤 (`study_topic.html:70`); "⚙️ Configurar IA" e "👤" na navbar (`base.html:27`, `:30`).
- **Impacto:** o leitor de tela anuncia o nome do emoji ("cesto de lixo", "robô"), e o botão de excluir não tem nome acessível confiável.
- **Requisito:** RNF10.
- **Observação:** o avatar das mensagens novas é gerado pelo JS (`app.js:95`); mudar isso é escopo B.

### A7. Fonte carregada e não usada ✅
- **Onde:** `base.html:11` carrega **Plus Jakarta Sans** (5 pesos) junto com a Inter. O CSS só usa Inter (`style.css:68-69`).
- **Impacto:** pequeno. O navegador só baixa os arquivos de fonte das famílias que o CSS usa, então os arquivos da Plus Jakarta Sans **não são baixados** (verificado rodando o app em 17/11/2026: só as faces da Inter carregam). O custo real é o CSS extra do Google Fonts (as declarações `@font-face` da família não usada) em toda página.
- **Requisito:** RNF03 (desempenho).

### A8. Aparência do aviso de modo demo ✅ (contraste confirmado em 17/11/2026)
- **Onde:** banner do dashboard (`dashboard.html:20-25`, todo inline, texto `orange-500` sobre `yellow-50`); nota no chat (`app.js:118`, inline no JS); aviso de transparência no rodapé (`base.html:81-84`).
- **Impacto:** cada aviso tem um visual diferente. O contraste do banner é **3,36:1** (`#dd6b20` sobre `#fffff0`), abaixo do mínimo AA de 4,5:1 para texto normal.
- **Requisito:** RNF06.
- **Limite do escopo:** a **aparência** do banner e do rodapé é A. **Quando** o aviso aparece depende do backend (`has_custom_key`, `is_simulated`, ver C). A nota do chat está dentro do JS (B).

---

## B. Comportamento do frontend (documentar e decidir com o grupo)

### B1. Feedback por questão do seminário nunca aparece ✅ (confirmado rodando o app em 17/11/2026)
- **Onde:** `seminar_view.html:98-104`. O `{% set feedback_item = fi %}` fica dentro de `{% for fi in ... %}`. No Jinja2, uma atribuição feita dentro de um loop não é visível fora dele, então `feedback_item` continua `None`.
- **Impacto:** depois da avaliação, os badges "✓ Correta / ~ Parcial / ✗ Precisa Rever" (`:112-120`) e o bloco "Retorno da IA" (`:160-164`) não são exibidos. Só o resumo geral aparece.
- **Medido:** seminário respondido e avaliado em modo demo: a página do resultado tem **0** blocos "Retorno da IA", e o único badge é o "Finalizado" do título.
- **Requisito:** F11 (respostas e retorno).
- **Por que não é só visual:** é escopo de variável na lógica do template. A correção usual (`namespace()`) muda o que a página exibe.

### B2. XSS na renderização do chat ✅ (por leitura; não testado)
- **Onde:** `study_topic.html:78`, `{{ msg.content | replace('\n', '<br>') | safe }}`, imprime o conteúdo sem escapar. `marked.parse()` (`app.js:38`, `:112`) gera HTML sem sanitização.
- **Impacto:** HTML ou script presente numa mensagem (digitada pelo usuário, gerada pela IA ou ecoado de um arquivo enviado) é interpretado pelo navegador.
- **Requisito:** RNF04, RNF05.
- **Por que não é só visual:** é segurança. A correção muda o pipeline de renderização e provavelmente adiciona uma dependência (por exemplo, DOMPurify).

### B3. `fetch` sem checar `response.ok` ✅
- **Onde:** `app.js:63-76` (chat) e `app.js:153-176` (checklist).
- **Impacto:** se o salvamento da tarefa falhar, a caixa fica marcada na tela, mas não foi gravada, e ao recarregar ela aparece desmarcada. Com a sessão expirada, o chat mostra um erro genérico em vez de pedir login (ver [02-rotas.md](02-rotas.md#login_required-e-as-rotas-json)).
- **Requisito:** RNF03.
- **Por que não é só visual:** é tratamento de erro em JS.

### B4. Sem estado de carregamento e sem proteção contra clique duplo ✅
- **Onde:** os POSTs síncronos com IA: `dashboard.html:79` (novo assunto), `plan_create.html:24` (plano), `study_topic.html:35`, `:138`, `plan_view.html:97` e `seminar_view.html:29` (gerar seminário), e `seminar_view.html:94` (enviar respostas). Também o upload (`dashboard.html:109`), que pode demorar em PDFs grandes, e o chat (`app.js:46-83`), que não desabilita o botão.
- **Impacto:** a página fica parada por vários segundos sem nenhum sinal. Um segundo clique cria **tópicos, planos ou seminários duplicados**.
- **Requisito:** RNF03.
- **Por que não é só visual:** exige JS para desabilitar o botão e trocar o rótulo no submit, o que impede o reenvio.
- **Candidato a entrar no redesign se o grupo aprovar.** O estilo do estado "carregando" pode ser preparado no CSS (A) e ficar pronto para quando o JS for aprovado.

### B5. Modal sem acessibilidade ✅
- **Onde:** `base.html:39-59` e `app.js:4-26`. Faltam `role="dialog"`, `aria-modal` e `aria-labelledby`; o foco não vai para o modal nem fica preso nele; Esc não fecha; o foco não volta ao botão ao fechar.
- **Impacto:** quem navega por teclado ou usa leitor de tela fica perdido atrás do overlay.
- **Requisito:** RNF10.
- **Por que não é só visual:** foco e teclado exigem JS. Trocar para `<dialog>` nativo quebraria o contrato do `style.display` (ver [04 §7.2](04-contratos-frontend.md#72-ids-e-classes-usados-pelo-appjs)).
- **Candidato a entrar no redesign se o grupo aprovar.**

### B6. Exclusão com `confirm()` nativo ✅
- **Onde:** `dashboard.html:170` (`onsubmit="return confirm(...)"`).
- **Impacto:** a caixa de diálogo do navegador destoa do resto da interface, mas funciona.
- **Requisito:** RNF01.
- **Por que não é só visual:** substituir exige um componente de confirmação em JS.
- **Candidato a entrar no redesign se o grupo aprovar.**

### B7. Upload acima de 10 MB sem validação no cliente ✅
- **Onde:** `dashboard.html:112` (input file sem checagem de tamanho); o limite fica em `app.py:26`.
- **Impacto:** o usuário espera o envio inteiro e recebe a página crua de erro 413 do Flask (a página é C).
- **Requisito:** RNF09.
- **Por que não é só visual:** exige JS (`file.size`) antes do submit.
- **Candidato a entrar no redesign se o grupo aprovar.**

### B8. Horário do chat: UTC no histórico × hora local nas mensagens novas ✅
- **Onde:** `study_topic.html:75` (`msg.created_at[11:16]`, UTC do SQLite) e `app.js:100-101` (`new Date()`, hora do navegador). O mesmo vale para as datas `[:10]` e `[:16]`.
- **Impacto:** em Brasília (UTC−3), uma mensagem enviada às 14:00 aparece como 14:00 e, depois de recarregar, como 17:00. Perto da meia-noite, a data do histórico pode mostrar o dia seguinte.
- **Por que não é só visual:** é conversão de dados. Pode ser resolvida no JS ou no backend (C), a combinar.

### B9. Contador de mensagens não é atualizado ✅
- **Onde:** `study_topic.html:62` (`{{ messages|length }}`); o `app.js` não o atualiza.
- **Impacto:** o "💾 N mensagens salvas no banco" fica desatualizado até recarregar a página.
- **Por que não é só visual:** exige JS.

### B10. CDNs sem versão fixa e script morto ✅
- **Onde:** `base.html:87` (`marked` sem versão), `base.html:13` (`lucide@latest`) e `:89-93` (`lucide.createIcons()`, sem nenhum `data-lucide` no projeto). Nenhum dos dois tem SRI (`integrity`).
- **Impacto:** uma nova versão major do `marked` pode mudar a API ou a saída e quebrar o chat sem nenhum commit nosso. O Lucide é baixado à toa. Numa apresentação offline, o Markdown não renderiza (⚠️ não confirmado).
- **Por que não é só visual:** é dependência de runtime usada pelo JS.

### B11. Duplicações ✅
- **Bolha de chat em Jinja e em JS:** `study_topic.html:67-81` e `app.js:86-130`.
- **Form "gerar seminário" repetido 4×:** `study_topic.html:35`, `:138`, `plan_view.html:97` e `seminar_view.html:29`.
- **Dois jeitos de abrir o modal:** listener em `app.js:9-13` e `onclick` inline em `dashboard.html:23`.
- **Estilo da tarefa concluída** definido no template (`plan_view.html:81`, `gray-400`) e no JS (`app.js:167-175`, `#94a3b8` / `inherit`).
- **Aviso de demo** como HTML inline dentro do JS (`app.js:118`).
- **Impacto:** risco de as duas versões divergirem num redesign parcial.
- **Por que não é só visual:** unificar mexe no JS ou cria macros Jinja usadas por várias telas. A macro do form de seminário é só markup, então é **candidata ao redesign se o grupo aprovar**.

---

## C. Backend

Os itens de backend que afetam o que aparece na tela (`is_simulated` descartado, banner de demo baseado só na chave do banco, 413 cru, JSON da IA sem validação, CSRF etc.) estão em [handoff/backend-pendencias.md](handoff/backend-pendencias.md).
