// supabaseClient.js

const SUPABASE_URL = "https://trtcbekyutqdlpxjaqig.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sDnS3IG0ZGBgPQtlP9d23A_rL95opcl";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loginWithGoogle() {
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) console.error("Error OAuth Google:", error.message);
    } catch (err) {
        console.error("Excepción al iniciar sesión:", err);
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

        const { error } = await supabaseClient.from('calculation_history').insert({
            user_id: user.id,
            data_type: dataType,
            input_data: inputData,
            results_json: results,
            selected_measures: selectedMeasures
        });

        if (error) console.error("Error guardando en base de datos:", error.message);
    } catch (e) {
        console.warn("No se pudo conectar a la base de datos de historial:", e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const btnLogin = document.getElementById('btn-login-google');
    if (btnLogin) {
        btnLogin.addEventListener('click', (e) => {
            e.preventDefault();
            loginWithGoogle();
        });
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
            const meta = session.user.user_metadata || {};
            const name = meta.full_name || meta.name || 'Usuario';
            const avatar = meta.avatar_url || meta.picture || '';

            const authLabel = document.getElementById('auth-label');
            const userPhoto = document.getElementById('user-photo');
            const btnLoginEl = document.getElementById('btn-login-google');
            const btnAvatar = document.getElementById('btn-user-avatar');

            if (authLabel) authLabel.innerText = name;
            if (userPhoto && avatar) userPhoto.src = avatar;
            if (btnLoginEl) btnLoginEl.classList.add('hidden');
            if (btnAvatar) btnAvatar.classList.remove('hidden');

            const modalImg = document.getElementById('modal-user-img');
            const modalName = document.getElementById('modal-user-name');
            const modalEmail = document.getElementById('modal-user-email');

            if (modalImg && avatar) modalImg.src = avatar;
            if (modalName) modalName.innerText = name;
            if (modalEmail) modalEmail.innerText = session.user.email;
        }
    });
});