let currentResults = null;
let currentDataType = 'no_agrupados';

document.addEventListener("DOMContentLoaded", () => {
    init3DScene();
    setupNavigation();

    // Tipo de datos
    document.getElementById('type-no-agrupados')?.addEventListener('click', () => {
        currentDataType = 'no_agrupados';
        document.getElementById('type-no-agrupados').classList.add('active');
        document.getElementById('type-agrupados').classList.remove('active');
    });

    document.getElementById('type-agrupados')?.addEventListener('click', () => {
        currentDataType = 'agrupados';
        document.getElementById('type-agrupados').classList.add('active');
        document.getElementById('type-no-agrupados').classList.remove('active');
    });

    // Limpiar
    document.getElementById('btn-limpiar')?.addEventListener('click', () => {
        document.getElementById('data-input').value = "";
        document.getElementById('project-name-input').value = "";
    });

    document.getElementById('btn-hero-start')?.addEventListener('click', () => {
        document.getElementById('data-input')?.focus();
    });

    // ========== BOTÓN CALCULAR ==========
    document.getElementById('btn-calcular')?.addEventListener('click', async () => {
    const rawInput = document.getElementById('data-input').value;
    const cleanNumbers = rawInput.split(/[\n,;\s]+/).map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

        if (cleanNumbers.length < 2) {
            alert("Ingresa al menos dos números válidos.");
            return;
        }

        // Elegir motor según tipo de dato
        if (currentDataType === 'agrupados') {
            currentResults = StatsEngine.calculateAgrupados(cleanNumbers);
        } else {
            currentResults = StatsEngine.calculateNoAgrupados(cleanNumbers);
        }

        document.getElementById('results-data-type').textContent = 
            currentDataType === 'agrupados' ? 'Agrupados' : 'No agrupados';

        renderResultsCards(currentResults);
        renderFrequencyTable(currentResults);

        const selectedChecklist = getSelectedChecklist();
        if (typeof saveCalculationToHistory === 'function') {
            await saveCalculationToHistory(currentDataType, rawInput, currentResults, selectedChecklist);
        }

        switchView('view-results');
    });

    // Guardar Proyecto
    document.getElementById('btn-save-project')?.addEventListener('click', async () => {
        const name = document.getElementById('project-name-input').value.trim() || 'Proyecto sin título';
        const rawInput = document.getElementById('data-input').value;

        if (!rawInput) {
            alert("Ingresa al menos algunos datos antes de guardar.");
            return;
        }

        if (typeof saveProjectToSupabase === 'function') {
            await saveProjectToSupabase(name, currentDataType, rawInput);
            alert(`Proyecto "${name}" guardado exitosamente.`);
        } else {
            alert("Función de guardado no disponible en este momento.");
        }
    });

    // Volver
    document.getElementById('btn-back')?.addEventListener('click', () => switchView('view-input'));

    // Modal Perfil
    const openProfile = async () => {
        document.getElementById('profile-modal')?.classList.remove('hidden');
        if (typeof loadProfileStats === 'function') await loadProfileStats();
    };

    document.getElementById('btn-user-avatar')?.addEventListener('click', openProfile);
    document.getElementById('btn-open-profile-sidebar')?.addEventListener('click', (e) => {
        e.preventDefault();
        openProfile();
    });

    document.getElementById('btn-close-profile')?.addEventListener('click', () => {
        document.getElementById('profile-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
        if (typeof logout === 'function') logout();
    });

    // ========== EXPORTACIÓN ==========
    document.getElementById('btn-export-main')?.addEventListener('click', () => {
        document.getElementById('dropdown-menu')?.classList.toggle('hidden');
    });

    // Excel
    document.getElementById('export-excel')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentResults) {
            alert("Primero realiza un cálculo.");
            return;
        }

        const dataToExport = Object.keys(currentResults)
            .filter(k => k !== 'tabla')
            .map(k => ({
                Medida: k.toUpperCase(),
                Resultado: currentResults[k].val
            }));

        // También exportar la tabla de frecuencias
        if (currentResults.tabla?.data) {
            dataToExport.push({});
            dataToExport.push({ Medida: "TABLA DE FRECUENCIAS", Resultado: "" });
            currentResults.tabla.data.forEach(row => {
                dataToExport.push({
                    Medida: `X=${row.valor}`,
                    Resultado: `fi=${row.fi} | Fi=${row.Fi} | %=${row.pct} | xi·fi=${row.xiFi}`
                });
            });
        }

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Resultados");
        XLSX.writeFile(wb, "Resultados_StatCalc.xlsx");
    });

    // PDF
    document.getElementById('export-pdf')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentResults) {
            alert("Primero realiza un cálculo.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("StatCalc Pro - Resultados Estadísticos", 14, 20);

        doc.setFontSize(11);
        let y = 35;

        Object.keys(currentResults).forEach(key => {
            if (key === 'tabla') return;
            const item = currentResults[key];
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.setFont(undefined, 'bold');
            doc.text(`${key.toUpperCase()}: ${item.val}`, 14, y);
            y += 8;
        });

        // Tabla de frecuencias
        if (currentResults.tabla?.data) {
            y += 10;
            doc.setFont(undefined, 'bold');
            doc.text("Tabla de Frecuencias", 14, y);
            y += 8;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);

            currentResults.tabla.data.forEach(row => {
                if (y > 275) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`X=${row.valor} | xi=${row.xi} | fi=${row.fi} | Fi=${row.Fi} | %=${row.pct} | xi·fi=${row.xiFi}`, 14, y);
                y += 6;
            });
        }

        doc.save("Resultados_StatCalc.pdf");
    });
});

// ========== NAVEGACIÓN ==========
function setupNavigation() {
    const navs = [
        { btn: 'nav-inicio', view: 'view-input' },
        { btn: 'nav-calc', view: 'view-input' },
        { btn: 'nav-projects', view: 'view-projects', action: loadUserProjects },
        { btn: 'nav-history', view: 'view-history', action: loadUserHistory }
    ];

    navs.forEach(item => {
        document.getElementById(item.btn)?.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById(item.btn)?.classList.add('active');
            switchView(item.view);
            if (item.action) item.action();
        });
    });
}

function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(viewId)?.classList.remove('hidden');
}

function getSelectedChecklist() {
    const mapChecklist = ['rango', 'amplitud', 'k', 'media', 'mediana', 'varianza', 'desviacion', 'cuartiles', 'deciles', 'percentiles', 'fisher', 'kurtosis', 'pearson', 'moda', 'tabla'];
    return mapChecklist.filter(id => document.getElementById(`chk-${id}`)?.checked);
}

// ========== TARJETAS DE RESULTADOS ==========
function renderResultsCards(results) {
    const container = document.getElementById('cards-container');
    if (!container) return;
    container.innerHTML = "";

    const mapChecklist = [
        { id: 'chk-rango', key: 'rango', title: 'Rango' },
        { id: 'chk-amplitud', key: 'amplitud', title: 'Amplitud' },
        { id: 'chk-k', key: 'k', title: 'K (Sturges)' },
        { id: 'chk-media', key: 'media', title: 'Media' },
        { id: 'chk-mediana', key: 'mediana', title: 'Mediana' },
        { id: 'chk-varianza', key: 'varianza', title: 'Varianza' },
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
}

// ========== TABLA DE FRECUENCIAS AVANZADA ==========
function renderFrequencyTable(results) {
    const container = document.getElementById('table-results-container');
    if (!container || !results?.tabla?.data || !document.getElementById('chk-tabla')?.checked) {
        if (container) container.innerHTML = "";
        return;
    }

    const dataRows = results.tabla.data;

    // Columnas básicas siempre
    const showFi = document.getElementById('col-fi')?.checked ?? true;
    const showFiAcc = document.getElementById('col-Fi-acc')?.checked ?? true;
    const showPct = document.getElementById('col-pct')?.checked ?? true;

    // Columnas de momentos (solo si la medida está marcada)
    const showVar = document.getElementById('chk-varianza')?.checked;
    const showFisher = document.getElementById('chk-fisher')?.checked;
    const showKurtosis = document.getElementById('chk-kurtosis')?.checked;

    let html = `
        <h3>Tabla de Frecuencias</h3>
        <div style="overflow-x:auto;">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Dato (X)</th>
                    <th>Marca de clase (xi)</th>
                    ${showFi ? '<th>fi</th>' : ''}
                    ${showFiAcc ? '<th>Fi</th>' : ''}
                    ${showPct ? '<th>%</th>' : ''}
                    <th>xi · fi</th>
                    ${showVar ? '<th>(xi − x̄)² · fi</th>' : ''}
                    ${showFisher ? '<th>(xi − x̄)³ · fi</th>' : ''}
                    ${showKurtosis ? '<th>(xi − x̄)⁴ · fi</th>' : ''}
                </tr>
            </thead>
            <tbody>
    `;

    dataRows.forEach(row => {
        html += `<tr>
            <td><b>${row.valor}</b></td>
            <td>${row.xi}</td>
            ${showFi ? `<td>${row.fi}</td>` : ''}
            ${showFiAcc ? `<td>${row.Fi}</td>` : ''}
            ${showPct ? `<td>${row.pct}</td>` : ''}
            <td>${row.xiFi}</td>
            ${showVar ? `<td>${row.desv2}</td>` : ''}
            ${showFisher ? `<td>${row.desv3}</td>` : ''}
            ${showKurtosis ? `<td>${row.desv4}</td>` : ''}
        </tr>`;
    });

    // Fila de totales
    html += `<tr style="background:rgba(99,102,241,0.15); font-weight:bold;">
        <td colspan="2">TOTALES</td>
        ${showFi ? `<td>${dataRows.reduce((a, r) => a + r.fi, 0)}</td>` : ''}
        ${showFiAcc ? '<td>—</td>' : ''}
        ${showPct ? '<td>100%</td>' : ''}
        <td>${results.tabla.sumXiFi}</td>
        ${showVar ? `<td>${results.tabla.sumXiFi2}</td>` : ''}
        ${showFisher ? `<td>${results.tabla.sumXiFi3}</td>` : ''}
        ${showKurtosis ? `<td>${results.tabla.sumXiFi4}</td>` : ''}
    </tr>`;

    html += `</tbody></table></div>`;

    // Nota explicativa
    if (showVar || showFisher || showKurtosis) {
        html += `<p style="margin-top:12px; font-size:0.85rem; color:var(--text-muted);">
            <i>Las columnas de momentos solo se muestran porque seleccionaste Varianza / Fisher / Kurtosis.</i>
        </p>`;
    }

    container.innerHTML = html;
}

// ========== PASOS DETALLADOS ==========
function showSteps(title, steps) {
    document.getElementById('steps-title').innerText = `Desglose - ${title}`;
    const content = document.getElementById('steps-content');
    content.innerHTML = steps.map((s, idx) => `
        <div class="step-box" style="margin-bottom: 14px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
            <div>${s}</div>
        </div>
    `).join('');
    document.getElementById('steps-panel').classList.remove('hidden');
}

document.getElementById('btn-close-steps')?.addEventListener('click', () => {
    document.getElementById('steps-panel')?.classList.add('hidden');
});

// ========== PROYECTOS E HISTORIAL ==========
async function loadUserProjects() {
    const container = document.getElementById('projects-list-container');
    if (!container) return;
    container.innerHTML = "Cargando proyectos guardados...";
    if (typeof fetchProjectsFromSupabase === 'function') {
        const projects = await fetchProjectsFromSupabase();
        if (!projects || projects.length === 0) {
            container.innerHTML = "<p>No tienes proyectos guardados.</p>";
            return;
        }
        container.innerHTML = projects.map(p => `
            <div class="stat-card">
                <h4>${p.name}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);">${new Date(p.created_at).toLocaleDateString()}</p>
                <button class="btn btn-primary btn-sm" onclick="loadProjectData('${p.input_data.replace(/'/g, "\\'")}')">Cargar Proyecto</button>
            </div>
        `).join('');
    }
}

async function loadUserHistory() {
    const container = document.getElementById('history-list-container');
    if (!container) return;
    container.innerHTML = "Cargando historial...";
    if (typeof fetchHistoryFromSupabase === 'function') {
        const history = await fetchHistoryFromSupabase();
        if (!history || history.length === 0) {
            container.innerHTML = "<p>No hay historial de cálculos.</p>";
            return;
        }
        container.innerHTML = history.map(h => `
            <div class="stat-card">
                <h4>Cálculo (${h.data_type})</h4>
                <p style="font-size:0.8rem; color: var(--text-muted);">${new Date(h.created_at).toLocaleDateString()}</p>
                <p><strong>Datos:</strong> ${h.input_data.substring(0, 40)}...</p>
            </div>
        `).join('');
    }
}

function loadProjectData(dataText) {
    document.getElementById('data-input').value = dataText;
    switchView('view-input');
    document.getElementById('nav-inicio')?.click();
}

// ========== ESCENA 3D ==========
function init3DScene() {
    const container = document.getElementById('canvas-3d-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(2, 0);
    const material = new THREE.MeshPhongMaterial({
        color: 0x6366f1,
        wireframe: true,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.2
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10, 10, 10);
    scene.add(light);

    camera.position.z = 6;

    function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.008;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}

document.getElementById('btn-mobile-menu')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('open');
});