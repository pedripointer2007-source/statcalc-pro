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
            <div class="glass-card card-item">
                <h4>N (Muestra)</h4>
                <p class="card-value">${results.n}</p>
            </div>
            <div class="glass-card card-item">
                <h4>Media (x̄)</h4>
                <p class="card-value">${results.media}</p>
            </div>
            <div class="glass-card card-item">
                <h4>Mediana</h4>
                <p class="card-value">${results.mediana}</p>
            </div>
            <div class="glass-card card-item">
                <h4>Moda</h4>
                <p class="card-value">${results.moda}</p>
            </div>
            <div class="glass-card card-item">
                <h4>Rango</h4>
                <p class="card-value">${results.rango}</p>
            </div>
            <div class="glass-card card-item">
                <h4>Desviación Estándar</h4>
                <p class="card-value">${results.desviacion}</p>
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

    function ejecutarCalculos() {
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
        }
    }

    if (btnCalcular) btnCalcular.addEventListener("click", ejecutarCalculos);

    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", () => {
            dataInput.value = "";
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