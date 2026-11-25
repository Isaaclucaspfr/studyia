/* ==========================================================================
   StudyIA — Animações da landing (features/04, PR 4, Fase 1)

   Só aparência: entrada do hero e revelação dos passos e dos benefícios ao
   rolar, com GSAP 3.15.1 + ScrollTrigger (static/vendor/gsap/3.15.1/).
   Não lê nem envia dado nenhum. Independente do app.js, do theme.js, do
   forms.js e do neural-bg.js (nenhum usa nada do outro).

   Regras (docs/features/04 §5.7):
   - Tudo dentro de gsap.matchMedia('(prefers-reduced-motion: no-preference)'):
     com movimento reduzido nada anima e a página fica no estado final.
   - Sem JS (ou sem GSAP), o conteúdo está visível. Só o hero começa
     invisível, e só com a classe .js + sem movimento reduzido (landing.css),
     com uma trava que o mostra sozinho em 1,6 s.
   - Só transform e opacity. Entrada curta (nenhum trecho passa de ~1 s).
   - O laço do cérebro (satélites flutuando, nós pulsando) pausa quando o
     hero sai da tela ou a aba fica oculta (o ticker do GSAP para sozinho).

   Fase 2 (cena 3D, fim do arquivo): no desktop capaz (o script do <head> do
   landing.html marca <html class="scene-3d">), o SVG nem aparece: o cérebro
   3D entra depois dos CTAs. Se ele falhar ou atrasar, o SVG entra no lugar.
   Ajustes da Fase 1 (25/11/2026): hero em tela cheia com o "role para
   explorar" (entrada no link data-hero; o wrapper data-hero-hint some ao
   rolar, como no site da Rosso), passos com print (data-step-text/-shot).
   ========================================================================== */

(function () {
    'use strict';

    var hero = document.querySelector('.landing-hero');
    var heroItems = document.querySelectorAll('.landing [data-hero]');
    var visual = document.querySelector('.landing [data-hero-visual]');
    var hint = document.querySelector('.landing [data-hero-hint]');

    // O "role para explorar" some entre a rolagem 0 e 20% da altura do hero.
    // Posições absolutas de rolagem (e não 'top top'): o hero começa abaixo da
    // navbar, então 'top top' só começaria depois de 56 px rolados
    var HINT_FADE = 0.2;
    function hintEnd() {
        return Math.round(hero.offsetHeight * HINT_FADE);
    }

    // Estado dividido entre as animações (Fase 1) e a cena 3D (Fase 2)
    var root = document.documentElement;
    var sceneQuery = window.matchMedia
        ? window.matchMedia('(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
        : null;
    var svgLoop = null;         // laço do cérebro SVG (satélites flutuando, nós pulsando)
    var sceneActive = false;    // a cena 3D está na tela: o laço do SVG fica parado

    // O SVG está visível? Não com a cena na tela, nem no desktop capaz enquanto
    // a cena carrega (o CSS esconde: .scene-3d), salvo se ela falhou (.is-fallback)
    function svgShown() {
        if (sceneActive) return false;
        if (visual && visual.classList.contains('is-fallback')) return true;
        return !(root.classList.contains('scene-3d') && sceneQuery && sceneQuery.matches);
    }
    var introDone = false;
    var introWaiters = [];
    function markIntroDone() {
        if (introDone) return;
        introDone = true;
        introWaiters.splice(0).forEach(function (fn) { fn(); });
    }
    function whenIntroDone(fn) {
        if (introDone) fn(); else introWaiters.push(fn);
    }

    // Título e apoio terminaram de entrar (animação só de CSS, landing-rise):
    // é a deixa do cérebro 3D. Com a curva ease-out, aos 70% do tempo o apoio
    // já está visualmente parado no lugar: a deixa vem aí. Trava de 1,5 s
    var textDone = false;
    var textWaiters = [];
    function markTextDone() {
        if (textDone) return;
        textDone = true;
        textWaiters.splice(0).forEach(function (fn) { fn(); });
    }
    function whenTextDone(fn) {
        if (textDone) fn(); else textWaiters.push(fn);
    }
    (function watchHeroText() {
        var lead = document.querySelector('.landing-lead');
        var running = lead && lead.getAnimations
            ? lead.getAnimations().filter(function (a) { return a.playState !== 'finished'; })
            : [];
        if (!running.length) { markTextDone(); return; }
        Promise.all(running.map(function (a) { return a.finished; })).then(markTextDone, markTextDone);
        try {
            var timing = running[0].effect.getComputedTiming();
            var cue = (timing.delay || 0) + timing.duration * 0.7;
            window.setTimeout(markTextDone, Math.max(0, cue - (running[0].currentTime || 0)));
        } catch (e) { /* sem a API: fica o fim da animação */ }
        window.setTimeout(markTextDone, 1500);
    })();

    // Sem GSAP (arquivo não carregou): mostra o hero na hora, sem esperar a trava do CSS
    function reveal() {
        Array.prototype.forEach.call(heroItems, function (el) {
            el.style.animation = 'none';
            el.style.opacity = '1';
        });
        if (visual) {
            visual.style.animation = 'none';
            visual.style.opacity = '1';
        }
    }

    initMotion();
    initScene();

    function initMotion() {
    if (!window.gsap || !hero) {
        reveal();
        markIntroDone();
        return;
    }

    var gsap = window.gsap;
    var hasScrollTrigger = !!window.ScrollTrigger;
    if (hasScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // Curva "ease-out" forte, a mesma do --ease-out do tokens.css (rápida no começo)
    var EASE = 'expo.out';

    var mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', function () {
        // ---------- Hero: título, apoio, CTAs e cérebro em sequência curta ----------

        // Daqui em diante o GSAP manda na opacidade: tira a trava do CSS
        gsap.set(heroItems, { animation: 'none' });
        if (visual) gsap.set(visual, { animation: 'none' });

        // CTAs e "role para explorar" logo depois do título e do apoio (que entram
        // só com CSS, landing.css): entrada curta, para o cérebro vir em seguida
        var intro = gsap.timeline({ defaults: { ease: EASE }, delay: 0.12 });
        intro.fromTo(heroItems,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 }
        );

        var brain = visual && visual.querySelector('.brain');
        // No desktop capaz o SVG não aparece: a entrada dele não roda (se a cena
        // falhar, ele entra só com o fade do CSS, já no estado final)
        var svgEntrance = svgShown();
        if (visual && brain) {
            var core = brain.querySelector('.brain-core');
            var base = brain.querySelector('.brain-base');
            var sats = brain.querySelectorAll('.brain-sat');
            var hot = brain.querySelectorAll('.brain-hot circle');

            intro.fromTo(visual,
                { opacity: 0 },
                { opacity: 1, duration: 0.6, ease: 'power1.out' },
                0.1
            );
            if (base && svgEntrance) {
                intro.fromTo(base,
                    { opacity: 0, scaleX: 0.7, svgOrigin: '320 512' },
                    { opacity: 1, scaleX: 1, duration: 1 },
                    0.15
                );
            }
            if (core && svgEntrance) {
                intro.fromTo(core,
                    { opacity: 0, y: 18, scale: 0.96, svgOrigin: '320 230' },
                    { opacity: 1, y: 0, scale: 1, duration: 1 },
                    0.2
                );
            }
            if (sats.length && svgEntrance) {
                intro.fromTo(sats,
                    { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' },
                    { opacity: function (i, el) { return el.classList.contains('brain-sat--back') ? 0.55 : 1; },
                      scale: 1, duration: 0.7, stagger: 0.06 },
                    0.45
                );
            }

            // ---------- Laço discreto (depois da entrada) ----------
            // Satélites sobem e descem devagar, fora de fase; os nós acesos pulsam.
            var loop = svgLoop = gsap.timeline({ paused: true, repeat: -1 });
            Array.prototype.forEach.call(sats, function (sat, i) {
                loop.to(sat, {
                    y: i % 2 ? 5 : -5,
                    duration: 3 + (i % 3) * 0.6,
                    ease: 'sine.inOut',
                    yoyo: true,
                    repeat: 1
                }, i * 0.35);
            });
            if (hot.length) {
                loop.to(hot, {
                    opacity: 0.45,
                    duration: 1.8,
                    ease: 'sine.inOut',
                    stagger: { each: 0.5, yoyo: true, repeat: 1 }
                }, 0);
            }

            intro.call(function () {
                if (svgShown()) loop.play();
                markIntroDone();
            });

            // Fora da tela, o laço para (não gasta CPU com o cérebro invisível)
            if (hasScrollTrigger) {
                window.ScrollTrigger.create({
                    trigger: hero,
                    start: 'top bottom',
                    end: 'bottom top',
                    onToggle: function (self) {
                        if (!intro.isActive() && intro.progress() === 1) {
                            if (self.isActive && svgShown()) loop.play(); else loop.pause();
                        }
                    }
                });
            }
        }

        if (!(visual && brain)) intro.call(markIntroDone);

        // ---------- Seções: revelação suave ao entrar na tela ----------
        // gsap.from: o estado final é o do HTML. Os itens só ficam escondidos
        // depois que este código roda (fora da tela), nunca pelo CSS.
        if (hasScrollTrigger) {
            // Títulos, cabeçalhos e blocos marcados com data-reveal, por seção, em cascata
            var sections = document.querySelectorAll('.landing-section');
            Array.prototype.forEach.call(sections, function (section) {
                var items = section.querySelectorAll('[data-reveal]');
                if (!items.length) return;
                gsap.from(items, {
                    opacity: 0,
                    y: 28,
                    duration: 0.8,
                    ease: EASE,
                    stagger: 0.08,
                    scrollTrigger: { trigger: items[0], start: 'top 85%', once: true }
                });
            });

            // Passos: o texto chega do lado dele e o print sobe logo depois
            var steps = document.querySelectorAll('.step');
            Array.prototype.forEach.call(steps, function (step, i) {
                var text = step.querySelector('[data-step-text]');
                var shot = step.querySelector('[data-step-shot]');
                var tl = gsap.timeline({
                    defaults: { ease: EASE, duration: 0.9 },
                    scrollTrigger: { trigger: step, start: 'top 80%', once: true }
                });
                if (text) tl.from(text, { opacity: 0, x: i % 2 ? 24 : -24 });
                if (shot) tl.from(shot, { opacity: 0, y: 36, scale: 0.98, transformOrigin: '50% 100%' }, 0.08);
            });
        }

        // ---------- "Role para explorar": some aos poucos ao rolar ----------
        // Opacidade ligada à rolagem (scrub: true, sem suavização = sem atraso):
        // 1 no topo, 0 a 20% da altura do hero; volta ao subir. autoAlpha põe
        // visibility: hidden no fim, então ele invisível não recebe clique nem Tab.
        if (hint && hasScrollTrigger) {
            gsap.fromTo(hint, { autoAlpha: 1 }, {
                autoAlpha: 0,
                ease: 'none',
                scrollTrigger: {
                    start: 0,
                    end: hintEnd,
                    scrub: true,
                    invalidateOnRefresh: true
                }
            });
        }

        // Ao sair do modo (o usuário liga o movimento reduzido), o matchMedia
        // desfaz tudo e a página volta ao estado final do HTML.
        return function () {};
    });

    // Movimento reduzido: nada anima; garante o hero visível (a regra do CSS
    // não vale com reduce, mas o usuário pode trocar a preferência com a página aberta)
    mm.add('(prefers-reduced-motion: reduce)', function () {
        reveal();
        markIntroDone();

        // O "role para explorar" some de uma vez no mesmo ponto (sem transição) e volta ao subir
        if (hint && hasScrollTrigger) {
            window.ScrollTrigger.create({
                start: 0,
                end: hintEnd,
                invalidateOnRefresh: true,
                onLeave: function () { gsap.set(hint, { autoAlpha: 0 }); },
                onEnterBack: function () { gsap.set(hint, { autoAlpha: 1 }); }
            });
            // Página aberta já rolada (recarregar no meio): começa escondido
            if (window.scrollY > hintEnd()) gsap.set(hint, { autoAlpha: 0 });
        }
        return function () { if (hint) gsap.set(hint, { clearProps: 'opacity,visibility' }); };
    });
    }

    /* ======================================================================
       Fase 2: a cena 3D (Three.js 0.187.0, static/vendor/three/0.187.0/)

       Só no desktop: largura ≥ 768 px, ponteiro fino, sem movimento reduzido
       e com WebGL 2 acelerado. Fora disso, nem o landing-scene.js, nem o
       Three.js, nem o modelo do cérebro (static/vendor/models/brain/) são
       baixados: fica o cérebro SVG (features/04 §5.6, decisão 2).
       - Decisão antes da primeira pintura: o script do <head> do landing.html
         testa as condições, marca <html class="scene-3d"> e adianta os
         downloads (modulepreload + preload do modelo). Com a classe, o CSS
         esconde o SVG: o espaço fica reservado (aspect-ratio) e vazio.
       - O cérebro 3D entra logo depois dos textos (título → apoio → CTAs →
         cérebro): a cena é montada assim que os arquivos chegam (em etapas
         curtas, sem travar a entrada dos CTAs) e surge com fade e escala
         (.is-3d no CSS, ≈ 0,55 s) quando o título e o apoio terminam de
         entrar, ou assim que ficar pronta, se chegar depois. Sem salto de layout.
       - Rede de segurança: se a cena falhar (sem WebGL, sem rede, erro) ou não
         ficar pronta em FALLBACK_MS, o SVG entra com fade (.is-fallback) e a
         cena não assume mais nesta visita (nada de troca tardia).
       - Sem a classe (janela que começou estreita e depois alargou), a cena
         carrega depois do load e entra por cima do SVG, com crossfade.
       - Com a cena na tela, o laço GSAP do SVG para. Sai da faixa (janela
         estreita, movimento reduzido ligado com a página aberta) ou pagehide:
         dispose() e o SVG volta. Volta do bfcache ou da faixa: monta de novo.
       - Nada vai para o console em nenhum desses caminhos.
       ====================================================================== */
    function initScene() {
        var src = visual && visual.getAttribute('data-scene-src');
        var modelSrc = visual && visual.getAttribute('data-model-src');
        if (!src || !modelSrc || !sceneQuery || !window.fetch) return;

        var FALLBACK_MS = 3500;   // da navegação até o SVG entrar no lugar da cena atrasada
        var query = sceneQuery;
        var early = root.classList.contains('scene-3d') && query.matches;
        var scene = null;
        var loading = false;
        var gaveUp = false;       // o SVG assumiu: a cena não entra mais nesta visita
        var pending = null;       // [módulo da cena, ArrayBuffer do modelo]

        function hasWebGL2() {
            try {
                var probe = document.createElement('canvas');
                var gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
                if (!gl) return false;
                var lose = gl.getExtension('WEBGL_lose_context');
                if (lose) lose.loseContext();
                return true;
            } catch (e) {
                return false;
            }
        }

        function setSceneActive(on) {
            sceneActive = on;
            visual.classList.toggle('is-3d', on);
            if (!svgLoop) return;
            if (!on && introDone && svgShown()) svgLoop.play();
            else svgLoop.pause();
        }

        // O SVG entra no lugar (fade no CSS) e a cena desiste
        function fallback() {
            if (sceneActive || gaveUp) return;
            gaveUp = true;
            visual.classList.add('is-fallback');
            if (svgLoop && introDone) svgLoop.play();
        }

        // Os downloads (já adiantados pelos preloads do <head>, quando há a classe)
        function load() {
            if (!pending) {
                var model = fetch(modelSrc).then(function (response) {
                    if (!response.ok) throw new Error('modelo');
                    return response.arrayBuffer();
                });
                pending = Promise.all([import(src), model]);
                pending.catch(function () { pending = null; });
            }
            return pending;
        }

        function mount() {
            if (scene || loading || gaveUp || !query.matches) return;
            loading = true;
            load()
                .then(function (loaded) {
                    if (gaveUp || !query.matches) throw new Error('cancelada');
                    return loaded[0].createScene(visual, loaded[1]);
                })
                .then(function (created) {
                    loading = false;
                    if (gaveUp || !query.matches) { created.dispose(); return; }
                    scene = created;
                    // O canvas nasce com opacidade 0 (CSS). Aparece quando o título e o
                    // apoio terminam de entrar (ou já, se eles terminaram antes)
                    whenTextDone(function () {
                        requestAnimationFrame(function () {
                            if (scene === created && !gaveUp) setSceneActive(true);
                        });
                    });
                })
                .catch(function () {
                    // Sem WebGL, sem rede, erro de montagem: o SVG entra, em silêncio
                    loading = false;
                    if (early) fallback();
                });
        }

        function unmount() {
            if (!scene) return;
            scene.dispose();
            scene = null;
            setSceneActive(false);
        }

        // Sem a classe do <head>: só depois do load, num momento ocioso
        function start() {
            if (gaveUp || !query.matches || !hasWebGL2()) return;
            whenIntroDone(function () {
                var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); };
                idle(mount, { timeout: 1500 });
            });
        }

        if (early) {
            mount();
            window.setTimeout(fallback, Math.max(0, FALLBACK_MS - performance.now()));
        } else if (document.readyState === 'complete') {
            start();
        } else {
            window.addEventListener('load', start, { once: true });
        }

        function onQueryChange() {
            if (query.matches) start(); else unmount();
        }
        if (query.addEventListener) query.addEventListener('change', onQueryChange);
        else if (query.addListener) query.addListener(onQueryChange);

        window.addEventListener('pagehide', unmount);
        window.addEventListener('pageshow', function (event) {
            if (event.persisted) start();
        });
    }
})();
