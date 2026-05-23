// FINANZAS JL V2 - Firebase Auth, Firestore y administración
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
    import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";

    import {
        getAuth,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        sendPasswordResetEmail,
        signOut,
        onAuthStateChanged
    } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

    import {
        getFirestore,
        doc,
        setDoc,
        getDoc,
        updateDoc,
        serverTimestamp,
        collection,
        query,
        where,
        getDocs
    } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

    const firebaseConfig = {
        apiKey: "AIzaSyBiBCAUpFcD9LfyRXwVleeBieVzCLgNpmQ",
        authDomain: "finanzas-jl-d379d.firebaseapp.com",
        projectId: "finanzas-jl-d379d",
        storageBucket: "finanzas-jl-d379d.firebasestorage.app",
        messagingSenderId: "868129664622",
        appId: "1:868129664622:web:379f73e12f066c9cd5c07f",
        measurementId: "G-JSQ7P75MPK"
    };

    const firebaseApp = initializeApp(firebaseConfig);
    getAnalytics(firebaseApp);

    const firebaseAuth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    const ADMIN_EMAIL = "mifinanzaspro@gmail.com";

    window.finanzasFirebaseState = {
        authReady: false,
        user: null,
        userData: null,
        premiumActivo: false,
        trialActivo: false,
        hasPremiumAccess: false,
        estadoPago: "sin_sesion",
        isAdmin: false
    };

    const userDocCreationPromises = {};

    function getAuthFriendlyError(error) {
        const code = error && error.code ? error.code : "";

        if (code === "auth/email-already-in-use") {
            return "Este correo ya tiene una cuenta. Usa Iniciar sesión.";
        }

        if (code === "auth/invalid-email") {
            return "El correo no es válido. Revisa que esté bien escrito.";
        }

        if (code === "auth/weak-password") {
            return "La contraseña es muy débil. Usa mínimo 6 caracteres.";
        }

        if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
            return "Correo o contraseña incorrectos.";
        }

        if (code === "auth/user-not-found") {
            return "No existe una cuenta con ese correo. Presiona Crear cuenta.";
        }

        if (code === "permission-denied" || code === "firestore/permission-denied") {
            return "La cuenta se creó, pero Firestore bloqueó la creación del perfil. Revisa las reglas de Firestore.";
        }

        return error && error.message ? error.message : "Error desconocido.";
    }

    const FIREBASE_TRIAL_DAYS = 30;

    function formatFirebaseDate(value) {
        if (!value) return "";
        if (value.toDate) return value.toDate().toLocaleDateString("es-CO");
        const date = new Date(value);
        return isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-CO");
    }

    function getDateFromFirebaseValue(value) {
        if (!value) return null;
        if (value.toDate) return value.toDate();
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }

    function addDaysToDate(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    function isTrialValid(data) {
        if (!data) return false;
        if (data.estadoPago !== "trial" && data.planActivo !== "trial") return false;

        const vencimientoTrial = getDateFromFirebaseValue(data.fechaVencimientoTrial);
        if (!vencimientoTrial) return false;

        const endOfDay = new Date(vencimientoTrial);
        endOfDay.setHours(23, 59, 59, 999);

        return endOfDay.getTime() >= Date.now();
    }

    function isPremiumValid(data) {
        if (!data || data.premiumActivo !== true) return false;

        if (!data.fechaVencimiento) return true;

        let vencimiento;
        if (data.fechaVencimiento.toDate) {
            vencimiento = data.fechaVencimiento.toDate();
        } else {
            vencimiento = new Date(data.fechaVencimiento);
        }

        if (isNaN(vencimiento.getTime())) return true;

        const endOfDay = new Date(vencimiento);
        endOfDay.setHours(23, 59, 59, 999);

        return endOfDay.getTime() >= Date.now();
    }

    function updateAuthUi() {
        const state = window.finanzasFirebaseState;
        const authForm = document.getElementById("auth-form-area");
        const status = document.getElementById("auth-status");
        const logoutBtn = document.getElementById("auth-logout-btn");
        const activationBox = document.getElementById("activation-box");
        const adminPanel = document.getElementById("admin-panel");

        if (!status) return;

        if (!state.user) {
            if (authForm) authForm.style.display = "block";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (activationBox) activationBox.style.display = "none";
            if (adminPanel) adminPanel.style.display = "none";

            status.innerHTML = "No has iniciado sesión.";
            return;
        }

        const data = state.userData || {};
        const vencimiento = formatFirebaseDate(data.fechaVencimiento);
        const vencimientoTrial = formatFirebaseDate(data.fechaVencimientoTrial);
        const plan = data.planActivo || data.planSolicitado || "gratis";

        if (authForm) authForm.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "block";

        if (activationBox) {
            const mostrarActivacion =
                !state.isAdmin &&
                !state.premiumActivo &&
                !state.trialActivo &&
                !(data.solicitudActivacion === true);

            activationBox.style.display = mostrarActivacion ? "block" : "none";
        }

        if (adminPanel) adminPanel.style.display = state.isAdmin ? "block" : "none";

        let estadoTexto = "Plan gratis básico";
        if (state.premiumActivo) {
            estadoTexto = `⭐ Premium activo${vencimiento ? " hasta " + vencimiento : ""}`;
        } else if (state.trialActivo) {
            estadoTexto = `🎁 Prueba Premium activa${vencimientoTrial ? " hasta " + vencimientoTrial : ""}`;
        } else if (data.solicitudActivacion === true) {
            estadoTexto = `⏳ Solicitud pendiente de activación (${data.planSolicitado || "plan"})`;
        } else if (data.trialUsado === true) {
            estadoTexto = "🔒 Prueba gratis finalizada. Usa las funciones básicas o solicita Premium.";
        }

        status.innerHTML = `
            <b>Sesión:</b> ${state.user.email}<br>
            <b>Estado:</b> ${estadoTexto}<br>
            <b>Plan:</b> ${plan}
            ${state.isAdmin ? "<br><b>Modo administrador activo</b>" : ""}
        `;
    }

    async function ensureUserDocument(user) {
        const userRef = doc(firestore, "usuarios", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            return snap.data();
        }

        // Evita que el botón Crear cuenta y onAuthStateChanged intenten crear
        // el mismo documento al mismo tiempo.
        if (!userDocCreationPromises[user.uid]) {
            userDocCreationPromises[user.uid] = setDoc(userRef, {
                email: user.email,
                premiumActivo: false,
                estadoPago: "trial",
                planActivo: "trial",
                trialUsado: true,
                solicitudActivacion: false,
                planSolicitado: "",
                fechaRegistro: serverTimestamp(),
                fechaActivacion: null,
                fechaVencimiento: null,
                fechaVencimientoTrial: addDaysToDate(new Date(), FIREBASE_TRIAL_DAYS).toISOString()
            });
        }

        await userDocCreationPromises[user.uid];
        delete userDocCreationPromises[user.uid];

        const createdSnap = await getDoc(userRef);
        return createdSnap.exists() ? createdSnap.data() : {
            email: user.email,
            premiumActivo: false,
            estadoPago: "trial",
            planActivo: "trial",
            trialUsado: true,
            solicitudActivacion: false,
            planSolicitado: "",
            fechaVencimientoTrial: addDaysToDate(new Date(), FIREBASE_TRIAL_DAYS).toISOString()
        };
    }

    async function refreshCurrentUserData() {
        const user = firebaseAuth.currentUser;
        if (!user) return;

        const data = await ensureUserDocument(user);
        const premium = isPremiumValid(data);
        const trial = isTrialValid(data);
        const hasPremiumAccess = premium || trial;

        window.finanzasFirebaseState = {
            authReady: true,
            user,
            userData: data,
            premiumActivo: premium,
            trialActivo: trial,
            hasPremiumAccess,
            estadoPago: data.estadoPago || "gratis",
            isAdmin: user.email === ADMIN_EMAIL
        };

        if (premium) {
            localStorage.setItem("finanzas_jl_premium_paid_v3", "true");
        } else {
            localStorage.removeItem("finanzas_jl_premium_paid_v3");
        }

        updateAuthUi();

        if (typeof window.updatePremiumStatusUI === "function") {
            window.updatePremiumStatusUI();
        }
    }

    window.registrarUsuarioFinanzas = async function() {
        const emailInput = document.getElementById("auth-email");
        const passwordInput = document.getElementById("auth-password");
        const email = emailInput?.value.trim();
        const password = passwordInput?.value.trim();

        if (!email || !password) {
            alert("Escribe correo y contraseña.");
            return;
        }

        if (password.length < 6) {
            alert("La contraseña debe tener mínimo 6 caracteres.");
            return;
        }

        try {
            const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            await ensureUserDocument(cred.user);
            await refreshCurrentUserData();
            alert("Cuenta creada correctamente. Ya puedes solicitar activación Premium cuando pagues.");
        } catch (error) {
            alert("Error al crear cuenta: " + getAuthFriendlyError(error));
        }
    };

    window.iniciarSesionFinanzas = async function() {
        const email = document.getElementById("auth-email")?.value.trim();
        const password = document.getElementById("auth-password")?.value.trim();

        if (!email || !password) {
            alert("Escribe correo y contraseña.");
            return;
        }

        try {
            await signInWithEmailAndPassword(firebaseAuth, email, password);
            alert("Sesión iniciada.");
        } catch (error) {
            alert("Error al iniciar sesión: " + getAuthFriendlyError(error));
        }
    };

    window.recuperarPasswordFinanzas = async function() {
        const email = document.getElementById("auth-email")?.value.trim();

        if (!email) {
            alert("Escribe primero tu correo electrónico y luego presiona recuperar contraseña.");
            return;
        }

        try {
            await sendPasswordResetEmail(firebaseAuth, email);
            alert("Te enviamos un correo para restablecer tu contraseña. Revisa también la carpeta de spam o promociones.");
        } catch (error) {
            alert("No se pudo enviar el correo de recuperación: " + getAuthFriendlyError(error));
        }
    };

    window.cerrarSesionFinanzas = async function() {
        await signOut(firebaseAuth);
        alert("Sesión cerrada.");
    };

    window.solicitarActivacionPremium = async function(plan = "mensual") {
        const user = firebaseAuth.currentUser;

        if (!user) {
            alert("Primero debes crear cuenta o iniciar sesión en la sección Perfil.");
            const profileBtn = Array.from(document.querySelectorAll(".nav-item")).find(btn => btn.innerText.includes("Perfil"));
            if (typeof window.nav === "function") {
                window.nav("scr-profile", profileBtn || null);
            }
            return;
        }

        try {
            const userRef = doc(firestore, "usuarios", user.uid);
            await updateDoc(userRef, {
                solicitudActivacion: true,
                planSolicitado: plan,
                fechaSolicitudActivacion: serverTimestamp()
            });

            await refreshCurrentUserData();
            alert("Solicitud registrada. El administrador activará tu Premium después de verificar el pago.");
        } catch (error) {
            alert("No se pudo registrar la solicitud: " + error.message);
        }
    };

    window.cargarUsuariosPendientes = async function() {
        const state = window.finanzasFirebaseState;

        if (!state.user || !state.isAdmin) {
            alert("No tienes permiso de administrador.");
            return;
        }

        const list = document.getElementById("admin-users-list");
        if (list) list.innerHTML = "<p style='margin-top:10px; color:#666;'>Cargando usuarios...</p>";

        try {
            const q = query(
                collection(firestore, "usuarios"),
                where("solicitudActivacion", "==", true)
            );

            const snap = await getDocs(q);

            if (!list) return;

            if (snap.empty) {
                list.innerHTML = "<p style='margin-top:10px; color:#666;'>No hay usuarios pendientes.</p>";
                return;
            }

            let html = "";
            snap.forEach(docSnap => {
                const data = docSnap.data();
                const uid = docSnap.id;
                const plan = data.planSolicitado || "mensual";

                html += `
                    <div class="admin-user-card">
                        <b>${data.email || "Sin correo"}</b><br>
                        UID: <small>${uid}</small><br>
                        Plan solicitado: <b>${plan}</b><br>
                        Estado pago: ${data.estadoPago || "gratis"}<br>
                        <div class="admin-user-actions">
                            <button type="button" class="btn btn-success" onclick="activarUsuarioPremium('${uid}', '${plan}')">
                                Activar ${plan}
                            </button>
                            <button type="button" class="btn btn-warning" onclick="desactivarSolicitudPremium('${uid}')">
                                Rechazar / limpiar
                            </button>
                        </div>
                    </div>
                `;
            });

            list.innerHTML = html;
        } catch (error) {
            if (list) list.innerHTML = "<p style='margin-top:10px; color:#C00000;'>Error cargando usuarios.</p>";
            alert("Error cargando usuarios: " + error.message);
        }
    };

    window.activarUsuarioPremium = async function(uid, plan = "mensual") {
        const state = window.finanzasFirebaseState;

        if (!state.user || !state.isAdmin) {
            alert("No tienes permiso de administrador.");
            return;
        }

        const hoy = new Date();
        const vencimiento = new Date(hoy);

        if (plan === "anual") {
            vencimiento.setFullYear(vencimiento.getFullYear() + 1);
        } else {
            vencimiento.setMonth(vencimiento.getMonth() + 1);
        }

        try {
            await updateDoc(doc(firestore, "usuarios", uid), {
                premiumActivo: true,
                estadoPago: "activado",
                planActivo: plan,
                solicitudActivacion: false,
                fechaActivacion: hoy.toISOString(),
                fechaVencimiento: vencimiento.toISOString(),
                trialUsado: true,
                fechaVencimientoTrial: null
            });

            alert("Usuario activado correctamente.");
            await window.cargarUsuariosPendientes();
        } catch (error) {
            alert("No se pudo activar: " + error.message);
        }
    };

    window.desactivarSolicitudPremium = async function(uid) {
        const state = window.finanzasFirebaseState;

        if (!state.user || !state.isAdmin) {
            alert("No tienes permiso de administrador.");
            return;
        }

        try {
            await updateDoc(doc(firestore, "usuarios", uid), {
                solicitudActivacion: false,
                estadoPago: "gratis",
                planSolicitado: ""
            });

            alert("Solicitud actualizada.");
            await window.cargarUsuariosPendientes();
        } catch (error) {
            alert("No se pudo actualizar: " + error.message);
        }
    };

    onAuthStateChanged(firebaseAuth, async (user) => {
        if (!user) {
            window.finanzasFirebaseState = {
                authReady: true,
                user: null,
                userData: null,
                premiumActivo: false,
                trialActivo: false,
                hasPremiumAccess: false,
                estadoPago: "sin_sesion",
                isAdmin: false
            };

            localStorage.removeItem("finanzas_jl_premium_paid_v3");
            updateAuthUi();

            if (typeof window.updatePremiumStatusUI === "function") {
                window.updatePremiumStatusUI();
            }

            return;
        }

        await refreshCurrentUserData();
    });

    window.addEventListener("load", updateAuthUi);
