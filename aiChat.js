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

    let conversationState = {
        lastData: [],
        lastMeasure: null
    };

    function escapeHTML(str) {
        return String(str).replace(/[&<>'"]/g,
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

    function applyToCalculator(numbers, forceCalculate = true) {
        const textarea = document.getElementById("data-input");
        if (textarea) {
            textarea.value = numbers.join(", ");
        }
        if (forceCalculate) {
            const btnCalc = document.getElementById("btn-calcular");
            if (btnCalc) setTimeout(() => btnCalc.click(), 200);
        }
    }

    async function processUserMessage(text) {
        const textLower = text.toLowerCase().trim();
        const extractedNums = extractNumbers(text);

        if (typingIndicator) typingIndicator.classList.remove("hidden");

        setTimeout(() => {
            if (typingIndicator) typingIndicator.classList.add("hidden");

            // Nuevos datos
            if (extractedNums.length >= 2) {
                conversationState.lastData = extractedNums;
                applyToCalculator(extractedNums, true);
                addMessage(`<b>✅ Datos procesados (${extractedNums.length} valores):</b><br>[${extractedNums.join(", ")}]<br>Se han transferido y calculado en la pantalla.`);
                return;
            }

            // Medidas usando datos en memoria
            if (conversationState.lastData.length >= 2) {
                const nums = conversationState.lastData;
                const calculated = StatsEngine.calculateNoAgrupados(nums);

                if (textLower.includes("media") || textLower.includes("promedio")) {
                    addMessage(`<b>Media (x̄):</b> ${calculated.media.val}<br><br>${calculated.media.steps.join("<br>")}`);
                    return;
                }
                if (textLower.includes("mediana")) {
                    addMessage(`<b>Mediana:</b> ${calculated.mediana.val}<br><br>${calculated.mediana.steps.join("<br>")}`);
                    return;
                }
                if (textLower.includes("varianza")) {
                    addMessage(`<b>Varianza (s²):</b> ${calculated.varianza.val}<br><br>${calculated.varianza.steps.join("<br>")}`);
                    return;
                }
                if (textLower.includes("desviacion") || textLower.includes("desviación")) {
                    addMessage(`<b>Desviación estándar:</b> ${calculated.desviacion.val}<br><br>${calculated.desviacion.steps.join("<br>")}`);
                    return;
                }
                if (textLower.includes("cuartil") || textLower.includes("q1") || textLower.includes("q3")) {
                    addMessage(`<b>Cuartiles:</b> ${calculated.cuartiles.val}<br><br>${calculated.cuartiles.steps.join("<br>")}`);
                    return;
                }
                if (textLower.includes("rango")) {
                    addMessage(`<b>Rango:</b> ${calculated.rango.val}<br><br>${calculated.rango.steps.join("<br>")}`);
                    return;
                }
                if (textLower.includes("kurtosis") || textLower.includes("curtosis")) {
                    addMessage(`<b>Kurtosis:</b> ${calculated.kurtosis.val}<br><br>${calculated.kurtosis.steps.join("<br>")}`);
                    return;
                }
                if (textLower.includes("fisher") || textLower.includes("asimetria")) {
                    addMessage(`<b>Fisher:</b> ${calculated.fisher.val}<br><br>${calculated.fisher.steps.join("<br>")}`);
                    return;
                }
                if (textLower.includes("moda")) {
                    addMessage(`<b>Moda:</b> ${calculated.moda.val}<br><br>${calculated.moda.steps.join("<br>")}`);
                    return;
                }
                if (textLower.includes("tabla") || textLower.includes("frecuencia")) {
                    addMessage(`<b>Tabla de frecuencias generada.</b><br>Revisa el panel de resultados. Se incluyen las columnas de momentos si tienes marcadas Varianza, Fisher o Kurtosis.`);
                    applyToCalculator(nums, true);
                    return;
                }
            }

            // Explicaciones conceptuales
            if (textLower.includes("kurtosis") || textLower.includes("curtosis")) {
                addMessage("La <b>Kurtosis</b> (o curtosis) mide el grado de apuntamiento y el peso de las colas de la distribución. Un valor cercano a 0 indica distribución mesocúrtica (similar a la normal).");
                return;
            }
            if (textLower.includes("fisher")) {
                addMessage("El <b>coeficiente de Fisher</b> mide la asimetría de la distribución. Valores cercanos a 0 indican simetría.");
                return;
            }

            if (textLower.includes("dame datos") || textLower.includes("prueba") || textLower.includes("ejemplo")) {
                const testData = [10, 15, 20, 25, 30, 35, 40];
                conversationState.lastData = testData;
                applyToCalculator(testData, true);
                addMessage(`<b>Cargados datos de prueba:</b> [${testData.join(", ")}]`);
                return;
            }

            addMessage("Entendido. Puedes enviarme datos numéricos o pedirme cálculos específicos (media, mediana, varianza, tabla de frecuencias, etc.).");
        }, 450);
    }

    // OCR
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
            }
        });
    }

    // Eventos del chat
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
            addMessage(escapeHTML(val), "user");
            chatInput.value = "";
            processUserMessage(val);
        });
    }

    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") sendBtn?.click();
        });
    }
});