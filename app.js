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