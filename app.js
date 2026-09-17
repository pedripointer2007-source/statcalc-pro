let currentResults = null;
let currentDataType = 'no_agrupados';

document.addEventListener("DOMContentLoaded", () => {
    init3DScene();
    setupNavigation();

    // Selectores tipo de dato
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

    // Limpieza
    document.getElementById('btn-limpiar')?.addEventListener('click', () => {
        document.getElementById('data-input').value = "";
        document.getElementById('project-name-input').value = "";
    });

    document.getElementById('btn-hero-start')?.addEventListener('click', () => {
        document.getElementById('data-input')?.focus();
    });

    // Botón Calcular
    document.getElementById('btn-calcular')?.addEventListener('click', async () => {
        const rawInput = document.getElementById('data-input').value;
        const cleanNumbers = rawInput.split(/[\n,;\s]+/).map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

        if (cleanNumbers.length < 2) {
            alert("Ingresa al menos dos números válidos para realizar los cálculos.");
            return;
        }

        currentResults = StatsEngine.calculateNoAgrupados(cleanNumbers);
        renderResultsCards(currentResults);
        renderFrequencyTable(currentResults.tabla?.data);

        const selectedChecklist = getSelectedChecklist();

        if (typeof saveCalculationToHistory === 'function') {
            await saveCalculationToHistory(currentDataType, rawInput, currentResults, selectedChecklist);
        }

        switchView('view-results');
    });

    // Guardar Proyecto / En Proceso
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

    // Exportación
    document.getElementById('btn-export-main')?.addEventListener('click', () => {
        document.getElementById('dropdown-menu').classList.toggle('hidden');
    });

    document.getElementById('export-excel')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentResults) return;
        const dataToExport = Object.keys(currentResults)
            .filter(k => k !== 'tabla')
            .map(k => ({ Medida: k.toUpperCase(), Resultado: currentResults[k].val }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.writeFile(wb, "Resultados_Estadistica.xlsx");
    });
});

// Navegación Sidebar Funcional
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
            document.getElementById(item.btn).classList.add('active');
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

function renderFrequencyTable(dataRows) {
    const container = document.getElementById('table-results-container');
    if (!container || !dataRows || !document.getElementById('chk-tabla')?.checked) {
        if (container) container.innerHTML = "";
        return;
    }

    const showFi = document.getElementById('col-fi')?.checked;
    const showFiAcc = document.getElementById('col-Fi-acc')?.checked;
    const showFr = document.getElementById('col-fr')?.checked;
    const showFrAcc = document.getElementById('col-Fr-acc')?.checked;
    const showPct = document.getElementById('col-pct')?.checked;

    let html = `<h3>Tabla de Frecuencias</h3><table class="data-table"><thead><tr><th>Dato (X)</th>`;
    if (showFi) html += `<th>fi</th>`;
    if (showFiAcc) html += `<th>Fi</th>`;
    if (showFr) html += `<th>fr</th>`;
    if (showFrAcc) html += `<th>Fr</th>`;
    if (showPct) html += `<th>%</th>`;
    html += `</tr></thead><tbody>`;

    dataRows.forEach(row => {
        html += `<tr><td><b>${row.valor}</b></td>`;
        if (showFi) html += `<td>${row.fi}</td>`;
        if (showFiAcc) html += `<td>${row.Fi}</td>`;
        if (showFr) html += `<td>${row.fr}</td>`;
        if (showFrAcc) html += `<td>${row.Fr}</td>`;
        if (showPct) html += `<td>${row.pct}</td>`;
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function showSteps(title, steps) {
    document.getElementById('steps-title').innerText = `Desglose - ${title}`;
    const content = document.getElementById('steps-content');
    content.innerHTML = steps.map((s, idx) => `
        <div class="step-box" style="margin-bottom: 12px;">
            <div>${s}</div>
        </div>
    `).join('');
    document.getElementById('steps-panel').classList.remove('hidden');
}

document.getElementById('btn-close-steps')?.addEventListener('click', () => {
    document.getElementById('steps-panel').classList.add('hidden');
});

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
                <p><strong>Datos:</strong> ${h.input_data.substring(0, 30)}...</p>
            </div>
        `).join('');
    }
}

function loadProjectData(dataText) {
    document.getElementById('data-input').value = dataText;
    switchView('view-input');
    document.getElementById('nav-inicio')?.click();
}

function init3DScene() {
    const container = document.getElementById('canvas-3d-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(2, 0);
    const material = new THREE.MeshPhongMaterial({ color: 0x6366f1, wireframe: true, emissive: 0x38bdf8, emissiveIntensity: 0.2 });

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