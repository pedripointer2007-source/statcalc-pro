// supabaseClient.js

const SUPABASE_URL = "https://trtcbekyutqdlpxjaqig.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sDnS3IG0ZGBgPQtlP9d23A_rL95opcl";

// Cambiar el nombre de la constante cliente para no sobreescribir el espacio global 'supabase'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loginWithGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    if (error) console.error("Error al iniciar sesión:", error.message);
}

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

// Guardar historial en la base de datos Supabase
async function saveCalculationToHistory(dataType, inputData, results, selectedMeasures) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return; // Si no hay usuario logueado, no guarda en DB

    const { error } = await supabaseClient.from('calculation_history').insert({
        user_id: user.id,
        data_type: dataType,
        input_data: inputData,
        results_json: results,
        selected_measures: selectedMeasures
    });

    if (error) console.error("Error al guardar historial:", error.message);
}

// Escuchar auth
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        const meta = session.user.user_metadata;
        const name = meta.full_name || meta.name || 'Usuario';
        const avatar = meta.avatar_url || meta.picture || '';

        const authLabel = document.getElementById('auth-label');
        const userPhoto = document.getElementById('user-photo');
        const btnLogin = document.getElementById('btn-login-google');
        const btnAvatar = document.getElementById('btn-user-avatar');

        if (authLabel) authLabel.innerText = name;
        if (userPhoto) userPhoto.src = avatar;
        if (btnLogin) btnLogin.classList.add('hidden');
        if (btnAvatar) btnAvatar.classList.remove('hidden');
        
        // Modal Data
        const modalImg = document.getElementById('modal-user-img');
        const modalName = document.getElementById('modal-user-name');
        const modalEmail = document.getElementById('modal-user-email');

        if (modalImg) modalImg.src = avatar;
        if (modalName) modalName.innerText = name;
        if (modalEmail) modalEmail.innerText = session.user.email;
    }
});