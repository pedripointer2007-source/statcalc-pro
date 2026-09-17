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

    let currentResults = null;

document.addEventListener("DOMContentLoaded", () => {
    const btnCalcular = document.getElementById("btn-calcular");
    const dataInput = document.getElementById("data-input");
    const tableWrapper = document.getElementById("table-wrapper");
    const cardsGrid = document.getElementById("cards-grid");
    const btnExportPDF = document.getElementById("btn-export-pdf");
    const btnExportExcel = document.getElementById("btn-export-excel");
    const btnExportMain = document.getElementById("btn-export-main");
    const dropdownMenu = document.getElementById("dropdown-menu");
    const btnLimpiar = document.getElementById("btn-limpiar");
    const btnSaveProject = document.getElementById("btn-save-project");
    const projectNameInput = document.getElementById("project-name-input");

    function getSelectedOptions() {
        return {
            varianza: document.getElementById("chk-varianza")?.checked || window.forceVarianzaFlag,
            asimetria: document.getElementById("chk-asimetria")?.checked || window.forceFisherFlag,
            kurtosis: document.getElementById("chk-kurtosis")?.checked || window.forceKurtosisFlag
        };
    }

    function renderCards(results) {
        if (!cardsGrid || !results) return;

        cardsGrid.innerHTML = `
            <div class="glass-card card-item" style="padding: 15px;">
                <h4>N (Muestra)</h4>
                <p class="card-value" style="font-size: 1.4rem; color: var(--accent); font-weight: bold;">${results.n}</p>
            </div>
            <div class="glass-card card-item" style="padding: 15px;">
                <h4>Media (x̄)</h4>
                <p class="card-value" style="font-size: 1.4rem; color: var(--accent); font-weight: bold;">${results.media}</p>
            </div>
            <div class="glass-card card-item" style="padding: 15px;">
                <h4>Mediana</h4>
                <p class="card-value" style="font-size: 1.4rem; color: var(--accent); font-weight: bold;">${results.mediana}</p>
            </div>
            <div class="glass-card card-item" style="padding: 15px;">
                <h4>Moda</h4>
                <p class="card-value" style="font-size: 1.4rem; color: var(--accent); font-weight: bold;">${results.moda}</p>
            </div>
            <div class="glass-card card-item" style="padding: 15px;">
                <h4>Rango</h4>
                <p class="card-value" style="font-size: 1.4rem; color: var(--accent); font-weight: bold;">${results.rango}</p>
            </div>
            <div class="glass-card card-item" style="padding: 15px;">
                <h4>Desviación Estándar</h4>
                <p class="card-value" style="font-size: 1.4rem; color: var(--accent); font-weight: bold;">${results.desviacion}</p>
            </div>
        `;
    }

    function renderTable(results) {
        if (!results || !tableWrapper) return;

        const flags = results.flags;
        let headersHTML = `
            <thead>
                <tr>
                    <th>Dato (X)</th>
                    <th>Marca de Clase (xi)</th>
                    <th>fi</th>
                    <th>Fi</th>
                    <th>%</th>
                    <th>xi * fi</th>
                    ${flags.includeVarianza ? `<th>fi * (xi - x̄)²</th>` : ''}
                    ${flags.includeFisher ? `<th>fi * (xi - x̄)³</th>` : ''}
                    ${flags.includeKurtosis ? `<th>fi * (xi - x̄)⁴</th>` : ''}
                </tr>
            </thead>
        `;

        let bodyHTML = "<tbody>";
        results.tabla.forEach(row => {
            bodyHTML += `
                <tr>
                    <td><b>${row.dato}</b></td>
                    <td>${row.xi}</td>
                    <td>${row.fi}</td>
                    <td>${row.Fi}</td>
                    <td>${row.pct}</td>
                    <td>${row.xi_fi}</td>
                    ${flags.includeVarianza ? `<td>${row.sq_diff}</td>` : ''}
                    ${flags.includeFisher ? `<td>${row.cub_diff}</td>` : ''}
                    ${flags.includeKurtosis ? `<td>${row.pow4_diff}</td>` : ''}
                </tr>
            `;
        });

        // Totales
        bodyHTML += `
            <tr style="font-weight: bold; background: rgba(99, 102, 241, 0.2);">
                <td colspan="2">Total / Sumatoria</td>
                <td>${results.totales.sum_fi}</td>
                <td>-</td>
                <td>100%</td>
                <td>${results.totales.sum_xi_fi}</td>
                ${flags.includeVarianza ? `<td>${results.totales.sum_sq_diff}</td>` : ''}
                ${flags.includeFisher ? `<td>${results.totales.sum_cub_diff}</td>` : ''}
                ${flags.includeKurtosis ? `<td>${results.totales.sum_pow4_diff}</td>` : ''}
            </tr>
        `;
        bodyHTML += "</tbody>";

        tableWrapper.innerHTML = `<table id="frequency-table" class="data-table">${headersHTML}${bodyHTML}</table>`;
    }

    async function ejecutarCalculos() {
        const rawText = dataInput.value;
        const matches = rawText.match(/-?\d+(?:[.,]\d+)?/g);
        if (!matches) {
            alert("Por favor ingresa datos numéricos válidos.");
            return;
        }

        const numbers = matches.map(v => parseFloat(v.replace(",", "."))).filter(Number.isFinite);
        const options = getSelectedOptions();

        currentResults = StatsEngine.calculateNoAgrupados(numbers, options);
        if (currentResults) {
            renderTable(currentResults);
            renderCards(currentResults);
            if (typeof saveCalculationToHistory === "function") {
                await saveCalculationToHistory("no_agrupados", rawText, currentResults, options);
            }
        }
    }

    if (btnCalcular) btnCalcular.addEventListener("click", ejecutarCalculos);

    if (btnSaveProject) {
        btnSaveProject.addEventListener("click", async () => {
            const name = projectNameInput ? projectNameInput.value.trim() : "";
            const rawText = dataInput.value.trim();
            if (!name) {
                alert("Por favor asigna un nombre al proyecto.");
                return;
            }
            if (!rawText) {
                alert("No hay datos para guardar en el proyecto.");
                return;
            }
            if (typeof saveProjectToSupabase === "function") {
                await saveProjectToSupabase(name, "no_agrupados", rawText);
                alert("Proyecto guardado con éxito.");
            }
        });
    }

    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", () => {
            dataInput.value = "";
            if (projectNameInput) projectNameInput.value = "";
            if (tableWrapper) tableWrapper.innerHTML = "";
            if (cardsGrid) cardsGrid.innerHTML = "";
            window.forceVarianzaFlag = false;
            window.forceFisherFlag = false;
            window.forceKurtosisFlag = false;
        });
    }

    // Dropdown Export
    if (btnExportMain && dropdownMenu) {
        btnExportMain.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle("hidden");
        });
        document.addEventListener("click", () => dropdownMenu.classList.add("hidden"));
    }

    // Exportación Excel
    if (btnExportExcel) {
        btnExportExcel.addEventListener("click", (e) => {
            e.preventDefault();
            const table = document.getElementById("frequency-table");
            if (!table) {
                alert("Primero debes calcular para generar la tabla.");
                return;
            }
            const wb = XLSX.utils.table_to_book(table, { sheet: "Frecuencias" });
            XLSX.writeFile(wb, "Tabla_de_Frecuencias.xlsx");
        });
    }

    // Exportación PDF
    if (btnExportPDF) {
        btnExportPDF.addEventListener("click", (e) => {
            e.preventDefault();
            const element = document.getElementById("results-section");
            if (!element) {
                alert("No hay resultados para exportar.");
                return;
            }
            const opt = {
                margin: 0.5,
                filename: 'Reporte_Estadistico.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
            };
            html2pdf().set(opt).from(element).save();
        });
    }
});
};