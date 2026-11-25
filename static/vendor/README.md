# static/vendor/

Bibliotecas e fontes de terceiros servidas pelo próprio app (sem CDN), para a apresentação funcionar **sem internet**.

**Regra** (contrato novo do [docs/features/04](../../docs/features/04-landing-page.md) §7): a versão vai **no caminho** (`<lib>/<versão>/`). Trocar de versão = nova pasta + atualizar o template. Nunca sobrescrever um arquivo sem trocar a URL. Versão fixa, publicada há pelo menos 2 semanas no dia do PR.

| Arquivo | Versão | Origem | Licença | Usado em |
|---|---|---|---|---|
| `gsap/3.15.1/gsap.min.js` | 3.15.1 (publicada em 04/11/2026) | pacote npm `gsap@3.15.1`, `dist/gsap.min.js`, sem alteração | GSAP Standard "No Charge" License | só `templates/landing.html` |
| `gsap/3.15.1/ScrollTrigger.min.js` | 3.15.1 | pacote npm `gsap@3.15.1`, `dist/ScrollTrigger.min.js`, sem alteração | GSAP Standard "No Charge" License | só `templates/landing.html` |
| `three/0.187.0/three.module.js` | 0.187.0 (r187, publicada em 30/10/2026) | `https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.min.js` (minificado pelo jsDelivr com Terser a partir do `build/three.module.js` do npm), salvo com o nome **sem** `.min` | MIT (`three/0.187.0/LICENSE`) | só a cena da landing (`static/js/landing-scene.js`, sob demanda, só no desktop) |
| `three/0.187.0/three.core.js` | 0.187.0 | `https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.core.min.js`, idem | MIT | importado pelo `three.module.js` |
| `three/0.187.0/LICENSE` | 0.187.0 | `LICENSE` do pacote npm `three@0.187.0`, sem alteração | — | — |
| `three/0.187.0/addons/math/MeshSurfaceSampler.js` | 0.187.0 | `https://cdn.jsdelivr.net/npm/three@0.187.0/examples/jsm/math/MeshSurfaceSampler.min.js` (minificado pelo jsDelivr a partir do `examples/jsm/math/MeshSurfaceSampler.js` do npm), nome sem `.min` | MIT (`three/0.187.0/LICENSE`) | só a cena da landing (sorteia os nós na superfície do cérebro) |
| `models/brain/brain-v2.glb` | v2 | modelo "Brain" de farhad.Guli (Sketchfab), otimizado: ver `models/brain/README.md` | **CC BY 4.0** (crédito no rodapé da landing) | só a cena da landing (forma do cérebro) |
| `fonts/inter-wordmark-600.woff2` | Inter 4 | subconjunto só com os glifos de "StudyIA" (rebrand) | SIL OFL 1.1 (`fonts/Inter-OFL.txt`) | `style.css` (logo, todas as telas) |
| `fonts/inter-display-latin.woff2` | Inter 4 (via `@fontsource-variable/inter@5.3.0`) | ver "Inter da landing" abaixo | SIL OFL 1.1 (`fonts/Inter-OFL.txt`) | só `landing.css` (títulos) |
| `fonts/inter-display-latin-italic.woff2` | Inter 4 (via `@fontsource-variable/inter@5.3.0`) | idem, itálico | SIL OFL 1.1 (`fonts/Inter-OFL.txt`) | só `landing.css` (ênfase dos títulos) |

GSAP e Inter copiados em 24/11/2026; Three.js em 25/11/2026. SHA-256 para conferir:

```
49bfc58c4097915b4fcf08ed1ee245c0da687f02d35908f38266dbd3d5324ac2  three/0.187.0/three.module.js
60880f0fd017e6ad08a80c2f0f7015c336ba0a5b6dbdde733b9272ca89eb95e2  three/0.187.0/three.core.js
8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc  three/0.187.0/LICENSE
37bbb364366ef0d0d8ae4de133b658958a1bb21179da890dafcb25019dea4f38  three/0.187.0/addons/math/MeshSurfaceSampler.js
07a63cad66d9780621a7b87f9cf5a205978f3e848c374c9f742b6105369ea71e  models/brain/brain-v2.glb
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

## Three.js: por que minificado do jsDelivr e com o nome sem `.min`

- O pacote `three@0.187.0` **não traz build UMD nem arquivo minificado**: só ES modules (`build/three.module.js`, 644 KB, que importa `./three.core.js`, 1,4 MB). Sem build step no app, o caminho é o módulo nativo do navegador: um `<script type="importmap">` no `landing.html` dá o nome `three` ao `three.module.js`, e o `landing-scene.js` faz `import … from 'three'`.
- Para não servir 2,1 MB, os dois arquivos são as versões que o **jsDelivr minifica** (Terser 5.48) a partir do mesmo pacote: 383 + 412 KB. É uma cópia única de arquivo, não um build step.
- Os nomes ficam **sem** `.min` porque o `three.module.js` minificado continua importando `"./three.core.js"` **pelo nome** (conferido no arquivo). Renomear um dos dois quebra o import.
- **Conferência:** os dois carregam no Node (`import * as T from './three.module.js'` → `T.REVISION === '187'`, `WebGLRenderer`, `ShaderMaterial`, `CanvasTexture` e `Sprite` presentes) e no navegador (cena da landing). O cabeçalho `@license … SPDX-License-Identifier: MIT` dos dois arquivos **tem que ficar**.
- **Licença MIT:** uso, cópia e modificação livres, inclusive comercial, desde que o aviso de copyright e a licença acompanhem o código (`three/0.187.0/LICENSE` + o cabeçalho de cada arquivo).
- **Addons:** o importmap também mapeia `three/addons/` para `three/0.187.0/addons/`. Só entra o que a cena usa (hoje, o `MeshSurfaceSampler`, 3 KB), com o mesmo caminho do pacote (`examples/jsm/…` → `addons/…`). O `.glb` do cérebro é lido por um leitor mínimo dentro da cena, **sem o `GLTFLoader`** (≈ 160 KB a mais para ler um arquivo de formato fixo gerado por nós).
- **Só a landing, só no desktop:** o script do `<head>` do `landing.html` só adianta os downloads (`modulepreload` + preload do modelo) e o `landing.js` só importa a cena (e com ela o Three.js) com largura ≥ 768 px, ponteiro fino, sem movimento reduzido e com WebGL 2 acelerado. No celular, nada disso (nem o modelo do cérebro) é baixado.

## Inter da landing: como foi gerada

Ponto de partida: `files/inter-latin-opsz-normal.woff2` e `files/inter-latin-opsz-italic.woff2` do pacote npm `@fontsource-variable/inter@5.3.0` (Inter 4, eixos `opsz` 14–32 e `wght` 100–900, subconjunto latino). Com o fontTools 4.68 (fora do repositório, sem build step no app):

1. `instancer`: `opsz` fixo em **32** (o corte "Display", feito para títulos grandes) e `wght` limitado a **400–600** (continua variável; a landing usa 500).
2. `pyftsubset`: só latim básico, Latin-1 (acentos do português), aspas, travessões, reticências e €; recursos `kern`, `liga`, `calt`, `ccmp`, `locl`, `mark`, `mkmk`, `case`; sem hinting.

Resultado: 23,8 KB (normal) + 25,6 KB (itálico), contra 72,9 KB + 79,7 KB dos originais. Para gerar de novo (outro peso, outro glifo), repetir os 2 passos a partir do mesmo pacote.
