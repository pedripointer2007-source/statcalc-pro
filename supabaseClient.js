const SUPABASE_URL = "https://trtcbekyutqdlpxjaqig.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sDnS3IG0ZGBgPQtlP9d23A_rL95opcl";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loginWithGoogle() {
    try {
        await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
    } catch (err) {
        console.error("Error en inicio de sesión:", err);
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

async function saveCalculationToHistory(dataType, inputData, results, selectedMeasures) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        await supabaseClient.from('calculation_history').insert({
            user_id: user.id,
            data_type: dataType,
            input_data: inputData,
            results_json: results,
            selected_measures: selectedMeasures
        });
    } catch (e) {
        console.warn("No se guardó el historial:", e);
    }
}

async function saveProjectToSupabase(projectName, dataType, inputData) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        await supabaseClient.from('projects').insert({
            user_id: user.id,
            name: projectName,
            data_type: dataType,
            input_data: inputData
        });
    } catch (e) {
        console.warn("No se pudo guardar el proyecto:", e);
    }
}

async function fetchProjectsFromSupabase() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabaseClient.from('projects').select('*').order('created_at', { ascending: false });
        if (error) return [];
        return data;
    } catch (e) {
        return [];
    }
}

async function fetchHistoryFromSupabase() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabaseClient.from('calculation_history').select('*').order('created_at', { ascending: false });
        if (error) return [];
        return data;
    } catch (e) {
        return [];
    }
}

async function loadProfileStats() {
    try {
        const projects = await fetchProjectsFromSupabase();
        const history = await fetchHistoryFromSupabase();
        const elProj = document.getElementById('stat-count-projects');
        const elCalcs = document.getElementById('stat-count-calcs');
        if (elProj) elProj.innerText = projects.length;
        if (elCalcs) elCalcs.innerText = history.length;
    } catch (e) {}
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('btn-login-google')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginWithGoogle();
    });

    const userAvatarBtn = document.getElementById('btn-user-avatar');
    const userModal = document.getElementById('user-modal');
    const closeModalBtn = document.getElementById('btn-close-modal');
    const logoutBtn = document.getElementById('btn-logout');

    if (userAvatarBtn && userModal) {
        userAvatarBtn.addEventListener('click', () => {
            userModal.classList.remove('hidden');
            loadProfileStats();
        });
    }

    if (closeModalBtn && userModal) {
        closeModalBtn.addEventListener('click', () => {
            userModal.classList.add('hidden');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
            const meta = session.user.user_metadata || {};
            const name = meta.full_name || meta.name || 'Usuario';
            const avatar = meta.avatar_url || meta.picture || 'https://via.placeholder.com/90';

            const btnLoginEl = document.getElementById('btn-login-google');
            const btnAvatar = document.getElementById('btn-user-avatar');
            const userPhoto = document.getElementById('user-photo');

            if (btnLoginEl) btnLoginEl.classList.add('hidden');
            if (btnAvatar) btnAvatar.classList.remove('hidden');
            if (userPhoto && avatar) userPhoto.src = avatar;

            const modalImg = document.getElementById('modal-user-img');
            const modalName = document.getElementById('modal-user-name');
            const modalEmail = document.getElementById('modal-user-email');

            if (modalImg) modalImg.src = avatar;
            if (modalName) modalName.innerText = name;
            if (modalEmail) modalEmail.innerText = session.user.email;
        }
    });
});