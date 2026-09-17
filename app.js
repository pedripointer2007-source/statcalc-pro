// app.js

let currentResults = null;
let currentDataType = 'no_agrupados';

// Alternar Tipo de Datos (Agrupados / No Agrupados)
document.getElementById('type-no-agrupados').addEventListener('click', (e) => {
    currentDataType = 'no_agrupados';
    e.target.classList.add('active');
    document.getElementById('type-agrupados').classList.remove('active');
});

document.getElementById('type-agrupados').addEventListener('click', (e) => {
    currentDataType = 'agrupados';
    e.target.classList.add('active');
    document.getElementById('type-no-agrupados').classList.remove('active');
});

// Limpiar Entrada
document.getElementById('btn-limpiar')?.addEventListener('click', () => {
    document.getElementById('data-input').value = "";
});

// Botón Calcular
document.getElementById('btn-calcular').addEventListener('click', async () => {
    const rawInput = document.getElementById('data-input').value;
    const cleanNumbers = rawInput.split(/[\n,;\s]+/).map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

    if (cleanNumbers.length === 0) {
        alert("Ingresa al menos dos números válidos.");
        return;
    }

    currentResults = StatsEngine.calculateNoAgrupados(cleanNumbers);
    renderResultsCards(currentResults);

    // Obtener checklist seleccionada
    const selectedChecklist = getSelectedChecklist();

    // Guardar en Supabase si la sesión está activa
    if (typeof saveCalculationToHistory === 'function') {
        await saveCalculationToHistory(currentDataType, rawInput, currentResults, selectedChecklist);
    }

    document.getElementById('view-input').classList.add('hidden');
    document.getElementById('view-results').classList.remove('hidden');
});

function getSelectedChecklist() {
    const mapChecklist = ['rango', 'amplitud', 'k', 'media', 'mediana', 'varianza', 'desviacion', 'cuartiles', 'deciles', 'percentiles', 'fisher', 'kurtosis', 'pearson', 'moda', 'tabla'];
    return mapChecklist.filter(id => document.getElementById(`chk-${id}`)?.checked);
}

// Renderizador Dinámico de Tarjetas
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
        const chk = document.getElementById(item.id);
        if (chk && chk.checked && results[item.key]) {
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

    // Renderizar Tabla de Frecuencias si está marcada
    if (document.getElementById('chk-tabla')?.checked && results.tabla) {
        const tableCard = document.createElement('div');
        tableCard.className = 'stat-card full-width';
        tableCard.style.gridColumn = "1 / -1";
        
        let rowsHtml = results.tabla.data.map(row => `
            <tr>
                <td>${row.valor}</td>
                <td>${row.f}</td>
                <td>${row.fr}</td>
                <td>${row.porcentaje}</td>
            </tr>
        `).join('');

        tableCard.innerHTML = `
            <h4>Tabla de Frecuencias</h4>
            <table class="table-frecuencias">
                <thead>
                    <tr><th>Valor</th><th>f (Absoluta)</th><th>fr (Relativa)</th><th>%</th></tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;
        container.appendChild(tableCard);
    }
}

// Abrir y Cerrar Modal de Pasos
function showSteps(title, steps) {
    document.getElementById('steps-title').innerText = `Detalle de cálculo - ${title}`;
    const content = document.getElementById('steps-content');
    content.innerHTML = steps.map((s, idx) => `
        <div class="step-box" style="margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <span class="step-num" style="font-weight:bold; color: var(--accent);">${idx + 1}.</span>
            <span>${s}</span>
        </div>
    `).join('');
    document.getElementById('steps-panel').classList.remove('hidden');
}

document.getElementById('btn-close-steps')?.addEventListener('click', () => {
    document.getElementById('steps-panel').classList.add('hidden');
});

// Navegación Volver
document.getElementById('btn-back')?.addEventListener('click', () => {
    document.getElementById('view-results').classList.add('hidden');
    document.getElementById('view-input').classList.remove('hidden');
});

// Modal Perfil de Usuario
document.getElementById('btn-user-avatar')?.addEventListener('click', () => {
    document.getElementById('profile-modal').classList.remove('hidden');
});

document.getElementById('btn-close-profile')?.addEventListener('click', () => {
    document.getElementById('profile-modal').classList.add('hidden');
});

document.getElementById('btn-logout')?.addEventListener('click', () => {
    if (typeof logout === 'function') logout();
});

// Exportaciones
document.getElementById('export-excel')?.addEventListener('click', () => {
    if (!currentResults) return;
    const dataToExport = Object.keys(currentResults)
        .filter(k => k !== 'tabla')
        .map(k => ({ Medida: k.toUpperCase(), Resultado: currentResults[k].val }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "Resultados_Estadisticos.xlsx");
});

document.getElementById('export-pdf')?.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Reporte de Resultados Estadísticos - StatCalc Pro", 10, 10);
    
    let y = 20;
    Object.keys(currentResults).forEach(k => {
        if (k !== 'tabla') {
            doc.text(`${k.toUpperCase()}: ${currentResults[k].val}`, 10, y);
            y += 10;
        }
    });
    doc.save("Resultados_Estadistica.pdf");
});