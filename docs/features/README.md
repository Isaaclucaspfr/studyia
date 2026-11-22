# Funcionalidades — especificação

Especificação das próximas 4 funcionalidades do StudyIA, **antes** da implementação. Cada documento separa o que o grupo já decidiu do que ainda é proposta, e aponta o código atual com `arquivo:linha`.

> Base: commit `69c99ab` (branch `main`, depois do merge da sprint 01). As referências `arquivo:linha` valem para esse commit e foram **conferidas no código**, não só nos docs. Os docs `01` a `05` citam o commit `7fbd035`; algumas linhas mudaram desde então (por exemplo, `#openSettingsBtn` estava em `base.html:26` e hoje está em `base.html:56`).
>
> Esta pasta é **só documentação**. Nenhum arquivo de código foi alterado.

## Arquivos

| # | Documento | Tamanho | Quem lidera |
|---|---|---|---|
| 01 | [Remover "Configurar IA"](01-remover-configurar-ia.md) | pequeno (1 PR) | quem estiver mexendo (toca backend e frontend) |
| 02 | [Tema claro / escuro / dispositivo](02-tema-claro-escuro-dispositivo.md) | médio (1 PR) | frontend (Renzo); não toca o backend |
| 03 | [Conteúdo dentro do plano](03-conteudo-do-plano.md) | grande (3 PRs: 4a, 4c, 4b) | **equipe de backend** |
| 04 | [Landing page](04-landing-page.md) | médio (1 PR) | frontend (Renzo); 1 linha de backend na rota `/`, revisada pela equipe de backend |

## Legenda

| Marcador | Significado |
|---|---|
| ✅ **Decidido** | Combinado pelo grupo. Não é para rediscutir na implementação. |
| 💡 **Proposta — validar com a equipe** | Sugestão técnica de quem escreveu o doc. A equipe pode trocar. |
| ❓ **Em aberto** | Ninguém decidiu ainda. Precisa de decisão antes do PR que depende dela. |
| ⚠️ **Não confirmado** | Conclusão tirada da leitura do código, sem rodar o app (ou estimativa a calibrar). |
| **A / B / C** | Escopos do [índice dos docs](../README.md#legenda-de-escopo): A visual, B comportamento do frontend (template/JS), C backend. |

Cada documento segue a mesma estrutura: objetivo · como funciona hoje · como deve funcionar · decisões do grupo · proposta técnica · impacto por camada · contratos afetados · riscos · critérios de aceite · divisão em PRs · em aberto.

## Ordem de implementação ✅ Decidido

1 docs → 2 remover "Configurar IA" → 3 tema → **em paralelo:** [4 conteúdo do plano: 4a → 4c → 4b] e [5 landing page].

| Passo | PR | Por que nesta posição |
|---|---|---|
| 1 | **Este PR de documentação** | Alinha o grupo antes de qualquer código, principalmente na funcionalidade 03, que mexe em banco, IA, rotas e frontend ao mesmo tempo. Os PRs seguintes apontam para estes docs. |
| 2 | **Remover "Configurar IA"** ([01](01-remover-configurar-ia.md)) | É a menor e destrava as outras: libera o espaço da navbar para o seletor de tema e tira do caminho o modal, que teria de ganhar versão escura à toa. Também corrige o banner de demonstração, que sem o modal ficaria errado para sempre. |
| 3 | **Tema claro/escuro/dispositivo** ([02](02-tema-claro-escuro-dispositivo.md)) | Vem antes do conteúdo e da landing para que as duas telas novas (4b e 5) já nasçam usando só tokens e funcionando nos dois temas, sem retrabalho. Depende do passo 2 por causa do espaço na navbar. |
| 4a | **Conteúdo — backend** ([03 §PR 4a](03-conteudo-do-plano.md#pr-4a--backend)) | Tabela, rotas, IA, regra de conclusão no servidor e testes. Não depende do tema; pode começar em paralelo com o passo 3, mas só entra na `main` depois do passo 2 (as duas mexem no `app.py`). |
| 4c | **Conteúdo — trava da conclusão** ([03 §PR 4c](03-conteudo-do-plano.md#pr-4c--trava-da-conclusão-antes-ou-junto-do-4b)) | Trava a conclusão no backend e ajusta o `toggle-task`; o checkbox vira indicador e o fetch do checklist sai do `app.js`. Mergeado **antes ou junto do 4b, nunca depois**: se o 4b entrasse primeiro, existiriam dois jeitos de marcar a tarefa (o checkbox antigo e o "Concluí a leitura"), com progressos diferentes. Depende só do 4a. |
| 4b | **Conteúdo — tela** ([03 §PR 4b](03-conteudo-do-plano.md#pr-4b--tela-de-conteúdo)) | Precisa das rotas do 4a, da trava do 4c e dos tokens escuros do passo 3. Tem como **pré-requisito a correção do XSS (B2)**, com o DOMPurify em `static/vendor/`, porque o conteúdo gerado é renderizado como Markdown. |
| 5 | **Landing page** ([04](04-landing-page.md)) | Vem **depois do tema** para já nascer nos dois temas e com o seletor fora da condição de sessão (decisão da 02). Pode correr **em paralelo ao conteúdo** porque é quase só frontend (1 linha de backend na rota `/`): o Renzo faz a landing enquanto a equipe de backend faz o 4a. Não depende da 03; o único cruzamento é o texto do passo "plano com conteúdo", que só vale depois do 4b ([04 §5.4](04-landing-page.md#54-estrutura-da-página)). |

```mermaid
flowchart LR
    D["1 · Docs<br/>(este PR)"] --> R["2 · Remover<br/>Configurar IA"]
    R --> T["3 · Tema<br/>claro/escuro"]
    R --> A["4a · Conteúdo<br/>backend"]
    A --> C["4c · Trava da<br/>conclusão"]
    C --> B["4b · Tela de<br/>conteúdo"]
    T --> B
    X["B2 · XSS<br/>(DOMPurify vendor)"] --> B
    T --> L["5 · Landing<br/>page"]
    B -.->|texto do passo 2| L
```

Leitura do diagrama: uma seta cheia significa "precisa estar na `main` antes". A seta `4c → 4b` admite o mesmo merge (os dois juntos), mas nunca o 4b sozinho antes do 4c. A seta pontilhada não bloqueia: a landing pode entrar antes do 4b, e o texto do passo 2 é atualizado depois. O B2 (XSS, [05-achados-frontend.md](../05-achados-frontend.md), §B2) não é uma das 4 funcionalidades, mas vira pré-requisito do 4b.

**Trilhas em paralelo depois do passo 3:**

| Trilha | Quem | PRs |
|---|---|---|
| Conteúdo do plano | equipe de backend lidera | 4a → 4c → 4b (4c e 4b juntos ou em sequência imediata) |
| Landing page | Renzo | 5 |

## Itens de docs existentes que estas funcionalidades tocam

| Doc existente | Item | Funcionalidade |
|---|---|---|
| [handoff/backend-pendencias.md](../handoff/backend-pendencias.md) | §2 chave em texto puro, §7 fallback silencioso, §9 banner de demo | 01 |
| [handoff/backend-pendencias.md](../handoff/backend-pendencias.md) | §8 `is_simulated` descartado, §11 JSON da IA sem validação, §12 CSRF, §15 emojis no conteúdo gerado | 03 |
| [05-achados-frontend.md](../05-achados-frontend.md) | B5 (modal sem acessibilidade) deixa de existir | 01 |
| [05-achados-frontend.md](../05-achados-frontend.md) | B11 (cores inline do `app.js`) | 01, 02 |
| [05-achados-frontend.md](../05-achados-frontend.md) | B2 (XSS), B3 (`response.ok`), B4 (carregamento e clique duplo) | 03 |
| [05-achados-frontend.md](../05-achados-frontend.md) | B10 (CDNs sem versão fixa): a landing inaugura o padrão `static/vendor/`, o mesmo do DOMPurify | 03, 04 |
| [04-contratos-frontend.md](../04-contratos-frontend.md) | não é alterado por este PR; cada doc lista o que muda em "Contratos afetados", e o PR de implementação atualiza o 04 | 01, 02, 03, 04 |
