const StatsEngine = {
    calculateNoAgrupados(data) {
        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;
        const min = sorted[0];
        const max = sorted[n - 1];
        const rango = max - min;
        const logN = Math.log10(n);
        const kRaw = 1 + 3.322 * logN;
        const k = Math.ceil(kRaw);
        const amplitud = parseFloat((rango / k).toFixed(4));

        const suma = sorted.reduce((a, b) => a + b, 0);
        const mediaVal = suma / n;
        const media = mediaVal.toFixed(4);

        const mid = Math.floor(n / 2);
        const medianaVal = n % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
        const mediana = medianaVal.toFixed(4);

        // Suma de cuadrados
        const ss = sorted.reduce((acc, x) => acc + Math.pow(x - mediaVal, 2), 0);
        const varMuestral = (ss / (n - 1)).toFixed(4);
        const desvMuestral = Math.sqrt(parseFloat(varMuestral)).toFixed(4);
        const varPoblacional = (ss / n).toFixed(4);
        const desvPoblacional = Math.sqrt(parseFloat(varPoblacional)).toFixed(4);

        // Frecuencias
        const freq = {};
        sorted.forEach(x => freq[x] = (freq[x] || 0) + 1);

        let maxFreq = 0, moda = [];
        for (let key in freq) {
            if (freq[key] > maxFreq) {
                maxFreq = freq[key];
                moda = [key];
            } else if (freq[key] === maxFreq) {
                moda.push(key);
            }
        }

        // Cuantiles
        const getQuantile = (p) => {
            const pos = (p / 100) * (n + 1);
            const idx = Math.floor(pos) - 1;
            if (idx < 0) return sorted[0];
            if (idx >= n - 1) return sorted[n - 1];
            const frac = pos - Math.floor(pos);
            return (sorted[idx] + frac * (sorted[idx + 1] - sorted[idx]));
        };

        const q1 = getQuantile(25).toFixed(4);
        const q2 = getQuantile(50).toFixed(4);
        const q3 = getQuantile(75).toFixed(4);

        const d1 = getQuantile(10).toFixed(4);
        const d5 = getQuantile(50).toFixed(4);
        const d9 = getQuantile(90).toFixed(4);

        const p10 = getQuantile(10).toFixed(4);
        const p50 = getQuantile(50).toFixed(4);
        const p90 = getQuantile(90).toFixed(4);

        // Momentos para Fisher y Kurtosis
        const desvP = Math.sqrt(ss / n) || 1;
        const m3 = sorted.reduce((acc, x) => acc + Math.pow(x - mediaVal, 3), 0) / n;
        const m4 = sorted.reduce((acc, x) => acc + Math.pow(x - mediaVal, 4), 0) / n;
        const fisher = (m3 / Math.pow(desvP, 3)).toFixed(4);
        const kurtosis = ((m4 / Math.pow(desvP, 4)) - 3).toFixed(4);
        const pearson = desvMuestral > 0
            ? ((3 * (mediaVal - medianaVal)) / parseFloat(desvMuestral)).toFixed(4)
            : "0.0000";

        // ========== TABLA DE FRECUENCIAS AVANZADA ==========
        let accFi = 0;
        let sumXiFi = 0;
        let sumXiFi2 = 0; // (xi - media)² * fi
        let sumXiFi3 = 0; // (xi - media)³ * fi
        let sumXiFi4 = 0; // (xi - media)⁴ * fi

        const tablaFrecuencias = Object.keys(freq).map(val => {
            const xi = parseFloat(val);
            const fi = freq[val];
            accFi += fi;
            const fr = fi / n;
            const xiFi = xi * fi;
            sumXiFi += xiFi;

            const desv = xi - mediaVal;
            const desv2 = Math.pow(desv, 2) * fi;
            const desv3 = Math.pow(desv, 3) * fi;
            const desv4 = Math.pow(desv, 4) * fi;

            sumXiFi2 += desv2;
            sumXiFi3 += desv3;
            sumXiFi4 += desv4;

            return {
                valor: xi,
                xi: xi,                    // Marca de clase (en no agrupados = valor)
                fi: fi,
                Fi: accFi,
                fr: fr.toFixed(4),
                Fr: (accFi / n).toFixed(4),
                pct: (fr * 100).toFixed(2) + '%',
                xiFi: xiFi.toFixed(4),
                desv2: desv2.toFixed(4),   // (xi - x̄)² · fi
                desv3: desv3.toFixed(4),   // (xi - x̄)³ · fi
                desv4: desv4.toFixed(4)    // (xi - x̄)⁴ · fi
            };
        });

        return {
            rango: {
                val: rango,
                steps: [
                    `<div class="formula-block"><b>Fórmula:</b> Rango (R) = X<sub>máx</sub> − X<sub>mín</sub></div>`,
                    `<b>Paso 1:</b> Identificar el valor máximo del conjunto → X<sub>máx</sub> = <b>${max}</b>`,
                    `<b>Paso 2:</b> Identificar el valor mínimo del conjunto → X<sub>mín</sub> = <b>${min}</b>`,
                    `<b>Paso 3:</b> Sustituir en la fórmula: R = ${max} − ${min}`,
                    `<b>Paso 4:</b> Resultado final → <b>R = ${rango}</b>`
                ]
            },
            k: {
                val: k,
                steps: [
                    `<div class="formula-block"><b>Fórmula (Regla de Sturges):</b> K = 1 + 3.322 · log<sub>10</sub>(N)</div>`,
                    `<b>Paso 1:</b> Contar el número total de observaciones → N = <b>${n}</b>`,
                    `<b>Paso 2:</b> Calcular el logaritmo en base 10 de N → log<sub>10</sub>(${n}) = <b>${logN.toFixed(6)}</b>`,
                    `<b>Paso 3:</b> Multiplicar por 3.322 → 3.322 × ${logN.toFixed(6)} = <b>${(3.322 * logN).toFixed(6)}</b>`,
                    `<b>Paso 4:</b> Sumar 1 → 1 + ${(3.322 * logN).toFixed(6)} = <b>${kRaw.toFixed(6)}</b>`,
                    `<b>Paso 5:</b> Redondear hacia arriba (ceil) → <b>K = ${k}</b>`
                ]
            },
            amplitud: {
                val: amplitud,
                steps: [
                    `<div class="formula-block"><b>Fórmula:</b> Amplitud (A) = Rango / K</div>`,
                    `<b>Paso 1:</b> Tener el Rango calculado → R = <b>${rango}</b>`,
                    `<b>Paso 2:</b> Tener el número de intervalos → K = <b>${k}</b>`,
                    `<b>Paso 3:</b> Dividir → A = ${rango} / ${k}`,
                    `<b>Paso 4:</b> Resultado → <b>A = ${amplitud}</b>`
                ]
            },
            media: {
                val: media,
                steps: [
                    `<div class="formula-block"><b>Fórmula:</b> x̄ = Σx<sub>i</sub> / N</div>`,
                    `<b>Paso 1:</b> Sumar todos los valores del conjunto → Σx<sub>i</sub> = <b>${suma}</b>`,
                    `<b>Paso 2:</b> Contar el total de datos → N = <b>${n}</b>`,
                    `<b>Paso 3:</b> Dividir la suma entre N → x̄ = ${suma} / ${n}`,
                    `<b>Paso 4:</b> Resultado final → <b>x̄ = ${media}</b>`
                ]
            },
            mediana: {
                val: mediana,
                steps: [
                    `<div class="formula-block"><b>Fórmula de posición:</b> Pos = (N + 1) / 2</div>`,
                    `<b>Paso 1:</b> Ordenar los datos de menor a mayor.`,
                    `<b>Paso 2:</b> Calcular la posición central → (${n} + 1) / 2 = <b>${((n + 1) / 2).toFixed(2)}</b>`,
                    n % 2 !== 0
                        ? `<b>Paso 3:</b> Como N es impar, la mediana es el valor que ocupa esa posición → <b>${mediana}</b>`
                        : `<b>Paso 3:</b> Como N es par, se promedian los dos valores centrales → (${sorted[mid - 1]} + ${sorted[mid]}) / 2 = <b>${mediana}</b>`
                ]
            },
            varianza: {
                val: varMuestral,
                steps: [
                    `<div class="formula-block"><b>Fórmula (muestral):</b> s² = Σ(x<sub>i</sub> − x̄)² / (N − 1)</div>`,
                    `<b>Paso 1:</b> Calcular la media → x̄ = <b>${media}</b>`,
                    `<b>Paso 2:</b> Para cada dato, restar la media y elevar al cuadrado.`,
                    `<b>Paso 3:</b> Sumar todos esos cuadrados → Σ(x<sub>i</sub> − x̄)² = <b>${ss.toFixed(4)}</b>`,
                    `<b>Paso 4:</b> Dividir entre (N − 1) → ${ss.toFixed(4)} / (${n} − 1) = ${ss.toFixed(4)} / ${n - 1}`,
                    `<b>Paso 5:</b> Resultado final → <b>s² = ${varMuestral}</b>`,
                    `<br><i>Nota: Si fuera población se dividiría entre N (no entre N-1).</i>`
                ]
            },
            desviacion: {
                val: desvMuestral,
                steps: [
                    `<div class="formula-block"><b>Fórmula:</b> s = √s²</div>`,
                    `<b>Paso 1:</b> Tener la varianza muestral → s² = <b>${varMuestral}</b>`,
                    `<b>Paso 2:</b> Extraer la raíz cuadrada → √(${varMuestral})`,
                    `<b>Paso 3:</b> Resultado final → <b>s = ${desvMuestral}</b>`
                ]
            },
            cuartiles: {
                val: `Q1: ${q1} | Q2: ${q2} | Q3: ${q3}`,
                steps: [
                    `<div class="formula-block"><b>Fórmula de posición:</b> Pos = k · (N + 1) / 4</div>`,
                    `<b>Q1 (25%):</b> Posición = 1·(${n}+1)/4 = ${((n + 1) / 4).toFixed(2)} → <b>Q1 = ${q1}</b>`,
                    `<b>Q2 (50%):</b> Posición = 2·(${n}+1)/4 = ${((2 * (n + 1)) / 4).toFixed(2)} → <b>Q2 = ${q2}</b> (coincide con la mediana)`,
                    `<b>Q3 (75%):</b> Posición = 3·(${n}+1)/4 = ${((3 * (n + 1)) / 4).toFixed(2)} → <b>Q3 = ${q3}</b>`
                ]
            },
            deciles: {
                val: `D1: ${d1} | D5: ${d5} | D9: ${d9}`,
                steps: [
                    `<div class="formula-block"><b>Fórmula:</b> Pos = k · (N + 1) / 10</div>`,
                    `<b>D1:</b> ${d1}`,
                    `<b>D5:</b> ${d5} (coincide con la mediana)`,
                    `<b>D9:</b> ${d9}`
                ]
            },
            percentiles: {
                val: `P10: ${p10} | P50: ${p50} | P90: ${p90}`,
                steps: [
                    `<div class="formula-block"><b>Fórmula:</b> Pos = k · (N + 1) / 100</div>`,
                    `<b>P10:</b> ${p10}`,
                    `<b>P50:</b> ${p50} (mediana)`,
                    `<b>P90:</b> ${p90}`
                ]
            },
            fisher: {
                val: fisher,
                steps: [
                    `<div class="formula-block"><b>Fórmula:</b> γ₁ = μ₃ / σ³</div>`,
                    `<b>Paso 1:</b> Calcular el tercer momento central μ₃ = Σ(x<sub>i</sub> − x̄)³ / N = <b>${m3.toFixed(6)}</b>`,
                    `<b>Paso 2:</b> Calcular la desviación típica poblacional σ = <b>${desvP.toFixed(4)}</b>`,
                    `<b>Paso 3:</b> Elevar σ al cubo → σ³ = <b>${Math.pow(desvP, 3).toFixed(6)}</b>`,
                    `<b>Paso 4:</b> Dividir → γ₁ = ${m3.toFixed(6)} / ${Math.pow(desvP, 3).toFixed(6)}`,
                    `<b>Paso 5:</b> Resultado → <b>γ₁ = ${fisher}</b>`,
                    `<br><i>Interpretación: ≈0 simétrica | >0 asimetría positiva | <0 asimetría negativa</i>`
                ]
            },
            kurtosis: {
                val: kurtosis,
                steps: [
                    `<div class="formula-block"><b>Fórmula (exceso de curtosis):</b> γ₂ = μ₄ / σ⁴ − 3</div>`,
                    `<b>Paso 1:</b> Calcular el cuarto momento central μ₄ = Σ(x<sub>i</sub> − x̄)⁴ / N = <b>${m4.toFixed(6)}</b>`,
                    `<b>Paso 2:</b> Calcular σ⁴ = <b>${Math.pow(desvP, 4).toFixed(6)}</b>`,
                    `<b>Paso 3:</b> Dividir μ₄ / σ⁴ = <b>${(m4 / Math.pow(desvP, 4)).toFixed(6)}</b>`,
                    `<b>Paso 4:</b> Restar 3 → Resultado final → <b>γ₂ = ${kurtosis}</b>`,
                    `<br><i>Interpretación: ≈0 mesocúrtica | >0 leptocúrtica | <0 platicúrtica</i>`
                ]
            },
            pearson: {
                val: pearson,
                steps: [
                    `<div class="formula-block"><b>Segundo coeficiente de Pearson:</b> As = 3(x̄ − Me) / s</div>`,
                    `<b>Paso 1:</b> Media x̄ = <b>${media}</b>`,
                    `<b>Paso 2:</b> Mediana Me = <b>${mediana}</b>`,
                    `<b>Paso 3:</b> Desviación estándar s = <b>${desvMuestral}</b>`,
                    `<b>Paso 4:</b> 3 × (${media} − ${mediana}) / ${desvMuestral}`,
                    `<b>Paso 5:</b> Resultado → <b>As = ${pearson}</b>`
                ]
            },
            moda: {
                val: moda.join(', '),
                steps: [
                    `<b>Paso 1:</b> Contar la frecuencia de cada valor.`,
                    `<b>Paso 2:</b> Identificar la frecuencia máxima → <b>${maxFreq}</b>`,
                    `<b>Paso 3:</b> Los valores con esa frecuencia son la moda → <b>${moda.join(', ')}</b>`,
                    moda.length > 1 ? `<i>El conjunto es multimodal.</i>` : `<i>El conjunto es unimodal.</i>`
                ]
            },
            tabla: {
                val: "Generada",
                data: tablaFrecuencias,
                sumXiFi: sumXiFi.toFixed(4),
                sumXiFi2: sumXiFi2.toFixed(4),
                sumXiFi3: sumXiFi3.toFixed(4),
                sumXiFi4: sumXiFi4.toFixed(4),
                media: mediaVal,
                steps: ["Tabla de frecuencias generada con todas las columnas solicitadas."]
            }
        };
    }
};