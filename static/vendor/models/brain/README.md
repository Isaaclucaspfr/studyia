# static/vendor/models/brain/

Forma do cérebro da cena 3D da landing (`static/js/landing-scene.js`). A malha **não é desenhada**: serve de molde para sortear os nós da rede na superfície (`MeshSurfaceSampler`) e de máscara de profundidade (esconde a rede do lado de trás). Só é baixada no desktop, junto com a cena (ver `docs/features/04-landing-page.md` §12).

## Origem e licença

| | |
|---|---|
| Modelo | **"Brain"** |
| Autor | **farhad.Guli** |
| Página | <https://sketchfab.com/3d-models/brain-6ca0844a846b400695ff54553dc9bda4> |
| Licença | **Creative Commons Attribution 4.0 (CC BY 4.0)**, <https://creativecommons.org/licenses/by/4.0/>: uso livre, inclusive comercial, **com crédito obrigatório** ao autor e indicação das alterações |
| Crédito | "Brain by farhad.Guli is licensed under Creative Commons Attribution". Na landing, no rodapé (`{% block footer_extra %}` do `landing.html`): "Modelo 3D do cérebro: “Brain” por farhad.Guli (Sketchfab), licença CC BY 4.0", com link para a página e para a licença |
| Original | `brain.glb` exportado pelo Sketchfab (1.249.628 bytes, ≈ 50,9 mil triângulos, 8 partes: frontal, parietal, temporal, occipital, cerebelo, tronco, corpo caloso e hipófise, mais 3 conjuntos de arestas e uma câmera do SketchUp). Guardado **fora do repositório**, em `~/Documents/projects/studyia-assets/brain/` (com um `fonte.txt`) |

## Alterações feitas (CC BY pede que sejam indicadas)

Feitas uma vez, fora do projeto (gltf-transform 4, meshoptimizer, Three.js 0.187.0 e three-mesh-bvh no Node, sem dependência no repositório):

1. Removidos: as arestas (`LINES`), a câmera, o corpo caloso (parte interna), a hipófise (solta, embaixo), as normais e os materiais.
2. Transformações aplicadas na geometria; cada parte soldada e **simplificada separadamente** com o meshoptimizer (erro 0,002), com mais detalhe onde a anatomia pede: frontal 6.365 → 3.894, parietal 3.808 → 2.253, temporal 5.674 → 3.385, occipital 2.663 → 1.712, **cerebelo** 28.628 → 17.820, tronco 3.370 → 2.488 triângulos.
3. **Só a casca externa:** de cada triângulo saem raios (um cone em volta da normal, dos dois lados, acelerados com uma BVH); fica quem enxerga o lado de fora, e as faces internas (as partes do original se interpenetram) saem: 31.552 → **18.609 triângulos, 7.967 vértices**. Cada face que ficou foi virada para fora (5.455 tinham o *winding* invertido): normais confiáveis, que a cena usa no brilho do contorno e para não ligar as duas margens de um sulco.
4. **Parte de cada vértice** num atributo `_PART` (uint8): 1 frontal, 2 parietal, 3 temporal, 4 occipital, 5 cerebelo, 6 tronco. A cena usa para desenhar a anatomia (fissura lateral e separação do cerebelo abertas, cerebelo mais denso com linhas horizontais, tronco com linhas verticais).
5. Centrada na origem, com o comprimento (frente–trás, eixo x) = 2; y para cima; frontal em +x.
6. Formato: glTF 2.0 binário, 1 malha, 1 primitiva, `POSITION` float32 + `_PART` uint8 + índices uint16, sem extensões, sem compressão (o leitor mínimo da cena, `parseBrainGLB`, só aceita isso). Validado com `gltf-transform validate`: sem erros nem avisos.

| Arquivo | Tamanho | SHA-256 |
|---|---|---|
| `brain-v2.glb` | 240.284 bytes (≈ 235 KB) | `07a63cad66d9780621a7b87f9cf5a205978f3e848c374c9f742b6105369ea71e` |
| original (fora do repo) | 1.249.628 bytes | `b0aa86b79874f41eea0080b1034febfc4a11abe8c6f7ef06d9e04d0cf1d00544` |

(O `brain-v1.glb`, só a casca sem as partes, existiu durante a implementação e nunca foi commitado.)

**Regra de versão** (a mesma do vendor): a versão vai no nome (`brain-v2.glb`). Gerou de novo? Novo nome (`brain-v3.glb`) e atualizar o `data-model-src` e o preload do `landing.html`. Nunca sobrescrever.
