// aiChat.js

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const toggleBtn = document.getElementById("btn-toggle-chat");
    const closeBtn = document.getElementById("btn-close-chat");
    const chatWindow = document.getElementById("ai-chat-window");
    const sendBtn = document.getElementById("btn-send-chat");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages");
    const fileInput = document.getElementById("chat-file-input");

    function addMessage(content, type = "ai") {
        if (!chatMessages) return;
        const div = document.createElement("div");
        div.className = type === "user" ? "msg msg-user" : "msg msg-ai";
        div.innerHTML = content;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function extractNumbers(text = "") {
        const matches = String(text).match(/-?\d+(?:[.,]\d+)?/g);
        if (!matches) return [];
        return matches.map(v => parseFloat(v.replace(",", "."))).filter(Number.isFinite);
    }

    // Controla directamente la calculadora e inyecta los datos en pantalla
    function applyToCalculator(numbers, forceCalculate = true) {
        const textarea = document.getElementById("data-input");
        if (textarea) {
            textarea.value = numbers.join(", ");
        }

        if (forceCalculate) {
            const btnCalc = document.getElementById("btn-calcular");
            if (btnCalc) {
                setTimeout(() => btnCalc.click(), 200);
            }
        }
    }

    async function processUserMessage(text) {
        const nums = extractNumbers(text);
        const textLower = text.toLowerCase();

        // Control de tipo de datos desde el chatbot
        if (textLower.includes("agrupados")) {
            document.getElementById("type-agrupados")?.click();
        } else if (textLower.includes("no agrupados")) {
            document.getElementById("type-no-agrupados")?.click();
        }

        if (nums.length >= 2) {
            applyToCalculator(nums, true);
            addMessage(`<b>✅ Datos transferidos e identificados (${nums.length} valores):</b><br>[${nums.join(", ")}]<br>Se han cargado y calculado automáticamente en la pantalla principal.`);
        } else {
            addMessage(`He analizado tu mensaje. Si deseas realizar un cálculo visual, ingresa los valores numéricos de tu ejercicio o adjunta una imagen/documento.`);
        }
    }

    // Procesamiento de Archivos e Imágenes (OCR)
    if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            addMessage(`📁 Archivo subido: <b>${file.name}</b>. Procesando datos...`, "user");

            if (file.type.startsWith("image/")) {
                addMessage("🔍 Analizando imagen con el motor OCR Tesseract... Un momento por favor.", "ai");
                try {
                    const result = await Tesseract.recognize(file, 'spa');
                    const extractedText = result.data.text;
                    const nums = extractNumbers(extractedText);

                    if (nums.length >= 2) {
                        applyToCalculator(nums, true);
                        addMessage(`<b>📷 Lectura OCR completada:</b><br>Datos detectados en la foto: [${nums.join(", ")}]<br>Cargados en la calculadora con éxito.`);
                    } else {
                        addMessage("No se pudieron detectar suficientes valores numéricos claros en la imagen.");
                    }
                } catch (err) {
                    addMessage("Ocurrió un error al leer la imagen. Asegúrate de que el texto sea claro.");
                }
            } else {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const content = event.target.result;
                    const nums = extractNumbers(content);
                    if (nums.length >= 2) {
                        applyToCalculator(nums, true);
                        addMessage(`<b>📄 Archivo procesado:</b><br>Se extrajeron ${nums.length} datos numéricos correctamente.`);
                    } else {
                        addMessage("El archivo no contiene un formato de datos reconocido.");
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    if (toggleBtn && chatWindow) {
        toggleBtn.addEventListener("click", () => chatWindow.classList.toggle("hidden"));
    }
    if (closeBtn && chatWindow) {
        closeBtn.addEventListener("click", () => chatWindow.classList.add("hidden"));
    }

    if (sendBtn) {
        sendBtn.addEventListener("click", () => {
            const val = chatInput.value.trim();
            if (!val) return;
            addMessage(val, "user");
            chatInput.value = "";
            setTimeout(() => processUserMessage(val), 400);
        });
    }

    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") sendBtn.click();
        });
    }
});

