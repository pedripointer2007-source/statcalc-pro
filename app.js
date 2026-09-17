// app.js

let currentResults = null;
let currentDataType = 'no_agrupados';

document.addEventListener("DOMContentLoaded", () => {
    // Inicialización del Renderizador 3D en el Hero
    init3DScene();

    // Eventos del Selector de Tipo de Datos
    const btnNoAgrupados = document.getElementById('type-no-agrupados');
    const btnAgrupados = document.getElementById('type-agrupados');

    if (btnNoAgrupados && btnAgrupados) {
        btnNoAgrupados.addEventListener('click', () => {
            currentDataType = 'no_agrupados';
            btnNoAgrupados.classList.add('active');
            btnAgrupados.classList.remove('active');
        });

        btnAgrupados.addEventListener('click', () => {
            currentDataType = 'agrupados';
            btnAgrupados.classList.add('active');
            btnNoAgrupados.classList.remove('active');
        });
    }

    // Botón Limpiar
    document.getElementById('btn-limpiar')?.addEventListener('click', () => {
        const input = document.getElementById('data-input');
        if (input) input.value = "";
    });

    // Botón Comienza Ahora
    document.getElementById('btn-hero-start')?.addEventListener('click', () => {
        document.getElementById('data-input')?.focus();
    });

    // Botón Calcular Principal
    document.getElementById('btn-calcular')?.addEventListener('click', async () => {
        const rawInput = document.getElementById('data-input').value;
        const cleanNumbers = rawInput.split(/[\n,;\s]+/).map(x => parseFloat(x.trim())).filter(x => !isNaN(x));

        if (cleanNumbers.length < 2) {
            alert("Ingresa al menos dos números válidos para el análisis.");
            return;
        }

        currentResults = StatsEngine.calculateNoAgrupados(cleanNumbers);
        renderResultsCards(currentResults);

        const selectedChecklist = getSelectedChecklist();

        if (typeof saveCalculationToHistory === 'function') {
            await saveCalculationToHistory(currentDataType, rawInput, currentResults, selectedChecklist);
        }

        document.getElementById('view-input').classList.add('hidden');
        document.getElementById('view-results').classList.remove('hidden');
    });

    // Volver
    document.getElementById('btn-back')?.addEventListener('click', () => {
        document.getElementById('view-results').classList.add('hidden');
        document.getElementById('view-input').classList.remove('hidden');
    });

    // Perfil Modal
    document.getElementById('btn-user-avatar')?.addEventListener('click', () => {
        document.getElementById('profile-modal')?.classList.remove('hidden');
    });
    document.getElementById('btn-open-profile-sidebar')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('profile-modal')?.classList.remove('hidden');
    });
    document.getElementById('btn-close-profile')?.addEventListener('click', () => {
        document.getElementById('profile-modal')?.classList.add('hidden');
    });
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        if (typeof logout === 'function') logout();
    });

    // Menú Desplegable de Exportación
    const btnExportMain = document.getElementById('btn-export-main');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (btnExportMain && dropdownMenu) {
        btnExportMain.addEventListener('click', () => {
            dropdownMenu.classList.toggle('hidden');
        });
    }

    // Exportación a Excel
    document.getElementById('export-excel')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentResults) return;
        const dataToExport = Object.keys(currentResults)
            .filter(k => k !== 'tabla')
            .map(k => ({ Medida: k.toUpperCase(), Resultado: currentResults[k].val }));
        
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Resultados");
        XLSX.writeFile(wb, "Resultados_Estadisticos.xlsx");
    });

    // Exportación a PDF
    document.getElementById('export-pdf')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentResults) return;
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
});

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
        { id: 'chk-k', key: 'k', title: 'K (Intervalos)' },
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

function showSteps(title, steps) {
    document.getElementById('steps-title').innerText = `Detalle de cálculo - ${title}`;
    const content = document.getElementById('steps-content');
    content.innerHTML = steps.map((s, idx) => `
        <div class="step-box" style="margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <span class="step-num" style="font-weight:bold; color: var(--accent);">${idx + 1}.</span>
            <span>${s}</span>
        </div>
    `).join('');
    document.getElementById('steps-panel').classList.remove('hidden');
}

document.getElementById('btn-close-steps')?.addEventListener('click', () => {
    document.getElementById('steps-panel').classList.add('hidden');
});

// Animaciones 3D con Three.js
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