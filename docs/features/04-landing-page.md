# 04 — Landing page

> Índice: [features/README.md](README.md) · Base: commit `69c99ab` · Tamanho: médio (1 PR) · Escopos: **A** (template, CSS, cena) + **B** (JS novo, só da landing) + **C pequeno** (1 linha da rota `/`) · Liderança: **frontend (Renzo)**, com a mudança da rota revisada pela equipe de backend.

## 1. Objetivo

Mostrar uma página de apresentação curta a quem chega ao StudyIA **sem sessão**, antes da tela de login.

- **Problema:** hoje quem abre o endereço do app cai direto num formulário de login (`app.py:57`). Um visitante (um colega, a banca da A3) não sabe o que o StudyIA faz antes de criar uma conta.
- **Valor:** em poucos segundos, a pessoa entende o fluxo (assunto → plano com conteúdo → seminário) e tem um caminho claro para "Criar conta" ou "Entrar". A animação (GSAP + Three.js) dá identidade à apresentação sem atrapalhar quem já usa o app: quem está logado continua indo direto para o dashboard.

## 2. Como funciona hoje

### Rota e navegação

| O quê | Onde | Observação |
|---|---|---|
| Rota `/` (`index`) | `app.py:53-57` | **só redireciona**: com sessão → `dashboard` (`:55-56`); sem sessão → `login` (`:57`). Não renderiza template nenhum |
| Decorador `login_required` | `app.py:32-39` | sem sessão, `flash` + redirect para `login` (`:37`). **Não muda** com a landing |
| Logout | `app.py:131-135` | redireciona para `login` (`:135`) |
| Login (GET) | `app.py:108-129` | renderiza `login.html` (`:129`) |
| Cadastro (GET) | `app.py:59-106` | renderiza `register.html` (`:106`) |
| Endpoints para os CTAs | já existem | `url_for('register')` (usado em `login.html:30`) e `url_for('login')` (usado em `register.html:45`). A landing reaproveita os dois; **nenhuma rota nova** |
| Link da marca | `base.html:48` | com sessão → `dashboard`; sem sessão → `login`. Contrato do [04 §7.1](../04-contratos-frontend.md#71-herança-jinja-e-estrutura-do-basehtml) ("Link da marca") |
| Endpoint `index` na lista do `url_for` | [04 §7.1](../04-contratos-frontend.md#71-herança-jinja-e-estrutura-do-basehtml) | já está na lista; nenhum template o usa hoje |

### Testes

| O quê | Onde | Observação |
|---|---|---|
| Acesso à `/` | — | **o `test_app.py` não acessa a `/`** (conferido com `grep`). O fluxo começa em `POST /register` (`test_app.py:25-33`) e segue o redirect para o dashboard |
| Impacto da mudança | — | **nenhum teste existente quebra.** Entram 2 testes novos (§5.1) |

### Estrutura que a landing herdaria do `base.html`

| O quê | Onde | Observação |
|---|---|---|
| Blocos | `base.html:6` (`title`), `:109` (`content`) | **não existe** bloco `head`/`scripts` ([04 §7.1](../04-contratos-frontend.md#71-herança-jinja-e-estrutura-do-basehtml)); criar um novo é permitido, desde que os dois atuais continuem |
| `<main class="container">` | `base.html:108`, `style.css:238-242` | largura máxima `--container-max` (1200 px, `tokens.css:165`) e respiro lateral `--gutter` (`tokens.css:166`) |
| Navbar sem sessão | `base.html:47-67` | só a marca (a `.nav-user` está dentro do `{% if %}`, `:54`). Depois da [02](02-tema-claro-escuro-dispositivo.md), o seletor de tema fica **fora** da condição e aparece aqui também |
| Rodapé RNF06 | `base.html:113-116` | a landing herda o aviso de transparência sobre o uso de IA |
| Dependências por CDN | `base.html:9-11` (Google Fonts), `:16` (`lucide@latest`), `:119` (`marked` sem versão) | [B10](../05-achados-frontend.md): sem internet, a fonte cai para o fallback, o Lucide e o `marked` não carregam (o `lucide.createIcons()` é protegido por `if (window.lucide)`, `:122`, e não gera erro). A landing não usa o `marked` |
| `app.js` | `base.html:120` | carregado em toda página; na landing, nenhum dos seletores dele existe e os blocos checam `null` (ver [01 §2, Armadilha 1](01-remover-configurar-ia.md#2-como-funciona-hoje)) |
| Movimento reduzido | `style.css:2101-2115` | a regra global zera `animation` e `transition` do **CSS**, mas **não alcança animações feitas em JS** (GSAP, `requestAnimationFrame` do Three.js). A landing precisa tratar isso no próprio JS (§5.7) |
| Cache dos estáticos | `app.py:27` | `SEND_FILE_MAX_AGE_DEFAULT = 0`: o navegador revalida todo estático a cada visita. Pesa no orçamento da landing (§5.6) |
| Compressão | `Procfile` (`gunicorn app:app`), `requirements.txt` | não há gzip/brotli configurado: o Flask serve os bytes **sem compressão**. O tamanho que conta é o do arquivo em disco |
| Pasta `static/vendor/` | — | não existe; hoje há só `static/css`, `static/js` e o `favicon.svg` |

## 3. Como deve funcionar

1. Um visitante **sem sessão** abre `/` e vê a landing (não é mais redirecionado ao login).
2. A landing é **curta**, uma rolagem em desktop e poucas no celular: hero com a cena 3D e a proposta de valor, "Como funciona" em 3 passos, chamada final e rodapé.
3. Há sempre dois caminhos visíveis: **"Criar conta"** (ação principal, vai para `register`) e **"Entrar"** (vai para `login`).
4. ~~A navbar mostra a marca e o **seletor de tema** ([02](02-tema-claro-escuro-dispositivo.md)), e a landing aparece no tema escolhido.~~ ⚠️ substituído: a landing é **sempre escura** e **sem seletor** (decisão 1 do rebrand, §4).
5. Quem **já está logado** e abre `/` vai direto para o dashboard, como hoje.
6. **Sem WebGL, com movimento reduzido, no celular ou sem JavaScript**, a página continua completa e legível, com uma ilustração estática no lugar da cena.
7. **Sem internet** (apresentação offline), a landing abre e anima, porque GSAP e Three.js vêm de `static/vendor/`.
8. Login, cadastro, `login_required` e todas as outras telas continuam iguais.

## 4. Decisões do grupo

- ✅ **Decidido:** uma landing page **curta**, mostrada **antes** da tela de login, para visitantes **sem sessão**.
- ✅ **Decidido:** animações com **GSAP** e **Three.js**.
- ✅ **Decidido:** quem já está logado continua indo **direto para o dashboard**.
- ~~✅ **Decidido:** o **seletor de tema** ([02](02-tema-claro-escuro-dispositivo.md), decisão "onde aparece") aparece também na landing.~~ ⚠️ substituído em 24/11/2026: landing sempre escura, sem seletor (decisão 1 do rebrand, abaixo).

✅ **Aprovado pelo Renzo** (eram 💡 propostas deste doc):

1. **Template:** o `landing.html` **estende o `base.html`**, que ganha 3 blocos novos **vazios** por padrão: `head_extra`, `nav_extra` e `scripts_extra` (§5.2). ⚠️ O `scripts_extra` **já entrou no PR 3** (login e cadastro, 24/11/2026), no lugar previsto aqui (depois do `app.js`); o PR da landing cria só o `head_extra` e o `nav_extra`.
2. **Three.js só no desktop:** abaixo de 768 px, com toque (`pointer: coarse`), sem WebGL ou com `prefers-reduced-motion: reduce`, a cena **não é baixada** e fica a ilustração em **SVG estático** (§5.5, §5.6, §5.7).
3. **Meta de Lighthouse no celular:** **Desempenho ≥ 90**, **Acessibilidade ≥ 95**, **CLS = 0** (§9).
4. **Link da marca sem sessão** (`base.html:48`) passa a ir para a **landing** (`index`) em vez do `login`. Isso muda o contrato "Link da marca" do [04 §7.1](../04-contratos-frontend.md#71-herança-jinja-e-estrutura-do-basehtml), registrado no §7 (§5.2).
5. **Texto do passo 2:** "**Plano de estudos com tarefas**" até o 4b da [03](03-conteudo-do-plano.md) entrar; depois, "Plano com conteúdo" (§5.4).
6. **Fonte offline:** sem internet, a landing usa a fonte de **fallback** (`system-ui`). Vendorizar a fonte fica para o **PR do [B10](../05-achados-frontend.md)**, não para este (§8, §11).
7. **Logout** continua indo para o **login** (`app.py:135`), sem mudança extra no backend (§5.1).

⚠️ **Continua dependendo do ok da equipe de backend:** a mudança da rota `/` (`app.py:57`, §5.1). É a única linha de Python do PR da landing.

### ✅ Decidido pelo grupo depois da especificação (rebrand azul, 24/11/2026)

Estas decisões vieram com o [rebrand azul](../06-padroes-visuais.md#8-identidade-azul-rebrand) (PR `feat/rebrand-azul`) e **substituem** o que for diferente nas seções abaixo. Onde o texto antigo conflita, ele foi marcado com "⚠️ substituído".

1. ✅ **Landing SEMPRE ESCURA, sem seletor de tema.** Ela usa os tokens do tema escuro, qualquer que seja a escolha salva ou o sistema, e o seletor não aparece nela. Muda, só para a landing, a decisão "onde aparece" da [02 §4](02-tema-claro-escuro-dispositivo.md#4-decisões-do-grupo) (o seletor continua no login, no cadastro e nas telas logadas). A escolha salva no navegador não é alterada pela landing.
2. ✅ **Páginas separadas:** landing (`/`), login e cadastro, cada uma com o seu template. A landing não embute o formulário de login.
3. ✅ **Cena 3D: o cérebro do logo no centro, com 6 conceitos orbitando como satélites:** livro, chapéu de formatura, lâmpada, gráfico de crescimento, camadas e notebook. Substitui a ideia "Caderno quieto em 3D" do §5.5. A ilustração estática (celular, sem WebGL, movimento reduzido, sem JS) é a mesma composição parada.
4. ✅ **4 benefícios, só na landing** (substituem os 3 do §5.4, parte 2):
   - "Inteligência Artificial para estudar melhor"
   - "Conteúdo amplo e organizado" (no lugar de "confiável", que contradiz o aviso de transparência do RNF06: a IA pode errar e o conteúdo deve ser revisado)
   - "Estudos estruturados por temas"
   - "Conhecimento na prática"
5. ✅ **Inter nos títulos da landing** (variável, peso 500, tracking ≈ −0,04em). O corpo de texto continua na Atkinson Hyperlegible Next. O arquivo da Inter vai em `static/vendor/fonts/` (OFL, sem CDN), com nome de família próprio, separado do subconjunto do wordmark (`Inter Wordmark`, só "StudyIA", que entrou no rebrand).
6. ✅ **Login e cadastro** com **olho de mostrar senha** e o **rodapé RNF06**, **sem os benefícios** (que ficam só na landing). É o PR 3 da sequência até 01/12 (rebrand → correções rápidas → login/cadastro → landing), branch `feat/login-cadastro`.
   - ~~🔍 Em análise: o painel do login com o cérebro pequeno em SVG × sem ele.~~ ✅ **Decidido no PR 3 (24/11/2026), depois de ver as duas versões montadas:** **nem o layout dividido nem o cérebro.** Login e cadastro usam o **card centralizado** (com o símbolo do logo acima, a partir de 768 px) sobre um **fundo de rede neural animada em canvas 2D**. A versão com o cérebro em SVG estático ao lado do card foi descartada.
7. ✅ **O cérebro é EXCLUSIVO da landing** (decisão do PR 3, 24/11/2026): o cérebro em 3D, com movimento e com as redes neurais em movimento ao redor (decisão 3), só aparece na landing. **Login e cadastro não têm ilustração:** só o fundo de rede neural em canvas 2D (`static/js/neural-bg.js`, sem Three.js), padrão visual no [06 §9](../06-padroes-visuais.md#9-telas-de-autenticação-login-e-cadastro).
   - **Reaproveitável na landing:** o `neural-bg.js` cria o próprio `<canvas class="neural-bg">` em tela cheia, atrás da página, e não depende de nada do login. A landing pode carregá-lo pelo `scripts_extra` como **camada de fundo** atrás da cena 3D ou como **fallback** onde a cena não é baixada (celular, sem WebGL, movimento reduzido: §5.6, §5.7). Precisa do CSS `.neural-bg` / `.neural-bg-active` (hoje no bloco de autenticação do `style.css`; se a landing usar, mover para um bloco comum).

### ✅ Implementação (Fases 1 e 2, 24–25/11/2026)

As duas fases foram implementadas e aprovadas pelo Renzo: a **Fase 1** (rota, template, CSS, Inter, cérebro em SVG, GSAP) e a **Fase 2** (o cérebro em 3D com Three.js, a partir de um modelo real). As decisões tomadas na implementação (textos finais, "sempre escura" com `data-theme-lock`, hero em tela cheia, "Como funciona" com prints reais, remoção do Lucide, o modelo "Brain" em CC BY 4.0, a rede densa com a anatomia, a entrada sem SVG no desktop etc.) estão no [§12](#12-registro-da-implementação) e **valem sobre as seções 5 a 9** onde forem diferentes.

## 5. Proposta técnica

> 💡 **Proposta — validar com a equipe**, exceto o que o §4 marca como ✅ aprovado pelo Renzo. Mantém o stack (Flask + Jinja + CSS puro + JS puro, sem build step). GSAP e Three.js entram como arquivos estáticos versionados, não como CDN.

### 5.1 Rota `/` (backend pequeno — ⚠️ precisa do ok da equipe de backend)

Muda **1 linha** do `app.py` (`:57`):

```python
# app.py:53-57 (proposta)
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))   # :55-56, sem mudança
    return render_template('landing.html')      # :57, era: return redirect(url_for('login'))
```

- **Não muda:** `login_required` (`app.py:37`) continua mandando para o `login`. Quem tenta abrir uma página protegida sem sessão vai para o formulário, não para a landing. É o comportamento esperado: essa pessoa já quer entrar.
- **Logout** (`app.py:135`): ✅ **aprovado pelo Renzo** (§4, decisão 7): continua indo para o `login`. Mudar para a landing seria outra linha de backend, sem ganho claro.
- **Testes novos no `test_app.py`:**
  1. `GET /` sem sessão → `200` e um texto da landing no HTML (por exemplo, o título do hero). Esse texto entra na tabela de textos testados do [04 §7.5](../04-contratos-frontend.md).
  2. `GET /` com sessão (depois do `POST /register`) → `302` para `/dashboard`.
- **Testes existentes:** nenhum muda, porque nenhum acessa a `/`.
- **Segurança:** a landing não tem formulário nem dado do usuário; não entra rota POST nova e não piora o [handoff §12](../handoff/backend-pendencias.md#12-ausência-de-csrf) (CSRF).

### 5.2 Template `landing.html`: estender o `base.html` ou layout próprio

> ✅ **Aprovado pelo Renzo** (§4, decisão 1): opção **A**. A tabela fica como registro das alternativas.

| Opção | Como | Prós | Contras |
|---|---|---|---|
| **A. Estender o `base.html` com blocos novos vazios** (✅ aprovada pelo Renzo) | `landing.html` faz `{% extends "base.html" %}` e preenche `title`, `content` e 3 blocos novos, todos **vazios por padrão** no `base.html`: `{% block head_extra %}` (no `<head>`, depois do CSS), `{% block nav_extra %}` (na navbar, ao lado do seletor de tema) e `{% block scripts_extra %}` (no fim do `<body>`, **depois** do `app.js`) | herda de graça o script anti-FOUC, os tokens, o seletor de tema, o sprite de ícones, os flashes e o rodapé RNF06: **uma** fonte da verdade para o tema; as outras 7 telas não mudam (blocos vazios); o [04 §7.1](../04-contratos-frontend.md#71-herança-jinja-e-estrutura-do-basehtml) permite blocos novos | a landing carrega também o `app.js` e o `marked` (inofensivos, mas são bytes à toa); a navbar precisa acomodar os links da landing |
| B. Layout próprio | `landing.html` é um HTML completo, sem `extends` | controle total do `<head>` e da navbar; nada de `app.js`/`marked` | **duplica** o `<head>`, o script anti-FOUC da 02 (que **não pode** divergir), o seletor de tema, o sprite e o rodapé; quem mudar o `base.html` precisa lembrar da landing; o 04 diz que "os 7 templates estendem o `base.html`" e esse passaria a ser o 8º sem estender |

Motivo da escolha de **A**: a duplicação do anti-FOUC e do seletor é o risco maior da opção B: o tema piscaria só na landing, ou o seletor mudaria numa página e não na outra.

**Navbar na landing (opção A):**

- marca + seletor de tema (herdados) + `{% block nav_extra %}` com **"Entrar"** (link discreto, `btn-ghost`) e, a partir de 640 px, **"Criar conta"** (`btn-primary btn-sm`). Abaixo de 640 px, só "Entrar", para caber em 375 px junto da marca e do seletor (mesma conta de espaço da [02 §5.6](02-tema-claro-escuro-dispositivo.md#56-seletor-na-navbar)); o "Criar conta" fica no hero.
- **Link da marca** (`base.html:48`), ✅ **aprovado pelo Renzo** (§4, decisão 4): sem sessão, passa a apontar para `index` (a landing) em vez de `login`. É troca de destino de `url_for` dentro da expressão que já existe, sem lógica nova, mas **muda um contrato** do [04 §7.1](../04-contratos-frontend.md#71-herança-jinja-e-estrutura-do-basehtml) ("Link da marca"). No login e no cadastro, a marca passa a levar de volta à landing.

**Largura:** o conteúdo fica dentro do `<main class="container">` (1200 px). ⚠️ **Não** usar a técnica de "sangrar" o hero com `width: 100vw` / `margin-inline: calc(50% - 50vw)`: o `100vw` inclui a barra de rolagem e gera **rolagem horizontal** no Windows. Se o hero precisar ocupar a largura toda, a alternativa é um 4º bloco (`{% block main_class %}container{% endblock %}`) no `<main>`, decidido no PR.

### 5.3 GSAP e Three.js só na landing, versões fixas em `static/vendor/`

**Regra:** GSAP e Three.js são carregados **só** no `landing.html`, pelos blocos `head_extra`/`scripts_extra`. **Nunca** no `base.html`: as outras telas não pagam esse peso.

**Versões e licenças** (conferidas no registro do npm e no site do GSAP em 22/11/2026):

| Biblioteca | Versão sugerida | Publicada em | Licença | Arquivos | Tamanho (sem compressão) |
|---|---|---|---|---|---|
| GSAP (core) | **3.15.1** | 04/11/2026 | **"Standard 'No Charge' GSAP License"** ([gsap.com/standard-license](https://gsap.com/standard-license)) | `dist/gsap.min.js` | ≈ 73 KB |
| Three.js | **0.187.0** (r187) | 30/10/2026 | **MIT** | `build/three.module.js` + `build/three.core.js` | ≈ 2,1 MB sem minificar · ≈ 814 KB minificado |

- **Regra de versão:** fixar uma versão publicada há **pelo menos 2 semanas** no dia do PR. As duas acima já cumprem isso. A versão vai **no caminho** (`static/vendor/gsap/3.15.1/gsap.min.js`), para nunca trocar um arquivo sem trocar a URL.

**Licença do GSAP:**

- A partir da **3.13.0** (30/04/2025, depois da compra da GreenSock pela Webflow), **o GSAP e todos os plugins**, inclusive os que eram pagos (SplitText, MorphSVG, DrawSVG etc.), são **gratuitos**, também para uso comercial, sob a licença "Standard 'No Charge'".
- **Não é MIT nem open source:** a licença proíbe usar o GSAP em ferramentas visuais de animação "no-code" que **concorram com a Webflow**, fazer engenharia reversa para produtos concorrentes e remover os avisos de copyright. O StudyIA não se encaixa em nenhuma das proibições.
- A página de licenciamento não cita projeto acadêmico de forma explícita; a concessão cobre "qualquer site, aplicação web ou interface digital". ⚠️ Conferido no texto da licença em 22/11/2026; reconferir no dia do PR.
- **Plugins sugeridos:** **nenhum**. O core basta para a entrada do hero e a revelação dos 3 passos (disparada por `IntersectionObserver`). O `ScrollTrigger` (≈ 45 KB, mesma licença) só entra se o grupo quiser animação amarrada à rolagem, o que a landing curta não precisa.

**Particularidades do Three.js (conferidas na lista de arquivos do pacote 0.187.0):**

- O pacote **não traz mais build UMD nem arquivo minificado oficial**: só **ES modules** (`three.module.js`, que importa `./three.core.js`). Sem build step, o caminho é carregar como módulo nativo do navegador:

  ```html
  {% block scripts_extra %}
  <script type="importmap">
    { "imports": { "three": "{{ url_for('static', filename='vendor/three/0.187.0/three.module.js') }}" } }
  </script>
  <script src="{{ url_for('static', filename='vendor/gsap/3.15.1/gsap.min.js') }}" defer></script>
  <script type="module" src="{{ url_for('static', filename='js/landing.js') }}?v=landing_v1"></script>
  {% endblock %}
  ```

- **Minificado:** para não servir 2,1 MB, copiar para o vendor as versões minificadas que o jsDelivr gera (Terser) dos **dois** arquivos, **mantendo os nomes** `three.module.js` e `three.core.js`, porque o módulo importa `./three.core.js` pelo nome (conferido no arquivo minificado). Registrar a URL de origem e a data num `static/vendor/README.md`. É uma cópia única de arquivo, não um build step.
- **Sem tree-shaking:** sem bundler, o navegador baixa o Three.js inteiro (≈ 814 KB minificado) mesmo que a cena use 5 classes. Por isso ele é carregado **sob demanda**, só quando a cena vai rodar (§5.6).

**Cruzamento com o [B10](../05-achados-frontend.md) (CDNs sem versão fixa):** a landing **inaugura** o padrão `static/vendor/<lib>/<versão>/`. O mesmo padrão é a proposta do B2 na [03 §5.6](03-conteudo-do-plano.md#56-segurança) (DOMPurify) e pode resolver o `marked` e, no futuro, a fonte. A landing **não** mexe nas CDNs do `base.html`: isso é do PR do B10.

### 5.4 Estrutura da página

Curta, com 5 partes. Os textos são ponto de partida, em sentence case e sem emojis (D11 da sprint 01).

| # | Parte | Conteúdo | Componentes |
|---|---|---|---|
| 1 | **Hero** | `<h1>` com a proposta de valor (ex.: "Estude qualquer assunto com um plano feito para você"); 1 frase de apoio (ex.: "Escolha um tema ou envie seu material. O StudyIA explica, organiza um plano de estudos com tarefas e testa o que você aprendeu."; mesma regra do passo 2, abaixo); CTAs **"Criar conta"** (`btn-primary`, `url_for('register')`) e **"Já tenho conta"** (`btn-secondary`, `url_for('login')`); ao lado (desktop) ou abaixo (celular), a cena 3D ou a ilustração estática | tokens de tipografia; `.btn` da sprint 01 |
| 2 | **Proposta de valor** | ⚠️ substituído: **4 benefícios** (decisão 4 do rebrand, §4). Texto original: 3 benefícios curtos, sem cards genéricos de ícone + título + parágrafo: fiel ao seu material (modo arquivo), no seu tempo (minutos por dia), com transparência sobre o uso de IA (RNF06) | lista simples com ícones do sprite |
| 3 | **Como funciona** | 3 passos numerados: **1. Assunto ou arquivo** → **2. Plano de estudos com tarefas** (vira "Plano com conteúdo" depois do 4b) → **3. Mini seminário com nota** | `<ol>` semântica; revelação suave com GSAP (§5.7) |
| 4 | **Chamada final** | 1 frase + os mesmos 2 CTAs | — |
| 5 | **Rodapé** | o rodapé RNF06 herdado do `base.html` (`:113-116`) | — |

- ✅ **Texto do passo 2, aprovado pelo Renzo** (§4, decisão 5): "plano **com conteúdo**" só é verdade depois do 4b da [03](03-conteudo-do-plano.md), e a landing corre em paralelo e pode entrar antes. Por isso, até o 4b entrar, o passo 2 (e a frase de apoio do hero) usa "**Plano de estudos com tarefas**". O texto troca para "Plano com conteúdo" no PR do 4b (ou no primeiro PR depois dele).
- **Nada de seções extras** (depoimentos, preços, FAQ, logos): o projeto é acadêmico e a landing é curta por decisão.

### 5.5 Cena Three.js: "Caderno quieto" em 3D

> ⚠️ **Substituído (rebrand, 24/11/2026):** a cena passa a ser o **cérebro do logo em 3D com 6 conceitos orbitando como satélites** (decisão 3 do rebrand, §4), na paleta azul escura. Continuam valendo as regras de desempenho (§5.6), de acessibilidade (§5.7), a interação mínima e a ilustração estática equivalente. O texto abaixo fica como registro da proposta original.

**Ideia:** pontos soltos (conceitos) flutuam devagar e, aos poucos, **assentam-se sobre as linhas pautadas de um caderno**, ligando-se em pequenos grupos por traços finos. A cena conta o que o app faz (do caos à organização) sem ilustrar literalmente "IA".

- **Coerente com a D1 da sprint 01 ("Caderno quieto"):** cor só no acento (`--color-accent`) para os pontos já organizados; neutros (`--color-border`, `--color-text-subtle`) para as linhas e os pontos soltos; fundo transparente sobre `--color-bg`.
- **Discreta:** `Points` + `LineSegments` com `PointsMaterial`/`LineBasicMaterial`, **sem luzes, sombras, texturas ou pós-processamento**; ≤ 1.500 pontos; movimento lento (um ciclo ≥ 8 s), sem loop frenético.
- **Interação mínima:** no máximo uma inclinação de até 3° seguindo o ponteiro, só com `pointer: fine` e sem movimento reduzido.
- **Evitar o "showcase genérico":** nada de galáxia de partículas, globo girando, logotipo 3D, brilho (bloom), gradiente roxo ou cubo de vidro. Se a cena puder estar em qualquer site de IA, está errada.
- **Ilustração estática equivalente:** um SVG inline com o **estado final** da cena (pontos assentados nas linhas), nas mesmas cores de token. É o pôster antes de a cena carregar e a alternativa sem WebGL, com movimento reduzido, no celular e sem JS (§5.6, §5.7). Como a cena começa pela composição do SVG, a troca não dá salto visual.

### 5.6 Desempenho

| Medida | Como |
|---|---|
| **Pixel ratio limitado** | `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))`; `antialias` desligado quando o DPR já é ≥ 2 |
| **Pausar fora da tela** | `IntersectionObserver` no contêiner do canvas: fora da viewport, o `setAnimationLoop(null)` para a renderização |
| **Pausar com a aba oculta** | `visibilitychange`: com `document.hidden`, parar o loop; voltar ao reaparecer |
| **Versão leve no celular** (✅ aprovado pelo Renzo, decisão 2) | abaixo de 768 px **ou** com `pointer: coarse`, o Three.js **não é baixado**: fica o SVG estático, e o GSAP anima só a entrada do texto. Motivo: ≈ 814 KB sem compressão em rede móvel não se pagam numa página curta |
| **Sem WebGL** (✅ decisão 2) | detectar com `canvas.getContext('webgl2') \|\| canvas.getContext('webgl')`; sem contexto (ou se o `import()` falhar), fica o SVG, sem erro no console |
| **Carregamento sob demanda** | o Three.js entra por `import('three')` **só** depois do evento `load` (ou num `requestIdleCallback`), e só se as condições acima permitirem. Nunca bloqueia a primeira pintura |
| **Sem salto de layout** | o contêiner da cena tem `aspect-ratio` fixo, e o SVG ocupa o mesmo espaço: CLS = 0 |
| **LCP é texto** | o maior elemento da primeira dobra é o `<h1>`, nunca o canvas |
| **Liberar memória** | `renderer.dispose()` e `geometry.dispose()` no `pagehide` |

**Orçamento de peso (sem compressão, porque o Flask não comprime, §2):**

| Parte | Teto |
|---|---|
| Primeira carga, **sem** o Three.js (HTML + CSS do app + `landing.js` + GSAP core) | **≤ 300 KB**, dos quais ≈ 73 KB são do GSAP |
| `landing.js` (cena + animações) | ≤ 15 KB |
| Three.js, carregado sob demanda e **só no desktop** | ≤ 850 KB (os 2 arquivos minificados) |
| Imagens | **nenhuma** (a ilustração é SVG inline) |

- ⚠️ **Cache desligado:** com `SEND_FILE_MAX_AGE_DEFAULT = 0` (`app.py:27`), o navegador revalida o Three.js a cada visita (resposta `304` se não mudou, mas ainda com uma ida e volta por arquivo). Como os caminhos do vendor são **versionados**, eles poderiam ter cache longo. Mudar isso é backend e não entra neste PR: fica registrado como futuro (§11).

### 5.7 Acessibilidade

- **Movimento reduzido** (✅ decisão 2): com `prefers-reduced-motion: reduce`, o Three.js **não é carregado** (fica o SVG estático) e o GSAP **não anima** nada (`gsap.matchMedia()` com a condição `(prefers-reduced-motion: no-preference)` em volta de toda animação). A regra global do `style.css:2101-2115` não alcança o JS, então isso precisa estar no `landing.js`.
- **Sem JavaScript:** todo o conteúdo está no HTML e aparece completo. **Regra:** nenhum elemento começa escondido no CSS. A animação de entrada usa `gsap.from()` (o estado final é o natural do HTML); se o JS falhar no meio, nada fica invisível. Se algum estado inicial precisar de CSS, ele só vale sob a classe `js` no `<html>`, que o script anti-FOUC da [02 §5.3](02-tema-claro-escuro-dispositivo.md#53-anti-fouc-script-inline-mínimo-no-head) aplica.
- **Contraste AA** nos dois temas: texto ≥ 4,5:1; texto grande, ícones informativos e bordas ≥ 3:1. Só tokens semânticos, nenhum `#hex` novo.
- **Canvas decorativo:** `<canvas aria-hidden="true">`, fora da ordem do Tab, sem nenhuma informação que não esteja no texto. O SVG estático também leva `aria-hidden="true"`.
- **Estrutura:** um único `<h1>` (hero) e `<h2>` para as seções; "Como funciona" numa `<ol>`; os CTAs são **links** (`<a>`, porque navegam), com alvo ≥ 44 px e anel de foco visível.
- **Nada piscando** mais de 3 vezes por segundo; nenhuma animação passa de ~1 s na entrada.

### 5.8 Dois temas

> ⚠️ **Substituído (rebrand, 24/11/2026):** a landing é **sempre escura** e **sem seletor** (decisão 1 do rebrand, §4). Na prática: o `landing.html` força os tokens escuros só nele (por exemplo, `data-theme="dark"` fixo no próprio template ou uma classe de escopo; a forma exata fica para o PR 4, sem tocar na chave `studyia-theme` do `localStorage`). A cena não precisa reagir à troca de tema. O texto abaixo fica como registro.

- A landing usa **só os tokens semânticos**, então herda o claro e o escuro da [02](02-tema-claro-escuro-dispositivo.md) sem CSS próprio por tema.
- **A cena reage ao tema:** o `landing.js` lê as cores dos tokens com `getComputedStyle(document.documentElement)` e as relê quando o tema muda: `MutationObserver` no atributo `data-theme` do `<html>` (escolha manual) + `matchMedia('(prefers-color-scheme: dark)')` com o evento `change` (modo Dispositivo). Depois de trocar as cores dos materiais, basta 1 quadro renderizado, mesmo com o loop pausado.
- O SVG estático usa `currentColor` e variáveis CSS, então troca de tema sozinho.
- **Depende da 02:** sem os tokens escuros e o seletor fora da condição de sessão, a landing nasceria só clara. Por isso ela vem **depois** do passo 3 ([ordem](README.md#ordem-de-implementação--decidido)).

### 5.9 Skills de referência (para o PR de implementação)

| Skill | Para quê |
|---|---|
| **frontend-design** | direção estética e tipografia do hero |
| **taste-skill** (`design-taste-frontend`) | o capítulo de **landing page**, que a sprint 01 deixou de fora ("piso de imagens e de animações vale para landing pages", [sprint 01, pendências](../sprints/sprint-01-redesign-visual.md#pendências-fora-do-escopo)) e agora se aplica; evitar a cara de landing genérica de IA |
| **emil kowalski** (`emil-design-eng`) | curvas, durações e entrada das animações; o que **não** animar |
| **apple-design** | clareza, hierarquia, alvos de toque e movimento reduzido |

Prioridade em conflito, como na sprint 01: contratos > acessibilidade visual > taste/frontend-design > o resto.

## 6. Impacto por camada

| Camada | O que muda |
|---|---|
| **Backend** (`app.py`) | **1 linha:** `app.py:57`, `redirect(url_for('login'))` → `render_template('landing.html')`. Nada mais |
| **Banco** | nada |
| **Templates** | novo `templates/landing.html` (estende o `base.html`); `base.html`: 2 blocos novos **vazios** (`head_extra`, `nav_extra`; o `scripts_extra` já entrou no PR 3) e o link da marca sem sessão apontando para `index` (`:48`). Nenhum outro template muda |
| **CSS** | estilos da landing (hero, passos, contêiner da cena), só com tokens. 💡 Num arquivo próprio, `static/css/landing.css`, carregado pelo `head_extra`: as outras telas não baixam esse CSS. Subir o `?v=` |
| **JS** | novo `static/js/landing.js` (módulo ES): cena, animações, pausas, troca de tema. Não depende do `app.js`, e o `app.js` não depende dele |
| **Vendor** | nova pasta `static/vendor/` com `gsap/3.15.1/gsap.min.js`, `three/0.187.0/three.module.js` e `three.core.js` (minificados) e um `README.md` com origem, versão, data e licença |
| **Testes** | 2 testes novos para a `/` (§5.1); nenhum existente muda |
| **Docs** | `docs/02-rotas.md` (a `/` passa a renderizar); `docs/03-frontend-inventario.md` (template, JS, CSS e vendor novos); `docs/04` (§7.1: blocos novos, link da marca; §7.5: texto novo testado); `docs/06` (componentes da landing); `docs/05` (B10: o vendor como padrão) |

## 7. Contratos afetados ([docs/04](../04-contratos-frontend.md))

| Contrato | Seção do 04 | O que acontece |
|---|---|---|
| Blocos `title` e `content` | §7.1 | **intactos.** Entram 3 blocos novos, vazios por padrão (o 04 permite) |
| "Os 7 templates fazem `extends`" | §7.1 | passam a ser 8; o `landing.html` também estende |
| Ordem `marked` → `app.js` | §7.1 | **mantida.** O `scripts_extra` fica **depois** do `app.js` |
| **Link da marca** | §7.1 | **muda** (✅ aprovado pelo Renzo, decisão 4): sem sessão, `base.html:48` passa de `url_for('login')` para `url_for('index')` (a landing); com sessão, continua indo para `dashboard`. No login e no cadastro, a marca leva de volta à landing. O PR da landing atualiza a linha "Link da marca" do 04 §7.1 |
| Condição de sessão da navbar | §7.1 | intacta (o seletor de tema fora do `{% if %}` é da [02](02-tema-claro-escuro-dispositivo.md)). O `nav_extra` só é preenchido pela landing, que nunca é vista com sessão |
| Endpoint `index` | §7.1 | já estava na lista; passa a ser usado (link da marca) |
| Textos do `test_app.py` | §7.5 | os atuais não mudam; entra o texto do hero testado pelo teste novo |
| **Novo contrato** | — | `static/vendor/<lib>/<versão>/`: versão sempre no caminho; trocar a versão = nova pasta + atualizar o template. `three.core.js` precisa manter esse nome (o `three.module.js` o importa por nome) |

## 8. Riscos e armadilhas

- **GSAP/Three.js parar no `base.html`:** todas as telas pagariam ~900 KB. Revisar no PR: o `grep -n "vendor/" templates/` só pode achar o `landing.html`.
- **Conteúdo escondido sem JS:** um `opacity: 0` no CSS esperando o GSAP deixa a página em branco se o JS falhar. Regra de §5.7.
- **Movimento reduzido ignorado:** a regra global do CSS não para o GSAP nem o Three.js. Testar com a emulação do DevTools (Rendering → `prefers-reduced-motion`).
- **Rolagem horizontal em 375 px:** o `100vw` e um canvas com largura fixa são os suspeitos comuns. O canvas segue a largura do contêiner (`ResizeObserver`).
- **Peso em rede móvel:** sem compressão e sem cache longo (§5.6), o Three.js custa caro; por isso ele não carrega no celular.
- **Promessa que o app ainda não cumpre:** o "plano com conteúdo" depende do 4b da [03](03-conteudo-do-plano.md) (§5.4).
- **Licença do GSAP:** não é MIT; não remover o cabeçalho de copyright do `gsap.min.js` e reconferir a licença no dia do PR.
- **Módulo ES e servidor:** o `type="module"` exige que o Flask sirva `.js` como `text/javascript` (padrão do Flask; ⚠️ conferir no deploy) e não funciona abrindo o HTML por `file://` (a apresentação usa o app rodando, então não afeta).
- **Fonte offline:** sem internet, a Atkinson Hyperlegible Next (Google Fonts, `base.html:9-11`) não carrega e a landing usa o fallback `system-ui`. A página funciona, mas com outra fonte. ✅ Aceito pelo Renzo (decisão 6); vendorizar a fonte fica para o PR do B10 (§11).
- **Cache de template:** com o Flask sem debug, reiniciar o servidor ao testar (registrado na sprint 01).

## 9. Critérios de aceite

- [ ] **Visitante sem sessão** vê a landing em `/` (resposta `200`, não redirect).
- [ ] **Logado** em `/` vai para o dashboard (`302` → `/dashboard`).
- [ ] Os CTAs levam ao **cadastro** (`register`) e ao **login** (`login`); a marca, sem sessão, leva de volta à landing.
- [ ] `login_required` continua mandando para o login (abrir `/dashboard` sem sessão → login).
- [ ] **Sem internet** (DevTools → Network → Offline, com o app rodando local): a landing abre, a cena roda e as animações funcionam; só a fonte cai para o fallback.
- [ ] **Sem WebGL** (`chrome://flags` ou `--disable-webgl`): aparece a ilustração estática, sem erro no console.
- [ ] **Movimento reduzido:** nenhuma animação, nenhuma cena 3D, a ilustração estática no lugar, e o Three.js **não** aparece na aba Network.
- [ ] **Sem JavaScript:** todo o texto e os CTAs aparecem e funcionam.
- [ ] **Celular (< 768 px):** o Three.js não é baixado; fica a ilustração estática.
- [ ] **Sem rolagem horizontal** em 375 px (e em 768 e 1440 px).
- [ ] ~~**Dois temas:** Claro, Escuro e Dispositivo aplicam-se à landing, inclusive às cores da cena, e o **seletor de tema** aparece na navbar.~~ ⚠️ substituído: **landing sempre escura**, com qualquer escolha de tema e com o sistema claro; **sem seletor** na navbar dela; a escolha salva continua valendo ao ir para o login.
- [ ] **4 benefícios** com os textos da decisão 4 do rebrand; títulos em **Inter**; cena com o **cérebro e os 6 satélites**.
- [ ] **AA** no tema escuro (o único da landing); canvas e SVG com `aria-hidden="true"`; CTAs com ≥ 44 px e foco visível.
- [ ] **Lighthouse (modo celular, app rodando local, aba anônima; meta ✅ aprovada pelo Renzo, decisão 3):** **Desempenho ≥ 90**, **Acessibilidade ≥ 95**, **CLS = 0**.
- [ ] **Passo 2** diz "Plano de estudos com tarefas" enquanto o 4b não estiver na `main` (decisão 5).
- [ ] **Logout** continua levando ao login (decisão 7).
- [ ] **Orçamento de peso** (§5.6) respeitado, medido na aba Network com o cache desativado.
- [ ] GSAP e Three.js só aparecem no `landing.html` (`grep -rn "vendor/" templates/`).
- [ ] Nenhum `#hex` novo no CSS da landing; nenhum `style=""` inline.
- [ ] `DATABASE_PATH=/tmp/studyia-teste.db python -m unittest test_app.py` passa, com os 2 testes novos da `/`.
- [ ] Docs 02, 03, 04, 05 e 06 atualizados no mesmo PR.

## 10. Divisão em PRs e responsáveis

**Um PR único**, do **frontend (Renzo)**. É o passo 5 da [ordem](README.md#ordem-de-implementação--decidido), em paralelo à [03](03-conteudo-do-plano.md).

**Status (25/11/2026): ✅ concluída — aguardando revisão** (PR aberto, branch `feat/landing-page`, base `main`). O que entrou, por parte (detalhes no [§12](#12-registro-da-implementação)):

| Parte | Escopo | Observação |
|---|---|---|
| ⚠️ **Rota `/` (`app.py`, só a função `index`) + 2 testes** | **C (pequeno)** | **destacada na descrição do PR para a revisão da equipe de backend.** É o único Python do PR, em commit separado (Fase 1) |
| Blocos novos e link da marca no `base.html` | A/B | 5 blocos **vazios por padrão** (`html_attrs`, `head_extra`, `theme_switch`, `nav_extra`, `footer_extra`): as outras telas não mudam |
| `landing.html` + `landing.css` | A | só tokens; o `head_extra` traz o importmap e o script "vai ter 3D?" (Fase 2) |
| `static/vendor/` (GSAP, Inter, Three.js + addon, modelo do cérebro, README) | — | versão no caminho (ou no nome, no modelo); origem, licença e SHA-256 no `static/vendor/README.md` e no `static/vendor/models/brain/README.md` |
| `landing.js` (animações, decisão e montagem da cena) e `landing-scene.js` (a cena 3D) | B (JS novo, só da landing) | aprovado ao decidir a funcionalidade |
| `static/img/landing/` | A | os prints do app em "Como funciona" (Fase 1) |
| Docs 04 (contratos), 05, 06, handoff e este | — | |

**Depende de:** passo 2 ([01](01-remover-configurar-ia.md)) e passo 3 ([02](02-tema-claro-escuro-dispositivo.md)) na `main`: a landing precisa do seletor de tema fora da condição de sessão, do script anti-FOUC e dos tokens escuros. **Não depende** da 03; o único cruzamento é o texto do passo 2 (§5.4).

**Conflito provável:** com o 4a da 03 no `app.py`. As mudanças ficam em funções diferentes (`index` × rotas novas), então o conflito, se houver, é trivial.

## 11. Em aberto / futuro

- **Futuro (✅ decisão 6):** vendorizar também a fonte (Atkinson Hyperlegible Next em `static/vendor/fonts/`), para a apresentação offline ficar idêntica. Mexe no `<head>` do `base.html` e vale para o app inteiro, então entra com o PR do [B10](../05-achados-frontend.md), não neste.
- **Futuro (backend):** cache longo para `static/vendor/` (caminhos versionados), em vez do `SEND_FILE_MAX_AGE_DEFAULT = 0` global (`app.py:27`), e compressão gzip no deploy. Pesa mais depois da Fase 2: no desktop, a cena baixa ≈ 1,08 MB sem compressão (≈ 360 KB com gzip), revalidados a cada visita. Registrado no [handoff §21](../handoff/backend-pendencias.md#21-sem-compressão-gzip-e-sem-cache-para-os-estáticos).
- **Futuro:** trocar o texto do passo 2 para "Plano com conteúdo" quando o 4b da 03 entrar (§5.4).
- **Futuro:** se a cena ficar pesada demais mesmo no desktop, uma versão só com GSAP + SVG animado mantém a ideia sem o Three.js. Isso exigiria rever a decisão do grupo, então só com novo ok.
- **⚠️ Não confirmado (Fase 2):** Safari, Firefox e aparelho físico (celular e tablet reais). Testado no Chromium (Playwright, GPU Intel integrada) e com o Lighthouse. Pedido na descrição do PR para quem revisar.

## 12. Registro da implementação

**Status: ✅ concluída — aguardando revisão** (Fases 1 e 2 aprovadas pelo Renzo em 25/11/2026; PR aberto na branch `feat/landing-page`, base `main`).

### Fase 1: estrutura, conteúdo, rota e GSAP (24–25/11/2026, branch `feat/landing-page`)

✅ **Aprovada pelo Renzo em 25/11/2026**, testada no navegador. A Fase 2 (o cérebro em 3D) está logo abaixo.

#### O que entrou

| Parte | Arquivos | Observação |
|---|---|---|
| Rota `/` | `app.py` (só a função `index`, `:74-78`) | sem sessão → `render_template('landing.html')`; com sessão → redirect para o `dashboard`. `login_required` e logout sem mudança. **Única mudança de Python**, para a revisão da equipe de backend |
| Testes | `test_app.py` (`LandingTestCase`, 2 testes) | anônimo em `/` → 200 com "Transforme qualquer tema em" e os links `/register` e `/login`; logado → 302 para `/dashboard`. Total: 13 testes passando |
| `base.html` | blocos, anti-flash, marca, sprite, CDN | 4 blocos novos **vazios por padrão**: `html_attrs` (no `<html>`), `head_extra` (depois do CSS), `theme_switch` (o padrão é o próprio seletor de tema) e `nav_extra` (na `.nav-actions`). O anti-flash pula o `localStorage` quando o `<html>` tem `data-theme-lock`. Link da marca sem sessão → `index`. Ícones novos no sprite: `chip`, `layers`, `network`, `trophy` (benefícios), `cap`, `bulb`, `chart-up`, `laptop` (satélites), `arrow-down` ("role para explorar"). **Lucide removido** (o `<script>` e o `createIcons()`). `tokens.css`/`style.css` em `?v=landing_v1` |
| `templates/landing.html` | novo | estende o `base.html`; hero, "Como funciona", benefícios, chamada final; o rodapé RNF06 vem do `base.html` |
| `static/css/landing.css` | novo (`?v=landing_v7`) | só tokens semânticos, nenhum `#hex`, nenhum `style=""`; carregado só pelo `head_extra` da landing |
| `static/js/landing.js` | novo (`?v=landing_v3`), script comum com `defer` | animações com GSAP; independente do `app.js`, `theme.js`, `forms.js` e `neural-bg.js` |
| `static/vendor/` | `gsap/3.15.1/` (`gsap.min.js` + `ScrollTrigger.min.js`), `fonts/inter-display-latin*.woff2`, `README.md` | origem, licença e SHA-256 no README. GSAP e Inter só no `landing.html` |
| `static/img/landing/` | 3 prints × (AVIF e WebP em 720 e 1120 + JPEG 1120) | 516 KB no repositório; na página, `loading="lazy"` e `width`/`height` |
| `style.css` | `.neural-bg` | saiu do bloco de autenticação para um bloco comum (login, cadastro e landing) |

#### Decisões aprovadas (24–25/11/2026)

1. **Textos** (sentence case, sem emoji):
   - Título: "Transforme qualquer tema em *aprendizagem estruturada*" (a frase do login; a ênfase em itálico no acento). Substituiu "Estude qualquer assunto com IA" no ajuste de 25/11.
   - Apoio: "Escolha um tema ou envie seu material. O StudyIA explica, monta um plano de estudos com tarefas e testa o que você aprendeu num mini seminário."
   - CTAs: **"Começar agora"** (`register`) e **"Entrar"** (`login`), no hero, na chamada final e na navbar (o "Começar agora" da navbar só a partir de 640 px). Substituem "Criar conta" / "Já tenho conta" do §5.4.
   - "Como funciona": "Do assunto ao seminário, *em três passos*"; passos "Escolha o assunto", "Plano de estudos com tarefas" (decisão 5) e "Mini seminário com nota", com textos ligados aos prints (Fotossíntese, prova de Biologia, 30 min/dia, 5 sessões).
   - Benefícios: "Feito para aprender, *não só para ler*" e os 4 títulos da decisão 4 do rebrand, com os textos de apoio da Fase 1.
   - Chamada final: "Comece pelo assunto da *próxima prova*." + os 2 CTAs.
2. **Sempre escura** com `data-theme="dark" data-theme-lock` no `<html>` (bloco `html_attrs`), entregue pelo servidor: funciona sem JS, o anti-flash não lê a escolha salva e a landing nunca escreve a chave `studyia-theme`. O bloco `theme_switch` fica vazio na landing, então o seletor nem existe no DOM e o `theme.js` sai na primeira linha (sem botão).
3. **`neural-bg.js` como fundo da página inteira**, com `--network-strength: 0.6` (no login é 0,85 no escuro), definido em `:root[data-theme-lock]` no `landing.css`.
4. **Hero em tela cheia** (`min-height: 100svh` menos a navbar), conteúdo centralizado na altura: título, apoio e CTAs à esquerda e o cérebro à direita no desktop; no celular, o cérebro abaixo dos CTAs (375 × 667: os CTAs terminam a 439 px, o cérebro aparece na dobra).
   - **"Role para explorar"** no pé do hero: link real para `#como-funciona`. Some aos poucos ao rolar, como no site da Rosso: o wrapper `[data-hero-hint]` vai de opacidade 1 (rolagem 0) a 0 (20% da altura do hero) com ScrollTrigger `scrub: true` (sem atraso) e `autoAlpha` (invisível = `visibility: hidden`, sem clique nem Tab); volta ao subir. Com movimento reduzido, some de uma vez no mesmo ponto; sem JS, fica visível.
5. **"Como funciona" com o produto real**: um print do StudyIA por passo (o card "Pesquisar assunto geral" preenchido com "Fotossíntese"; o plano com 36,4% e as tarefas da sessão 1 marcadas; o resultado do seminário com 83,3%), em layout alternado (texto | print, invertendo no passo 2) a partir de 1024 px, empilhado abaixo disso, com o número do passo grande e discreto (`--color-border-input`, 4,7:1).
   - Gerados do app real, no tema escuro, a 2x, num banco descartável e numa porta própria, em modo demonstração. ⚠️ **O conteúdo da IA nos prints é exemplo escrito à mão** no mesmo formato JSON que a IA devolve (`ai_service.py`), não uma resposta do Gemini. Para refazer com respostas reais, basta repetir com a chave.
6. **Benefícios no formato original da Fase 1**: painel na superfície, título e introdução à esquerda e a lista 2 × 2 com ícones de linha à direita. As 2 alternativas "editoriais" do ajuste de 25/11 foram montadas, comparadas e **descartadas** (markup, CSS e as imagens do chat removidos).
7. **Lucide removido do `base.html`** ([B10](../05-achados-frontend.md)): nenhum `data-lucide` no projeto; eram 489 KB síncronos em todas as páginas. O `marked` sem versão continua aberto.
8. **Peso de 334 KB** locais na primeira carga (sem as imagens, que são `lazy`), acima do teto de 300 KB do §5.6, que não contava o ScrollTrigger (44 KB) nem a Inter (48 KB). Aceito.
9. **Entrada do hero**: título e apoio entram com uma animação **só de CSS** (`landing-rise`, a partir de 1% de opacidade, só com `.js` e sem movimento reduzido), na primeira pintura. É o que deixa o LCP no título (o Chrome ignora no LCP o que pinta com opacidade 0). CTAs, cérebro e o "role para explorar" entram com o GSAP; até o GSAP rodar, ficam invisíveis (só com `.js` + sem movimento reduzido), com a trava de 1,6 s no CSS.
10. **Inter dos títulos**: corte Display (`opsz` 32), variável 400–600, subconjunto latino + português, 23,8 + 25,6 KB (normal + itálico), família `"Inter"` com fallback de métricas ajustadas (CLS 0). Como foi gerada: `static/vendor/README.md`.
11. **GSAP + ScrollTrigger** (o §5.3 sugeria só o core): o ScrollTrigger cuida da revelação das seções, da pausa do laço do cérebro fora da tela e do "role para explorar".

#### Verificação (medida com Playwright e Lighthouse, banco descartável)

- **Lighthouse no celular** (aba anônima, app local): **Desempenho 91** (3 rodadas, todas 91), **Acessibilidade 100**, **Boas práticas 100**, **CLS 0**, LCP 3,2 s. Histórico: 80 com o Lucide → 86 sem ele → 91 com o título e o apoio em CSS. O que ainda pesa é o CSS sem compressão (ver [handoff §21](../handoff/backend-pendencias.md#21-sem-compressão-gzip-e-sem-cache-para-os-estáticos)).
- **Tema**: com "Claro" salvo, a landing fica escura e o login continua claro; a chave salva não muda. Com o sistema claro e nada salvo, também escura.
- **Offline** (só `127.0.0.1`): GSAP, ScrollTrigger e Inter carregam do vendor; nenhum erro do app.
- **Sem JS** e **movimento reduzido**: nada escondido, nada deslocado. **Sem rolagem horizontal** em 375, 390, 768 e 1440. Todos os alvos ≥ 44 px, foco visível em todos.
- Screenshots: `../studyia-screenshots/landing/fase1/`, `fase1-ajustes/`, `fase1-ajustes/beneficios-restaurado/` e `fase1-ajustes/role-para-explorar/`.

#### Critérios de aceite (§9) depois da Fase 1

| Critério | Situação |
|---|---|
| Sem sessão vê a landing (200); logado → dashboard (302); CTAs e marca; `login_required` e logout | ✅ (testes + navegador) |
| Sem internet, sem JS, movimento reduzido, sem rolagem horizontal, AA, 44 px, Lighthouse, passo 2, peso, sem `#hex`/`style=""`, testes | ✅ |
| Sempre escura e sem seletor; 4 benefícios; títulos em Inter | ✅ |
| Cena com o cérebro e os 6 satélites | ✅ no SVG estático; **3D na Fase 2** |
| Sem WebGL: ilustração estática sem erro; celular e movimento reduzido sem baixar o Three.js | **Fase 2** (hoje o Three.js não existe, então a ilustração estática é sempre a que aparece) |
| GSAP e Three.js só no `landing.html` (`grep -rn "vendor/" templates/`) | ✅ GSAP. O `grep` também acha o `base.html`, mas é o preload do `inter-wordmark-600.woff2` (rebrand), esperado |
| Docs 02, 03, 04, 05 e 06 no mesmo PR | ✅ |

#### Desvios do plano original

- Linhas citadas no §2 mudaram: a rota `/` está hoje em `app.py:73-78` e o link da marca em `base.html:92`.
- Em vez de 3 blocos novos, entraram **4** (`html_attrs`, `head_extra`, `theme_switch`, `nav_extra`); o `scripts_extra` já vinha do PR 3.
- A Inter foi vendorizada já (a decisão 6 do §4 foi substituída pela decisão 5 do rebrand). A Atkinson do corpo continua no Google Fonts: offline, o corpo cai no fallback.
- O `landing.js` é um script comum com `defer`, não um módulo: a Fase 2 decide como carregar o Three.js (ver abaixo).
- Ordem das seções: "Como funciona" antes dos benefícios (o §5.4 tinha o contrário).

### Fase 2: o cérebro em 3D (25/11/2026, branch `feat/landing-page`)

✅ **Aprovada pelo Renzo em 25/11/2026**, testada no navegador, depois de 4 rodadas de ajuste (cérebro procedural → modelo real → rede densa e entrada sem SVG → tamanho e tempo). Nenhum Python novo nesta fase.

#### O que entrou

| Parte | Arquivos | Observação |
|---|---|---|
| Three.js 0.187.0 | `static/vendor/three/0.187.0/three.module.js`, `three.core.js`, `LICENSE`, `addons/math/MeshSurfaceSampler.js` | minificados pelo jsDelivr a partir do pacote npm, **nomes sem `.min`** (o módulo importa `./three.core.js` pelo nome); MIT; SHA-256 no `static/vendor/README.md` |
| Modelo do cérebro | `static/vendor/models/brain/brain-v2.glb` (235 KB) + `README.md` | "Brain", de **farhad.Guli** (Sketchfab), **CC BY 4.0**. Otimizado fora do projeto: só a casca externa (18.609 triângulos), simplificado por parte, normais para fora, a parte do cérebro em cada vértice (`_PART`). Original (1,25 MB) e `fonte.txt` **fora do repositório**, em `~/Documents/projects/studyia-assets/brain/`. Alterações listadas no README da pasta |
| Cena | `static/js/landing-scene.js` (novo, módulo ES, `?v=landing_scene_v6`) | a rede neural, a máscara de profundidade, os impulsos, a base holográfica, a órbita, os 6 satélites, as pausas e o `dispose()`. Parâmetros no topo do arquivo |
| Orquestração | `static/js/landing.js` (`?v=landing_v8`) | importa a cena e baixa o modelo sob demanda; deixa de entrada; rede de segurança; troca de faixa (janela estreita/larga), `pagehide`/`pageshow` |
| Template | `templates/landing.html` | `head_extra`: importmap (`three`, `three/addons/`) e o script "vai ter 3D?"; `data-scene-src` e `data-model-src` no `.landing-visual`; o crédito do modelo no `footer_extra` |
| `base.html` | bloco `{% block footer_extra %}` | **vazio por padrão**, dentro do `<footer>`, depois do texto do RNF06 |
| CSS | `static/css/landing.css` (`?v=landing_v11`) | `.landing-scene` (canvas absoluto, sangra 8%), `.scene-3d`, `.is-3d`, `.is-fallback`, `.landing-credit`; título e apoio entram em 0,5 s |

#### Decisões aprovadas (25/11/2026)

1. **Modelo real, não procedural.** A forma gerada por código (dois elipsoides) lia como "duas bolhas"; o cérebro vem do modelo "Brain" (farhad.Guli, CC BY 4.0). A malha **não aparece**: serve de molde (os nós são sorteados na superfície com o `MeshSurfaceSampler`) e de máscara.
2. **Crédito do CC BY** no rodapé da landing, pelo bloco novo `footer_extra` do `base.html`: "Modelo 3D do cérebro: “Brain” por farhad.Guli (Sketchfab), licença CC BY 4.0", com link para a página do modelo e para a licença. Aparece sempre na landing (também no celular, onde o modelo não desce); nunca nas outras telas.
3. **Rede densa que desenha a anatomia:** até 3.400 nós (só a metade de frente aparece) e ≈ 6.000 ligações curtas seguindo a superfície. As **fissuras ficam abertas**: superfícies que se olham (as duas margens de um sulco, os dois hemisférios) não se ligam, o temporal só se liga a si e ao occipital (fissura lateral) e o cerebelo só a si. **Cerebelo** mais denso, com ligações quase horizontais (as folhas); **tronco** com ligações verticais, descendo até o feixe. O **contorno** brilha um pouco mais que o miolo. 70 impulsos.
4. **Máscara de profundidade:** a malha entra só no buffer de profundidade (`colorWrite: false`): esconde a rede do lado de trás, os satélites e a metade da órbita que passam atrás do cérebro. Sem casca, sem cor, sem malha sólida visível.
5. **Leitor mínimo do `.glb`** (`parseBrainGLB`, ≈ 50 linhas) no lugar do `GLTFLoader` (≈ 160 KB): só aceita o formato que nós geramos (1 malha, `POSITION` float32, `_PART` uint8, índices); qualquer outra coisa falha em silêncio e o SVG fica.
6. **Rotação:** 360° contínuos no eixo vertical, **20 s por volta** (`ROTATION_PERIOD`), com o eixo inclinado **14°** (`BRAIN_PITCH_DEG`: a câmera vê um pouco de cima, e de frente aparecem os dois hemisférios e a fissura). Inclinação de até **5°** seguindo o mouse, sem quique. (A oscilação no três quartos foi montada e comparada em vídeo, e descartada.)
7. **Entrada sem o SVG no desktop capaz:** um script no `<head>` decide antes da primeira pintura (≥ 768 px, `pointer: fine`, sem movimento reduzido, WebGL 2 acelerado), marca `<html class="scene-3d">` e adianta os downloads (`modulepreload` + preload do modelo). O CSS esconde o SVG (espaço reservado, CLS 0). O cérebro surge com fade + escala de 0,55 s **logo depois do título e do apoio** (deixa: 70% da animação do apoio), ou assim que a cena ficar pronta. Ordem: título → apoio → CTAs → cérebro.
8. **Rede de segurança de 3,5 s:** se a cena falhar ou não ficar pronta até 3,5 s da navegação, o SVG entra com fade (`.is-fallback`) e a cena **não entra mais** naquela visita (sem troca tardia). Celular, sem WebGL, movimento reduzido e sem JS: o SVG, como na Fase 1.
9. **Tamanho:** `BRAIN_SCALE` **2,7** (o cérebro ocupa a maior parte da coluna); base, feixe e halo derivam dele; **órbita 2,72**, o maior raio em que os satélites não são cortados pela borda direita da coluna (a `.landing` corta o que passa dela a partir de 1024 px).
10. **Satélites:** sprites do Three com textura desenhada num canvas 2D a partir dos ícones do sprite do `base.html`; linha fraca até o cérebro com um impulso que vai para dentro.
11. **`neural-bg.js` sem mudança:** ele já pausa com a aba oculta (60 → 0 desenhos/s, medido) e no `pagehide`; o canvas é fixo e cobre a janela, então nunca fica "fora da tela".
12. **Montagem em etapas:** a cena é montada assim que os arquivos chegam, em etapas curtas (o navegador recebe a vez entre elas) e com os shaders compilados em paralelo quando a GPU tem `KHR_parallel_shader_compile`: nenhuma tarefa longa durante a entrada.

#### Verificação (Playwright e Lighthouse, banco descartável, Chromium com GPU Intel integrada)

| Medida | Resultado |
|---|---|
| FPS no desktop (1440 px, mouse mexendo) | **60** estáveis (p95 16,8 ms); **23 draw calls** por quadro |
| Entrada (5 rodadas, desde a navegação) | 1ª pintura 0,28–0,32 s · CTAs completos 0,74–0,80 s · **cérebro: começa 0,67–0,73 s, termina 1,24–1,31 s** · nenhuma tarefa longa |
| LCP no desktop com 3D | continua o título, 0,25–0,34 s; FCP ≈ +20 ms (o teste de WebGL no `<head>`) |
| CPU da thread principal (parada no hero) | ≈ 11% com a cena e o fundo de rede; a cena custa o mesmo que o laço do SVG que ela substitui; o fundo de rede, ≈ 3 pontos |
| Pausas | fora da tela e com a aba oculta: 0 draw calls; volta sozinha |
| Memória | 12 idas e voltas de rolagem: heap JS 6,33 → 6,36 MB, sempre 1 canvas (sem vazamento) |
| Peso só no desktop com 3D | ≈ 1,08 MB sem compressão (Three.js 795 KB, modelo 235 KB, cena 51 KB, sampler 3 KB); ≈ 360 KB com gzip |
| Celular, tablet com toque, movimento reduzido, sem WebGL | SVG; **0 arquivos** de 3D baixados; console limpo |
| Offline (só `127.0.0.1`) | a cena carrega do vendor |
| Rede de segurança | modelo atrasado 6 s → SVG com fade aos 3,5 s; modelo com erro → SVG na hora |
| Sem corte, sem rolagem horizontal | 375, 768, 1024, 1280 e 1440 px (inclusive com o satélite no ponto mais à direita da órbita) |
| Lighthouse no celular | **Desempenho 89–91** (a Fase 1 dá 89–91 na mesma máquina, medido lado a lado), **Acessibilidade 100**, Boas práticas 100, **CLS 0** |
| Lighthouse no desktop | Desempenho 98–100, Acessibilidade 100, CLS 0 (o Chrome headless do Lighthouse não informa `pointer: fine`, então ele não pega o caminho 3D: o custo da cena está nas linhas acima) |
| Regressão | 13 testes passando; cadastro → app → logout → login; tema salvo fora da landing intacto |

Screenshots e vídeos: `../studyia-screenshots/landing/fase2/` (versões anteriores), `modelo-real/`, `ajustes/` (rede densa: `cena-frente.png`, `cena-tres-quartos.png`, `cena-lado.png`, `volta-completa.webm`) e `ajustes-2/` (versão final: `hero-*.png`, `entrada.webm`).

#### Critérios de aceite (§9) no fim

| Critério | Situação |
|---|---|
| Sem sessão vê a landing (200); logado → dashboard (302); CTAs e marca; `login_required` e logout | ✅ |
| Sem internet: a landing abre e a cena roda | ✅ (só a fonte do corpo cai no fallback) |
| Sem WebGL: ilustração estática, sem erro no console; movimento reduzido e celular sem baixar o Three.js | ✅ |
| Cena com o cérebro e os 6 satélites | ✅ (3D no desktop; SVG no resto) |
| Sem JS, sem rolagem horizontal, AA, 44 px, Lighthouse no celular (≥ 90 / ≥ 95 / CLS 0) | ✅ (Desempenho na faixa 89–91, igual à da Fase 1 medida no mesmo dia: oscilação do Lighthouse) |
| Orçamento de peso (§5.6) | ⚠️ desviado (ver abaixo), aprovado |
| GSAP e Three.js só no `landing.html` | ✅ (`grep -rn "vendor/" templates/` acha também o preload da fonte do wordmark no `base.html`, esperado) |
| Docs no mesmo PR | ✅ |

#### Desvios do plano original (aprovados)

- **Tamanho dos JS:** `landing.js` 19,8 KB e `landing-scene.js` 51,9 KB (muito comentário, sem minificar; 6 KB e 15 KB com gzip), acima do teto de 15 KB do §5.6. A cena só é baixada no desktop capaz.
- **Módulo separado** (`landing-scene.js`), e o `landing.js` continua script comum com `defer` (usa `import()` dinâmico).
- **Só WebGL 2** (o Three.js deixou de suportar WebGL 1 na r163) e só com aceleração (`failIfMajorPerformanceCaveat`).
- **FOV de 20°** (pouca perspectiva: nada sai do quadro).
- **Importmap no `<head>`** (no `head_extra`), não no fim do `<body>`: o navegador rejeita um importmap que chega depois de um `modulepreload`.
- **Script inline novo no `head_extra`** ("vai ter 3D?" + preloads), além do anti-flash do `base.html`.
- **Bloco novo `footer_extra`** no `base.html` (o 5º bloco opcional), para o crédito do modelo.
- **Modelo 3D** (não previsto no §5.5, que previa "sem texturas" e uma cena gerada): 235 KB a mais no desktop, em CC BY 4.0.
- **A troca SVG → 3D** deixou de ser "a mesma pose": no desktop capaz o SVG nem aparece; no caminho raro (janela que começou estreita e alargou), o crossfade troca o logo de frente pelo cérebro de lado.

#### Pendências

- ⚠️ **Não confirmado:** Safari, Firefox e aparelho físico. O WebKit do cache do Playwright não abriu e o Firefox não está instalado na máquina de teste. Pedido na descrição do PR.
- **Backend (opcional):** gzip e cache longo para `static/vendor/` ([handoff §21](../handoff/backend-pendencias.md#21-sem-compressão-gzip-e-sem-cache-para-os-estáticos)).
- **Futuro:** o texto do passo 2 vira "Plano com conteúdo" quando o 4b da [03](03-conteudo-do-plano.md) entrar.

#### Como refazer o modelo (fora do projeto, sem dependência no repositório)

A partir do original em `~/Documents/projects/studyia-assets/brain/brain.glb`, com gltf-transform 4, meshoptimizer, three@0.187.0 e three-mesh-bvh num diretório temporário: separar as partes pelo nome do nó pai (`frontal`, `pariet`, `temp`, `occipit`, `cereb`, `stem`; fora `corpus`, `pitua`, as arestas e a câmera), soldar e simplificar cada uma (erro 0,002; proporções 0,55 / 0,32 no cerebelo / 0,6 no tronco), juntar com o id da parte por vértice, manter só as faces que enxergam o lado de fora (raios em cone pelos dois lados, com BVH) virando-as para fora, centrar e normalizar (comprimento = 2) e gravar com `POSITION` float32, `_PART` uint8 e índices uint16. Salvar com **nome novo** (`brain-v3.glb`) e atualizar o `data-model-src` e o preload do `landing.html`.
