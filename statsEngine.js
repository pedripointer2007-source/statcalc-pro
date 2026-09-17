const StatsEngine = {
    // 1. Datos No Agrupados
    calculateNoAgrupados(data) {
        const sorted = [...data].sort((a, b) => a - b);
        const n = sorted.length;
        const min = sorted[0];
        const max = sorted[n - 1];
        const rango = max - min;
        const k = Math.ceil(1 + 3.322 * Math.log10(n));
        const amplitud = (rango / k).toFixed(2);
        
        const suma = sorted.reduce((a, b) => a + b, 0);
        const media = (suma / n).toFixed(2);
        
        // Mediana
        const mid = Math.floor(n / 2);
        const mediana = n % 2 !== 0 ? sorted[mid] : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
        
        // Varianza y Desviación Escribiendo Pasos
        const ss = sorted.reduce((acc, x) => acc + Math.pow(x - media, 2), 0);
        const varMuestral = (ss / (n - 1)).toFixed(2);
        const desvMuestral = Math.sqrt(varMuestral).toFixed(2);
        const varPoblacional = (ss / n).toFixed(2);
        const desvPoblacional = Math.sqrt(varPoblacional).toFixed(2);
        
        // Moda
        const freq = {};
        sorted.forEach(x => freq[x] = (freq[x] || 0) + 1);
        let maxFreq = 0;
        let moda = [];
        for (let key in freq) {
            if (freq[key] > maxFreq) { maxFreq = freq[key]; moda = [key]; }
            else if (freq[key] === maxFreq) { moda.push(key); }
        }

        // Posiciones Cuartiles Q1, Q2, Q3
        const getQuantile = (p) => {
            const pos = (p / 100) * (n + 1);
            const idx = Math.floor(pos) - 1;
            if (idx < 0) return sorted[0];
            if (idx >= n - 1) return sorted[n - 1];
            return (sorted[idx] + (pos - Math.floor(pos)) * (sorted[idx + 1] - sorted[idx])).toFixed(2);
        };

        const q1 = getQuantile(25), q2 = getQuantile(50), q3 = getQuantile(75);
        const d1 = getQuantile(10), d5 = getQuantile(50), d9 = getQuantile(90);
        const p10 = getQuantile(10), p50 = getQuantile(50), p90 = getQuantile(90);

        // Fisher & Kurtosis
        const m3 = sorted.reduce((acc, x) => acc + Math.pow(x - media, 3), 0) / n;
        const m4 = sorted.reduce((acc, x) => acc + Math.pow(x - media, 4), 0) / n;
        const fisher = (m3 / Math.pow(desvPoblacional, 3)).toFixed(2);
        const kurtosis = ((m4 / Math.pow(desvPoblacional, 4)) - 3).toFixed(2);
        const pearson = ((3 * (media - mediana)) / desvMuestral).toFixed(2);

        return {
            rango: { val: rango, steps: [`Rango = Max - Min`, `Rango = ${max} - ${min} = ${rango}`] },
            amplitud: { val: amplitud, steps: [`Amplitud = Rango / K`, `Amplitud = ${rango} / ${k} = ${amplitud}`] },
            k: { val: k, steps: [`K = 1 + 3.322 * log10(N)`, `K = 1 + 3.322 * log10(${n}) = ${k}`] },
            media: { val: media, steps: [`1. Organiza los datos (n = ${n})`, `2. Suma de datos Σx = ${suma}`, `3. Aplica la fórmula x̄ = Σx / n`, `x̄ = ${suma} / ${n} = ${media}`] },
            mediana: { val: mediana, steps: [`1. Ordenar los datos de menor a mayor.`, `2. Al ser n=${n}, la posición central otorga la mediana: ${mediana}`] },
            varianza: { val: varMuestral, steps: [`1. Calcula la media (x̄ = ${media})`, `2. Resta cada dato con la media y eleva al cuadrado Σ(x - x̄)² = ${ss.toFixed(2)}`, `3. Divide entre (n - 1) => ${ss.toFixed(2)} / ${n-1} = ${varMuestral}`] },
            desviacion: { val: desvMuestral, steps: [`1. Extraer la raíz cuadrada de la varianza muestral`, `s = √(${varMuestral}) = ${desvMuestral}`] },
            varPoblacional: { val: varPoblacional, steps: [`1. Divide la suma de diferencias entre N`, `σ² = ${ss.toFixed(2)} / ${n} = ${varPoblacional}`] },
            desvPoblacional: { val: desvPoblacional, steps: [`1. Extraer la raíz cuadrada de la varianza poblacional`, `σ = √(${varPoblacional}) = ${desvPoblacional}`] },
            cuartiles: { val: `Q1:${q1}, Q2:${q2}, Q3:${q3}`, steps: [`Fórmula: Pos = k*(n+1)/4`, `Q1 = ${q1}`, `Q2 = ${q2}`, `Q3 = ${q3}`] },
            deciles: { val: `D1:${d1}, D5:${d5}, D9:${d9}`, steps: [`Fórmula: Pos = k*(n+1)/10`, `D1 = ${d1}`, `D5 = ${d5}`, `D9 = ${d9}`] },
            percentiles: { val: `P10:${p10}, P50:${p50}, P90:${p90}`, steps: [`Fórmula: Pos = k*(n+1)/100`, `P10 = ${p10}`, `P50 = ${p50}`, `P90 = ${p90}`] },
            fisher: { val: fisher, steps: [`Calculando el coeficiente de asimetría de Fisher: ${fisher}`] },
            kurtosis: { val: kurtosis, steps: [`Calculando el coeficiente de curtosis: ${kurtosis}`] },
            pearson: { val: pearson, steps: [`Pearson = 3 * (Media - Mediana) / Desviación = ${pearson}`] },
            moda: { val: moda.join(', '), steps: [`Valor con mayor frecuencia absoluta registrada: ${moda.join(', ')}`] }
        };
    }
};