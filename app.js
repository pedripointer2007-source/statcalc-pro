let currentResults = null;

// Lógica de cálculo al pulsar el botón "Calcular"
document.getElementById('btn-calcular').addEventListener('click', () => {
    const rawInput = document.getElementById('data-input').value;
    const cleanNumbers = rawInput.split(/[\n,]+/).map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

    if (cleanNumbers.length === 0) {
        alert("Ingresa al menos un número válido.");
        return;
    }

    currentResults = StatsEngine.calculateNoAgrupados(cleanNumbers);
    renderResultsCards(currentResults);

    document.getElementById('view-input').classList.add('hidden');
    document.getElementById('view-results').classList.remove('hidden');
});

// Renderizador Dinámico de Tarjetas según Checklist
function renderResultsCards(results) {
    const container = document.getElementById('cards-container');
    container.innerHTML = "";

    const mapChecklist = [
        { id: 'chk-rango', key: 'rango', title: 'Rango' },
        { id: 'chk-amplitud', key: 'amplitud', title: 'Amplitud' },
        { id: 'chk-k', key: 'k', title: 'K (Intervalos)' },
        { id: 'chk-media', key: 'media', title: 'Media' },
        { id: 'chk-mediana', key: 'mediana', title: 'Mediana' },
        { id: 'chk-varianza', key: 'varianza', title: 'Varianza (Muestral)' },
        { id: 'chk-desviacion', key: 'desviacion', title: 'Desviación Estándar' },
        { id: 'chk-cuartiles', key: 'cuartiles', title: 'Cuartiles' },
        { id: 'chk-deciles', key: 'deciles', title: 'Deciles' },
        { id: 'chk-percentiles', key: 'percentiles', title: 'Percentiles' },
        { id: 'chk-fisher', key: 'fisher', title: 'Fisher' },
        { id: 'chk-kurtosis', key: 'kurtosis', title: 'Kurtosis' },
        { id: 'chk-pearson', key: 'pearson', title: 'Pearson' },
        { id: 'chk-moda', key: 'moda', title: 'Moda' }
    ];

    mapChecklist.forEach(item => {
        if (document.getElementById(item.id).checked) {
            const data = results[item.key];
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <h4>${item.title}</h4>
                <div class="val">${data.val}</div>
                <button class="btn btn-secondary btn-sm" onclick="showSteps('${item.title}', ${JSON.stringify(data.steps).replace(/"/g, '&quot;')})">Ver pasos</button>
            `;
            container.appendChild(card);
        }
    });
}

// Abrir Modal Lateral "Paso a Paso"
function showSteps(title, steps) {
    document.getElementById('steps-title').innerText = `Detalle de cálculo - ${title}`;
    const content = document.getElementById('steps-content');
    content.innerHTML = steps.map((s, idx) => `
        <div class="step-box">
            <span class="step-num">${idx + 1}</span>
            <p>${s}</p>
        </div>
    `).join('');
    document.getElementById('steps-panel').classList.remove('hidden');
}

document.getElementById('btn-close-steps').addEventListener('click', () => {
    document.getElementById('steps-panel').classList.add('hidden');
});

// Navegación Volver
document.getElementById('btn-back').addEventListener('click', () => {
    document.getElementById('view-results').classList.add('hidden');
    document.getElementById('view-input').classList.remove('hidden');
});

// Exportaciones Multiformato
document.getElementById('export-excel').addEventListener('click', () => {
    const dataToExport = Object.keys(currentResults).map(k => ({ Medida: k, Resultado: currentResults[k].val }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "Resultados_Estadisticos.xlsx");
});

document.getElementById('export-png').addEventListener('click', () => {
    html2canvas(document.getElementById('cards-container')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Resultados_Estadistica.png';
        link.href = canvas.toDataURL();
        link.click();
    });
});