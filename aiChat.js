document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('btn-toggle-chat');
    const closeBtn = document.getElementById('btn-close-chat');
    const chatWindow = document.getElementById('ai-chat-window');
    const sendBtn = document.getElementById('btn-send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // Manejo de Apertura / Cierre
    if (toggleBtn && chatWindow) {
        toggleBtn.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
        });
    }

    if (closeBtn && chatWindow) {
        closeBtn.addEventListener('click', () => {
            chatWindow.classList.add('hidden');
        });
    }

    // Enviar Mensaje
    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Agregar mensaje de usuario
        chatMessages.innerHTML += `<div class="msg msg-user">${text}</div>`;
        chatInput.value = '';

        // Extraer números si existen
        const numbers = text.match(/-?\d+(\.\d+)?/g);
        
        setTimeout(() => {
            if (numbers) {
                const dataInput = document.getElementById('data-input');
                if (dataInput) {
                    dataInput.value = numbers.join(', ');
                }
                chatMessages.innerHTML += `<div class="msg msg-ai">✨ Extraje los números <b>${numbers.join(', ')}</b> y los coloqué en la calculadora.</div>`;
                
                const btnCalcular = document.getElementById('btn-calcular');
                if (btnCalcular) btnCalcular.click();
            } else {
                chatMessages.innerHTML += `<div class="msg msg-ai">No detecté datos numéricos. Por favor ingresa una serie de números separados por coma.</div>`;
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 500);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});