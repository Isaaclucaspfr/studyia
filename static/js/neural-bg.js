/* ==========================================================================
   StudyIA — Fundo de rede neural animada (login e cadastro, PR 3)

   Só decoração: um <canvas> 2D atrás da página, com nós que flutuam devagar
   e linhas finas entre os nós próximos (mais transparentes quanto mais longe).
   Não muda nada da página, não lê nem envia dado nenhum.

   - Cor: o --color-accent do tema, multiplicado pelo --network-strength
     (tokens.css). Troca ao vivo quando o tema muda (seletor ou sistema).
   - Movimento reduzido (prefers-reduced-motion): um quadro parado, sem animar.
   - Desempenho: nós proporcionais à área (menos no celular), pixel ratio no
     máximo 1,5, pausa com a aba oculta, um único conjunto de listeners.
   - Ponteiro (só mouse/trackpad): os nós perto dele ganham uma linha fraca
     até o ponteiro.
   - Melhoria progressiva: sem JS, ou sem canvas 2D, fica o fundo estático
     (--pattern-network no CSS). Com a rede rodando, o <html> ganha a classe
     .neural-bg-active e o CSS tira o fundo estático.

   Carregado só no login e no cadastro (bloco scripts_extra do base.html).
   Independente do app.js, do theme.js, do forms.js e do auth.js.
   Reaproveitável: em outra página, basta carregar o arquivo (o canvas é
   criado aqui, em tela cheia) e ter o CSS .neural-bg / .neural-bg-active.
   ========================================================================== */

(function () {
    'use strict';

    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return; // sem canvas: fica o fundo estático do CSS

    // ---------- Ajustes (px de CSS) ----------
    // Densidade: 1 nó a cada AREA_PER_NODE px² da janela, entre MIN e MAX.
    //   1440 × 900 → 185 → 180 nós · 375 × 812 → 43 nós
    var AREA_PER_NODE = 7000;   // ≈ 84 × 84 px por nó
    var MIN_NODES = 24;
    var MAX_NODES = 180;
    // Distância máxima de ligação: LINK_FACTOR × o lado da célula de cada nó,
    // entre LINK_MIN e LINK_MAX. Com 7000 px²: ≈ 126 px (≈ 7 vizinhos ao
    // alcance, mas só os mais perto aparecem bem: a opacidade cai com a distância).
    var LINK_FACTOR = 1.5;
    var LINK_MIN = 100;
    var LINK_MAX = 150;
    var SPEED_MIN = 4;          // px por segundo
    var SPEED_MAX = 11;
    var NODE_RADIUS = 1.5;
    var NODE_ALPHA = 0.42;      // antes do --network-strength; nós um pouco mais visíveis que as linhas
    var LINE_ALPHA = 0.16;      // linha mais curta; vai a 0 na distância máxima
    var ALPHA_STEPS = 8;        // linhas agrupadas em 8 faixas de opacidade: 8 stroke() por quadro, não 1 por linha
    var LINE_WIDTH = 1;
    var POINTER_ALPHA = 0.14;
    var MAX_DPR = 1.5;

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    var width = 0;
    var height = 0;
    var linkDist = 140;
    var nodes = [];
    var color = '#0B5FCC';
    var strength = 1;
    var pointer = null;   // {x, y} ou null
    var frame = 0;        // id do requestAnimationFrame (0 = parado)
    var last = 0;
    var resizeQueued = false;
    var buckets = [];     // segmentos por faixa de opacidade (reaproveitados)
    for (var bk = 0; bk < ALPHA_STEPS; bk++) buckets.push([]);

    canvas.className = 'neural-bg';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('role', 'presentation');

    function readTheme() {
        var styles = getComputedStyle(document.documentElement);
        color = styles.getPropertyValue('--color-accent').trim() || color;
        var s = parseFloat(styles.getPropertyValue('--network-strength'));
        strength = isNaN(s) ? 1 : s;
    }

    // Distribuição uniforme: uma grade com um nó sorteado dentro de cada célula
    // (sem aglomerar e sem cara de grade).
    function makeNodes() {
        var target = Math.round((width * height) / AREA_PER_NODE);
        var count = Math.max(MIN_NODES, Math.min(MAX_NODES, target));
        var cols = Math.max(1, Math.round(Math.sqrt(count * width / height)));
        var rows = Math.max(1, Math.ceil(count / cols));
        var cw = width / cols;
        var ch = height / rows;
        var list = [];
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var angle = Math.random() * Math.PI * 2;
                var speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
                list.push({
                    x: (c + 0.15 + Math.random() * 0.7) * cw,
                    y: (r + 0.15 + Math.random() * 0.7) * ch,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed
                });
            }
        }
        nodes = list;
        linkDist = Math.max(LINK_MIN, Math.min(LINK_MAX, Math.sqrt(cw * ch) * LINK_FACTOR));
    }

    function resize() {
        resizeQueued = false;
        var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        var w = window.innerWidth;
        var h = window.innerHeight;
        if (w === width && h === height && canvas.width === Math.round(w * dpr)) return;
        var oldW = width;
        var oldH = height;
        width = w;
        height = h;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Mudança pequena (barra do navegador no celular): só reescala as posições.
        // Mudança grande: refaz os nós (o array antigo é descartado inteiro).
        if (nodes.length && oldW && Math.abs(w - oldW) < 80 && Math.abs(h - oldH) < 160) {
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].x *= w / oldW;
                nodes[i].y *= h / oldH;
            }
        } else {
            makeNodes();
        }
        draw();
    }

    function step(dt) {
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            n.x += n.vx * dt;
            n.y += n.vy * dt;
            // Rebate na borda (sem teletransporte: as linhas não "pulam")
            if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx); }
            else if (n.x > width) { n.x = width; n.vx = -Math.abs(n.vx); }
            if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy); }
            else if (n.y > height) { n.y = height; n.vy = -Math.abs(n.vy); }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = LINE_WIDTH;

        // Opacidade = 1 − (d/máx)²: cai devagar no começo e rápido no fim, então
        // as ligações médias continuam visíveis (malha contínua) e as longas somem.
        // Cada linha vai para uma das ALPHA_STEPS faixas; um stroke() por faixa.
        var max2 = linkDist * linkDist;
        var i, j, k, a, b, dx, dy, d2;
        for (k = 0; k < ALPHA_STEPS; k++) buckets[k].length = 0; // reaproveita: sem lixo por quadro
        for (i = 0; i < nodes.length; i++) {
            a = nodes[i];
            for (j = i + 1; j < nodes.length; j++) {
                b = nodes[j];
                dx = a.x - b.x;
                dy = a.y - b.y;
                d2 = dx * dx + dy * dy;
                if (d2 < max2) {
                    k = Math.min(ALPHA_STEPS - 1, Math.floor((1 - d2 / max2) * ALPHA_STEPS));
                    buckets[k].push(a.x, a.y, b.x, b.y);
                }
            }
        }
        for (k = 0; k < ALPHA_STEPS; k++) {
            var seg = buckets[k];
            if (!seg.length) continue;
            ctx.globalAlpha = LINE_ALPHA * strength * (k + 0.5) / ALPHA_STEPS;
            ctx.beginPath();
            for (j = 0; j < seg.length; j += 4) {
                ctx.moveTo(seg[j], seg[j + 1]);
                ctx.lineTo(seg[j + 2], seg[j + 3]);
            }
            ctx.stroke();
        }

        if (pointer) {
            var pd = linkDist * 1.1;
            for (i = 0; i < nodes.length; i++) {
                a = nodes[i];
                dx = a.x - pointer.x;
                dy = a.y - pointer.y;
                d2 = dx * dx + dy * dy;
                if (d2 < pd * pd) {
                    ctx.globalAlpha = POINTER_ALPHA * strength * (1 - Math.sqrt(d2) / pd);
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(pointer.x, pointer.y);
                    ctx.stroke();
                }
            }
        }

        ctx.globalAlpha = NODE_ALPHA * strength;
        ctx.beginPath();
        for (i = 0; i < nodes.length; i++) {
            ctx.moveTo(nodes[i].x + NODE_RADIUS, nodes[i].y);
            ctx.arc(nodes[i].x, nodes[i].y, NODE_RADIUS, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    function tick(now) {
        // dt limitado: depois de uma pausa longa, os nós não dão um salto
        var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
        last = now;
        step(dt);
        draw();
        frame = window.requestAnimationFrame(tick);
    }

    function start() {
        if (frame || reducedMotion.matches || document.hidden) return;
        last = 0;
        frame = window.requestAnimationFrame(tick);
    }

    function stop() {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
    }

    // Movimento reduzido: para no quadro atual (continua desenhado, parado)
    function onMotionChange() {
        if (reducedMotion.matches) { stop(); draw(); }
        else start();
    }

    // Tema: o seletor troca o data-theme do <html>; "Dispositivo" segue o sistema.
    // O valor só muda depois do recálculo de estilo: lê no próximo quadro.
    function onThemeChange() {
        window.requestAnimationFrame(function () {
            readTheme();
            draw();
        });
    }

    function onPointerMove(event) {
        if (event.pointerType !== 'mouse' || !finePointer.matches) return;
        pointer = { x: event.clientX, y: event.clientY };
        if (!frame) draw(); // parado (movimento reduzido): redesenha uma vez
    }

    function onPointerLeave() {
        pointer = null;
        if (!frame) draw();
    }

    function listen(mql, fn) {
        if (mql.addEventListener) mql.addEventListener('change', fn);
        else if (mql.addListener) mql.addListener(fn); // Safari antigo
    }

    function init() {
        document.body.appendChild(canvas);
        document.documentElement.classList.add('neural-bg-active');
        readTheme();
        resize();

        window.addEventListener('resize', function () {
            if (resizeQueued) return;
            resizeQueued = true;
            window.requestAnimationFrame(resize);
        }, { passive: true });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop();
            else start();
        });
        // Voltar pelo histórico (bfcache): retoma; sair: para
        window.addEventListener('pageshow', start);
        window.addEventListener('pagehide', stop);

        listen(reducedMotion, onMotionChange);
        listen(darkScheme, onThemeChange);
        new MutationObserver(onThemeChange).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', onPointerLeave);

        start();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
