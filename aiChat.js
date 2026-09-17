document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    // ============================================================
    // STATCALC AI
    // Asistente estadístico inteligente
    // ============================================================

    const $ = (id) => document.getElementById(id);

    const toggleBtn = $("btn-toggle-chat");
    const closeBtn = $("btn-close-chat");
    const chatWindow = $("ai-chat-window");
    const sendBtn = $("btn-send-chat");
    const chatInput = $("chat-input");
    const chatMessages = $("chat-messages");

    // ============================================================
    // ESTADO
    // ============================================================

    const AIState = {
        data: [],
        sortedData: [],
        dataType: "no_agrupados",

        lastIntent: null,
        lastMeasure: null,
        lastQuestion: "",

        sampleOrPopulation: "muestra",

        conversation: [],

        isTyping: false,
        initialized: false
    };


    // ============================================================
    // UTILIDADES
    // ============================================================

    function normalizeText(text = "") {

        return String(text)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[¿?¡!«»"'`´]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }


    function escapeHTML(text = "") {

        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatNumber(value, decimals = 4) {

        if (!Number.isFinite(value)) {
            return "No disponible";
        }

        return Number(value.toFixed(decimals))
            .toLocaleString("es-NI", {
                maximumFractionDigits: decimals
            });
    }


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    // ============================================================
    // MENSAJES
    // ============================================================

    function addMessage(content, type = "ai") {

        if (!chatMessages) return;

        const div = document.createElement("div");

        div.className =
            type === "user"
                ? "msg msg-user"
                : "msg msg-ai";

        if (type === "user") {
            div.textContent = content;
        } else {
            div.innerHTML = content;
        }

        chatMessages.appendChild(div);

        chatMessages.scrollTop =
            chatMessages.scrollHeight;
    }


    function showTyping() {

        if (!chatMessages || AIState.isTyping) {
            return null;
        }

        AIState.isTyping = true;

        const div = document.createElement("div");

        div.className =
            "msg msg-ai typing-message";

        div.innerHTML = `
            <span>StatCalc AI está analizando</span>

            <span class="typing-dots">
                <i></i>
                <i></i>
                <i></i>
            </span>
        `;

        chatMessages.appendChild(div);

        chatMessages.scrollTop =
            chatMessages.scrollHeight;

        return div;
    }


    function hideTyping(element) {

        if (element && element.parentNode) {
            element.remove();
        }

        AIState.isTyping = false;
    }


    // ============================================================
    // EXTRACCIÓN INTELIGENTE DE NÚMEROS
    // ============================================================

    function extractNumbers(text = "") {

        /*
            Reconoce:

            10, 20, 30
            10; 20; 30
            10 20 30
            10.5, 20.8
            -5, 10, 15
            10,5
        */

        const matches =
            String(text).match(
                /-?\d+(?:[.,]\d+)?/g
            );

        if (!matches) {
            return [];
        }

        return matches
            .map(value =>
                parseFloat(
                    value.replace(",", ".")
                )
            )
            .filter(Number.isFinite);
    }


    function hasStatisticalContext(text) {

        const t = normalizeText(text);

        const words = [
            "dato",
            "datos",
            "calcula",
            "calcular",
            "media",
            "promedio",
            "mediana",
            "moda",
            "varianza",
            "desviacion",
            "rango",
            "amplitud",
            "cuartil",
            "decil",
            "percentil",
            "fisher",
            "pearson",
            "kurtosis",
            "curtosis",
            "frecuencia",
            "intervalo",
            "sturges",
            "estadistica"
        ];

        return words.some(word =>
            t.includes(word)
        );
    }


    function looksLikeData(text) {

        const numbers = extractNumbers(text);

        if (numbers.length < 2) {
            return false;
        }

        return (
            numbers.length >= 3 ||
            hasStatisticalContext(text)
        );
    }


    // ============================================================
    // CARGAR DATOS EN LA CALCULADORA
    // ============================================================

    function loadData(numbers) {

        if (!Array.isArray(numbers) ||
            numbers.length === 0) {
            return;
        }

        AIState.data = [...numbers];

        AIState.sortedData =
            [...numbers].sort((a, b) => a - b);

        const input = $("data-input");

        if (input) {
            input.value =
                numbers.join(", ");
        }

        /*
            Si tu calculadora tiene un botón
            llamado btn-calcular, lo ejecutamos.
        */

        const calculateButton =
            $("btn-calcular");

        if (calculateButton) {

            setTimeout(() => {

                try {
                    calculateButton.click();
                } catch (error) {
                    console.warn(
                        "No se pudo ejecutar la calculadora:",
                        error
                    );
                }

            }, 100);
        }
    }


    // ============================================================
    // ESTADÍSTICAS BÁSICAS
    // ============================================================

    function sum(data) {

        return data.reduce(
            (total, value) =>
                total + value,
            0
        );
    }


    function mean(data) {

        if (!data.length) {
            return NaN;
        }

        return sum(data) / data.length;
    }


    function median(data) {

        if (!data.length) {
            return NaN;
        }

        const sorted =
            [...data].sort(
                (a, b) => a - b
            );

        const n = sorted.length;
        const middle =
            Math.floor(n / 2);

        if (n % 2 === 0) {

            return (
                sorted[middle - 1] +
                sorted[middle]
            ) / 2;
        }

        return sorted[middle];
    }


    function variance(data, population = false) {

        if (data.length === 0) {
            return NaN;
        }

        if (!population && data.length < 2) {
            return NaN;
        }

        const avg = mean(data);

        const squared =
            data.map(x =>
                Math.pow(x - avg, 2)
            );

        const denominator =
            population
                ? data.length
                : data.length - 1;

        return sum(squared) / denominator;
    }


    function standardDeviation(
        data,
        population = false
    ) {

        const v =
            variance(
                data,
                population
            );

        return Math.sqrt(v);
    }


    // ============================================================
    // RANGO
    // ============================================================

    function calculateRange(data) {

        if (!data.length) {
            return NaN;
        }

        return (
            Math.max(...data) -
            Math.min(...data)
        );
    }


    // ============================================================
    // K - STURGES
    // ============================================================

    function calculateK(data) {

        const n = data.length;

        if (n <= 0) {
            return NaN;
        }

        return Math.ceil(
            1 +
            3.322 *
            Math.log10(n)
        );
    }


    // ============================================================
    // AMPLITUD
    // ============================================================

    function calculateAmplitude(data) {

        if (!data.length) {
            return NaN;
        }

        const range =
            calculateRange(data);

        const k =
            calculateK(data);

        return range / k;
    }


    // ============================================================
    // MODA
    // ============================================================

    function calculateMode(data) {

        if (!data.length) {
            return [];
        }

        const frequencies =
            new Map();

        data.forEach(value => {

            frequencies.set(
                value,
                (frequencies.get(value) || 0) + 1
            );

        });

        const maxFrequency =
            Math.max(
                ...frequencies.values()
            );

        if (maxFrequency === 1) {
            return [];
        }

        return [...frequencies.entries()]
            .filter(
                ([, frequency]) =>
                    frequency === maxFrequency
            )
            .map(
                ([value]) => value
            );
    }


    // ============================================================
    // PERCENTIL - MÉTODO INTERPOLADO
    // ============================================================

    function percentile(data, p) {

        if (!data.length) {
            return NaN;
        }

        if (p < 0 || p > 100) {
            return NaN;
        }

        const sorted =
            [...data].sort(
                (a, b) => a - b
            );

        const position =
            (p / 100) *
            (sorted.length - 1);

        const lower =
            Math.floor(position);

        const upper =
            Math.ceil(position);

        if (lower === upper) {
            return sorted[lower];
        }

        const fraction =
            position - lower;

        return (
            sorted[lower] +
            fraction *
            (
                sorted[upper] -
                sorted[lower]
            )
        );
    }


    function quartiles(data) {

        return {
            q1: percentile(data, 25),
            q2: percentile(data, 50),
            q3: percentile(data, 75)
        };
    }


    function decile(data, d) {

        return percentile(
            data,
            d * 10
        );
    }


    // ============================================================
    // FISHER
    // ============================================================

    function fisher(data) {

        if (data.length < 2) {
            return NaN;
        }

        const avg = mean(data);

        const deviation =
            standardDeviation(
                data,
                true
            );

        if (deviation === 0) {
            return 0;
        }

        const thirdMoment =
            data.reduce(
                (total, x) =>
                    total +
                    Math.pow(
                        x - avg,
                        3
                    ),
                0
            ) / data.length;

        return (
            thirdMoment /
            Math.pow(
                deviation,
                3
            )
        );
    }


    // ============================================================
    // KURTOSIS
    // ============================================================

    function kurtosis(data) {

        if (data.length < 2) {
            return NaN;
        }

        const avg = mean(data);

        const sd =
            standardDeviation(
                data,
                true
            );

        if (sd === 0) {
            return 0;
        }

        const fourthMoment =
            data.reduce(
                (total, x) =>
                    total +
                    Math.pow(
                        x - avg,
                        4
                    ),
                0
            ) / data.length;

        return (
            fourthMoment /
            Math.pow(sd, 4)
        ) - 3;
    }


    // ============================================================
    // PEARSON
    // ============================================================

    function pearson(data) {

        const avg =
            mean(data);

        const med =
            median(data);

        const sd =
            standardDeviation(
                data,
                true
            );

        if (!Number.isFinite(sd) ||
            sd === 0) {
            return 0;
        }

        /*
            Segundo coeficiente
            de asimetría de Pearson.
        */

        return (
            3 *
            (avg - med)
        ) / sd;
    }


    // ============================================================
    // TABLA DE FRECUENCIAS NO AGRUPADA
    // ============================================================

    function frequencyTable(data) {

        const frequencies =
            new Map();

        data.forEach(value => {

            frequencies.set(
                value,
                (frequencies.get(value) || 0) + 1
            );

        });

        const sorted =
            [...frequencies.keys()]
                .sort((a, b) => a - b);

        const n = data.length;

        let accumulated = 0;

        return sorted.map(value => {

            const f =
                frequencies.get(value);

            accumulated += f;

            return {
                value,
                f,
                F: accumulated,
                h: f / n,
                H: accumulated / n,
                percentage:
                    (f / n) * 100
            };

        });
    }


    // ============================================================
    // TABLA HTML
    // ============================================================

    function createFrequencyTableHTML(data) {

        const table =
            frequencyTable(data);

        let html = `
            <div class="ai-table-wrapper">

            <table class="ai-frequency-table">

                <thead>
                    <tr>
                        <th>Valor</th>
                        <th>f</th>
                        <th>F</th>
                        <th>h</th>
                        <th>H</th>
                        <th>%</th>
                    </tr>
                </thead>

                <tbody>
        `;

        table.forEach(row => {

            html += `
                <tr>
                    <td>${formatNumber(row.value)}</td>
                    <td>${row.f}</td>
                    <td>${row.F}</td>
                    <td>${row.h.toFixed(4)}</td>
                    <td>${row.H.toFixed(4)}</td>
                    <td>${row.percentage.toFixed(2)}%</td>
                </tr>
            `;

        });

        html += `
                </tbody>
            </table>

            </div>
        `;

        return html;
    }


    // ============================================================
    // DETECCIÓN DE MEDIDAS
    // ============================================================

    const measurePatterns = [

        {
            name: "rango",
            patterns: [
                "rango",
                "amplitud total",
                "diferencia entre maximo y minimo"
            ]
        },

        {
            name: "amplitud",
            patterns: [
                "amplitud",
                "ancho de clase",
                "ancho del intervalo"
            ]
        },

        {
            name: "k",
            patterns: [
                "numero de intervalos",
                "cantidad de intervalos",
                "regla de sturges",
                "sturges"
            ]
        },

        {
            name: "media",
            patterns: [
                "media",
                "promedio",
                "media aritmetica",
                "promedio aritmetico"
            ]
        },

        {
            name: "mediana",
            patterns: [
                "mediana",
                "valor central"
            ]
        },

        {
            name: "varianza",
            patterns: [
                "varianza",
                "dispersion cuadratica"
            ]
        },

        {
            name: "desviacion",
            patterns: [
                "desviacion",
                "desviacion estandar",
                "desviacion tipica"
            ]
        },

        {
            name: "moda",
            patterns: [
                "moda",
                "valor mas repetido",
                "valor mas frecuente"
            ]
        },

        {
            name: "cuartiles",
            patterns: [
                "cuartil",
                "cuartiles",
                "q1",
                "q2",
                "q3"
            ]
        },

        {
            name: "deciles",
            patterns: [
                "decil",
                "deciles",
                "d1",
                "d2",
                "d3",
                "d4",
                "d5",
                "d6",
                "d7",
                "d8",
                "d9"
            ]
        },

        {
            name: "percentiles",
            patterns: [
                "percentil",
                "percentiles",
                "p1",
                "p10",
                "p25",
                "p50",
                "p75",
                "p90",
                "p99"
            ]
        },

        {
            name: "fisher",
            patterns: [
                "fisher",
                "asimetria fisher"
            ]
        },

        {
            name: "pearson",
            patterns: [
                "pearson",
                "asimetria pearson"
            ]
        },

        {
            name: "kurtosis",
            patterns: [
                "kurtosis",
                "curtosis",
                "apuntamiento"
            ]
        },

        {
            name: "frecuencias",
            patterns: [
                "tabla de frecuencia",
                "tabla de frecuencias",
                "frecuencia absoluta",
                "frecuencia acumulada"
            ]
        }
    ];


    function detectMeasure(text) {

        const t =
            normalizeText(text);

        for (
            const measure
            of measurePatterns
        ) {

            for (
                const pattern
                of measure.patterns
            ) {

                if (t.includes(pattern)) {
                    return measure.name;
                }

            }

        }

        return null;
    }


    // ============================================================
    // DETECTAR MUESTRA / POBLACIÓN
    // ============================================================

    function detectSampleType(text) {

        const t =
            normalizeText(text);

        if (
            t.includes("poblacion") ||
            t.includes("poblacional") ||
            t.includes("toda la poblacion")
        ) {

            AIState.sampleOrPopulation =
                "poblacion";

            return "poblacion";
        }

        if (
            t.includes("muestra") ||
            t.includes("muestral")
        ) {

            AIState.sampleOrPopulation =
                "muestra";

            return "muestra";
        }

        return AIState.sampleOrPopulation;
    }


    // ============================================================
    // INTENCIÓN
    // ============================================================

    function detectIntent(text) {

        const t =
            normalizeText(text);

        if (
            /^(hola|holaa|hello|hey|buenas|saludos)/.test(t)
        ) {
            return "saludo";
        }

        if (
            /(adios|chao|bye|hasta luego)/.test(t)
        ) {
            return "despedida";
        }

        if (
            /(gracias|muchas gracias|te agradezco)/.test(t)
        ) {
            return "agradecimiento";
        }

        if (
            /(ayuda|que puedes hacer|que sabes hacer|funciones)/.test(t)
        ) {
            return "ayuda";
        }

        if (
            /(datos agrupados|intervalos de clase|tabla agrupada)/.test(t)
        ) {
            return "agrupados";
        }

        if (
            /(datos no agrupados|datos simples)/.test(t)
        ) {
            return "no_agrupados";
        }

        if (
            /(formula|formulas|como se calcula|como calculo)/.test(t)
        ) {
            return "formula";
        }

        if (
            /(calcula|calcular|calculo|resuelve|resolver|hazlo|realiza)/.test(t)
        ) {
            return "calcular";
        }

        const measure =
            detectMeasure(text);

        if (measure) {
            return measure;
        }

        return "general";
    }


    // ============================================================
    // EXPLICACIONES
    // ============================================================

    const explanations = {

        rango: `
            <b>📏 RANGO</b>

            <p>
                El rango representa la diferencia entre el valor máximo
                y el valor mínimo.
            </p>

            <div class="ai-formula">
                R = X<sub>máx</sub> − X<sub>mín</sub>
            </div>

            <b>Procedimiento:</b>

            <ol>
                <li>Ordenamos los datos.</li>
                <li>Identificamos el valor mínimo.</li>
                <li>Identificamos el valor máximo.</li>
                <li>Restamos máximo − mínimo.</li>
            </ol>
        `,

        amplitud: `
            <b>📐 AMPLITUD</b>

            <p>
                Para datos agrupados, la amplitud indica el tamaño
                de cada intervalo.
            </p>

            <div class="ai-formula">
                A = R / K
            </div>

            <p>
                Donde R es el rango y K es el número de intervalos.
            </p>
        `,

        k: `
            <b>🔢 NÚMERO DE INTERVALOS</b>

            <p>
                Una forma habitual de determinar K es mediante
                la regla de Sturges.
            </p>

            <div class="ai-formula">
                K = 1 + 3.322 log<sub>10</sub>(n)
            </div>

            <ol>
                <li>Determina n.</li>
                <li>Calcula log₁₀(n).</li>
                <li>Multiplica por 3.322.</li>
                <li>Suma 1.</li>
                <li>Redondea K según el criterio adoptado.</li>
            </ol>
        `,

        media: `
            <b>📊 MEDIA ARITMÉTICA</b>

            <div class="ai-formula">
                x̄ = Σx / n
            </div>

            <ol>
                <li>Sumamos todos los valores.</li>
                <li>Contamos la cantidad de datos.</li>
                <li>Dividimos la suma entre n.</li>
            </ol>

            <p>
                Para datos agrupados se utiliza la marca de clase:
            </p>

            <div class="ai-formula">
                x̄ = Σ(f·x) / N
            </div>
        `,

        mediana: `
            <b>📍 MEDIANA</b>

            <p>
                Es el valor que ocupa la posición central
                después de ordenar los datos.
            </p>

            <p>
                Cuando n es impar:
            </p>

            <div class="ai-formula">
                Posición = (n + 1) / 2
            </div>

            <p>
                Cuando n es par, se promedian los dos valores centrales.
            </p>
        `,

        varianza: `
            <b>📉 VARIANZA</b>

            <p>
                La varianza mide la dispersión de los datos
                respecto a la media.
            </p>

            <b>Varianza poblacional:</b>

            <div class="ai-formula">
                σ² = Σ(x − μ)² / N
            </div>

            <b>Varianza muestral:</b>

            <div class="ai-formula">
                s² = Σ(x − x̄)² / (n − 1)
            </div>
        `,

        desviacion: `
            <b>📈 DESVIACIÓN ESTÁNDAR</b>

            <p>
                Se obtiene calculando la raíz cuadrada de la varianza.
            </p>

            <div class="ai-formula">
                s = √s²
            </div>

            <p>
                Para población:
            </p>

            <div class="ai-formula">
                σ = √σ²
            </div>
        `,

        moda: `
            <b>🔁 MODA</b>

            <p>
                Es el valor que aparece con mayor frecuencia.
            </p>

            <p>
                Puede existir una sola moda, varias modas
                o ninguna si todos los valores aparecen una sola vez.
            </p>
        `,

        cuartiles: `
            <b>🔹 CUARTILES</b>

            <ul>
                <li><b>Q1:</b> aproximadamente 25%</li>
                <li><b>Q2:</b> 50%</li>
                <li><b>Q3:</b> aproximadamente 75%</li>
            </ul>

            <p>
                Q2 coincide con la mediana.
            </p>
        `,

        deciles: `
            <b>🔹 DECILES</b>

            <p>
                Dividen el conjunto ordenado en diez partes.
            </p>

            <ul>
                <li>D1 = 10%</li>
                <li>D2 = 20%</li>
                <li>D3 = 30%</li>
                <li>D4 = 40%</li>
                <li>D5 = 50%</li>
                <li>D6 = 60%</li>
                <li>D7 = 70%</li>
                <li>D8 = 80%</li>
                <li>D9 = 90%</li>
            </ul>
        `,

        percentiles: `
            <b>🔹 PERCENTILES</b>

            <p>
                Dividen los datos ordenados en cien posiciones porcentuales.
            </p>

            <p>
                Por ejemplo, P25 corresponde al percentil 25,
                P50 al 50 y P75 al 75.
            </p>
        `,

        fisher: `
            <b>📐 ASIMETRÍA DE FISHER</b>

            <div class="ai-formula">
                γ₁ = μ₃ / σ³
            </div>

            <ul>
                <li>γ₁ ≈ 0 → aproximadamente simétrica.</li>
                <li>γ₁ > 0 → asimetría positiva.</li>
                <li>γ₁ < 0 → asimetría negativa.</li>
            </ul>
        `,

        pearson: `
            <b>📐 PEARSON</b>

            <p>
                Un coeficiente habitual es:
            </p>

            <div class="ai-formula">
                As = 3(Media − Mediana) / Desviación estándar
            </div>
        `,

        kurtosis: `
            <b>📊 KURTOSIS / CURTOSIS</b>

            <div class="ai-formula">
                γ₂ = μ₄ / σ⁴ − 3
            </div>

            <ul>
                <li>γ₂ ≈ 0 → mesocúrtica.</li>
                <li>γ₂ > 0 → leptocúrtica.</li>
                <li>γ₂ < 0 → platicúrtica.</li>
            </ul>
        `,

        frecuencias: `
            <b>📋 TABLA DE FRECUENCIAS</b>

            <p>
                Una tabla puede incluir:
            </p>

            <ul>
                <li>Valor o intervalo.</li>
                <li>Frecuencia absoluta (f).</li>
                <li>Frecuencia acumulada (F).</li>
                <li>Frecuencia relativa (h).</li>
                <li>Frecuencia relativa acumulada (H).</li>
                <li>Porcentaje.</li>
            </ul>
        `
    };


    // ============================================================
    // RESULTADO DE UNA MEDIDA
    // ============================================================

    function calculateMeasure(measure, data) {

        if (!data.length) {
            return `
                <b>⚠️ No tengo datos.</b>

                Envíame una lista como:

                <div class="ai-example">
                    10, 15, 20, 25, 30
                </div>
            `;
        }

        const n = data.length;

        switch (measure) {

            case "rango": {

                const min = Math.min(...data);
                const max = Math.max(...data);
                const result = max - min;

                return `
                    <b>📏 Cálculo del rango</b>

                    <ol>
                        <li>Valor mínimo:
                            <b>${formatNumber(min)}</b>
                        </li>

                        <li>Valor máximo:
                            <b>${formatNumber(max)}</b>
                        </li>

                        <li>Aplicamos la fórmula:</li>
                    </ol>

                    <div class="ai-formula">
                        R = ${formatNumber(max)}
                        − ${formatNumber(min)}
                        = ${formatNumber(result)}
                    </div>

                    <b>Resultado:</b>
                    El rango es
                    <strong>${formatNumber(result)}</strong>.
                `;
            }


            case "amplitud": {

                const range =
                    calculateRange(data);

                const k =
                    calculateK(data);

                const amplitude =
                    range / k;

                return `
                    <b>📐 Cálculo de amplitud</b>

                    <ol>

                        <li>
                            Rango =
                            <b>${formatNumber(range)}</b>
                        </li>

                        <li>
                            K =
                            <b>${k}</b>
                        </li>

                        <li>
                            Aplicamos:
                        </li>

                    </ol>

                    <div class="ai-formula">
                        A = R / K
                        <br>
                        A = ${formatNumber(range)}
                        / ${k}
                        <br>
                        A = ${formatNumber(amplitude)}
                    </div>

                    <b>Resultado:</b>
                    ${formatNumber(amplitude)}.
                `;
            }


            case "k": {

                const k =
                    calculateK(data);

                return `
                    <b>🔢 Cálculo de K mediante Sturges</b>

                    <ol>

                        <li>
                            Número de datos:
                            <b>n = ${n}</b>
                        </li>

                        <li>
                            Aplicamos:
                        </li>

                    </ol>

                    <div class="ai-formula">
                        K = 1 + 3.322 log₁₀(${n})
                    </div>

                    <div class="ai-formula">
                        K ≈ ${formatNumber(k)}
                    </div>

                    <b>Resultado:</b>
                    ${k} intervalos aproximadamente.
                `;
            }


            case "media": {

                const total =
                    sum(data);

                const avg =
                    mean(data);

                return `
                    <b>📊 Cálculo de la media</b>

                    <ol>

                        <li>
                            Número de datos:
                            <b>n = ${n}</b>
                        </li>

                        <li>
                            Sumamos los datos:
                        </li>

                    </ol>

                    <div class="ai-formula">
                        Σx = ${formatNumber(total)}
                    </div>

                    <ol start="3">

                        <li>
                            Aplicamos:
                        </li>

                    </ol>

                    <div class="ai-formula">
                        x̄ = Σx / n
                        <br>
                        x̄ = ${formatNumber(total)}
                        / ${n}
                        <br>
                        x̄ = ${formatNumber(avg)}
                    </div>

                    <b>Resultado:</b>
                    La media es
                    <strong>${formatNumber(avg)}</strong>.
                `;
            }


            case "mediana": {

                const sorted =
                    [...data].sort(
                        (a, b) => a - b
                    );

                const med =
                    median(data);

                return `
                    <b>📍 Cálculo de la mediana</b>

                    <p>
                        Primero ordenamos los datos:
                    </p>

                    <div class="ai-formula">
                        ${sorted.join(", ")}
                    </div>

                    <p>
                        n = <b>${n}</b>
                    </p>

                    <div class="ai-formula">
                        Mediana = ${formatNumber(med)}
                    </div>

                    <b>Resultado:</b>
                    ${formatNumber(med)}.
                `;
            }


            case "varianza": {

                const population =
                    AIState.sampleOrPopulation ===
                    "poblacion";

                const avg =
                    mean(data);

                const v =
                    variance(
                        data,
                        population
                    );

                const denominator =
                    population
                        ? n
                        : n - 1;

                return `
                    <b>📉 Cálculo de la varianza</b>

                    <p>
                        Tipo seleccionado:
                        <b>
                            ${population
                                ? "Poblacional"
                                : "Muestral"}
                        </b>
                    </p>

                    <ol>

                        <li>
                            Calculamos la media:
                            <b>${formatNumber(avg)}</b>
                        </li>

                        <li>
                            Calculamos cada
                            (x − media)².
                        </li>

                        <li>
                            Sumamos las diferencias
                            cuadráticas.
                        </li>

                        <li>
                            Dividimos entre
                            <b>${denominator}</b>.
                        </li>

                    </ol>

                    <div class="ai-formula">
                        Varianza =
                        ${formatNumber(v)}
                    </div>

                    <b>Resultado:</b>
                    ${formatNumber(v)}.
                `;
            }


            case "desviacion": {

                const population =
                    AIState.sampleOrPopulation ===
                    "poblacion";

                const v =
                    variance(
                        data,
                        population
                    );

                const sd =
                    standardDeviation(
                        data,
                        population
                    );

                return `
                    <b>📈 Desviación estándar</b>

                    <ol>

                        <li>
                            Varianza =
                            <b>${formatNumber(v)}</b>
                        </li>

                        <li>
                            Extraemos la raíz cuadrada:
                        </li>

                    </ol>

                    <div class="ai-formula">
                        σ = √${formatNumber(v)}
                        <br>
                        σ = ${formatNumber(sd)}
                    </div>

                    <b>Resultado:</b>
                    ${formatNumber(sd)}.
                `;
            }


            case "moda": {

                const modes =
                    calculateMode(data);

                if (!modes.length) {

                    return `
                        <b>🔁 Moda</b>

                        Ningún valor se repite.
                        Por lo tanto, no existe una moda
                        en este conjunto.
                    `;
                }

                return `
                    <b>🔁 Cálculo de la moda</b>

                    <p>
                        Los valores con mayor frecuencia son:
                    </p>

                    <div class="ai-formula">
                        ${modes
                            .map(formatNumber)
                            .join(", ")}
                    </div>

                    <b>Resultado:</b>
                    ${modes.length === 1
                        ? "El conjunto es unimodal."
                        : "El conjunto tiene varias modas."}
                `;
            }


            case "cuartiles": {

                const q =
                    quartiles(data);

                return `
                    <b>🔹 Cuartiles</b>

                    <div class="ai-formula">
                        Q1 = ${formatNumber(q.q1)}
                        <br>
                        Q2 = ${formatNumber(q.q2)}
                        <br>
                        Q3 = ${formatNumber(q.q3)}
                    </div>

                    <ul>
                        <li>
                            Q1 representa aproximadamente
                            el 25% de los datos.
                        </li>

                        <li>
                            Q2 representa el 50%.
                        </li>

                        <li>
                            Q3 representa aproximadamente
                            el 75%.
                        </li>
                    </ul>
                `;
            }


            case "deciles": {

                const values = [];

                for (let d = 1; d <= 9; d++) {

                    values.push(`
                        <tr>
                            <td>D${d}</td>
                            <td>
                                ${formatNumber(
                                    decile(data, d)
                                )}
                            </td>
                            <td>${d * 10}%</td>
                        </tr>
                    `);
                }

                return `
                    <b>🔹 Deciles</b>

                    <div class="ai-table-wrapper">

                        <table class="ai-frequency-table">

                            <thead>
                                <tr>
                                    <th>Decil</th>
                                    <th>Valor</th>
                                    <th>Posición</th>
                                </tr>
                            </thead>

                            <tbody>
                                ${values.join("")}
                            </tbody>

                        </table>

                    </div>
                `;
            }


            case "percentiles": {

                const values = [10, 25, 50, 75, 90];

                return `
                    <b>🔹 Percentiles</b>

                    <div class="ai-table-wrapper">

                        <table class="ai-frequency-table">

                            <thead>
                                <tr>
                                    <th>Percentil</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>

                            <tbody>

                                ${values.map(p => `
                                    <tr>
                                        <td>P${p}</td>
                                        <td>
                                            ${formatNumber(
                                                percentile(
                                                    data,
                                                    p
                                                )
                                            )}
                                        </td>
                                    </tr>
                                `).join("")}

                            </tbody>

                        </table>

                    </div>
                `;
            }


            case "fisher": {

                const value =
                    fisher(data);

                return `
                    <b>📐 Asimetría de Fisher</b>

                    <div class="ai-formula">
                        γ₁ =
                        ${formatNumber(value)}
                    </div>

                    <p>
                        Interpretación:
                        ${
                            Math.abs(value) < 0.05
                                ? "aproximadamente simétrica"
                                : value > 0
                                    ? "asimetría positiva"
                                    : "asimetría negativa"
                        }
                    </p>
                `;
            }


            case "pearson": {

                const value =
                    pearson(data);

                return `
                    <b>📐 Coeficiente de Pearson</b>

                    <div class="ai-formula">
                        As =
                        3(Media − Mediana)
                        / Desviación estándar
                    </div>

                    <div class="ai-formula">
                        As =
                        ${formatNumber(value)}
                    </div>

                    <p>
                        El signo indica la dirección
                        de la asimetría.
                    </p>
                `;
            }


            case "kurtosis": {

                const value =
                    kurtosis(data);

                return `
                    <b>📊 Kurtosis / Curtosis</b>

                    <div class="ai-formula">
                        γ₂ =
                        ${formatNumber(value)}
                    </div>

                    <p>
                        Interpretación habitual:
                        ${
                            Math.abs(value) < 0.05
                                ? "aproximadamente mesocúrtica"
                                : value > 0
                                    ? "leptocúrtica"
                                    : "platicúrtica"
                        }
                    </p>
                `;
            }


            case "frecuencias": {

                return `
                    <b>📋 Tabla de frecuencias</b>

                    <p>
                        Se analizaron
                        <b>${n}</b> datos.
                    </p>

                    ${createFrequencyTableHTML(data)}
                `;
            }


            default:

                return `
                    No encontré esa medida.
                    Prueba con media, mediana, moda,
                    varianza, desviación, rango,
                    cuartiles, deciles, percentiles,
                    Fisher, Pearson o kurtosis.
                `;
        }
    }


    // ============================================================
    // RESPUESTAS GENERALES
    // ============================================================

    function generalResponse(text) {

        const t =
            normalizeText(text);

        if (
            t.includes("quien eres") ||
            t.includes("que eres")
        ) {

            return `
                <b>🤖 Soy StatCalc AI</b>

                <p>
                    Soy el asistente estadístico integrado
                    en tu calculadora.
                </p>

                <p>
                    Puedo ayudarte a introducir datos,
                    realizar cálculos y explicar cada
                    procedimiento paso a paso.
                </p>
            `;
        }


        if (
            t.includes("ayuda") ||
            t.includes("que puedes hacer")
        ) {

            return `
                <b>🧠 ¿Qué puedo hacer?</b>

                <ul>
                    <li>📊 Media</li>
                    <li>📍 Mediana</li>
                    <li>🔁 Moda</li>
                    <li>📏 Rango</li>
                    <li>📐 Amplitud</li>
                    <li>🔢 K / Sturges</li>
                    <li>📉 Varianza</li>
                    <li>📈 Desviación estándar</li>
                    <li>🔹 Cuartiles</li>
                    <li>🔹 Deciles</li>
                    <li>🔹 Percentiles</li>
                    <li>📐 Fisher</li>
                    <li>📐 Pearson</li>
                    <li>📊 Kurtosis</li>
                    <li>📋 Tablas de frecuencia</li>
                </ul>

                <p>
                    También puedo utilizar los datos
                    que ya introdujiste anteriormente.
                </p>
            `;
        }


        if (
            t.includes("ejemplo") ||
            t.includes("datos de prueba")
        ) {

            const example = [
                12, 15, 15, 18,
                20, 22, 22, 25,
                28, 30
            ];

            loadData(example);

            return `
                <b>🧪 Datos de prueba cargados</b>

                <div class="ai-formula">
                    ${example.join(", ")}
                </div>

                <p>
                    Ya los cargué en la calculadora.
                </p>

                <p>
                    Puedes decir:
                    <b>"calcula todo"</b>.
                </p>
            `;
        }


        if (
            t.includes("muestra") ||
            t.includes("poblacion")
        ) {

            return `
                <b>👥 Muestra y población</b>

                <p>
                    Una <b>población</b> representa el conjunto
                    completo que se desea estudiar.
                </p>

                <p>
                    Una <b>muestra</b> representa una parte
                    de esa población.
                </p>

                <b>Varianza muestral:</b>

                <div class="ai-formula">
                    s² = Σ(x − x̄)² / (n − 1)
                </div>

                <b>Varianza poblacional:</b>

                <div class="ai-formula">
                    σ² = Σ(x − μ)² / N
                </div>
            `;
        }


        return `
            <b>🤔 Vamos a intentarlo de otra forma</b>

            Puedo entender preguntas como:

            <div class="ai-example">
                ¿Cuál es la media?
            </div>

            <div class="ai-example">
                Calcula la varianza muestral
            </div>

            <div class="ai-example">
                ¿Cuál es Q3?
            </div>

            <div class="ai-example">
                Explícame Fisher
            </div>

            <div class="ai-example">
                Haz una tabla de frecuencias
            </div>

            <div class="ai-example">
                Calcula estos datos:
                10, 15, 18, 20, 25
            </div>
        `;
    }


    // ============================================================
    // PROCESAR MENSAJE
    // ============================================================

    function generateResponse(text) {

        const t =
            normalizeText(text);

        detectSampleType(text);

        const numbers =
            extractNumbers(text);

        /*
            Si hay números y contexto estadístico,
            primero procesamos los datos.
        */

        if (looksLikeData(text)) {

            loadData(numbers);

            const measure =
                detectMeasure(text);

            if (measure) {

                AIState.lastMeasure =
                    measure;

                return `
                    <b>✅ Datos recibidos</b>

                    <div class="ai-formula">
                        ${numbers.join(", ")}
                    </div>

                    <p>
                        Detecté
                        <b>${numbers.length}</b>
                        observaciones.
                    </p>

                    ${calculateMeasure(
                        measure,
                        numbers
                    )}
                `;
            }

            return `
                <b>✅ Datos cargados</b>

                <div class="ai-formula">
                    ${numbers.join(", ")}
                </div>

                <p>
                    Encontré
                    <b>${numbers.length}</b>
                    datos y los envié a la calculadora.
                </p>

                <p>
                    Ahora puedes decirme:
                </p>

                <div class="ai-example">
                    calcula la media
                </div>

                <div class="ai-example">
                    calcula todo
                </div>
            `;
        }


        // ========================================================
        // PREGUNTAS DE SEGUIMIENTO
        // ========================================================

        const measure =
            detectMeasure(text);

        if (
            measure &&
            AIState.data.length > 0
        ) {

            AIState.lastMeasure =
                measure;

            return `
                <b>🔄 Utilizando tus datos anteriores</b>

                <div class="ai-formula">
                    ${AIState.data.join(", ")}
                </div>

                ${calculateMeasure(
                    measure,
                    AIState.data
                )}
            `;
        }


        // ========================================================
        // "CALCULA TODO"
        // ========================================================

        if (
            /(calcula todo|calcular todo|todas las medidas|todo)/.test(t)
        ) {

            if (!AIState.data.length) {

                return `
                    <b>⚠️ Primero necesito los datos.</b>

                    Escríbelos así:

                    <div class="ai-example">
                        10, 12, 15, 18, 20, 25, 30
                    </div>
                `;
            }

            return generateCompleteSummary();
        }


        // ========================================================
        // INTENCIÓN NORMAL
        // ========================================================

        const intent =
            detectIntent(text);

        AIState.lastIntent =
            intent;

        switch (intent) {

            case "saludo":

                return `
                    <b>👋 ¡Hola!</b>

                    Soy <b>StatCalc AI</b>.

                    <p>
                        Estoy listo para ayudarte con
                        tus cálculos estadísticos.
                    </p>

                    <div class="ai-example">
                        Calcula la media de 10, 20, 30
                    </div>
                `;


            case "despedida":

                return `
                    <b>👋 ¡Hasta luego!</b>

                    Cuando quieras continuar con tus
                    cálculos, aquí estaré.
                `;


            case "agradecimiento":

                return `
                    😊 ¡De nada!

                    ¿Quieres realizar otro cálculo?
                `;


            case "ayuda":

                return generalResponse(
                    "ayuda"
                );


            case "agrupados":

                AIState.dataType =
                    "agrupados";

                return `
                    <b>📦 Datos agrupados</b>

                    Para datos agrupados normalmente
                    trabajamos con:

                    <ol>
                        <li>Rango.</li>
                        <li>K.</li>
                        <li>Amplitud.</li>
                        <li>Intervalos.</li>
                        <li>Marca de clase.</li>
                        <li>Frecuencia.</li>
                        <li>Frecuencia acumulada.</li>
                    </ol>

                    Si tu calculadora tiene un selector
                    de tipo de datos, selecciona
                    <b>Datos agrupados</b>.
                `;


            case "no_agrupados":

                AIState.dataType =
                    "no_agrupados";

                return `
                    <b>📦 Datos no agrupados</b>

                    Los datos se mantienen individualmente,
                    por ejemplo:

                    <div class="ai-formula">
                        10, 12, 15, 15, 18, 20
                    </div>

                    Sobre ellos podemos calcular
                    todas las medidas estadísticas.
                `;


            case "formula": {

                const detected =
                    detectMeasure(text);

                if (
                    detected &&
                    explanations[detected]
                ) {
                    return explanations[detected];
                }

                return `
                    <b>📚 Fórmulas disponibles</b>

                    Puedo explicarte:

                    <ul>
                        <li>Rango</li>
                        <li>Amplitud</li>
                        <li>K</li>
                        <li>Media</li>
                        <li>Mediana</li>
                        <li>Varianza</li>
                        <li>Desviación estándar</li>
                        <li>Cuartiles</li>
                        <li>Deciles</li>
                        <li>Percentiles</li>
                        <li>Fisher</li>
                        <li>Pearson</li>
                        <li>Kurtosis</li>
                        <li>Moda</li>
                    </ul>
                `;
            }


            case "calcular":

                if (!AIState.data.length) {

                    return `
                        <b>🧮 Necesito los datos</b>

                        Por ejemplo:

                        <div class="ai-example">
                            Calcula:
                            12, 15, 18, 20, 25
                        </div>
                    `;
                }

                return generateCompleteSummary();


            case "rango":
            case "amplitud":
            case "k":
            case "media":
            case "mediana":
            case "varianza":
            case "desviacion":
            case "moda":
            case "cuartiles":
            case "deciles":
            case "percentiles":
            case "fisher":
            case "pearson":
            case "kurtosis":
            case "frecuencias":

                if (
                    explanations[intent] &&
                    !AIState.data.length
                ) {
                    return explanations[intent];
                }

                return calculateMeasure(
                    intent,
                    AIState.data
                );


            default:

                return generalResponse(text);
        }
    }


    // ============================================================
    // RESUMEN COMPLETO
    // ============================================================

    function generateCompleteSummary() {

        const data =
            AIState.data;

        const avg =
            mean(data);

        const med =
            median(data);

        const mode =
            calculateMode(data);

        const range =
            calculateRange(data);

        const k =
            calculateK(data);

        const amplitude =
            calculateAmplitude(data);

        const sampleVariance =
            variance(data, false);

        const populationVariance =
            variance(data, true);

        const sampleSD =
            standardDeviation(data, false);

        const populationSD =
            standardDeviation(data, true);

        const q =
            quartiles(data);

        return `
            <b>📊 ANÁLISIS ESTADÍSTICO COMPLETO</b>

            <p>
                Se analizaron
                <b>${data.length}</b>
                observaciones.
            </p>

            <hr>

            <b>📏 Rango</b>

            <div class="ai-formula">
                R = ${formatNumber(range)}
            </div>


            <b>🔢 Número de intervalos</b>

            <div class="ai-formula">
                K ≈ ${k}
            </div>


            <b>📐 Amplitud</b>

            <div class="ai-formula">
                A ≈ ${formatNumber(amplitude)}
            </div>


            <b>📊 Media</b>

            <div class="ai-formula">
                x̄ = ${formatNumber(avg)}
            </div>


            <b>📍 Mediana</b>

            <div class="ai-formula">
                Me = ${formatNumber(med)}
            </div>


            <b>🔁 Moda</b>

            <div class="ai-formula">
                ${
                    mode.length
                        ? mode
                            .map(formatNumber)
                            .join(", ")
                        : "Sin moda"
                }
            </div>


            <b>📉 Varianza muestral</b>

            <div class="ai-formula">
                s² =
                ${formatNumber(sampleVariance)}
            </div>


            <b>📉 Varianza poblacional</b>

            <div class="ai-formula">
                σ² =
                ${formatNumber(populationVariance)}
            </div>


            <b>📈 Desviación estándar muestral</b>

            <div class="ai-formula">
                s =
                ${formatNumber(sampleSD)}
            </div>


            <b>📈 Desviación estándar poblacional</b>

            <div class="ai-formula">
                σ =
                ${formatNumber(populationSD)}
            </div>


            <b>🔹 Cuartiles</b>

            <div class="ai-formula">
                Q1 = ${formatNumber(q.q1)}
                <br>
                Q2 = ${formatNumber(q.q2)}
                <br>
                Q3 = ${formatNumber(q.q3)}
            </div>


            <b>🔹 Deciles</b>

            <div class="ai-formula">

                D1 = ${formatNumber(decile(data, 1))}
                <br>

                D2 = ${formatNumber(decile(data, 2))}
                <br>

                D3 = ${formatNumber(decile(data, 3))}
                <br>

                D4 = ${formatNumber(decile(data, 4))}
                <br>

                D5 = ${formatNumber(decile(data, 5))}
                <br>

                D6 = ${formatNumber(decile(data, 6))}
                <br>

                D7 = ${formatNumber(decile(data, 7))}
                <br>

                D8 = ${formatNumber(decile(data, 8))}
                <br>

                D9 = ${formatNumber(decile(data, 9))}

            </div>


            <b>🔹 Percentiles principales</b>

            <div class="ai-formula">

                P10 =
                ${formatNumber(percentile(data, 10))}
                <br>

                P25 =
                ${formatNumber(percentile(data, 25))}
                <br>

                P50 =
                ${formatNumber(percentile(data, 50))}
                <br>

                P75 =
                ${formatNumber(percentile(data, 75))}
                <br>

                P90 =
                ${formatNumber(percentile(data, 90))}

            </div>


            <b>📐 Fisher</b>

            <div class="ai-formula">
                γ₁ =
                ${formatNumber(fisher(data))}
            </div>


            <b>📐 Pearson</b>

            <div class="ai-formula">
                As =
                ${formatNumber(pearson(data))}
            </div>


            <b>📊 Kurtosis</b>

            <div class="ai-formula">
                γ₂ =
                ${formatNumber(kurtosis(data))}
            </div>


            <hr>

            <b>📋 Tabla de frecuencias</b>

            ${createFrequencyTableHTML(data)}

            <hr>

            <p>
                ✅ El análisis fue realizado directamente
                con los datos cargados en StatCalc AI.
            </p>
        `;
    }


    // ============================================================
    // ENVÍO
    // ============================================================

    async function sendMessage() {

        if (
            !chatInput ||
            AIState.isTyping
        ) {
            return;
        }

        const text =
            chatInput.value.trim();

        if (!text) {
            return;
        }

        addMessage(
            text,
            "user"
        );

        AIState.conversation.push({
            role: "user",
            content: text,
            date: new Date()
        });

        AIState.lastQuestion =
            text;

        chatInput.value = "";

        const typing =
            showTyping();

        await sleep(
            350 +
            Math.random() * 450
        );

        let response;

        try {

            response =
                generateResponse(text);

        } catch (error) {

            console.error(
                "StatCalc AI error:",
                error
            );

            response = `
                <b>⚠️ Ocurrió un problema</b>

                No pude procesar esa solicitud
                correctamente.

                <p>
                    Intenta escribir nuevamente
                    tu pregunta o tus datos.
                </p>
            `;
        }

        hideTyping(typing);

        addMessage(
            response,
            "ai"
        );

        AIState.lastResponse =
            response;

        AIState.conversation.push({
            role: "assistant",
            content: response,
            date: new Date()
        });
    }


    // ============================================================
    // BOTÓN DE CHAT
    // ============================================================

    if (
        toggleBtn &&
        chatWindow
    ) {

        toggleBtn.addEventListener(
            "click",
            () => {

                chatWindow.classList.toggle(
                    "hidden"
                );

                if (
                    !chatWindow.classList.contains(
                        "hidden"
                    ) &&
                    chatInput
                ) {

                    setTimeout(
                        () => chatInput.focus(),
                        150
                    );
                }
            }
        );
    }


    // ============================================================
    // CERRAR CHAT
    // ============================================================

    if (
        closeBtn &&
        chatWindow
    ) {

        closeBtn.addEventListener(
            "click",
            () => {

                chatWindow.classList.add(
                    "hidden"
                );

            }
        );
    }


    // ============================================================
    // BOTÓN ENVIAR
    // ============================================================

    if (sendBtn) {

        sendBtn.addEventListener(
            "click",
            sendMessage
        );
    }


    // ============================================================
    // ENTER
    // ============================================================

    if (chatInput) {

        chatInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();
                }
            }
        );
    }


    // ============================================================
    // MENSAJE INICIAL
    // ============================================================

    if (
        chatMessages &&
        !chatMessages.children.length
    ) {

        setTimeout(
            () => {

                addMessage(`
                    <b>🤖 ¡Hola! Soy StatCalc AI</b>

                    <p>
                        Puedo analizar tus datos estadísticos
                        y explicarte los resultados paso a paso.
                    </p>

                    <div class="ai-example">
                        Calcula la media de
                        10, 15, 20, 25
                    </div>

                    <div class="ai-example">
                        ¿Qué es la varianza?
                    </div>

                    <div class="ai-example">
                        Calcula todo
                    </div>
                `);

                AIState.initialized =
                    true;

            },
            250
        );
    }

});