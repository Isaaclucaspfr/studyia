# Documentação técnica — StudyIA

Documentação de apoio ao desenvolvimento do frontend do StudyIA. Ela **não substitui** o [README do projeto](../README.md) (visão geral, requisitos e como rodar) nem o [doc_completo.txt](../doc_completo.txt) (documentação acadêmica do GitBook). Aqui ficam o mapa técnico do código e os contratos entre frontend e backend.

> Base: commit `7fbd035` (branch `main`). As referências `arquivo:linha` valem para esse commit. Todo o conteúdo veio da **leitura do código**: o app não foi executado. Itens que dependem de execução estão marcados com **⚠️ não confirmado**.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| [00-visao-geral.md](00-visao-geral.md) | Resumo do sistema, funcionalidades, stack, como rodar e modo demo |
| [01-arquitetura.md](01-arquitetura.md) | Fluxos de ponta a ponta (diagrama do plano de estudos), chave do Gemini, fallback, schema do banco *(referência — backend)* |
| [02-rotas.md](02-rotas.md) | Tabela completa de rotas do `app.py` e quem consome cada uma |
| [03-frontend-inventario.md](03-frontend-inventario.md) | Templates, `static/`, chamadas `fetch()`, CDNs e cache-busting |
| [04-contratos-frontend.md](04-contratos-frontend.md) | **Leitura obrigatória antes de qualquer mudança visual.** O que o redesign não pode quebrar |
| [05-achados-frontend.md](05-achados-frontend.md) | Problemas encontrados no frontend, classificados por escopo (A/B) |
| [06-padroes-visuais.md](06-padroes-visuais.md) | Convenções propostas para o redesign *(PROPOSTA — aguardando aprovação do grupo)* |
| [handoff/backend-pendencias.md](handoff/backend-pendencias.md) | Pendências para a **equipe de backend** (escopo C) |
| [sprints/sprint-01-redesign-visual.md](sprints/sprint-01-redesign-visual.md) | Plano da sprint 1 do redesign visual |
| [features/](features/README.md) | Especificação das próximas funcionalidades (remover "Configurar IA", tema claro/escuro, conteúdo do plano, landing page) e a **ordem de implementação** |

## Legenda de escopo

| Escopo | Significado | Quem age |
|---|---|---|
| **A — Visual** | HTML/CSS e apresentação nos templates Jinja. Não muda comportamento. | Frontend visual (Renzo), dentro do redesign |
| **B — Comportamento do frontend** | Lógica de template Jinja ou JS (`app.js`) que muda o que a página *faz*, não só como ela aparece. | **Decisão do grupo** antes de qualquer alteração, em PR próprio |
| **C — Backend** | Python, banco, prompts da IA, segurança do servidor. | Equipe de backend. O frontend só documenta, em [handoff/backend-pendencias.md](handoff/backend-pendencias.md) |

## Marcadores usados

- **⚠️ não confirmado**: conclusão tirada da leitura do código, ainda sem verificação no app rodando.
- **Referência — responsabilidade do backend**: seção apenas informativa para o frontend. Não altere com base nela.
