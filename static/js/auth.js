/* ==========================================================================
   StudyIA — Mostrar/ocultar senha (login e cadastro, PR 3)

   Só interface: troca o type do campo entre "password" e "text". Não muda
   name, valor, action nem method, e nada vai ao servidor por causa disto.

   Melhoria progressiva: o botão do olho vem com `hidden` no template. Sem
   este arquivo (ou sem JavaScript) ele não aparece e o campo funciona normal.

   Marcação (templates/login.html e register.html):
       <input type="password" id="password" ...>
       <button type="button" class="password-toggle" aria-controls="password"
               aria-label="Mostrar senha" aria-pressed="false" hidden>…</button>

   O rótulo é FIXO ("Mostrar senha") e o estado vai no aria-pressed: o leitor
   de tela lê "Mostrar senha, botão, pressionado" com a senha visível. Trocar
   também o rótulo ("Ocultar senha, pressionado") diria a mesma coisa duas
   vezes, ao contrário (decisão 6 do PR 3).

   Carregado só no login e no cadastro (bloco scripts_extra do base.html).
   Independente do app.js, do theme.js e do forms.js: nenhum usa nada do outro.
   ========================================================================== */

(function () {
    'use strict';

    function setVisible(button, input, visible) {
        input.type = visible ? 'text' : 'password';
        button.setAttribute('aria-pressed', visible ? 'true' : 'false');
    }

    Array.prototype.forEach.call(document.querySelectorAll('.password-toggle[aria-controls]'), function (button) {
        var input = document.getElementById(button.getAttribute('aria-controls'));
        if (!input || input.type !== 'password') return;

        // O foco fica no botão (não vai para o campo): quem usa teclado ou leitor
        // de tela ouve o novo estado e continua de onde estava.
        button.addEventListener('click', function () {
            setVisible(button, input, input.type === 'password');
        });

        // Ao enviar, o campo volta a ser de senha: o navegador não guarda o valor
        // no histórico de preenchimento de campos de texto, e os gerenciadores de
        // senha reconhecem o campo. O valor enviado é o mesmo.
        if (input.form) {
            input.form.addEventListener('submit', function () {
                setVisible(button, input, false);
            });
        }

        button.hidden = false;
    });
})();
