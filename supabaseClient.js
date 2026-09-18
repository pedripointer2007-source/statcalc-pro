// supabaseClient.js
const SUPABASE_URL = "https://trtcbekyutqdlpxjaqig.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sDnS3IG0ZGBgPQtlP9d23A_rL95opcl";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== ADMIN ====================
const ADMIN_EMAIL = "pedripointer2007@gmail.com";

function isAdmin(email) {
    return email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// ==================== PLAN / LÍMITES ====================
const PlanManager = {
    getUsage() {
        const data = sessionStorage.getItem('statcalc_usage');
        return data ? JSON.parse(data) : { calculations: 0, files: 0, isPro: false };
    },
    saveUsage(usage) {
        sessionStorage.setItem('statcalc_usage', JSON.stringify(usage));
    },
    isPro() {
        return this.getUsage().isPro === true;
    },
    canCalculate() {
        if (this.isPro()) return true;
        return this.getUsage().calculations < 2;
    },
    canUploadFile() {
        if (this.isPro()) return true;
        return this.getUsage().files < 2;
    },
    registerCalculation() {
        if (this.isPro()) return;
        const u = this.getUsage();
        u.calculations += 1;
        this.saveUsage(u);
    },
    registerFile() {
        if (this.isPro()) return;
        const u = this.getUsage();
        u.files += 1;
        this.saveUsage(u);
    },
    activateProSession() {
        const u = this.getUsage();
        u.isPro = true;
        this.saveUsage(u);
    },
    resetToFree() {
        const u = this.getUsage();
        u.isPro = false;
        this.saveUsage(u);
    }
};

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
    PlanManager.resetToFree();
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
        if (error) console.error("Error guardando historial:", error.message);
    } catch (e) {
        console.warn("No se pudo guardar historial:", e);
    }
}

async function saveProjectToSupabase(name, dataType, inputData) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            alert("Debes iniciar sesión para guardar proyectos.");
            return;
        }

        await saveCalculationToHistory(dataType, inputData, {}, []);

        const { error } = await supabaseClient.from('projects').insert({
            user_id: user.id,
            name: name,
            data_type: dataType,
            input_data: inputData
        });

        if (error) {
            console.error("Error guardando proyecto:", error.message);
            alert("Error al guardar el proyecto.");
        }
    } catch (e) {
        console.warn("Error en saveProjectToSupabase:", e);
    }
}

async function fetchProjectsFromSupabase() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            return [];
        }
        return data || [];
    } catch (e) {
        return [];
    }
}

async function fetchHistoryFromSupabase() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabaseClient
            .from('calculation_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            return [];
        }
        return data || [];
    } catch (e) {
        return [];
    }
}

async function loadProfileStats() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const projects = await fetchProjectsFromSupabase();
        const history = await fetchHistoryFromSupabase();

        const elProjects = document.getElementById('stat-count-projects');
        const elCalcs = document.getElementById('stat-count-calcs');
        if (elProjects) elProjects.textContent = projects.length;
        if (elCalcs) elCalcs.textContent = history.length;
    } catch (e) {}
}

// ==================== ADMIN FUNCTIONS ====================
async function createPaymentRequest(planRequested = 'pro') {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            alert("Debes iniciar sesión para solicitar el plan.");
            return false;
        }

        const meta = user.user_metadata || {};
        const { error } = await supabaseClient.from('payment_requests').insert({
            user_id: user.id,
            email: user.email,
            full_name: meta.full_name || meta.name || user.email.split('@')[0],
            plan_requested: planRequested,
            status: 'pending'
        });

        if (error) {
            console.error(error);
            alert("Error al enviar la solicitud. Intenta de nuevo.");
            return false;
        }

        alert("✅ Solicitud enviada. Cuando confirmemos tu pago, activaremos tu plan.");
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function fetchPendingPayments() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user || !isAdmin(user.email)) return [];

        const { data, error } = await supabaseClient
            .from('payment_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            return [];
        }
        return data || [];
    } catch (e) {
        return [];
    }
}

async function approvePaymentRequest(requestId, userId, plan) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user || !isAdmin(user.email)) {
            alert("No tienes permisos de administrador.");
            return false;
        }

        const { error: err1 } = await supabaseClient
            .from('payment_requests')
            .update({
                status: 'approved',
                processed_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (err1) {
            console.error(err1);
            alert("Error al actualizar la solicitud.");
            return false;
        }

        const { error: err2 } = await supabaseClient
            .from('profiles')
            .update({
                plan_type: plan,
                is_premium: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (err2) {
            console.error(err2);
            alert("Error al asignar el plan al usuario.");
            return false;
        }

        alert(`✅ Plan ${plan.toUpperCase()} asignado correctamente.`);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function rejectPaymentRequest(requestId) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user || !isAdmin(user.email)) return false;

        await supabaseClient
            .from('payment_requests')
            .update({
                status: 'rejected',
                processed_at: new Date().toISOString()
            })
            .eq('id', requestId);

        return true;
    } catch (e) {
        return false;
    }
}

async function loadUserPlanFromDB() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('plan_type, is_premium')
            .eq('id', user.id)
            .single();

        if (error || !data) return;

        if (data.is_premium || data.plan_type === 'pro' || data.plan_type === 'pro_plus') {
            PlanManager.activateProSession();
        }
    } catch (e) {
        console.warn("No se pudo cargar el plan:", e);
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

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.classList.add('hidden');

    supabaseClient.auth.onAuthStateChange((event, session) => {
        const btnLogout = document.getElementById('btn-logout');
        const btnLoginEl = document.getElementById('btn-login-google');
        const btnAvatar = document.getElementById('btn-user-avatar');
        const navAdmin = document.getElementById('nav-admin');

        if (session && session.user) {
            const meta = session.user.user_metadata || {};
            const name = meta.full_name || meta.name || 'Usuario';
            const avatar = meta.avatar_url || meta.picture || '';
            const email = session.user.email || '';

            const authLabel = document.getElementById('auth-label');
            const userPhoto = document.getElementById('user-photo');
            const modalImg = document.getElementById('modal-user-img');
            const modalName = document.getElementById('modal-user-name');
            const modalEmail = document.getElementById('modal-user-email');

            if (authLabel) authLabel.innerText = name;
            if (userPhoto && avatar) userPhoto.src = avatar;
            if (btnLoginEl) btnLoginEl.classList.add('hidden');
            if (btnAvatar) btnAvatar.classList.remove('hidden');
            if (btnLogout) btnLogout.classList.remove('hidden');

            if (modalImg && avatar) modalImg.src = avatar;
            if (modalName) modalName.innerText = name;
            if (modalEmail) modalEmail.innerText = email;

            if (navAdmin) {
                if (isAdmin(email)) {
                    navAdmin.classList.remove('hidden');
                } else {
                    navAdmin.classList.add('hidden');
                }
            }

            loadUserPlanFromDB();
        } else {
            if (btnLogout) btnLogout.classList.add('hidden');
            if (btnLoginEl) btnLoginEl.classList.remove('hidden');
            if (btnAvatar) btnAvatar.classList.add('hidden');
            if (navAdmin) navAdmin.classList.add('hidden');
        }
    });
});