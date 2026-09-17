const StatsEngine = {
    calculateNoAgrupados(data = [], options = {}) {
        if (!data || data.length === 0) return null;

        const nums = [...data].sort((a, b) => a - b);
        const n = nums.length;
        const suma = nums.reduce((acc, v) => acc + v, 0);
        const media = suma / n;

        // Mediana
        let mediana;
        const mid = Math.floor(n / 2);
        if (n % 2 === 0) {
            mediana = (nums[mid - 1] + nums[mid]) / 2;
        } else {
            mediana = nums[mid];
        }

        // Frecuencias
        const freqMap = {};
        nums.forEach(x => freqMap[x] = (freqMap[x] || 0) + 1);

        // Moda
        let maxFreq = 0;
        let modas = [];
        for (const val in freqMap) {
            if (freqMap[val] > maxFreq) {
                maxFreq = freqMap[val];
                modas = [Number(val)];
            } else if (freqMap[val] === maxFreq) {
                modas.push(Number(val));
            }
        }
        const modaStr = (modas.length === Object.keys(freqMap).length) ? "No hay moda" : modas.join(", ");

        const uniqueValues = Object.keys(freqMap).map(Number).sort((a, b) => a - b);

        const includeVarianza = !!options.varianza;
        const includeFisher = !!options.asimetria;
        const includeKurtosis = !!options.kurtosis;

        let Fi_acumulada = 0;
        let sum_xi_fi = 0;
        let sum_sq_diff = 0;
        let sum_cub_diff = 0;
        let sum_pow4_diff = 0;

        const tableRows = uniqueValues.map(x => {
            const fi = freqMap[x];
            Fi_acumulada += fi;
            const xi = x;
            const xi_fi = xi * fi;
            const pct = ((fi / n) * 100).toFixed(2) + "%";
            const diff = xi - media;

            sum_xi_fi += xi_fi;

            const row = {
                dato: x,
                xi: xi,
                fi: fi,
                Fi: Fi_acumulada,
                pct: pct,
                xi_fi: xi_fi
            };

            if (includeVarianza) {
                const term2 = fi * Math.pow(diff, 2);
                row.sq_diff = term2.toFixed(4);
                sum_sq_diff += term2;
            }
            if (includeFisher) {
                const term3 = fi * Math.pow(diff, 3);
                row.cub_diff = term3.toFixed(4);
                sum_cub_diff += term3;
            }
            if (includeKurtosis) {
                const term4 = fi * Math.pow(diff, 4);
                row.pow4_diff = term4.toFixed(4);
                sum_pow4_diff += term4;
            }

            return row;
        });

        // Varianza Muestral y Desviación Estándar
        const varianzaMuestral = n > 1 ? sum_sq_diff / (n - 1) : 0;
        const desviacionEstandar = Math.sqrt(varianzaMuestral);

        return {
            n,
            media: media.toFixed(4),
            mediana: mediana.toFixed(4),
            moda: modaStr,
            min: nums[0],
            max: nums[n - 1],
            rango: (nums[n - 1] - nums[0]).toFixed(4),
            varianza: varianzaMuestral.toFixed(4),
            desviacion: desviacionEstandar.toFixed(4),
            tabla: tableRows,
            totales: {
                sum_fi: n,
                sum_xi_fi: sum_xi_fi.toFixed(2),
                sum_sq_diff: sum_sq_diff.toFixed(4),
                sum_cub_diff: sum_cub_diff.toFixed(4),
                sum_pow4_diff: sum_pow4_diff.toFixed(4)
            },
            flags: {
                includeVarianza,
                includeFisher,
                includeKurtosis
            }
        };
    }
};