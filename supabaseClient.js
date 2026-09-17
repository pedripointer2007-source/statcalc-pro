// Reemplaza con tus claves de tu proyecto de Supabase
const SUPABASE_URL = "https://trtcbekyutqdlpxjaqig.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sDnS3IG0ZGBgPQtlP9d23A_rL95opcl";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    if (error) console.error("Error al iniciar sesión:", error.message);
}

async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
}

// Detectar cambios en el estado del usuario
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        document.getElementById('auth-label').innerText = session.user.user_metadata.full_name;
        document.getElementById('user-photo').src = session.user.user_metadata.avatar_url;
        document.getElementById('btn-login-google').classList.add('hidden');
        document.getElementById('btn-user-avatar').classList.remove('hidden');
        
        // Modal Data
        document.getElementById('modal-user-img').src = session.user.user_metadata.avatar_url;
        document.getElementById('modal-user-name').innerText = session.user.user_metadata.full_name;
        document.getElementById('modal-user-email').innerText = session.user.email;
    }
});