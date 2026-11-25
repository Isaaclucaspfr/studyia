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

   Fase 2: a cena 3D (Three.js) entra no .landing-visual, por cima do SVG.
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

    if (!window.gsap || !hero) {
        reveal();
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

        var intro = gsap.timeline({ defaults: { ease: EASE } });
        intro.fromTo(heroItems,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.9, stagger: 0.09 }
        );

        var brain = visual && visual.querySelector('.brain');
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
            if (base) {
                intro.fromTo(base,
                    { opacity: 0, scaleX: 0.7, svgOrigin: '320 512' },
                    { opacity: 1, scaleX: 1, duration: 1 },
                    0.15
                );
            }
            if (core) {
                intro.fromTo(core,
                    { opacity: 0, y: 18, scale: 0.96, svgOrigin: '320 230' },
                    { opacity: 1, y: 0, scale: 1, duration: 1 },
                    0.2
                );
            }
            if (sats.length) {
                intro.fromTo(sats,
                    { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' },
                    { opacity: function (i, el) { return el.classList.contains('brain-sat--back') ? 0.55 : 1; },
                      scale: 1, duration: 0.7, stagger: 0.06 },
                    0.45
                );
            }

            // ---------- Laço discreto (depois da entrada) ----------
            // Satélites sobem e descem devagar, fora de fase; os nós acesos pulsam.
            var loop = gsap.timeline({ paused: true, repeat: -1 });
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

            intro.call(function () { loop.play(); });

            // Fora da tela, o laço para (não gasta CPU com o cérebro invisível)
            if (hasScrollTrigger) {
                window.ScrollTrigger.create({
                    trigger: hero,
                    start: 'top bottom',
                    end: 'bottom top',
                    onToggle: function (self) {
                        if (!intro.isActive() && intro.progress() === 1) {
                            if (self.isActive) loop.play(); else loop.pause();
                        }
                    }
                });
            }
        }

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
})();
