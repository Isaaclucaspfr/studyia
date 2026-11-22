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
4. A navbar mostra a marca e o **seletor de tema** ([02](02-tema-claro-escuro-dispositivo.md)), e a landing aparece no tema escolhido.
5. Quem **já está logado** e abre `/` vai direto para o dashboard, como hoje.
6. **Sem WebGL, com movimento reduzido, no celular ou sem JavaScript**, a página continua completa e legível, com uma ilustração estática no lugar da cena.
7. **Sem internet** (apresentação offline), a landing abre e anima, porque GSAP e Three.js vêm de `static/vendor/`.
8. Login, cadastro, `login_required` e todas as outras telas continuam iguais.

## 4. Decisões do grupo

- ✅ **Decidido:** uma landing page **curta**, mostrada **antes** da tela de login, para visitantes **sem sessão**.
- ✅ **Decidido:** animações com **GSAP** e **Three.js**.
- ✅ **Decidido:** quem já está logado continua indo **direto para o dashboard**.
- ✅ **Decidido:** o **seletor de tema** ([02](02-tema-claro-escuro-dispositivo.md), decisão "onde aparece") aparece também na landing.

✅ **Aprovado pelo Renzo** (eram 💡 propostas deste doc):

1. **Template:** o `landing.html` **estende o `base.html`**, que ganha 3 blocos novos **vazios** por padrão: `head_extra`, `nav_extra` e `scripts_extra` (§5.2).
2. **Three.js só no desktop:** abaixo de 768 px, com toque (`pointer: coarse`), sem WebGL ou com `prefers-reduced-motion: reduce`, a cena **não é baixada** e fica a ilustração em **SVG estático** (§5.5, §5.6, §5.7).
3. **Meta de Lighthouse no celular:** **Desempenho ≥ 90**, **Acessibilidade ≥ 95**, **CLS = 0** (§9).
4. **Link da marca sem sessão** (`base.html:48`) passa a ir para a **landing** (`index`) em vez do `login`. Isso muda o contrato "Link da marca" do [04 §7.1](../04-contratos-frontend.md#71-herança-jinja-e-estrutura-do-basehtml), registrado no §7 (§5.2).
5. **Texto do passo 2:** "**Plano de estudos com tarefas**" até o 4b da [03](03-conteudo-do-plano.md) entrar; depois, "Plano com conteúdo" (§5.4).
6. **Fonte offline:** sem internet, a landing usa a fonte de **fallback** (`system-ui`). Vendorizar a fonte fica para o **PR do [B10](../05-achados-frontend.md)**, não para este (§8, §11).
7. **Logout** continua indo para o **login** (`app.py:135`), sem mudança extra no backend (§5.1).

⚠️ **Continua dependendo do ok da equipe de backend:** a mudança da rota `/` (`app.py:57`, §5.1). É a única linha de Python do PR da landing.

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
| 2 | **Proposta de valor** | 3 benefícios curtos, sem cards genéricos de ícone + título + parágrafo: fiel ao seu material (modo arquivo), no seu tempo (minutos por dia), com transparência sobre o uso de IA (RNF06) | lista simples com ícones do sprite |
| 3 | **Como funciona** | 3 passos numerados: **1. Assunto ou arquivo** → **2. Plano de estudos com tarefas** (vira "Plano com conteúdo" depois do 4b) → **3. Mini seminário com nota** | `<ol>` semântica; revelação suave com GSAP (§5.7) |
| 4 | **Chamada final** | 1 frase + os mesmos 2 CTAs | — |
| 5 | **Rodapé** | o rodapé RNF06 herdado do `base.html` (`:113-116`) | — |

- ✅ **Texto do passo 2, aprovado pelo Renzo** (§4, decisão 5): "plano **com conteúdo**" só é verdade depois do 4b da [03](03-conteudo-do-plano.md), e a landing corre em paralelo e pode entrar antes. Por isso, até o 4b entrar, o passo 2 (e a frase de apoio do hero) usa "**Plano de estudos com tarefas**". O texto troca para "Plano com conteúdo" no PR do 4b (ou no primeiro PR depois dele).
- **Nada de seções extras** (depoimentos, preços, FAQ, logos): o projeto é acadêmico e a landing é curta por decisão.

### 5.5 Cena Three.js: "Caderno quieto" em 3D

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
| **Templates** | novo `templates/landing.html` (estende o `base.html`); `base.html`: 3 blocos novos **vazios** (`head_extra`, `nav_extra`, `scripts_extra`) e o link da marca sem sessão apontando para `index` (`:48`). Nenhum outro template muda |
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
- [ ] **Dois temas:** Claro, Escuro e Dispositivo aplicam-se à landing, inclusive às cores da cena, e o **seletor de tema** aparece na navbar.
- [ ] **AA** nos dois temas; canvas e SVG com `aria-hidden="true"`; CTAs com ≥ 44 px e foco visível.
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

| Parte | Escopo | Observação |
|---|---|---|
| ⚠️ **Rota `/` (`app.py:57`) + 2 testes** | **C (pequeno)** | **destacada na descrição do PR para a revisão da equipe de backend.** É a única linha de Python do PR. Em commit separado, para a equipe revisar e aprovar isolado |
| Blocos novos e link da marca no `base.html` | A/B | blocos vazios: as outras telas não mudam |
| `landing.html` + `landing.css` | A | só tokens |
| `static/vendor/` (GSAP, Three.js, README) | — | versões e licenças de §5.3 |
| `landing.js` (cena, animações, pausas, tema) | B (JS novo) | aprovado ao decidir a funcionalidade |
| Docs 02, 03, 04, 05, 06 | — | |

**Depende de:** passo 2 ([01](01-remover-configurar-ia.md)) e passo 3 ([02](02-tema-claro-escuro-dispositivo.md)) na `main`: a landing precisa do seletor de tema fora da condição de sessão, do script anti-FOUC e dos tokens escuros. **Não depende** da 03; o único cruzamento é o texto do passo 2 (§5.4).

**Conflito provável:** com o 4a da 03 no `app.py`. As mudanças ficam em funções diferentes (`index` × rotas novas), então o conflito, se houver, é trivial.

## 11. Em aberto / futuro

- **Futuro (✅ decisão 6):** vendorizar também a fonte (Atkinson Hyperlegible Next em `static/vendor/fonts/`), para a apresentação offline ficar idêntica. Mexe no `<head>` do `base.html` e vale para o app inteiro, então entra com o PR do [B10](../05-achados-frontend.md), não neste.
- **Futuro (backend):** cache longo para `static/vendor/` (caminhos versionados), em vez do `SEND_FILE_MAX_AGE_DEFAULT = 0` global (`app.py:27`), e compressão gzip no deploy. Fica registrado no [handoff](../handoff/backend-pendencias.md).
- **Futuro:** trocar o texto do passo 2 para "Plano com conteúdo" quando o 4b da 03 entrar (§5.4).
- **Futuro:** se a cena ficar pesada demais mesmo no desktop, uma versão só com GSAP + SVG animado mantém a ideia sem o Three.js. Isso exigiria rever a decisão do grupo, então só com novo ok.
