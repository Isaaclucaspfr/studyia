/* ==========================================================================
   StudyIA — Tema claro / escuro / dispositivo (features/02)

   Só cuida da APARÊNCIA: lê e grava a preferência no navegador e aplica o
   tema. Não faz requisição, não envia formulário e não usa nada do app.js
   (nem o app.js usa nada daqui).

   Contrato (docs/04):
     - chave "studyia-theme" no localStorage: "light" | "dark" | "system"
     - data-theme="light" | "dark" no <html>, ou ausente (= segue o sistema)
     - o script inline do <head> (base.html) aplica o data-theme antes da
       primeira pintura; este arquivo roda depois (defer) e só cuida do seletor.
   ========================================================================== */

(function () {
    'use strict';

    var STORAGE_KEY = 'studyia-theme';
    var NAMES = { light: 'Claro', dark: 'Escuro', system: 'Dispositivo' };
    var root = document.documentElement;

    var button = document.getElementById('themeToggle');
    var menu = document.getElementById('themeMenu');
    var current = document.getElementById('themeCurrent');
    var systemHint = document.getElementById('themeSystemHint');
    if (!button || !menu) return;

    var radios = Array.prototype.slice.call(menu.querySelectorAll('input[name="studyia-theme"]'));
    var systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var supportsPopover = typeof HTMLElement !== 'undefined' &&
        Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover');

    // ---------- Preferência (localStorage pode estar bloqueado: aí vale o sistema) ----------

    function readPreference() {
        try {
            var value = localStorage.getItem(STORAGE_KEY);
            return value === 'light' || value === 'dark' ? value : 'system';
        } catch (e) {
            return 'system';
        }
    }

    function savePreference(preference) {
        try {
            localStorage.setItem(STORAGE_KEY, preference);
        } catch (e) {
            // sem armazenamento: o tema vale só até recarregar a página
        }
    }

    // "Dispositivo" resolvido agora: o que o sistema operacional pede
    function systemTheme() {
        return systemDark && systemDark.matches ? 'dark' : 'light';
    }

    // ---------- Aplicar ----------

    // Desliga as transições por um quadro, para a página trocar de cor de uma vez
    function withoutTransitions(change) {
        root.classList.add('theme-switching');
        change();
        window.getComputedStyle(root).getPropertyValue('color'); // força o cálculo já sem transição
        window.setTimeout(function () {
            root.classList.remove('theme-switching');
        }, 0);
    }

    function applyTheme(preference) {
        withoutTransitions(function () {
            if (preference === 'light' || preference === 'dark') {
                root.setAttribute('data-theme', preference);
            } else {
                root.removeAttribute('data-theme'); // o @media (prefers-color-scheme) decide
            }
        });
    }

    // Estado visual e acessível do seletor. O ícone do botão vem do CSS (data-theme).
    function syncControl(preference) {
        if (current) current.textContent = ': ' + NAMES[preference]; // nome: "Tema: Dispositivo"
        radios.forEach(function (radio) {
            radio.checked = radio.value === preference;
        });
        if (systemHint) {
            systemHint.textContent = 'Segue o sistema (' + (systemTheme() === 'dark' ? 'escuro' : 'claro') + ')';
        }
    }

    // A preferência em uso fica em memória: com o localStorage bloqueado, ela
    // continua valendo até recarregar a página.
    var preference = readPreference();

    function choose(value) {
        preference = value;
        savePreference(preference);
        applyTheme(preference);
        syncControl(preference);
    }

    // ---------- Painel ----------

    function isOpen() {
        return supportsPopover ? menu.matches(':popover-open') : !menu.hidden;
    }

    // Abaixo do botão, alinhado pela direita dele (a navbar é sticky, o botão não sai do lugar)
    function placeMenu() {
        var rect = button.getBoundingClientRect();
        menu.style.setProperty('--theme-menu-top', Math.round(rect.bottom + 4) + 'px');
        menu.style.setProperty('--theme-menu-right', Math.max(8, Math.round(root.clientWidth - rect.right)) + 'px');
    }

    function focusChecked() {
        var checked = radios.filter(function (radio) { return radio.checked; })[0] || radios[0];
        if (checked) checked.focus();
    }

    function openMenu() {
        placeMenu();
        if (supportsPopover) {
            menu.showPopover();
        } else {
            menu.hidden = false;
            button.setAttribute('aria-expanded', 'true');
            focusChecked();
        }
    }

    function closeMenu(returnFocus) {
        if (!isOpen()) return;
        if (supportsPopover) {
            menu.hidePopover();
        } else {
            menu.hidden = true;
            button.setAttribute('aria-expanded', 'false');
        }
        if (returnFocus) button.focus();
    }

    if (supportsPopover) {
        // Abrir, fechar, Esc e clique fora são do navegador (popovertarget no botão)
        menu.removeAttribute('hidden');
        menu.addEventListener('beforetoggle', function (event) {
            var open = event.newState === 'open';
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) placeMenu();
        });
        menu.addEventListener('toggle', function (event) {
            if (event.newState === 'open') focusChecked();
        });
    } else {
        // Navegador sem popover: o mesmo comportamento com [hidden]
        button.removeAttribute('popovertarget');
        button.addEventListener('click', function () {
            if (isOpen()) closeMenu(false);
            else openMenu();
        });
        document.addEventListener('click', function (event) {
            if (isOpen() && !menu.contains(event.target) && !button.contains(event.target)) closeMenu(false);
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && isOpen()) closeMenu(true);
        });
    }

    window.addEventListener('resize', function () {
        if (isOpen()) placeMenu();
    });

    // ---------- Escolha ----------

    // Setas trocam a opção e o tema na hora, com o painel aberto (radio nativo)
    radios.forEach(function (radio) {
        radio.addEventListener('change', function () {
            if (radio.checked) choose(radio.value);
        });
    });

    // Clique (mouse ou toque) numa opção, ou Enter: escolhe e fecha.
    // Pelo teclado, Espaço e setas trocam o tema e mantêm o painel aberto.
    var lastInput = 'keyboard';
    menu.addEventListener('pointerdown', function () { lastInput = 'pointer'; });
    menu.addEventListener('click', function (event) {
        if (lastInput !== 'pointer' || !event.target.closest('.theme-option')) return;
        // depois do change do radio (o clique no <label> chega antes dele)
        window.setTimeout(function () { closeMenu(true); }, 0);
    });
    menu.addEventListener('keydown', function (event) {
        lastInput = 'keyboard';
        if (event.key === 'Enter' && event.target.name === 'studyia-theme') {
            event.preventDefault();
            if (!event.target.checked) {
                event.target.checked = true;
                choose(event.target.value);
            }
            closeMenu(true);
        }
    });

    // ---------- Sistema ao vivo ----------

    // Com "Dispositivo", quem troca a paleta é o CSS; aqui só sem transições
    // e com a dica "(claro)/(escuro)" atualizada.
    function onSystemChange() {
        if (preference === 'system') applyTheme('system');
        syncControl(preference);
    }
    if (systemDark) {
        if (systemDark.addEventListener) systemDark.addEventListener('change', onSystemChange);
        else if (systemDark.addListener) systemDark.addListener(onSystemChange); // Safari < 14
    }

    syncControl(preference);
})();
