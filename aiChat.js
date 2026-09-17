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
    const typingIndicator = document.getElementById("ai-typing-indicator");

    // Memoria conversacional
    let conversationState = {
        lastData: [],
        lastMeasure: null
    };

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }

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
        const textLower = text.toLowerCase().trim();
        const extractedNums = extractNumbers(text);

        if (typingIndicator) typingIndicator.classList.remove("hidden");

        setTimeout(() => {
            if (typingIndicator) typingIndicator.classList.add("hidden");

            // Si se ingresan nuevos datos numéricos
            if (extractedNums.length >= 2) {
                conversationState.lastData = extractedNums;
                applyToCalculator(extractedNums, true);
                addMessage(`<b>✅ Datos procesados (${extractedNums.length} valores):</b><br>[${extractedNums.join(", ")}]<br>Se han transferido y calculado en la pantalla.`);
                return;
            }

            // Si se solicita una medida usando los últimos datos en memoria
            if (conversationState.lastData.length >= 2) {
                const nums = conversationState.lastData;
                const calculated = StatsEngine.calculateNoAgrupados(nums, { varianza: true, asimetria: true, kurtosis: true });

                if (textLower.includes("media") || textLower.includes("promedio")) {
                    addMessage(`<b>Media (x̄):</b> ${calculated.media}`);
                    return;
                }
                if (textLower.includes("mediana")) {
                    addMessage(`<b>Mediana:</b> ${calculated.mediana}`);
                    return;
                }
                if (textLower.includes("varianza")) {
                    addMessage(`<b>Varianza (s²):</b> ${calculated.varianza}`);
                    return;
                }
                if (textLower.includes("rango")) {
                    addMessage(`<b>Rango:</b> ${calculated.rango}`);
                    return;
                }
                if (textLower.includes("desviacion") || textLower.includes("desviación")) {
                    addMessage(`<b>Desviación Estándar (s):</b> ${calculated.desviacion}`);
                    return;
                }
            }

            // Explicaciones conceptuales
            if (textLower.includes("kurtosis") || textLower.includes("curtosis")) {
                addMessage("La <b>Kurtosis</b> mide el grado de concentración de los datos alrededor de la zona central de la distribución de frecuencias.");
                return;
            }

            if (textLower.includes("dame datos") || textLower.includes("prueba")) {
                const testData = [10, 15, 20, 25, 30, 35, 40];
                conversationState.lastData = testData;
                applyToCalculator(testData, true);
                addMessage(`<b>Cargados datos de prueba:</b> [${testData.join(", ")}]`);
                return;
            }

            addMessage("Entendido. Puedes enviarme datos o pedirme cálculos específicos sobre los datos actuales.");
        }, 500);
    }

    // Procesamiento de Archivos e Imágenes (OCR)
    if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            addMessage(`📁 Archivo subido: <b>${escapeHTML(file.name)}</b>`, "user");

            if (file.type.startsWith("image/")) {
                addMessage("🔍 Procesando lectura OCR de la imagen...", "ai");
                try {
                    const result = await Tesseract.recognize(file, 'spa');
                    const nums = extractNumbers(result.data.text);

                    if (nums.length >= 2) {
                        conversationState.lastData = nums;
                        applyToCalculator(nums, true);
                        addMessage(`<b>📷 OCR Exitoso:</b> Se detectaron los valores [${nums.join(", ")}] y se enviaron a la calculadora.`);
                    } else {
                        addMessage("No se encontraron suficientes valores numéricos legibles.");
                    }
                } catch (err) {
                    addMessage("Error en el escaneo OCR.");
                }
            } else {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const content = event.target.result;
                    const nums = extractNumbers(content);
                    if (nums.length >= 2) {
                        conversationState.lastData = nums;
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

    // Apertura y Cierre de Ventana Chat
    if (toggleBtn && chatWindow) {
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            chatWindow.classList.toggle("hidden");
        });
    }

    if (closeBtn && chatWindow) {
        closeBtn.addEventListener("click", () => {
            chatWindow.classList.add("hidden");
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener("click", () => {
            const val = chatInput.value.trim();
            if (!val) return;
            addMessage(escapeHTML(val), "user");
            chatInput.value = "";
            processUserMessage(val);
        });
    }

    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") sendBtn.click();
        });
    }
});