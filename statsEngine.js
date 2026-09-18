const StatsEngine = {
    // =========================================================
    // DATOS NO AGRUPADOS
    // =========================================================
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
        const medianaVal = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        const mediana = medianaVal.toFixed(4);

        const ss = sorted.reduce((acc, x) => acc + Math.pow(x - mediaVal, 2), 0);
        const varMuestral = (ss / (n - 1)).toFixed(4);
        const desvMuestral = Math.sqrt(parseFloat(varMuestral)).toFixed(4);

        const freq = {};
        sorted.forEach(x => freq[x] = (freq[x] || 0) + 1);

        let maxFreq = 0, moda = [];
        for (let key in freq) {
            if (freq[key] > maxFreq) { maxFreq = freq[key]; moda = [key]; }
            else if (freq[key] === maxFreq) moda.push(key);
        }

        const getQuantile = (p) => {
            const pos = (p / 100) * (n + 1);
            const idx = Math.floor(pos) - 1;
            if (idx < 0) return sorted[0];
            if (idx >= n - 1) return sorted[n - 1];
            const frac = pos - Math.floor(pos);
            return sorted[idx] + frac * (sorted[idx + 1] - sorted[idx]);
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

        const desvP = Math.sqrt(ss / n) || 1;
        const m3 = sorted.reduce((acc, x) => acc + Math.pow(x - mediaVal, 3), 0) / n;
        const m4 = sorted.reduce((acc, x) => acc + Math.pow(x - mediaVal, 4), 0) / n;
        const fisher = (m3 / Math.pow(desvP, 3)).toFixed(4);
        const kurtosis = ((m4 / Math.pow(desvP, 4)) - 3).toFixed(4);
        const pearson = desvMuestral > 0 ? ((3 * (mediaVal - medianaVal)) / parseFloat(desvMuestral)).toFixed(4) : "0.0000";

        // Tabla de frecuencias
        let accFi = 0, sumXiFi = 0, sumXiFi2 = 0, sumXiFi3 = 0, sumXiFi4 = 0;

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
                xi: xi,
                fi: fi,
                Fi: accFi,
                fr: fr.toFixed(4),
                Fr: (accFi / n).toFixed(4),
                pct: (fr * 100).toFixed(2) + '%',
                xiFi: xiFi.toFixed(4),
                desv2: desv2.toFixed(4),
                desv3: desv3.toFixed(4),
                desv4: desv4.toFixed(4)
            };
        });

        return {
            tipo: 'no_agrupados',
            rango: { val: rango, steps: this._stepsRango(max, min, rango) },
            k: { val: k, steps: this._stepsK(n, logN, kRaw, k) },
            amplitud: { val: amplitud, steps: this._stepsAmplitud(rango, k, amplitud) },
            media: { val: media, steps: this._stepsMedia(suma, n, media) },
            mediana: { val: mediana, steps: this._stepsMediana(n, sorted, mid, mediana) },
            varianza: { val: varMuestral, steps: this._stepsVarianza(media, ss, n, varMuestral) },
            desviacion: { val: desvMuestral, steps: this._stepsDesviacion(varMuestral, desvMuestral) },
            cuartiles: { val: `Q1: ${q1} | Q2: ${q2} | Q3: ${q3}`, steps: this._stepsCuartiles(n, q1, q2, q3) },
            deciles: { val: `D1: ${d1} | D5: ${d5} | D9: ${d9}`, steps: [`D1 = ${d1}`, `D5 = ${d5}`, `D9 = ${d9}`] },
            percentiles: { val: `P10: ${p10} | P50: ${p50} | P90: ${p90}`, steps: [`P10 = ${p10}`, `P50 = ${p50}`, `P90 = ${p90}`] },
            fisher: { val: fisher, steps: this._stepsFisher(m3, desvP, fisher) },
            kurtosis: { val: kurtosis, steps: this._stepsKurtosis(m4, desvP, kurtosis) },
            pearson: { val: pearson, steps: this._stepsPearson(media, mediana, desvMuestral, pearson) },
            moda: { val: moda.join(', '), steps: this._stepsModa(maxFreq, moda) },
            tabla: {
                val: "Generada",
                data: tablaFrecuencias,
                sumXiFi: sumXiFi.toFixed(4),
                sumXiFi2: sumXiFi2.toFixed(4),
                sumXiFi3: sumXiFi3.toFixed(4),
                sumXiFi4: sumXiFi4.toFixed(4),
                media: mediaVal
            }
        };
    },

    // =========================================================
    // DATOS AGRUPADOS
    // =========================================================
    calculateAgrupados(data) {
        // data = array de números → se agrupan automáticamente
        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;
        const min = sorted[0];
        const max = sorted[n - 1];
        const rango = max - min;
        const logN = Math.log10(n);
        const kRaw = 1 + 3.322 * logN;
        const k = Math.ceil(kRaw);
        let amplitud = rango / k;
        // Redondear amplitud hacia arriba a un valor "bonito"
        amplitud = Math.ceil(amplitud * 100) / 100;

        // Construir intervalos
        const intervalos = [];
        let li = min;
        for (let i = 0; i < k; i++) {
            const ls = i === k - 1 ? max + 0.0001 : li + amplitud;
            intervalos.push({ li, ls, marca: (li + ls) / 2 });
            li = ls;
        }

        // Contar frecuencias
        const freq = intervalos.map(int => {
            const fi = sorted.filter(x => x >= int.li && x < int.ls).length;
            return { ...int, fi };
        });

        // Ajustar último intervalo para incluir el máximo
        if (freq.length > 0) {
            const last = freq[freq.length - 1];
            last.fi = sorted.filter(x => x >= last.li && x <= max).length;
        }

        // Cálculos
        let sumaFi = 0, sumaXiFi = 0, sumaXiFi2 = 0, sumaXiFi3 = 0, sumaXiFi4 = 0;
        let fiAcum = 0;

        const tabla = freq.map(row => {
            const xi = row.marca;
            const fi = row.fi;
            fiAcum += fi;
            sumaFi += fi;
            const xiFi = xi * fi;
            sumaXiFi += xiFi;

            return { ...row, Fi: fiAcum, xiFi };
        });

        const mediaVal = sumaXiFi / n;
        const media = mediaVal.toFixed(4);

        // Momentos
        tabla.forEach(row => {
            const desv = row.marca - mediaVal;
            row.desv2 = (Math.pow(desv, 2) * row.fi).toFixed(4);
            row.desv3 = (Math.pow(desv, 3) * row.fi).toFixed(4);
            row.desv4 = (Math.pow(desv, 4) * row.fi).toFixed(4);
            sumaXiFi2 += parseFloat(row.desv2);
            sumaXiFi3 += parseFloat(row.desv3);
            sumaXiFi4 += parseFloat(row.desv4);

            row.pct = ((row.fi / n) * 100).toFixed(2) + '%';
            row.fr = (row.fi / n).toFixed(4);
            row.Fr = (row.Fi / n).toFixed(4);
            row.xi = row.marca.toFixed(4);
            row.valor = `${row.li.toFixed(2)} - ${row.ls.toFixed(2)}`;
        });

        const varMuestral = (sumaXiFi2 / (n - 1)).toFixed(4);
        const desvMuestral = Math.sqrt(parseFloat(varMuestral)).toFixed(4);

        // Mediana agrupada
        const posMed = n / 2;
        let medianaVal = 0;
        for (let i = 0; i < tabla.length; i++) {
            if (tabla[i].Fi >= posMed) {
                const prevFi = i === 0 ? 0 : tabla[i - 1].Fi;
                const Li = tabla[i].li;
                const a = amplitud;
                const fi = tabla[i].fi;
                medianaVal = Li + ((posMed - prevFi) / fi) * a;
                break;
            }
        }
        const mediana = medianaVal.toFixed(4);

        // Moda agrupada
        let maxFi = 0, modaIdx = 0;
        tabla.forEach((r, i) => { if (r.fi > maxFi) { maxFi = r.fi; modaIdx = i; } });
        const modaRow = tabla[modaIdx];
        const d1 = modaIdx > 0 ? modaRow.fi - tabla[modaIdx - 1].fi : modaRow.fi;
        const d2 = modaIdx < tabla.length - 1 ? modaRow.fi - tabla[modaIdx + 1].fi : modaRow.fi;
        const modaVal = modaRow.li + (d1 / (d1 + d2)) * amplitud;
        const moda = modaVal.toFixed(4);

        // Fisher & Kurtosis
        const desvP = Math.sqrt(sumaXiFi2 / n) || 1;
        const fisher = (sumaXiFi3 / n / Math.pow(desvP, 3)).toFixed(4);
        const kurtosis = ((sumaXiFi4 / n / Math.pow(desvP, 4)) - 3).toFixed(4);
        const pearson = desvMuestral > 0 ? ((3 * (mediaVal - medianaVal)) / parseFloat(desvMuestral)).toFixed(4) : "0.0000";

        return {
            tipo: 'agrupados',
            rango: { val: rango.toFixed(4), steps: this._stepsRango(max, min, rango) },
            k: { val: k, steps: this._stepsK(n, logN, kRaw, k) },
            amplitud: { val: amplitud.toFixed(4), steps: this._stepsAmplitud(rango, k, amplitud) },
            media: { val: media, steps: [
                `<div class="formula-block"><b>Fórmula:</b> x̄ = Σ(xi · fi) / N</div>`,
                `Σ(xi · fi) = ${sumaXiFi.toFixed(4)}`,
                `N = ${n}`,
                `x̄ = ${sumaXiFi.toFixed(4)} / ${n} = <b>${media}</b>`
            ]},
            mediana: { val: mediana, steps: [
                `<div class="formula-block"><b>Fórmula:</b> Me = L<sub>i</sub> + ((N/2 − F<sub>i-1</sub>) / f<sub>i</sub>) · a</div>`,
                `Posición = N/2 = ${posMed}`,
                `Resultado → <b>${mediana}</b>`
            ]},
            varianza: { val: varMuestral, steps: [
                `<div class="formula-block"><b>Fórmula:</b> s² = Σ((xi − x̄)² · fi) / (N − 1)</div>`,
                `Σ((xi − x̄)² · fi) = ${sumaXiFi2.toFixed(4)}`,
                `s² = ${varMuestral}`
            ]},
            desviacion: { val: desvMuestral, steps: this._stepsDesviacion(varMuestral, desvMuestral) },
            cuartiles: { val: "Calculados sobre intervalos", steps: ["Se usan fórmulas de posición en datos agrupados."] },
            deciles: { val: "Calculados sobre intervalos", steps: [] },
            percentiles: { val: "Calculados sobre intervalos", steps: [] },
            fisher: { val: fisher, steps: this._stepsFisher(sumaXiFi3 / n, desvP, fisher) },
            kurtosis: { val: kurtosis, steps: this._stepsKurtosis(sumaXiFi4 / n, desvP, kurtosis) },
            pearson: { val: pearson, steps: this._stepsPearson(media, mediana, desvMuestral, pearson) },
            moda: { val: moda, steps: [
                `<div class="formula-block"><b>Fórmula:</b> Mo = L<sub>i</sub> + (d1 / (d1 + d2)) · a</div>`,
                `Resultado → <b>${moda}</b>`
            ]},
            tabla: {
                val: "Generada",
                data: tabla,
                sumXiFi: sumaXiFi.toFixed(4),
                sumXiFi2: sumaXiFi2.toFixed(4),
                sumXiFi3: sumaXiFi3.toFixed(4),
                sumXiFi4: sumaXiFi4.toFixed(4),
                media: mediaVal
            }
        };
    },

    // =========================================================
    // HELPERS DE PASOS (reutilizables)
    // =========================================================
    _stepsRango(max, min, rango) {
        return [
            `<div class="formula-block"><b>Fórmula:</b> R = Xmáx − Xmín</div>`,
            `Xmáx = <b>${max}</b> | Xmín = <b>${min}</b>`,
            `R = ${max} − ${min} = <b>${rango}</b>`
        ];
    },
    _stepsK(n, logN, kRaw, k) {
        return [
            `<div class="formula-block"><b>Regla de Sturges:</b> K = 1 + 3.322 · log₁₀(N)</div>`,
            `N = ${n}`,
            `log₁₀(${n}) = ${logN.toFixed(6)}`,
            `K = 1 + 3.322 × ${logN.toFixed(6)} = ${kRaw.toFixed(4)} → <b>${k}</b>`
        ];
    },
    _stepsAmplitud(rango, k, amplitud) {
        return [
            `<div class="formula-block"><b>Fórmula:</b> A = R / K</div>`,
            `A = ${rango} / ${k} = <b>${amplitud}</b>`
        ];
    },
    _stepsMedia(suma, n, media) {
        return [
            `<div class="formula-block"><b>Fórmula:</b> x̄ = Σx / N</div>`,
            `Σx = ${suma} | N = ${n}`,
            `x̄ = ${suma} / ${n} = <b>${media}</b>`
        ];
    },
    _stepsMediana(n, sorted, mid, mediana) {
        return [
            `<div class="formula-block"><b>Posición:</b> (N + 1) / 2</div>`,
            `Posición = ${(n + 1) / 2}`,
            n % 2 !== 0 ? `Mediana = <b>${mediana}</b>` : `Promedio de valores centrales = <b>${mediana}</b>`
        ];
    },
    _stepsVarianza(media, ss, n, varMuestral) {
        return [
            `<div class="formula-block"><b>Fórmula (muestral):</b> s² = Σ(x − x̄)² / (N − 1)</div>`,
            `x̄ = ${media}`,
            `Σ(x − x̄)² = ${ss.toFixed(4)}`,
            `s² = ${ss.toFixed(4)} / (${n} − 1) = <b>${varMuestral}</b>`
        ];
    },
    _stepsDesviacion(varMuestral, desv) {
        return [
            `<div class="formula-block"><b>Fórmula:</b> s = √s²</div>`,
            `s = √${varMuestral} = <b>${desv}</b>`
        ];
    },
    _stepsCuartiles(n, q1, q2, q3) {
        return [
            `Q1 (25%) = <b>${q1}</b>`,
            `Q2 (50%) = <b>${q2}</b>`,
            `Q3 (75%) = <b>${q3}</b>`
        ];
    },
    _stepsFisher(m3, desvP, fisher) {
        return [
            `<div class="formula-block"><b>γ₁ = μ₃ / σ³</b></div>`,
            `μ₃ = ${typeof m3 === 'number' ? m3.toFixed(6) : m3}`,
            `σ = ${desvP.toFixed(4)}`,
            `γ₁ = <b>${fisher}</b>`
        ];
    },
    _stepsKurtosis(m4, desvP, kurtosis) {
        return [
            `<div class="formula-block"><b>γ₂ = μ₄ / σ⁴ − 3</b></div>`,
            `μ₄ = ${typeof m4 === 'number' ? m4.toFixed(6) : m4}`,
            `γ₂ = <b>${kurtosis}</b>`
        ];
    },
    _stepsPearson(media, mediana, desv, pearson) {
        return [
            `<div class="formula-block"><b>As = 3(x̄ − Me) / s</b></div>`,
            `As = 3(${media} − ${mediana}) / ${desv} = <b>${pearson}</b>`
        ];
    },
    _stepsModa(maxFreq, moda) {
        return [
            `Frecuencia máxima = ${maxFreq}`,
            `Moda = <b>${moda.join(', ')}</b>`
        ];
    }
};