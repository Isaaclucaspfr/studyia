// StudyIA - Frontend Interactivity

document.addEventListener('DOMContentLoaded', () => {
    // Chat Interativo com o Assistente (F03 / F06)
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    // Renderização de Markdown com Marked.js para mensagens pré-existentes
    const rawBubbles = document.querySelectorAll('.markdown-content');
    rawBubbles.forEach(b => {
        const raw = b.getAttribute('data-raw');
        if (raw && window.marked) {
            b.innerHTML = marked.parse(raw);
        }
    });

    if (chatForm && chatInput && chatMessages) {
        // Rola até o final das mensagens
        chatMessages.scrollTop = chatMessages.scrollHeight;

        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            const topicId = chatForm.dataset.topicId;

            // Insere bolha do usuário imediatamente
            appendBubble(message, 'user');
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Insere indicador de digitação
            const typingBubble = appendBubble('StudyIA está analisando sua pergunta com profundidade conceitual...', 'assistant typing');
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                const response = await fetch(`/topic/${topicId}/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: message })
                });

                const data = await response.json();
                typingBubble.remove();

                if (data.reply) {
                    appendBubble(data.reply, 'assistant', data.is_simulated);
                } else if (data.error) {
                    appendBubble(`Erro: ${data.error}`, 'assistant error');
                }
            } catch (err) {
                typingBubble.remove();
                appendBubble('Ocorreu um erro ao conectar ao serviço de IA. Tente novamente.', 'assistant error');
            }

            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    function appendBubble(content, type, isSimulated = false) {
        const isUser = type.includes('user');
        const isTyping = type.includes('typing');
        
        const row = document.createElement('div');
        row.className = `message-row ${isUser ? 'user' : 'assistant'}`;

        const avatar = document.createElement('div');
        avatar.className = `avatar-circle ${isUser ? 'user' : 'assistant'}`;
        avatar.innerHTML = isUser ? '👤' : '🤖';

        const wrapper = document.createElement('div');
        wrapper.className = 'message-content-wrapper';

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const senderHeader = document.createElement('div');
        senderHeader.className = 'message-sender-name';
        senderHeader.innerHTML = `${isUser ? 'Você' : 'StudyIA Tutor'} <span class="message-time">${timeStr}</span>`;

        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;

        let formatted = '';
        if (window.marked && !isTyping) {
            formatted = marked.parse(content);
        } else {
            formatted = escapeHTML(content).replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }

        if (isSimulated && !isUser && !isTyping) {
            formatted += `<div class="chat-demo-note">Resposta de demonstração: a IA não está disponível no momento.</div>`;
        }

        bubble.innerHTML = formatted;
        wrapper.appendChild(senderHeader);
        wrapper.appendChild(bubble);

        row.appendChild(avatar);
        row.appendChild(wrapper);

        chatMessages.appendChild(row);
        return row;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Checklist do Plano de Estudo (F13)
    const taskCheckboxes = document.querySelectorAll('.plan-task-checkbox');
    taskCheckboxes.forEach(cb => {
        cb.addEventListener('change', async (e) => {
            const taskKey = cb.dataset.taskKey;
            const planId = cb.dataset.planId;
            const label = document.getElementById(`label_${taskKey}`);

            try {
                const response = await fetch(`/plan/${planId}/toggle-task`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ task_key: taskKey })
                });

                const data = await response.json();
                if (data.progress_percent !== undefined) {
                    const progressBar = document.getElementById('planProgressBar');
                    const progressText = document.getElementById('planProgressText');

                    if (progressBar) progressBar.style.width = `${data.progress_percent}%`;
                    if (progressText) progressText.textContent = `${data.progress_percent}%`;

                    if (label) {
                        if (data.status === 'checked') {
                            label.style.textDecoration = 'line-through';
                            label.style.color = '#94a3b8';
                        } else {
                            label.style.textDecoration = 'none';
                            label.style.color = 'inherit';
                        }
                    }
                }
            } catch (err) {
                console.error("Erro ao atualizar tarefa:", err);
            }
        });
    });
});
