/* ==========================================================================
   StudyIA — Estado de carregamento e anti-clique-duplo dos forms (B4)

   Melhoria progressiva: sem este arquivo (ou sem JavaScript) os forms
   continuam enviando como sempre. Não muda action, method, name nem dado
   nenhum: só impede o REENVIO e mostra que a página está trabalhando.

   Uso (docs/04): no botão de envio de um form POST,
       <button type="submit" data-loading-text="Gerando plano…">
   No primeiro envio:
     - o form ganha aria-busy="true" e os envios seguintes (clique, Enter)
       são cancelados;
     - o botão ganha aria-disabled="true" (e não `disabled`, para o foco
       continuar nele) e troca o rótulo pelo indicador + o texto do atributo;
     - uma região aria-live (role="status") anuncia o carregamento.
   Ao voltar pelo "voltar" do navegador (bfcache), tudo volta ao normal.

   Independente do app.js e do theme.js: um não usa nada do outro.
   O chat (#chatForm) não passa por aqui: ele usa fetch e tem a própria
   guarda no app.js.
   ========================================================================== */

(function () {
    'use strict';

    var BUTTON_SELECTOR = 'button[type="submit"][data-loading-text]';
    var originals = new WeakMap(); // botão → filhos originais (ícone + rótulo)
    var status = null;

    // Região única de anúncio. Criada vazia antes de qualquer envio: o leitor
    // de tela só anuncia mudanças numa região que já existia na página.
    function getStatus() {
        if (status) return status;
        status = document.createElement('p');
        status.className = 'sr-only';
        status.id = 'formsStatus';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        document.body.appendChild(status);
        return status;
    }

    function findButton(form, submitter) {
        if (submitter && submitter.matches && submitter.matches(BUTTON_SELECTOR)) return submitter;
        return form.querySelector(BUTTON_SELECTOR);
    }

    function setLoading(form, button) {
        var text = button.getAttribute('data-loading-text');

        form.setAttribute('aria-busy', 'true');
        button.setAttribute('aria-disabled', 'true');

        originals.set(button, Array.prototype.slice.call(button.childNodes));

        var spinner = document.createElement('span');
        spinner.className = 'btn-spinner';
        spinner.setAttribute('aria-hidden', 'true');

        var label = document.createElement('span');
        label.textContent = text;

        button.replaceChildren(spinner, label);

        // Pequeno atraso: dá tempo de o leitor de tela registrar a região vazia.
        var region = getStatus();
        window.setTimeout(function () {
            region.textContent = text + ' Isso pode levar alguns segundos.';
        }, 50);
    }

    function reset(form) {
        form.removeAttribute('aria-busy');
        Array.prototype.forEach.call(form.querySelectorAll(BUTTON_SELECTOR), function (button) {
            var children = originals.get(button);
            if (children) {
                button.replaceChildren.apply(button, children);
                originals.delete(button);
            }
            button.removeAttribute('aria-disabled');
        });
    }

    document.addEventListener('submit', function (event) {
        var form = event.target;
        if (!(form instanceof HTMLFormElement)) return;

        var button = findButton(form, event.submitter);
        if (!button) return; // form sem data-loading-text: comportamento de sempre

        // Já enviado: cancela o reenvio (2º clique, Enter no campo, etc.).
        if (form.getAttribute('aria-busy') === 'true') {
            event.preventDefault();
            return;
        }

        // Outro script cancelou o envio (ex.: um confirm() recusado): não trava.
        if (event.defaultPrevented) return;

        setLoading(form, button);
    });

    // Volta pelo histórico: o navegador pode restaurar a página congelada
    // (bfcache) com os botões ainda em "carregando". Restaura todos.
    window.addEventListener('pageshow', function () {
        Array.prototype.forEach.call(document.querySelectorAll('form[aria-busy="true"]'), reset);
        if (status) status.textContent = '';
    });

    getStatus();
})();
