// statsEngine.js - Motor Estadístico Avanzado (Agrupados y No Agrupados)

export class StatsEngine {
  
  // --- DATOS NO AGRUPADOS ---
  static calculateUngrouped(data, isSample = true, selectedMetrics = {}) {
    const rawData = [...data].sort((a, b) => a - b);
    const n = rawData.length;
    const steps = [];

    steps.push(`<h3>1. Ordenamiento y Datos Iniciales</h3>`);
    steps.push(`<p><b>Muestra ordenada (N = ${n}):</b> [${rawData.join(', ')}]</p>`);

    // Rango, k, Amplitud
    const min = rawData[0];
    const max = rawData[n - 1];
    const range = max - min;
    const k = Math.round(1 + 3.322 * Math.log10(n));
    const amplitude = range / (k || 1);

    steps.push(`<h3>2. Rango, Intervalos (Sturges) y Amplitud</h3>`);
    steps.push(`<p><b>Valor Mínimo (X<sub>min</sub>):</b> ${min}</p>`);
    steps.push(`<p><b>Valor Máximo (X<sub>max</sub>):</b> ${max}</p>`);
    steps.push(`<p><b>Rango (R = X<sub>max</sub> - X<sub>min</sub>):</b> ${max} - ${min} = <b>${range}</b></p>`);
    steps.push(`<p><b>Número de Intervalos (k = 1 + 3.322 log10(N)):</b> 1 + 3.322 log10(${n}) = <b>${k}</b></p>`);
    steps.push(`<p><b>Amplitud (A = R / k):</b> ${range} / ${k} = <b>${amplitude.toFixed(4)}</b></p>`);

    // Media
    const sum = rawData.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    steps.push(`<h3>3. Media Aritmética (x̄)</h3>`);
    steps.push(`<p><b>Fórmula:</b> Σx / N</p>`);
    steps.push(`<p><b>Cálculo:</b> (${rawData.join(' + ')}) / ${n} = ${sum.toFixed(4)} / ${n} = <b>${mean.toFixed(4)}</b></p>`);

    // Mediana
    let median;
    steps.push(`<h3>4. Mediana (Me)</h3>`);
    if (n % 2 !== 0) {
      const mid = Math.floor(n / 2);
      median = rawData[mid];
      steps.push(`<p>N es impar (${n}). La mediana es el valor en la posición central (${mid + 1}): <b>${median}</b></p>`);
    } else {
      const mid1 = rawData[n / 2 - 1];
      const mid2 = rawData[n / 2];
      median = (mid1 + mid2) / 2;
      steps.push(`<p>N es par (${n}). Promedio de posiciones ${n/2} y ${n/2 + 1}: (${mid1} + ${mid2}) / 2 = <b>${median}</b></p>`);
    }

    // Moda
    const freqMap = {};
    rawData.forEach(x => freqMap[x] = (freqMap[x] || 0) + 1);
    let maxFreq = 0;
    for (let x in freqMap) if (freqMap[x] > maxFreq) maxFreq = freqMap[x];
    
    let modes = [];
    if (maxFreq > 1) {
      for (let x in freqMap) if (freqMap[x] === maxFreq) modes.push(Number(x));
    }
    const modeStr = modes.length > 0 ? modes.join(', ') : 'Amodal (sin repeticiones)';
    steps.push(`<h3>5. Moda (Mo)</h3>`);
    steps.push(`<p>Frecuencia máxima observada: ${maxFreq}. <b>Moda(s):</b> ${modeStr}</p>`);

    // Varianza y Desviación Estándar
    const sqDiffs = rawData.map(x => Math.pow(x - mean, 2));
    const sumSqDiffs = sqDiffs.reduce((a, b) => a + b, 0);
    const divisor = isSample ? (n - 1) : n;
    const variance = sumSqDiffs / (divisor || 1);
    const stdDev = Math.sqrt(variance);

    steps.push(`<h3>6. Varianza (s² / σ²) y Desviación Estándar (s / σ)</h3>`);
    steps.push(`<p><b>Tipo de análisis:</b> ${isSample ? 'Muestral (divisor N-1)' : 'Poblacional (divisor N)'}</p>`);
    steps.push(`<p><b>Suma de diferencias al cuadrado [Σ(x - x̄)²]:</b> ${sumSqDiffs.toFixed(4)}</p>`);
    steps.push(`<p><b>Varianza:</b> ${sumSqDiffs.toFixed(4)} / ${divisor} = <b>${variance.toFixed(4)}</b></p>`);
    steps.push(`<p><b>Desviación Estándar:</b> √(${variance.toFixed(4)}) = <b>${stdDev.toFixed(4)}</b></p>`);

    // Cuartiles, Deciles, Percentiles
    const getPercentile = (p) => {
      const index = (p / 100) * (n - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      if (upper >= n) return rawData[n - 1];
      return rawData[lower] + weight * (rawData[upper] - rawData[lower]);
    };

    const q1 = getPercentile(25);
    const q2 = getPercentile(50);
    const q3 = getPercentile(75);
    const d5 = getPercentile(50);
    const p90 = getPercentile(90);

    steps.push(`<h3>7. Medidas de Posición (Cuartiles, Deciles, Percentiles)</h3>`);
    steps.push(`<p><b>Cuartil 1 (Q1 - 25%):</b> ${q1.toFixed(4)}</p>`);
    steps.push(`<p><b>Cuartil 2 (Q2 - 50% / Mediana):</b> ${q2.toFixed(4)}</p>`);
    steps.push(`<p><b>Cuartil 3 (Q3 - 75%):</b> ${q3.toFixed(4)}</p>`);
    steps.push(`<p><b>Decil 5 (D5 - 50%):</b> ${d5.toFixed(4)}</p>`);
    steps.push(`<p><b>Percentil 90 (P90):</b> ${p90.toFixed(4)}</p>`);

    // Asimetría de Fisher y Pearson, Kurtosis
    const m3 = rawData.reduce((acc, x) => acc + Math.pow(x - mean, 3), 0) / n;
    const m4 = rawData.reduce((acc, x) => acc + Math.pow(x - mean, 4), 0) / n;
    
    const fisher = stdDev !== 0 ? m3 / Math.pow(stdDev, 3) : 0;
    const kurtosis = stdDev !== 0 ? (m4 / Math.pow(stdDev, 4)) - 3 : 0;
    const primaryMode = modes.length > 0 ? modes[0] : mean;
    const pearson = stdDev !== 0 ? (mean - primaryMode) / stdDev : 0;

    steps.push(`<h3>8. Forma de la Distribución (Fisher, Pearson, Curtosis)</h3>`);
    steps.push(`<p><b>Coeficiente de Asimetría de Fisher:</b> ${fisher.toFixed(4)} (${fisher > 0 ? 'Sesgo Positivo / Derecha' : fisher < 0 ? 'Sesgo Negativo / Izquierda' : 'Simétrica'})</p>`);
    steps.push(`<p><b>Sesgo de Pearson:</b> ${pearson.toFixed(4)}</p>`);
    steps.push(`<p><b>Curtosis (Exceso):</b> ${kurtosis.toFixed(4)} (${kurtosis > 0 ? 'Leptocúrtica' : kurtosis < 0 ? 'Platocúrtica' : 'Mesocúrtica'})</p>`);

    // Tabla de Frecuencias
    const freqTable = Object.keys(freqMap).map(val => {
      const f = freqMap[val];
      return {
        val: Number(val),
        f,
        fr: f / n,
        frPct: ((f / n) * 100).toFixed(2) + '%'
      };
    }).sort((a, b) => a.val - b.val);

    let accumF = 0;
    freqTable.forEach(row => {
      accumF += row.f;
      row.F = accumF;
    });

    return {
      type: 'ungrouped',
      results: { range, k, amplitude, mean, median, modes, variance, stdDev, q1, q2, q3, fisher, kurtosis, pearson },
      freqTable,
      steps
    };
  }

  // --- DATOS AGRUPADOS ---
  static calculateGrouped(intervals, isSample = true, selectedMetrics = {}) {
    // intervals: [{ min, max, f }]
    const steps = [];
    let N = intervals.reduce((sum, item) => sum + item.f, 0);

    steps.push(`<h3>1. Tabla de Frecuencias e Intervalos</h3>`);
    
    let accumF = 0;
    const tableData = intervals.map(inv => {
      const xi = (inv.min + inv.max) / 2;
      accumF += inv.f;
      return {
        ...inv,
        xi,
        f: inv.f,
        F: accumF,
        f_xi: inv.f * xi
      };
    });

    const sumFXi = tableData.reduce((sum, r) => sum + r.f_xi, 0);
    const mean = sumFXi / N;

    steps.push(`<p><b>Suma de Frecuencias (N):</b> ${N}</p>`);
    steps.push(`<p><b>Media (x̄ = Σ(f · x<sub>i</sub>) / N):</b> ${sumFXi.toFixed(4)} / ${N} = <b>${mean.toFixed(4)}</b></p>`);

    // Mediana Agrupada
    const halfN = N / 2;
    const medianInterval = tableData.find(r => r.F >= halfN);
    const prevF = tableData[tableData.indexOf(medianInterval) - 1]?.F || 0;
    const L_me = medianInterval.min;
    const f_me = medianInterval.f;
    const A = medianInterval.max - medianInterval.min;
    const median = L_me + ((halfN - prevF) / f_me) * A;

    steps.push(`<h3>2. Mediana Agrupada (Me)</h3>`);
    steps.push(`<p><b>Posición N/2:</b> ${halfN}</p>`);
    steps.push(`<p><b>Intervalo Mediano:</b> [${medianInterval.min} - ${medianInterval.max}]</p>`);
    steps.push(`<p><b>Fórmula:</b> L<sub>i</sub> + [(N/2 - F<sub>i-1</sub>) / f<sub>i</sub>] · A</p>`);
    steps.push(`<p><b>Cálculo:</b> ${L_me} + [(${halfN} - ${prevF}) / ${f_me}] · ${A} = <b>${median.toFixed(4)}</b></p>`);

    // Moda Agrupada
    const maxF = Math.max(...tableData.map(r => r.f));
    const modeInterval = tableData.find(r => r.f === maxF);
    const idxMo = tableData.indexOf(modeInterval);
    const f_mo = modeInterval.f;
    const f_prev = idxMo > 0 ? tableData[idxMo - 1].f : 0;
    const f_next = idxMo < tableData.length - 1 ? tableData[idxMo + 1].f : 0;
    const d1 = f_mo - f_prev;
    const d2 = f_mo - f_next;
    const mode = modeInterval.min + (d1 / (d1 + d2 || 1)) * A;

    steps.push(`<h3>3. Moda Agrupada (Mo)</h3>`);
    steps.push(`<p><b>Frecuencia Mayor:</b> ${maxF} en Intervalo [${modeInterval.min} - ${modeInterval.max}]</p>`);
    steps.push(`<p><b>Cálculo:</b> ${modeInterval.min} + [${d1} / (${d1} + ${d2})] · ${A} = <b>${mode.toFixed(4)}</b></p>`);

    // Varianza y Desviación
    const sumDevSq = tableData.reduce((sum, r) => sum + r.f * Math.pow(r.xi - mean, 2), 0);
    const divisor = isSample ? (N - 1) : N;
    const variance = sumDevSq / (divisor || 1);
    const stdDev = Math.sqrt(variance);

    steps.push(`<h3>4. Varianza y Desviación Estándar Agrupada</h3>`);
    steps.push(`<p><b>Σ f·(x<sub>i</sub> - x̄)²:</b> ${sumDevSq.toFixed(4)}</p>`);
    steps.push(`<p><b>Varianza:</b> ${variance.toFixed(4)} | <b>Desviación Estándar:</b> ${stdDev.toFixed(4)}</p>`);

    // Cuartil 1, 3
    const getGroupedPercentile = (p) => {
      const pos = (p / 100) * N;
      const targetInt = tableData.find(r => r.F >= pos);
      const prev = tableData[tableData.indexOf(targetInt) - 1]?.F || 0;
      return targetInt.min + ((pos - prev) / targetInt.f) * (targetInt.max - targetInt.min);
    };

    const q1 = getGroupedPercentile(25);
    const q3 = getGroupedPercentile(75);

    steps.push(`<h3>5. Cuartiles y Medidas de Posición</h3>`);
    steps.push(`<p><b>Q1 (25%):</b> ${q1.toFixed(4)} | <b>Q3 (75%):</b> ${q3.toFixed(4)}</p>`);

    return {
      type: 'grouped',
      results: { mean, median, mode, variance, stdDev, q1, q3 },
      tableData,
      steps
    };
  }
}