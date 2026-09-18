let currentResults = null;
let currentDataType = 'no_agrupados';

// =========================================================
// CONTROL DE LÍMITES Y PLAN
// =========================================================
function checkLimitAndShowUpgrade(type = 'calculation') {
    if (typeof PlanManager === 'undefined') return true;
    if (PlanManager.isPro()) return true;

    if (type === 'calculation' && !PlanManager.canCalculate()) {
        document.getElementById('upgrade-modal')?.classList.remove('hidden');
        return false;
    }
    if (type === 'file' && !PlanManager.canUploadFile()) {
        document.getElementById('upgrade-modal')?.classList.remove('hidden');
        return false;
    }
    return true;
}

function applyFreePlanRestrictions() {
    if (typeof PlanManager === 'undefined') return;

    if (PlanManager.isPro()) {
        document.querySelectorAll('.checklist-container input[type="checkbox"]').forEach(chk => {
            chk.disabled = false;
            if (chk.parentElement) chk.parentElement.style.opacity = '1';
        });
        return;
    }

    const premiumIds = [
        'chk-rango', 'chk-amplitud', 'chk-varianza', 'chk-desviacion',
        'chk-cuartiles', 'chk-deciles', 'chk-percentiles',
        'chk-fisher', 'chk-kurtosis', 'chk-pearson'
    ];

    premiumIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.checked = false;
        el.disabled = true;
        if (el.parentElement) {
            el.parentElement.style.opacity = '0.45';
            el.parentElement.style.cursor = 'not-allowed';
            el.parentElement.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.getElementById('upgrade-modal')?.classList.remove('hidden');
            };
        }
    });

    ['chk-media', 'chk-mediana', 'chk-moda', 'chk-k', 'chk-tabla'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = false;
            if (el.parentElement) {
                el.parentElement.style.opacity = '1';
                el.parentElement.style.cursor = 'pointer';
                el.parentElement.onclick = null;
            }
        }
    });
}

function updatePlanBadge() {
    const badge = document.getElementById('profile-plan-badge');
    if (!badge) return;

    if (typeof PlanManager !== 'undefined' && PlanManager.isPro()) {
        badge.textContent = '👑 Plan Pro';
        badge.className = 'badge-premium';
    } else {
        badge.textContent = 'Plan Gratuito';
        badge.className = 'badge-premium badge-free';
    }
}

// =========================================================
// INICIO
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    init3DScene();
    setupNavigation();
    applyFreePlanRestrictions();
    updatePlanBadge();

    // ---------- Modal de oferta ----------
    document.getElementById('btn-close-upgrade')?.addEventListener('click', () => {
        document.getElementById('upgrade-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-continue-free')?.addEventListener('click', () => {
        document.getElementById('upgrade-modal')?.classList.add('hidden');
        applyFreePlanRestrictions();
    });

    document.getElementById('btn-license')?.addEventListener('click', () => {
        document.getElementById('license-box')?.classList.toggle('hidden');
    });

    document.getElementById('btn-activate-license')?.addEventListener('click', () => {
        const pass = document.getElementById('license-input')?.value.trim();
        if (pass === '45-30-38-47-67-51') {
            PlanManager.activateProSession();
            alert('✅ Licencia activada para esta sesión. ¡Disfruta Plan Pro!');
            document.getElementById('upgrade-modal')?.classList.add('hidden');
            location.reload();
        } else {
            alert('Contraseña incorrecta');
        }
    });

    // ---------- Tipo de datos ----------
    document.getElementById('type-no-agrupados')?.addEventListener('click', () => {
        currentDataType = 'no_agrupados';
        document.getElementById('type-no-agrupados')?.classList.add('active');
        document.getElementById('type-agrupados')?.classList.remove('active');
    });

    document.getElementById('type-agrupados')?.addEventListener('click', () => {
        currentDataType = 'agrupados';
        document.getElementById('type-agrupados')?.classList.add('active');
        document.getElementById('type-no-agrupados')?.classList.remove('active');
    });

    // ---------- Limpiar ----------
    document.getElementById('btn-limpiar')?.addEventListener('click', () => {
        document.getElementById('data-input').value = "";
        document.getElementById('project-name-input').value = "";
    });

    document.getElementById('btn-hero-start')?.addEventListener('click', () => {
        document.getElementById('data-input')?.focus();
    });

    // ---------- BOTÓN CALCULAR ----------
    document.getElementById('btn-calcular')?.addEventListener('click', async () => {
        if (!checkLimitAndShowUpgrade('calculation')) return;

        const rawInput = document.getElementById('data-input').value;
        const cleanNumbers = rawInput
            .split(/[\n,;\s]+/)
            .map(x => parseFloat(x.trim()))
            .filter(x => !isNaN(x));

        if (cleanNumbers.length < 2) {
            alert("Ingresa al menos dos números válidos.");
            return;
        }

        if (currentDataType === 'agrupados') {
            currentResults = StatsEngine.calculateAgrupados(cleanNumbers);
        } else {
            currentResults = StatsEngine.calculateNoAgrupados(cleanNumbers);
        }

        document.getElementById('results-data-type').textContent =
            currentDataType === 'agrupados' ? 'Agrupados' : 'No agrupados';

        renderResultsCards(currentResults);
        renderFrequencyTable(currentResults);

        if (typeof PlanManager !== 'undefined') {
            PlanManager.registerCalculation();
        }

        const selectedChecklist = getSelectedChecklist();
        if (typeof saveCalculationToHistory === 'function') {
            await saveCalculationToHistory(currentDataType, rawInput, currentResults, selectedChecklist);
        }

        switchView('view-results');
    });

    // ---------- GUARDAR PROYECTO ----------
    document.getElementById('btn-save-project')?.addEventListener('click', async () => {
        if (typeof PlanManager !== 'undefined' && !PlanManager.isPro()) {
            document.getElementById('upgrade-modal')?.classList.remove('hidden');
            return;
        }

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
            alert("Función de guardado no disponible.");
        }
    });

    // ---------- Volver ----------
    document.getElementById('btn-back')?.addEventListener('click', () => switchView('view-input'));

    // ---------- PERFIL (CORREGIDO) ----------
    const openProfile = async () => {
        const modal = document.getElementById('profile-modal');
        if (!modal) return;
        modal.classList.remove('hidden');

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            const btnLogout = document.getElementById('btn-logout');

            if (!user) {
                document.getElementById('modal-user-name').textContent = 'Invitado';
                document.getElementById('modal-user-email').textContent = 'No has iniciado sesión';
                document.getElementById('modal-user-img').src = 'https://via.placeholder.com/100';
                updatePlanBadge();
                if (btnLogout) btnLogout.classList.add('hidden');
                return;
            }

            const meta = user.user_metadata || {};
            const email = user.email || '';
            const shortName = email.split('@')[0] || 'Usuario';
            const fullName = meta.full_name || meta.name || shortName;

            const customAvatar = localStorage.getItem('statcalc_custom_avatar');
            const avatar = customAvatar || meta.avatar_url || meta.picture || 'https://via.placeholder.com/100';

            document.getElementById('modal-user-name').textContent = fullName;
            document.getElementById('modal-user-email').textContent = email;
            document.getElementById('modal-user-img').src = avatar;

            updatePlanBadge();

            if (btnLogout) btnLogout.classList.remove('hidden');

            if (typeof loadProfileStats === 'function') {
                await loadProfileStats();
            }
        } catch (err) {
            console.error('Error cargando perfil:', err);
        }
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

    // ---------- SUBIR AVATAR ----------
    const avatarInput = document.createElement('input');
    avatarInput.type = 'file';
    avatarInput.accept = 'image/*';
    avatarInput.style.display = 'none';
    document.body.appendChild(avatarInput);

    document.getElementById('modal-user-img')?.addEventListener('click', () => {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Solo se permiten imágenes');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target.result;
            const modalImg = document.getElementById('modal-user-img');
            const headerImg = document.getElementById('user-photo');

            if (modalImg) modalImg.src = result;
            if (headerImg) headerImg.src = result;

            localStorage.setItem('statcalc_custom_avatar', result);
        };
        reader.readAsDataURL(file);
    });

    // Cargar avatar personalizado al iniciar
    const savedAvatar = localStorage.getItem('statcalc_custom_avatar');
    if (savedAvatar) {
        const img = document.getElementById('modal-user-img');
        const headerImg = document.getElementById('user-photo');
        if (img) img.src = savedAvatar;
        if (headerImg) headerImg.src = savedAvatar;
    }

    // ---------- EXPORTACIÓN ----------
    document.getElementById('btn-export-main')?.addEventListener('click', () => {
        document.getElementById('dropdown-menu')?.classList.toggle('hidden');
    });

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
                doc.text(`X=${row.valor} | xi=${row.xi} | fi=${row.fi} | Fi=${row.Fi} | %=${row.pct}`, 14, y);
                y += 6;
            });
        }

        doc.save("Resultados_StatCalc.pdf");
    });

    // ---------- Menú móvil ----------
    document.getElementById('btn-mobile-menu')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
    });
});

// =========================================================
// NAVEGACIÓN
// =========================================================
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
    const mapChecklist = [
        'rango', 'amplitud', 'k', 'media', 'mediana', 'varianza', 'desviacion',
        'cuartiles', 'deciles', 'percentiles', 'fisher', 'kurtosis', 'pearson', 'moda', 'tabla'
    ];
    return mapChecklist.filter(id => document.getElementById(`chk-${id}`)?.checked);
}

// =========================================================
// RESULTADOS
// =========================================================
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
                <button class="btn btn-secondary btn-sm" onclick="showSteps('${item.title}', ${JSON.stringify(data.steps).replace(/"/g, '&quot;')})">
                    Ver pasos
                </button>
            `;
            container.appendChild(card);
        }
    });
}

function renderFrequencyTable(results) {
    const container = document.getElementById('table-results-container');
    if (!container || !results?.tabla?.data || !document.getElementById('chk-tabla')?.checked) {
        if (container) container.innerHTML = "";
        return;
    }

    const dataRows = results.tabla.data;
    const showFi = document.getElementById('col-fi')?.checked ?? true;
    const showFiAcc = document.getElementById('col-Fi-acc')?.checked ?? true;
    const showPct = document.getElementById('col-pct')?.checked ?? true;
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
    container.innerHTML = html;
}

// =========================================================
// PASOS
// =========================================================
function showSteps(title, steps) {
    if (typeof PlanManager !== 'undefined' && !PlanManager.isPro()) {
        const premiumTitles = ['Rango', 'Amplitud', 'Varianza', 'Desviación Estándar', 'Cuartiles', 'Deciles', 'Percentiles', 'Fisher', 'Kurtosis', 'Pearson'];
        if (premiumTitles.includes(title)) {
            document.getElementById('upgrade-modal')?.classList.remove('hidden');
            return;
        }
    }

    document.getElementById('steps-title').innerText = `Desglose - ${title}`;
    const content = document.getElementById('steps-content');
    content.innerHTML = steps.map(s => `
        <div class="step-box" style="margin-bottom: 14px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
            <div>${s}</div>
        </div>
    `).join('');
    document.getElementById('steps-panel').classList.remove('hidden');
}

document.getElementById('btn-close-steps')?.addEventListener('click', () => {
    document.getElementById('steps-panel')?.classList.add('hidden');
});

// =========================================================
// PROYECTOS E HISTORIAL
// =========================================================
async function loadUserProjects() {
    const container = document.getElementById('projects-list-container');
    if (!container) return;
    container.innerHTML = "Cargando proyectos...";

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
                <button class="btn btn-primary btn-sm" onclick="loadProjectData('${String(p.input_data).replace(/'/g, "\\'")}')">
                    Cargar Proyecto
                </button>
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
            container.innerHTML = "<p>No hay historial de cálculos. (Debes estar logueado y haber calculado)</p>";
            return;
        }
        container.innerHTML = history.map(h => `
            <div class="stat-card">
                <h4>Cálculo (${h.data_type})</h4>
                <p style="font-size:0.8rem; color: var(--text-muted);">${new Date(h.created_at).toLocaleDateString()}</p>
                <p><strong>Datos:</strong> ${h.input_data.substring(0, 50)}${h.input_data.length > 50 ? '...' : ''}</p>
            </div>
        `).join('');
    }
}

function loadProjectData(dataText) {
    document.getElementById('data-input').value = dataText;
    switchView('view-input');
    document.getElementById('nav-inicio')?.click();
}

// =========================================================
// ESCENA 3D
// =========================================================
function init3DScene() {
    const container = document.getElementById('canvas-3d-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight || 1, 0.1, 1000);
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