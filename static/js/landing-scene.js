/* ==========================================================================
   StudyIA — Cena 3D do hero da landing (features/04, PR 4, Fase 2)

   Só decoração: um cérebro de verdade desenhado como rede neural (nós
   ligados por linhas finas, com impulsos de luz percorrendo as ligações),
   a base holográfica em anéis e os 6 satélites em órbita (livro, formatura,
   lâmpada, gráfico, camadas, notebook). Não lê nem envia dado nenhum.

   Quem carrega este módulo é o landing.js, com import() sob demanda, e só
   quando a cena faz sentido: largura ≥ 768 px, ponteiro fino (mouse ou
   trackpad), sem movimento reduzido e com WebGL 2 (features/04 §5.6).
   Em qualquer outro caso, este arquivo, o Three.js e o modelo nem são
   baixados, e fica o cérebro em SVG da Fase 1 (que também é o pôster).

   - Forma: o modelo "Brain" de farhad.Guli (CC BY 4.0), otimizado em
     static/vendor/models/brain/ (ver o README de lá). A malha NÃO aparece:
     serve de molde e de máscara. Os nós são pontos sorteados na superfície
     (MeshSurfaceSampler do Three.js), com distância mínima entre eles; a
     malha entra só no buffer de profundidade (colorWrite: false), para a
     rede do lado de trás ficar escondida, como numa superfície opaca. Sem
     cor, sem casca. O crédito está no rodapé.
   - O .glb é lido aqui mesmo (parseBrainGLB): é um arquivo gerado por nós,
     com uma malha só (posição float32 + a parte do cérebro de cada vértice
     + índices). O GLTFLoader seria ≈ 160 KB a mais para ler isso.
   - A rede desenha a anatomia: ligações curtas seguindo a superfície, sem
     atravessar as fissuras (longitudinal, lateral, a do cerebelo); cerebelo
     mais denso com linhas quase horizontais; tronco com linhas verticais;
     o contorno um pouco mais brilhante que o miolo.
   - Gira 360° no eixo vertical (ROTATION_PERIOD), com o eixo inclinado para
     a câmera ver um pouco de cima.
   - Composição no mesmo quadro do SVG (landing.html, viewBox 640 × 600):
     1 unidade do mundo = 100 px do viewBox, origem no centro. Os satélites
     começam nas posições do SVG; a troca é um crossfade (CSS).
   - Satélites: sprites com textura desenhada num canvas 2D a partir dos
     ícones do sprite do base.html (#i-book etc.), na ordem de profundidade.
   - Desempenho: geometria em buffers (≈ 20 draw calls), pixel ratio ≤ 1,5,
     sem pós-processamento (o brilho é do próprio shader dos pontos). O laço
     para fora da tela (IntersectionObserver) e com a aba oculta.
   - dispose() libera tudo (geometrias, materiais, texturas, renderer,
     listeners) e tira o canvas. O landing.js chama no pagehide.
   - Cores lidas dos tokens (a landing é sempre escura): --color-accent,
     --color-accent-active, --color-primary, --color-accent-soft-border,
     --color-surface. Nenhum #hex de cor aqui.
   - O canvas é aria-hidden e não recebe ponteiro nem foco.
   ========================================================================== */

import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    CanvasTexture,
    CircleGeometry,
    Color,
    CylinderGeometry,
    DoubleSide,
    Group,
    LineSegments,
    Mesh,
    MeshBasicMaterial,
    NormalBlending,
    PerspectiveCamera,
    PlaneGeometry,
    Points,
    RingGeometry,
    Scene,
    ShaderMaterial,
    Sprite,
    SpriteMaterial,
    SRGBColorSpace,
    Vector3,
    WebGLRenderer
} from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

/* --------------------------------------------------------------------------
   Ajustes principais (mexa aqui)
   -------------------------------------------------------------------------- */

const BRAIN_SCALE = 2.7;           // meio comprimento (frente–trás) do cérebro, em unidades (o quadro tem 6,4 × 6).
                                   // A base, o feixe, o halo e a órbita se ajustam a partir dele (ver "Geometria")
const NODE_COUNT = 3400;           // teto de nós na superfície (só a metade de frente aparece)
const NODE_SPACING = 0.026;        // distância mínima entre nós (× BRAIN_SCALE); menor = rede mais densa
const ROTATION_PERIOD = 20;        // segundos por volta (360° contínuos no eixo vertical)
const START_YAW_DEG = -30;         // pose inicial: três quartos, o frontal vindo para a câmera
const BRAIN_PITCH_DEG = 14;        // eixo inclinado: a câmera vê um pouco de cima (a fissura entre os hemisférios aparece de frente)
const GLOW_INTENSITY = 1;          // 0 = sem brilho em volta dos pontos; 1 = o padrão
const RIM_MIN = 0.55;              // brilho do que está de frente para a câmera (1 = sem destaque do contorno)
const PULSE_COUNT = 70;            // impulsos de luz correndo pela rede ao mesmo tempo
const PULSE_SPEED = 0.95;          // unidades/s
const ORBIT_SPEED = -0.07;         // rad/s dos satélites (negativo: a frente anda da esquerda para a direita)
const TILT_MAX_DEG = 5;            // inclinação máxima seguindo o mouse (graus)
const TILT_RESPONSE = 3.2;         // quão rápido a inclinação alcança o mouse (1/s; maior = mais rápido)
const MAX_DPR = 1.5;               // teto do pixel ratio

/* Geometria da composição (unidades = px do SVG ÷ 100, y para cima) */
const BRAIN_Y = 0.5;               // centro do cérebro
const BRAIN_BOTTOM = BRAIN_Y - BRAIN_SCALE * 0.87;      // ponta do tronco (o modelo tem altura 2 × 0,87)
// Órbita: em volta do cérebro, sem passar da borda do quadro (± 3,2; a borda
// direita é cortada pela .landing a partir de 1024 px). Com o brilho do
// satélite, a perspectiva e a inclinação do mouse, 2,72 é o maior raio que cabe
const ORBIT_RADIUS = Math.min(BRAIN_SCALE + 0.05, 2.72);
const ORBIT_CENTER_Y = 0.05;
const ORBIT_TILT_X = 0.29;         // rad: a órbita vista de cima (ry/rx = 84/290 no SVG)
const ORBIT_ROLL_Z = 0.14;         // rad: a inclinação de −8° do SVG
// Base: abaixo do tronco, sem sair da parte de baixo do canvas; anéis na escala do cérebro
const BASE_Y = Math.max(BRAIN_BOTTOM - 0.72, -2.62);
const BASE_SCALE = Math.min(BRAIN_SCALE / 2.3, 1.12);
const BASE_TILT_X = 0.06;          // rad extra para os anéis ficarem como as elipses do SVG
const FRAME_HEIGHT = 6;            // altura do viewBox (600 px) em unidades
const FOV = 20;                    // estreito: pouca perspectiva, nada sai do quadro

/* Satélites: ícone do sprite e ângulo na elipse do SVG (graus) */
const SATELLITES = [
    { icon: 'i-book',     angle: -28 },
    { icon: 'i-cap',      angle: 22 },
    { icon: 'i-bulb',     angle: 78 },
    { icon: 'i-chart-up', angle: 132 },
    { icon: 'i-layers',   angle: 182 },
    { icon: 'i-laptop',   angle: 228 }
];
const SAT_SIZE = 0.52;             // diâmetro do círculo (≈ 50 px do SVG)

/* Ordem de desenho (sem teste de profundidade: a ordem é a profundidade) */
const ORDER = {
    halo: 0, floor: 1, beam: 2, rings: 3, orbitBack: 4, satBack: 5, satLinks: 6,
    links: 8, nodes: 9, pulses: 10, orbitFront: 11, satFront: 12
};

/* --------------------------------------------------------------------------
   Utilitários
   -------------------------------------------------------------------------- */

// Gerador pseudoaleatório com semente: a rede sai igual em toda visita
function mulberry32(seed) {
    let a = seed;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function readToken(styles, name, fallback) {
    const value = styles.getPropertyValue(name).trim();
    const color = new Color();
    try {
        color.setStyle(value || fallback);
    } catch (e) {
        color.setStyle(fallback);
    }
    return color;
}

function readTokenString(styles, name, fallback) {
    return styles.getPropertyValue(name).trim() || fallback;
}

/* Lê o brain.glb (glTF 2.0 binário, gerado por nós: 1 malha, 1 primitiva,
   POSITION float32 VEC3 + _PART uint8 + índices uint16/uint32). Qualquer
   coisa fora disso lança erro, e quem chama mantém o SVG. */
function parseBrainGLB(buffer) {
    const view = new DataView(buffer);
    if (view.getUint32(0, true) !== 0x46546C67) throw new Error('glb');   // "glTF"
    let json = null;
    let bin = -1;
    let offset = 12;
    while (offset + 8 <= view.byteLength) {
        const length = view.getUint32(offset, true);
        const type = view.getUint32(offset + 4, true);
        const start = offset + 8;
        if (type === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, start, length)));
        else if (type === 0x004E4942) bin = start;
        offset = start + length;
    }
    if (!json || bin < 0) throw new Error('glb');
    const primitive = json.meshes[0].primitives[0];

    function read(index, expectedType) {
        const accessor = json.accessors[index];
        const bufferView = json.bufferViews[accessor.bufferView];
        const Type = { 5126: Float32Array, 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array }[accessor.componentType];
        const size = { SCALAR: 1, VEC3: 3 }[accessor.type];
        if (!Type || !size || accessor.type !== expectedType || accessor.normalized) throw new Error('glb');
        const start = bin + (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
        const packed = size * Type.BYTES_PER_ELEMENT;
        const stride = bufferView.byteStride || packed;
        if (stride === packed) {
            // slice: cópia alinhada (o offset no .glb pode não ser múltiplo de 4)
            return new Type(buffer.slice(start, start + accessor.count * packed));
        }
        // Com passo (ex.: _PART de 1 byte alinhado a 4, como o glTF pede para vértices)
        const out = new Type(accessor.count * size);
        for (let i = 0; i < accessor.count; i++) {
            out.set(new Type(buffer.slice(start + i * stride, start + i * stride + packed)), i * size);
        }
        return out;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(read(primitive.attributes.POSITION, 'VEC3'), 3));
    if (primitive.indices !== undefined) geometry.setIndex(new BufferAttribute(read(primitive.indices, 'SCALAR'), 1));
    // Parte do cérebro de cada vértice (1 frontal, 2 parietal, 3 temporal, 4 occipital,
    // 5 cerebelo, 6 tronco). Vai no atributo "color" (r = parte / 8), que o
    // MeshSurfaceSampler interpola: os 3 vértices de uma face são da mesma parte
    if (primitive.attributes._PART !== undefined) {
        const part = read(primitive.attributes._PART, 'SCALAR');
        const color = new Float32Array(part.length * 3);
        for (let i = 0; i < part.length; i++) color[i * 3] = part[i] / 8;
        geometry.setAttribute('color', new BufferAttribute(color, 3));
    }
    return geometry;
}

/* --------------------------------------------------------------------------
   Shaders (pontos com brilho próprio, linhas e superfícies com degradê)
   -------------------------------------------------------------------------- */

// Profundidade: o que está atrás fica mais apagado (dá volume)
const DEPTH_FADE = /* glsl */`
    uniform float uNear;
    uniform float uFar;
    float depthFade(vec4 mv) {
        return 1.0 - 0.75 * clamp((-mv.z - uNear) / (uFar - uNear), 0.0, 1.0);
    }
`;

// Contorno: com a normal da superfície (aNormal), o que está de lado para a
// câmera brilha mais e o que está de frente fica um pouco mais fraco. Reforça
// o perfil do cérebro (como o contorno do logo). Sem normal (impulsos,
// anéis, órbita), vale uRimInner.
const RIM = /* glsl */`
    attribute vec3 aNormal;
    uniform float uRimMin;
    uniform float uRimInner;
    float rimFactor(vec4 mv) {
        if (dot(aNormal, aNormal) < 0.25) return uRimInner;
        vec3 n = normalize(normalMatrix * aNormal);
        float facing = abs(dot(n, normalize(-mv.xyz)));
        return mix(uRimMin, 1.0, pow(1.0 - facing, 1.6));
    }
`;

const POINT_VERTEX = /* glsl */`
    attribute float aSize;
    attribute float aAlpha;
    attribute float aPhase;
    uniform float uTime;
    uniform float uSizeScale;
    uniform float uTwinkle;
    varying float vAlpha;
    varying float vHot;
    ${DEPTH_FADE}
    ${RIM}
    void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float twinkle = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * 1.1 + aPhase));
        vHot = clamp(aAlpha - 1.0, 0.0, 1.0);
        // O impulso que chega acende o nó mesmo de frente (vHot ignora o contorno)
        vAlpha = min(aAlpha, 1.0) * max(rimFactor(mv), vHot) * twinkle * depthFade(mv);
        gl_PointSize = aSize * (1.0 + vHot * 0.6) * uSizeScale / -mv.z;
    }
`;

const POINT_FRAGMENT = /* glsl */`
    uniform vec3 uColor;
    uniform vec3 uHot;
    uniform float uGlow;
    uniform float uOpacity;
    varying float vAlpha;
    varying float vHot;
    void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float core = smoothstep(0.3, 0.14, d);
        float halo = pow(1.0 - d, 3.2) * 0.32 * uGlow;
        vec3 color = mix(uColor, uHot, max(core * 0.45, vHot));
        gl_FragColor = vec4(color, (core + halo) * vAlpha * uOpacity);
        #include <colorspace_fragment>
    }
`;

const LINE_VERTEX = /* glsl */`
    attribute float aAlpha;
    varying float vAlpha;
    ${DEPTH_FADE}
    ${RIM}
    void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        vAlpha = aAlpha * rimFactor(mv) * depthFade(mv);
    }
`;

const LINE_FRAGMENT = /* glsl */`
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;
    void main() {
        gl_FragColor = vec4(uColor, vAlpha * uOpacity);
        #include <colorspace_fragment>
    }
`;

// Degradê radial (halo atrás do cérebro e o chão da base)
const RADIAL_VERTEX = /* glsl */`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const RADIAL_FRAGMENT = /* glsl */`
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uPower;
    varying vec2 vUv;
    void main() {
        float d = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0);
        gl_FragColor = vec4(uColor, pow(1.0 - d, uPower) * uOpacity);
        #include <colorspace_fragment>
    }
`;

// Anel com perfil gaussiano (o brilho do anel de dentro e a onda que pulsa)
const RING_VERTEX = /* glsl */`
    varying float vR;
    void main() {
        vR = length(position.xy);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const RING_FRAGMENT = /* glsl */`
    uniform vec3 uColor;
    uniform float uRadius;
    uniform float uWidth;
    uniform float uOpacity;
    varying float vR;
    void main() {
        float d = (vR - uRadius) / uWidth;
        gl_FragColor = vec4(uColor, exp(-d * d) * uOpacity);
        #include <colorspace_fragment>
    }
`;

// Feixe da base: some de baixo para cima
const BEAM_FRAGMENT = /* glsl */`
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
        gl_FragColor = vec4(uColor, pow(1.0 - vUv.y, 1.6) * uOpacity);
        #include <colorspace_fragment>
    }
`;

/* --------------------------------------------------------------------------
   Textura dos satélites: o ícone do sprite do base.html, desenhado num canvas
   -------------------------------------------------------------------------- */

const SAT_TEXTURE = 256;
const SAT_CIRCLE = 92;   // raio do círculo na textura (o resto é o brilho em volta)

function drawSatellite(symbol, colors) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SAT_TEXTURE;
    const ctx = canvas.getContext('2d');
    const c = SAT_TEXTURE / 2;

    // Brilho fraco em volta, círculo na superfície com a borda do acento
    ctx.save();
    ctx.shadowColor = colors.accent;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(c, c, SAT_CIRCLE, 0, Math.PI * 2);
    ctx.fillStyle = colors.surface;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(c, c, SAT_CIRCLE, 0, Math.PI * 2);
    ctx.fillStyle = colors.surface;
    ctx.fill();
    ctx.lineWidth = 4.6;
    ctx.strokeStyle = colors.border;
    ctx.stroke();

    // Ícone (viewBox 24) a 0,96 do raio, como no SVG (ícone de 24 num círculo de 25)
    const iconSize = SAT_CIRCLE * 0.96;
    ctx.save();
    ctx.translate(c - iconSize / 2, c - iconSize / 2);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = colors.accent;
    Array.prototype.forEach.call(symbol ? symbol.children : [], function (el) {
        const tag = el.tagName.toLowerCase();
        if (tag === 'path') {
            ctx.stroke(new Path2D(el.getAttribute('d')));
        } else if (tag === 'rect') {
            const x = +el.getAttribute('x') || 0;
            const y = +el.getAttribute('y') || 0;
            const w = +el.getAttribute('width');
            const h = +el.getAttribute('height');
            const r = +el.getAttribute('rx') || 0;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
            ctx.stroke();
        } else if (tag === 'circle') {
            ctx.beginPath();
            ctx.arc(+el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('r'), 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    ctx.restore();

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
}

/* --------------------------------------------------------------------------
   A rede do cérebro: nós sorteados na superfície do modelo
   -------------------------------------------------------------------------- */

const PART = { frontal: 1, parietal: 2, temporal: 3, occipital: 4, cerebellum: 5, stem: 6 };
// Densidade e ligações por parte: o cerebelo é mais miúdo e denso, com linhas
// quase horizontais (as folhas); o tronco, alongado, com linhas verticais
const PART_RULES = {
    default: { spacing: 1, links: 4, dir: null },
    5: { spacing: 0.7, links: 3, dir: 'horizontal' },
    6: { spacing: 0.7, links: 2, dir: 'vertical' }
};
// Quem se liga com quem. O temporal só com ele mesmo e o occipital: a fissura
// lateral (que separa o temporal do frontal e do parietal) continua aberta.
// Cerebelo e tronco só consigo mesmos: a separação do cerebelo também fica aberta
function linkable(a, b) {
    if (a === b) return true;
    const pair = a < b ? a * 10 + b : b * 10 + a;
    return pair === 12 || pair === 14 || pair === 24 || pair === 34;
}

// Devolve a vez ao navegador entre as etapas da montagem (nenhuma tarefa longa
// enquanto os textos do hero ainda entram)
function yieldToMain() {
    return new Promise(function (resolve) { setTimeout(resolve, 0); });
}

async function buildBrainNetwork(geometry, rand) {
    // O modelo vem centrado, com o maior lado (frente–trás) = 2
    const mold = new Mesh(geometry);
    const sampler = new MeshSurfaceSampler(mold).setRandomGenerator(rand).build();
    const hasParts = !!geometry.getAttribute('color');
    const p = new Vector3();
    const n = new Vector3();
    const c = new Color();
    const baseSpacing = NODE_SPACING * BRAIN_SCALE;
    const maxLink = baseSpacing * 3.4;   // alcance das ligações (o espaçamento real fica acima do mínimo)

    // Grade espacial (célula = maior ligação): sorteio e vizinhos sem varrer tudo
    const cell = maxLink;
    const grid = new Map();
    const keyOf = (x, y, z) => (Math.floor(x / cell) + 512) * 1048576 + (Math.floor(y / cell) + 512) * 1024 + (Math.floor(z / cell) + 512);
    function around(v, fn) {
        const cx = Math.floor(v.x / cell), cy = Math.floor(v.y / cell), cz = Math.floor(v.z / cell);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
            const list = grid.get((cx + dx + 512) * 1048576 + (cy + dy + 512) * 1024 + (cz + dz + 512));
            if (list) for (let k = 0; k < list.length; k++) fn(list[k]);
        }
    }

    // Superfície: candidatos sorteados por área; aceita só os que ficam a uma
    // distância mínima dos já aceitos (distribuição uniforme, mesmo nas dobras
    // do cerebelo, que têm muita área escondida)
    const nodes = [];
    const normals = [];
    const parts = [];
    const spacing = [];
    for (let tries = 0; nodes.length < NODE_COUNT && tries < NODE_COUNT * 25; tries++) {
        sampler.sample(p, n, c);
        const part = hasParts ? Math.round(c.r * 8) : 1;
        const rule = PART_RULES[part] || PART_RULES.default;
        const r = baseSpacing * rule.spacing;
        // Um pouco para fora da superfície: nós e linhas ficam por cima da máscara
        p.addScaledVector(n, 0.012).multiplyScalar(BRAIN_SCALE);
        let ok = true;
        around(p, function (j) {
            if (ok && nodes[j].distanceToSquared(p) < Math.pow(Math.min(r, spacing[j]), 2)) ok = false;
        });
        if (!ok) continue;
        const i = nodes.length;
        nodes.push(p.clone());
        normals.push(n.clone());
        parts.push(part);
        spacing.push(r);
        const k = keyOf(p.x, p.y, p.z);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(i);
    }
    mold.material.dispose();   // o Mesh cria um material padrão; o molde não é desenhado
    await yieldToMain();

    // Ligações curtas, seguindo a superfície: os vizinhos mais perto da mesma
    // região, com normais parecidas (superfícies que se olham, as duas margens
    // de um sulco ou fissura, não se ligam: os sulcos ficam abertos)
    const N = nodes.length;
    const edges = [];
    const edgeKeys = new Set();
    const adjacency = nodes.map(function () { return []; });
    const d = new Vector3();
    for (let i = 0; i < N; i++) {
        const rule = PART_RULES[parts[i]] || PART_RULES.default;
        const reach = maxLink * rule.spacing;
        const near = [];
        around(nodes[i], function (j) {
            if (j === i || !linkable(parts[i], parts[j])) return;
            if (normals[i].dot(normals[j]) < 0.3) return;
            d.subVectors(nodes[j], nodes[i]);
            const dist = d.length();
            if (dist > reach) return;
            const vertical = Math.abs(d.y) / dist;
            if (rule.dir === 'horizontal' && vertical > 0.4) return;
            if (rule.dir === 'vertical' && vertical < 0.6) return;
            near.push({ j: j, d: dist });
        });
        near.sort(function (a, b) { return a.d - b.d; });
        for (let k = 0; k < Math.min(rule.links, near.length); k++) {
            const j = near[k].j;
            const key = i < j ? i * N + j : j * N + i;
            if (edgeKeys.has(key)) continue;
            edgeKeys.add(key);
            adjacency[i].push(edges.length);
            adjacency[j].push(edges.length);
            edges.push([i, j, near[k].d]);
        }
    }
    return { nodes: nodes, normals: normals, parts: parts, edges: edges, adjacency: adjacency, maxLink: maxLink };
}

/* --------------------------------------------------------------------------
   A cena
   -------------------------------------------------------------------------- */

/**
 * Monta a cena dentro do contêiner (o .landing-visual) e devolve
 * { canvas, dispose }. modelBuffer: o ArrayBuffer do brain.glb (o landing.js
 * baixa em paralelo com o Three.js). Rejeita (sem erro no console) se o
 * modelo não puder ser lido ou se não houver WebGL 2 com aceleração; quem
 * chama mantém o SVG.
 */
export async function createScene(container, modelBuffer) {
    const brainGeometry = parseBrainGLB(modelBuffer);   // lança erro se o arquivo não for o esperado

    const canvas = document.createElement('canvas');
    canvas.className = 'landing-scene';
    canvas.setAttribute('aria-hidden', 'true');

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: dpr < 2,
        premultipliedAlpha: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: true
    });
    if (!gl) {
        brainGeometry.dispose();
        throw new Error('webgl2');
    }

    const renderer = new WebGLRenderer({ canvas: canvas, context: gl, alpha: true, antialias: dpr < 2 });
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.sortObjects = true;

    const styles = getComputedStyle(document.documentElement);
    const COLOR = {
        accent: readToken(styles, '--color-accent', 'rgb(56, 209, 255)'),
        hot: readToken(styles, '--color-accent-active', 'rgb(147, 231, 255)'),
        primary: readToken(styles, '--color-primary', 'rgb(11, 95, 204)'),
        border: readToken(styles, '--color-accent-soft-border', 'rgb(28, 95, 134)')
    };
    const CSS_COLOR = {
        accent: readTokenString(styles, '--color-accent', 'rgb(56, 209, 255)'),
        border: readTokenString(styles, '--color-accent-soft-border', 'rgb(28, 95, 134)'),
        surface: readTokenString(styles, '--color-surface', 'rgb(6, 30, 57)')
    };

    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 1, 60);
    const root = new Group();        // inclina com o mouse
    const brain = new Group();       // gira / oscila
    brain.position.y = BRAIN_Y;
    brain.rotation.x = BRAIN_PITCH_DEG * Math.PI / 180;
    scene.add(root);
    root.add(brain);

    // Tudo o que é criado vai para estas listas, para o dispose()
    const geometries = [];
    const materials = [];
    const textures = [];
    function track(geometry, material) {
        geometries.push(geometry);
        materials.push(material);
    }

    const depthUniforms = { uNear: { value: 10 }, uFar: { value: 16 } };
    const rand = mulberry32(20261125);

    /* ---------- Halo atrás do cérebro (azul primário, como o .brain-halo) ---------- */
    {
        const geometry = new PlaneGeometry(BRAIN_SCALE * 3.1, BRAIN_SCALE * 2.8);
        const material = new ShaderMaterial({
            vertexShader: RADIAL_VERTEX,
            fragmentShader: RADIAL_FRAGMENT,
            uniforms: { uColor: { value: COLOR.primary }, uOpacity: { value: 0.32 * GLOW_INTENSITY }, uPower: { value: 1.6 } },
            transparent: true, depthTest: false, depthWrite: false
        });
        const mesh = new Mesh(geometry, material);
        mesh.position.set(0, BRAIN_Y, -2.8);
        mesh.renderOrder = ORDER.halo;
        root.add(mesh);
        track(geometry, material);
    }

    /* ---------- Base holográfica: chão, feixe, anéis e a onda que pulsa ---------- */
    const base = new Group();
    base.position.y = BASE_Y;
    base.rotation.x = BASE_TILT_X;
    base.scale.set(BASE_SCALE, 1, BASE_SCALE);
    root.add(base);

    {
        const geometry = new CircleGeometry(2.5, 64);
        const material = new ShaderMaterial({
            vertexShader: RADIAL_VERTEX,
            fragmentShader: RADIAL_FRAGMENT,
            uniforms: { uColor: { value: COLOR.accent }, uOpacity: { value: 0.3 * GLOW_INTENSITY }, uPower: { value: 2 } },
            transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending
        });
        const mesh = new Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.renderOrder = ORDER.floor;
        base.add(mesh);
        track(geometry, material);
    }

    {
        // Feixe da base até a parte de baixo do cérebro (o tronco entra nele)
        const height = BRAIN_BOTTOM + 0.15 - BASE_Y;
        const geometry = new CylinderGeometry(1.6, 0.94, height, 48, 1, true);
        const material = new ShaderMaterial({
            vertexShader: RADIAL_VERTEX,
            fragmentShader: BEAM_FRAGMENT,
            uniforms: { uColor: { value: COLOR.accent }, uOpacity: { value: 0.1 * GLOW_INTENSITY } },
            transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending, side: DoubleSide
        });
        const mesh = new Mesh(geometry, material);
        mesh.position.y = height / 2;
        mesh.renderOrder = ORDER.beam;
        base.add(mesh);
        track(geometry, material);
    }

    function circleLines(radius, segments, dashFraction, alpha) {
        // dashFraction = 1: círculo contínuo; < 1: tracejado
        const positions = [];
        const alphas = [];
        for (let i = 0; i < segments; i++) {
            const a0 = (i / segments) * Math.PI * 2;
            const a1 = ((i + dashFraction) / segments) * Math.PI * 2;
            positions.push(Math.cos(a0) * radius, 0, Math.sin(a0) * radius, Math.cos(a1) * radius, 0, Math.sin(a1) * radius);
            alphas.push(alpha(a0), alpha(a1));
        }
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute('aAlpha', new BufferAttribute(new Float32Array(alphas), 1));
        return geometry;
    }

    function lineMaterial(color, opacity, additive) {
        return new ShaderMaterial({
            vertexShader: LINE_VERTEX,
            fragmentShader: LINE_FRAGMENT,
            uniforms: Object.assign({ uColor: { value: color }, uOpacity: { value: opacity }, uRimMin: { value: 1 }, uRimInner: { value: 1 } }, depthUniforms),
            transparent: true, depthTest: false, depthWrite: false,
            blending: additive ? AdditiveBlending : NormalBlending
        });
    }

    const ringDefs = [
        { radius: 2.14, segments: 128, dash: 1, opacity: 0.3 },
        { radius: 1.84, segments: 96, dash: 0.22, opacity: 0.6, spin: 0.05 },
        { radius: 1.5, segments: 128, dash: 1, opacity: 0.5 },
        { radius: 0.96, segments: 96, dash: 1, opacity: 0.95, breathe: true }
    ];
    const breathing = [];
    let ticksRing = null;
    ringDefs.forEach(function (def) {
        const geometry = circleLines(def.radius, def.segments, def.dash, function () { return 1; });
        const material = lineMaterial(COLOR.accent, def.opacity, true);
        const lines = new LineSegments(geometry, material);
        lines.renderOrder = ORDER.rings;
        base.add(lines);
        track(geometry, material);
        if (def.spin) ticksRing = { object: lines, speed: def.spin };
        if (def.breathe) breathing.push(material);
    });

    // Brilho largo do anel de dentro (o filtro de brilho do SVG) e a onda
    function glowRing(radius, width, opacity, inner, outer) {
        const geometry = new RingGeometry(inner || Math.max(radius - width * 3, 0.01), outer || radius + width * 3, 128, 1);
        const material = new ShaderMaterial({
            vertexShader: RING_VERTEX,
            fragmentShader: RING_FRAGMENT,
            uniforms: { uColor: { value: COLOR.accent }, uRadius: { value: radius }, uWidth: { value: width }, uOpacity: { value: opacity } },
            transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending
        });
        const mesh = new Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.renderOrder = ORDER.rings;
        base.add(mesh);
        track(geometry, material);
        return mesh;
    }
    const innerGlow = glowRing(0.96, 0.07, 0.4 * GLOW_INTENSITY);
    breathing.push(innerGlow.material);
    // A onda: um anel que sai do de dentro e some antes da borda (a cada WAVE_PERIOD s)
    const WAVE_PERIOD = 4.8;
    const wave = glowRing(1, 0.05, 0, 0.8, 2.45);

    /* ---------- Cérebro: nós e ligações sobre a forma do modelo ---------- */
    await yieldToMain();
    const network = await buildBrainNetwork(brainGeometry, rand);
    await yieldToMain();
    const nodes = network.nodes;
    const normals = network.normals;
    const N = nodes.length;

    // Máscara: a malha só no buffer de profundidade (não pinta nada). Empurrada
    // um pouco para trás (polygonOffset) para os nós da superfície não piscarem
    {
        const material = new MeshBasicMaterial({
            colorWrite: false, depthWrite: true, depthTest: true,
            polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4
        });
        const mask = new Mesh(brainGeometry, material);
        mask.scale.setScalar(BRAIN_SCALE);
        brain.add(mask);
        track(brainGeometry, material);
    }

    const edges = network.edges;
    const adjacency = network.adjacency;
    const MAX_LINK = network.maxLink;
    const isCerebellum = function (i) { return network.parts[i] === PART.cerebellum; };

    {
        const positions = new Float32Array(edges.length * 6);
        const edgeNormals = new Float32Array(edges.length * 6);
        const alphas = new Float32Array(edges.length * 2);
        edges.forEach(function (edge, e) {
            const a = nodes[edge[0]], b = nodes[edge[1]];
            const na = normals[edge[0]], nb = normals[edge[1]];
            positions.set([a.x, a.y, a.z, b.x, b.y, b.z], e * 6);
            edgeNormals.set([na.x, na.y, na.z, nb.x, nb.y, nb.z], e * 6);
            // Ligações curtas mais fortes
            // Curtas mais fortes; o cerebelo, mais miúdo, um pouco mais fraco
            const alpha = (0.55 - 0.3 * (edge[2] / MAX_LINK)) * (isCerebellum(edge[0]) ? 0.9 : 1);
            alphas[e * 2] = alpha;
            alphas[e * 2 + 1] = alpha;
        });
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(positions, 3));
        geometry.setAttribute('aAlpha', new BufferAttribute(alphas, 1));
        geometry.setAttribute('aNormal', new BufferAttribute(edgeNormals, 3));
        const material = lineMaterial(COLOR.accent, 0.9, true);
        material.uniforms.uRimMin.value = RIM_MIN;
        material.depthTest = true;   // escondidas atrás da máscara
        const lines = new LineSegments(geometry, material);
        lines.renderOrder = ORDER.links;
        brain.add(lines);
        track(geometry, material);
    }

    // Pontos: tamanho em unidades do mundo (o shader converte para px com a distância)
    const pointUniforms = function (color, twinkle) {
        return Object.assign({
            uColor: { value: color },
            uHot: { value: COLOR.hot },
            uGlow: { value: GLOW_INTENSITY },
            uOpacity: { value: 1 },
            uTime: { value: 0 },
            uSizeScale: { value: 1 },
            uTwinkle: { value: twinkle },
            uRimMin: { value: 1 },
            uRimInner: { value: 1 }
        }, depthUniforms);
    };
    function pointMaterial(color, twinkle) {
        const material = new ShaderMaterial({
            vertexShader: POINT_VERTEX,
            fragmentShader: POINT_FRAGMENT,
            uniforms: pointUniforms(color, twinkle),
            transparent: true, depthTest: false, depthWrite: false, blending: AdditiveBlending
        });
        return material;
    }

    const nodeGlow = new Float32Array(N);    // brilho extra quando um impulso chega (decai)
    const nodeBaseAlpha = new Float32Array(N);
    let nodeAlphaAttr;
    const nodeMaterial = pointMaterial(COLOR.accent, 0.35);
    nodeMaterial.uniforms.uRimMin.value = RIM_MIN;
    nodeMaterial.depthTest = true;
    {
        const positions = new Float32Array(N * 3);
        const nodeNormals = new Float32Array(N * 3);
        const sizes = new Float32Array(N);
        const phases = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            positions.set([nodes[i].x, nodes[i].y, nodes[i].z], i * 3);
            nodeNormals.set([normals[i].x, normals[i].y, normals[i].z], i * 3);
            const big = rand() < 0.03;      // uns poucos nós maiores ("acesos" do SVG)
            const small = isCerebellum(i) ? 0.75 : 1;
            sizes[i] = (big ? 0.15 : 0.075 + rand() * 0.025) * small;
            nodeBaseAlpha[i] = big ? 1.2 : 0.8;
            phases[i] = rand() * Math.PI * 2;
        }
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(positions, 3));
        geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
        nodeAlphaAttr = new BufferAttribute(Float32Array.from(nodeBaseAlpha), 1);
        geometry.setAttribute('aAlpha', nodeAlphaAttr);
        geometry.setAttribute('aPhase', new BufferAttribute(phases, 1));
        geometry.setAttribute('aNormal', new BufferAttribute(nodeNormals, 3));
        const points = new Points(geometry, nodeMaterial);
        points.renderOrder = ORDER.nodes;
        brain.add(points);
        track(geometry, nodeMaterial);
    }

    /* ---------- Órbita e satélites ---------- */
    const orbit = new Group();
    orbit.position.y = ORBIT_CENTER_Y;
    orbit.rotation.order = 'ZXY';
    orbit.rotation.z = ORBIT_ROLL_Z;
    orbit.rotation.x = ORBIT_TILT_X;
    root.add(orbit);

    // Órbita tracejada: a metade de trás no tom da borda, a da frente no acento (como no SVG)
    [
        { front: false, color: COLOR.border, opacity: 0.9, order: ORDER.orbitBack, additive: false },
        { front: true, color: COLOR.accent, opacity: 0.45, order: ORDER.orbitFront, additive: true }
    ].forEach(function (half) {
        const geometry = circleLines(ORBIT_RADIUS, 160, 0.38, function (a) {
            const z = Math.sin(a);
            return (half.front ? z >= 0 : z < 0) ? 1 : 0;
        });
        const material = lineMaterial(half.color, half.opacity, half.additive);
        // A metade de trás some atrás do cérebro (máscara de profundidade)
        material.depthTest = !half.front;
        const lines = new LineSegments(geometry, material);
        lines.renderOrder = half.order;
        orbit.add(lines);
        track(geometry, material);
    });

    const satellites = SATELLITES.map(function (def, i) {
        const texture = drawSatellite(document.getElementById(def.icon), CSS_COLOR);
        textures.push(texture);
        const material = new SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
        const sprite = new Sprite(material);
        const scale = SAT_SIZE * SAT_TEXTURE / (SAT_CIRCLE * 2);
        sprite.scale.set(scale, scale, 1);
        orbit.add(sprite);
        materials.push(material);
        return {
            sprite: sprite,
            material: material,
            // No SVG o ângulo cresce no sentido horário (y para baixo); aqui, z para a câmera
            angle: def.angle * Math.PI / 180,
            bob: i * 1.3
        };
    });

    // Linha fraca de cada satélite até a borda do cérebro, com um impulso que vai para dentro
    const satLinkPositions = new Float32Array(SATELLITES.length * 6);
    const satLinkAlphas = new Float32Array(SATELLITES.length * 2);
    for (let i = 0; i < SATELLITES.length; i++) {
        satLinkAlphas[i * 2] = 0.32;
        satLinkAlphas[i * 2 + 1] = 0;
    }
    const satLinkGeometry = new BufferGeometry();
    const satLinkPosAttr = new BufferAttribute(satLinkPositions, 3);
    satLinkGeometry.setAttribute('position', satLinkPosAttr);
    satLinkGeometry.setAttribute('aAlpha', new BufferAttribute(satLinkAlphas, 1));
    {
        const material = lineMaterial(COLOR.accent, 0.6, true);
        const lines = new LineSegments(satLinkGeometry, material);
        lines.renderOrder = ORDER.satLinks;
        lines.frustumCulled = false;
        root.add(lines);
        track(satLinkGeometry, material);
    }

    /* ---------- Impulsos: cometas curtos ---------- */
    const TRAIL = 3;
    function pulseLayer(count, sizes, parent) {
        const positions = new Float32Array(count * TRAIL * 3);
        const alphas = new Float32Array(count * TRAIL);
        const sizeArray = new Float32Array(count * TRAIL);
        for (let i = 0; i < count * TRAIL; i++) sizeArray[i] = sizes[i % TRAIL];
        const geometry = new BufferGeometry();
        const posAttr = new BufferAttribute(positions, 3);
        const alphaAttr = new BufferAttribute(alphas, 1);
        geometry.setAttribute('position', posAttr);
        geometry.setAttribute('aSize', new BufferAttribute(sizeArray, 1));
        geometry.setAttribute('aAlpha', alphaAttr);
        geometry.setAttribute('aPhase', new BufferAttribute(new Float32Array(count * TRAIL), 1));
        const material = pointMaterial(COLOR.hot, 0);
        const points = new Points(geometry, material);
        points.renderOrder = ORDER.pulses;
        points.frustumCulled = false;
        parent.add(points);
        track(geometry, material);
        return { positions: positions, alphas: alphas, posAttr: posAttr, alphaAttr: alphaAttr, material: material };
    }
    // Os da rede andam no espaço do cérebro (giram com ele); os dos satélites, no root
    const brainPulses = pulseLayer(PULSE_COUNT, [0.2, 0.14, 0.1], brain);
    brainPulses.material.depthTest = true;
    const satPulses = pulseLayer(SATELLITES.length, [0.22, 0.15, 0.1], root);

    const pulses = [];
    for (let p = 0; p < PULSE_COUNT && edges.length; p++) {
        const e = Math.floor(rand() * edges.length);
        pulses.push({ edge: e, from: edges[e][0], t: rand(), life: rand() * 6 });
    }

    function nextEdge(node, cameFrom) {
        const options = adjacency[node];
        if (!options.length) return cameFrom;
        let e = options[Math.floor(Math.random() * options.length)];
        if (e === cameFrom && options.length > 1) e = options[(options.indexOf(e) + 1) % options.length];
        return e;
    }

    /* ---------- Câmera e tamanho ---------- */
    function resize() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        // O quadro do SVG (600 de altura) ocupa a altura do contêiner; o canvas
        // é maior (sangra para os lados, ver .landing-scene no CSS)
        const frame = FRAME_HEIGHT * height / Math.max(container.clientHeight, 1);
        const tanHalf = Math.tan((FOV * Math.PI / 180) / 2);
        const distance = (frame / 2) / tanHalf;
        camera.aspect = width / height;
        camera.position.set(0, 0, distance);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        depthUniforms.uNear.value = distance - 2.4;
        depthUniforms.uFar.value = distance + 2.4;
        // px do dispositivo por unidade do mundo, a 1 unidade da câmera
        const sizeScale = (height * dpr) / (2 * tanHalf);
        nodeMaterial.uniforms.uSizeScale.value = sizeScale;
        brainPulses.material.uniforms.uSizeScale.value = sizeScale;
        satPulses.material.uniforms.uSizeScale.value = sizeScale;
    }

    /* ---------- Mouse: inclinação suave (só quem chama com ponteiro fino) ---------- */
    let targetYaw = 0, targetPitch = 0, yaw = 0, pitch = 0;
    const tiltMax = TILT_MAX_DEG * Math.PI / 180;
    function onPointerMove(event) {
        if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        const nx = (event.clientX / window.innerWidth) * 2 - 1;
        const ny = (event.clientY / window.innerHeight) * 2 - 1;
        targetYaw = nx * tiltMax;
        targetPitch = ny * tiltMax * 0.6;
    }
    function onPointerLeave() {
        targetYaw = 0;
        targetPitch = 0;
    }

    /* ---------- Quadro a quadro ---------- */
    const startYaw = START_YAW_DEG * Math.PI / 180;
    const spinSpeed = (Math.PI * 2) / ROTATION_PERIOD;
    let time = 0;
    let last = 0;
    const satWorld = new Vector3();
    const brainCenter = new Vector3(0, BRAIN_Y, 0);
    const linkEnd = new Vector3();
    const point = new Vector3();
    const rimRadius = BRAIN_SCALE * 0.8;   // onde a linha do satélite encosta no cérebro

    function brainYaw(t) {
        return startYaw + t * spinSpeed;
    }

    function update(dt) {
        time += dt;

        // Inclinação: aproxima exponencialmente (sem passar do alvo, sem quique)
        const k = 1 - Math.exp(-dt * TILT_RESPONSE);
        yaw += (targetYaw - yaw) * k;
        pitch += (targetPitch - pitch) * k;
        root.rotation.y = yaw;
        root.rotation.x = pitch;

        brain.rotation.y = brainYaw(time);
        if (ticksRing) ticksRing.object.rotation.y = time * ticksRing.speed;

        // Base: o anel de dentro "respira" e uma onda sai dele
        const breath = 0.82 + 0.18 * Math.sin(time * (Math.PI * 2 / 3.6));
        breathing.forEach(function (m) {
            if (m.userData.base === undefined) m.userData.base = m.uniforms.uOpacity.value;
            m.uniforms.uOpacity.value = m.userData.base * breath;
        });
        const w = (time % WAVE_PERIOD) / WAVE_PERIOD;
        wave.material.uniforms.uRadius.value = 0.96 + w * 1.3;
        wave.material.uniforms.uOpacity.value = 0.3 * GLOW_INTENSITY * Math.sin(Math.PI * Math.min(w * 1.2, 1));

        nodeMaterial.uniforms.uTime.value = time;

        // Nós: o brilho de chegada decai
        const decay = Math.exp(-dt * 2.6);
        for (let i = 0; i < N; i++) {
            nodeGlow[i] *= decay;
            nodeAlphaAttr.array[i] = nodeBaseAlpha[i] + nodeGlow[i];
        }

        // Impulsos da rede (no espaço do cérebro)
        let slot = 0;
        for (let p = 0; p < pulses.length; p++) {
            const pulse = pulses[p];
            const edge = edges[pulse.edge];
            pulse.t += (PULSE_SPEED * dt) / edge[2];
            pulse.life += dt;
            if (pulse.t >= 1) {
                const reached = edge[0] === pulse.from ? edge[1] : edge[0];
                nodeGlow[reached] = Math.min(nodeGlow[reached] + 0.8, 1.2);
                pulse.edge = nextEdge(reached, pulse.edge);
                pulse.from = reached;
                pulse.t = 0;
            }
            const e = edges[pulse.edge];
            const fromNode = nodes[pulse.from];
            const toNode = nodes[e[0] === pulse.from ? e[1] : e[0]];
            // Aparece devagar no começo da vida (nunca acende de uma vez)
            const fade = Math.min(1, pulse.life / 0.8);
            for (let k2 = 0; k2 < TRAIL; k2++) {
                const t = Math.max(0, pulse.t - k2 * 0.09);
                point.copy(fromNode).lerp(toNode, t);
                brainPulses.positions.set([point.x, point.y, point.z], slot * 3);
                brainPulses.alphas[slot] = (k2 === 0 ? 1.7 : k2 === 1 ? 0.75 : 0.4) * fade;
                slot++;
            }
        }

        // Satélites: andam na órbita, sobem e descem de leve; os de trás ficam atrás do cérebro
        orbit.updateMatrixWorld(true);
        root.updateMatrixWorld(true);
        slot = 0;
        for (let i = 0; i < satellites.length; i++) {
            const sat = satellites[i];
            const a = sat.angle + time * ORBIT_SPEED;
            const bob = Math.sin(time * 0.9 + sat.bob) * 0.05;
            sat.sprite.position.set(Math.cos(a) * ORBIT_RADIUS, bob, Math.sin(a) * ORBIT_RADIUS);
            const front = Math.sin(a);  // −1 atrás … 1 na frente
            const t = Math.min(Math.max((front + 0.7) / 1.4, 0), 1);
            sat.material.opacity = 0.42 + 0.58 * t * t * (3 - 2 * t);
            sat.sprite.renderOrder = front >= 0 ? ORDER.satFront : ORDER.satBack;
            // Atrás: o cérebro encobre o satélite (máscara de profundidade); na frente, sempre por cima
            sat.material.depthTest = front < 0;

            // Linha até a borda do cérebro (no espaço do root)
            satWorld.copy(sat.sprite.position);
            orbit.localToWorld(satWorld);
            root.worldToLocal(satWorld);
            linkEnd.copy(satWorld).sub(brainCenter).normalize().multiplyScalar(rimRadius).add(brainCenter);
            satLinkPositions.set([satWorld.x, satWorld.y, satWorld.z, linkEnd.x, linkEnd.y, linkEnd.z], i * 6);

            // Impulso do satélite para o cérebro: 1,4 s de viagem a cada 4,2 s, defasados
            const cycle = ((time + i * 0.7) % 4.2) / 1.4;
            for (let k2 = 0; k2 < TRAIL; k2++) {
                const t2 = Math.min(Math.max(cycle - k2 * 0.07, 0), 1);
                point.copy(satWorld).lerp(linkEnd, t2);
                satPulses.positions.set([point.x, point.y, point.z], slot * 3);
                const alive = cycle <= 1 ? Math.sin(Math.PI * cycle) : 0;
                satPulses.alphas[slot] = (k2 === 0 ? 0.9 : 0.4) * alive;
                slot++;
            }
        }

        nodeAlphaAttr.needsUpdate = true;
        brainPulses.posAttr.needsUpdate = true;
        brainPulses.alphaAttr.needsUpdate = true;
        satPulses.posAttr.needsUpdate = true;
        satPulses.alphaAttr.needsUpdate = true;
        satLinkPosAttr.needsUpdate = true;
    }

    function frame(now) {
        const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
        last = now;
        update(dt);
        renderer.render(scene, camera);
    }

    /* ---------- Pausas: fora da tela e com a aba oculta ---------- */
    let onScreen = true;
    let running = false;
    let disposed = false;
    function syncLoop() {
        const shouldRun = !disposed && onScreen && !document.hidden;
        if (shouldRun === running) return;
        running = shouldRun;
        last = 0;   // na volta, não "pula" o tempo que ficou parado
        renderer.setAnimationLoop(shouldRun ? frame : null);
    }

    const observer = 'IntersectionObserver' in window
        ? new IntersectionObserver(function (entries) {
            onScreen = entries[entries.length - 1].isIntersecting;
            syncLoop();
        })
        : null;
    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;

    await yieldToMain();
    container.appendChild(canvas);
    resize();
    update(0);
    // Shaders: em paralelo quando a GPU tem KHR_parallel_shader_compile; sem ela,
    // numa etapa própria (sem aviso no console), antes do primeiro quadro
    if (renderer.extensions.has('KHR_parallel_shader_compile')) {
        await renderer.compileAsync(scene, camera);
    } else {
        renderer.compile(scene, camera);
        await yieldToMain();
    }
    renderer.render(scene, camera);

    if (observer) observer.observe(container);
    if (resizeObserver) resizeObserver.observe(container);
    document.addEventListener('visibilitychange', syncLoop);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    syncLoop();

    function dispose() {
        if (disposed) return;
        disposed = true;
        renderer.setAnimationLoop(null);
        if (observer) observer.disconnect();
        if (resizeObserver) resizeObserver.disconnect();
        document.removeEventListener('visibilitychange', syncLoop);
        window.removeEventListener('pointermove', onPointerMove);
        document.documentElement.removeEventListener('pointerleave', onPointerLeave);
        geometries.forEach(function (g) { g.dispose(); });
        materials.forEach(function (m) { m.dispose(); });
        textures.forEach(function (t) { t.dispose(); });
        renderer.dispose();
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }

    // Resolve depois do primeiro quadro desenhado: quem chama já pode fazer o crossfade
    return new Promise(function (resolve) {
        requestAnimationFrame(function () {
            resolve({ canvas: canvas, dispose: dispose });
        });
    });
}
