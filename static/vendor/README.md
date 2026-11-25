# static/vendor/

Bibliotecas e fontes de terceiros servidas pelo próprio app (sem CDN), para a apresentação funcionar **sem internet**.

**Regra** (contrato novo do [docs/features/04](../../docs/features/04-landing-page.md) §7): a versão vai **no caminho** (`<lib>/<versão>/`). Trocar de versão = nova pasta + atualizar o template. Nunca sobrescrever um arquivo sem trocar a URL. Versão fixa, publicada há pelo menos 2 semanas no dia do PR.

| Arquivo | Versão | Origem | Licença | Usado em |
|---|---|---|---|---|
| `gsap/3.15.1/gsap.min.js` | 3.15.1 (publicada em 04/11/2026) | pacote npm `gsap@3.15.1`, `dist/gsap.min.js`, sem alteração | GSAP Standard "No Charge" License | só `templates/landing.html` |
| `gsap/3.15.1/ScrollTrigger.min.js` | 3.15.1 | pacote npm `gsap@3.15.1`, `dist/ScrollTrigger.min.js`, sem alteração | GSAP Standard "No Charge" License | só `templates/landing.html` |
| `fonts/inter-wordmark-600.woff2` | Inter 4 | subconjunto só com os glifos de "StudyIA" (rebrand) | SIL OFL 1.1 (`fonts/Inter-OFL.txt`) | `style.css` (logo, todas as telas) |
| `fonts/inter-display-latin.woff2` | Inter 4 (via `@fontsource-variable/inter@5.3.0`) | ver "Inter da landing" abaixo | SIL OFL 1.1 (`fonts/Inter-OFL.txt`) | só `landing.css` (títulos) |
| `fonts/inter-display-latin-italic.woff2` | Inter 4 (via `@fontsource-variable/inter@5.3.0`) | idem, itálico | SIL OFL 1.1 (`fonts/Inter-OFL.txt`) | só `landing.css` (ênfase dos títulos) |

Copiados em 24/11/2026. SHA-256 para conferir:

```
3d1bea374ab1b703cc5c4105358eec63c4465efdc573931dc116e34a0a190c1b  gsap/3.15.1/gsap.min.js
b5bb360661f478f0ff6ffa11500d8ce5e2b6aaf6f7288237cdca3aac9548035a  gsap/3.15.1/ScrollTrigger.min.js
586e309b59a3fc197fb2fc68fe74a47dab34b085459ea9a0eb7ee1b1c4d444f6  fonts/inter-display-latin.woff2
492e6a83cd1b062f88a48b0db5f3d3aa7c0559687bc8be7e91a0732023628c62  fonts/inter-display-latin-italic.woff2
```

## GSAP: licença

- **Standard "No Charge" GSAP License** (<https://gsap.com/standard-license>): desde a 3.13 (30/04/2025), o GSAP e todos os plugins são gratuitos, inclusive para uso comercial.
- **Não é MIT nem open source.** A licença proíbe usar o GSAP em ferramentas visuais de animação "no-code" que concorram com a Webflow, fazer engenharia reversa para produtos concorrentes e **remover os avisos de copyright**. O StudyIA não se encaixa em nenhuma das proibições.
- O cabeçalho `@license Copyright 2026, GreenSock` de cada `.min.js` **tem que ficar** no arquivo. Não minificar de novo nem editar.
- ⚠️ Texto da licença conferido em 22/11/2026 (doc 04 §5.3); reconferir no dia do PR.

## Inter da landing: como foi gerada

Ponto de partida: `files/inter-latin-opsz-normal.woff2` e `files/inter-latin-opsz-italic.woff2` do pacote npm `@fontsource-variable/inter@5.3.0` (Inter 4, eixos `opsz` 14–32 e `wght` 100–900, subconjunto latino). Com o fontTools 4.68 (fora do repositório, sem build step no app):

1. `instancer`: `opsz` fixo em **32** (o corte "Display", feito para títulos grandes) e `wght` limitado a **400–600** (continua variável; a landing usa 500).
2. `pyftsubset`: só latim básico, Latin-1 (acentos do português), aspas, travessões, reticências e €; recursos `kern`, `liga`, `calt`, `ccmp`, `locl`, `mark`, `mkmk`, `case`; sem hinting.

Resultado: 23,8 KB (normal) + 25,6 KB (itálico), contra 72,9 KB + 79,7 KB dos originais. Para gerar de novo (outro peso, outro glifo), repetir os 2 passos a partir do mesmo pacote.
