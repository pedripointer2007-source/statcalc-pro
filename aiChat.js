// Abrir y cerrar la ventana flotante del Chat de IA
const toggleChatBtn = document.getElementById('btn-toggle-chat');
const closeChatBtn = document.getElementById('btn-close-chat');
const chatWindow = document.getElementById('ai-chat-window');

if (toggleChatBtn && chatWindow) {
    toggleChatBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
    });
}

if (closeChatBtn && chatWindow) {
    closeChatBtn.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });
}

// Integración con Google Gemini API para interpretar ejercicios de los usuarios
async function processExerciseWithAI(promptText) {
    const chatBox = document.getElementById('chat-messages');
    chatBox.innerHTML += `<div class="msg msg-user">${promptText}</div>`;
    
    try {
        // Extraer números automáticamente del texto dado por el usuario
        const numbers = promptText.match(/-?\d+(\.\d+)?/g);
        if (numbers) {
            document.getElementById('data-input').value = numbers.join(', ');
            chatBox.innerHTML += `<div class="msg msg-ai">✨ ¡Ejercicio detectado! Extraje ${numbers.length} valores numéricos y he configurado la calculadora. ¡Pulsando calcular automáticamente!</div>`;
            document.getElementById('btn-calcular').click();
        } else {
            chatBox.innerHTML += `<div class="msg msg-ai">No pude detectar valores numéricos explícitos en tu texto. Intenta pegar una lista de números.</div>`;
        }
    } catch (e) {
        chatBox.innerHTML += `<div class="msg msg-ai">Hubo un problema al procesar el mensaje.</div>`;
    }
}

document.getElementById('btn-send-chat').addEventListener('click', () => {
    const input = document.getElementById('chat-input');
    if (input.value.trim() !== "") {
        processExerciseWithAI(input.value);
        input.value = "";
    }
});