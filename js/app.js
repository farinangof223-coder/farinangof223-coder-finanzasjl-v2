// FINANZAS JL V2 - lógica principal de la app
let db = JSON.parse(localStorage.getItem('freddy_db_v11')) || [];
    let currentLang = localStorage.getItem('app_lang') || 'es';
    let currentCurrency = localStorage.getItem('app_currency') || 'COP';
    let selectedReceiptIndex = Number(localStorage.getItem('selected_receipt_index'));

    let profile = JSON.parse(localStorage.getItem('finanzas_jl_profile_v1')) || {
        name: "",
        id: "",
        contact: "",
        email: "",
        address: ""
    };


    // =========================
    // PREMIUM / PRUEBA GRATIS 30 DÍAS
    // =========================
    // Enlaces de pago.
    // IMPORTANTE: PayPal debe estar configurado como suscripción real mensual/anual desde PayPal.
    // ePayco se mantiene como método alternativo de pago.
    const PAYPAL_MONTHLY_PAYMENT_URL = 'https://www.paypal.com/ncp/payment/VDZ882VRYCCAU';
    const PAYPAL_ANNUAL_PAYMENT_URL = 'https://www.paypal.com/ncp/payment/WLA7LZCEQH698';
    const EPAYCO_MONTHLY_PAYMENT_URL = 'https://payco.link/5c4dfa0e-420c-49a6-b205-e4a98ec48606';
    const EPAYCO_ANNUAL_PAYMENT_URL = 'https://payco.link/6230ba54-fbc8-4aef-9cc7-aa7a5e2225db';
    const TRIAL_DAYS = 30;
    const TRIAL_START_KEY = 'finanzas_jl_trial_start_v3';
    const PREMIUM_PAID_KEY = 'finanzas_jl_premium_paid_v3';
    const LAST_PAYMENT_REDIRECT_KEY = 'finanzas_jl_last_payment_redirect_v3';

    function initTrial() {
        if (!localStorage.getItem(TRIAL_START_KEY)) {
            localStorage.setItem(TRIAL_START_KEY, new Date().toISOString());
        }
    }

    function parseFirebaseClientDate(value) {
        if (!value) return null;
        if (value.toDate) return value.toDate();
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }

    function getTrialInfo() {
        const firebaseState = window.finanzasFirebaseState || {};
        const data = firebaseState.userData || {};
        const isLoggedIn = !!firebaseState.user;
        const isPaid = firebaseState.premiumActivo === true;
        const isTrialActive = firebaseState.trialActivo === true;
        const trialEnd = parseFirebaseClientDate(data.fechaVencimientoTrial);
        const now = new Date();
        const daysLeft = trialEnd
            ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
            : 0;

        return {
            trialStart: parseFirebaseClientDate(data.fechaRegistro),
            trialEnd,
            daysLeft,
            isPaid,
            isTrialActive,
            isLoggedIn,
            hasPremiumAccess: isPaid || isTrialActive,
            firebaseState
        };
    }

    function updatePremiumStatusUI() {
        const info = getTrialInfo();
        const title = document.getElementById('premium-status-title');
        const text = document.getElementById('premium-status-text');
        const chip = document.getElementById('premium-status-chip');
        const card = document.getElementById('premium-status-card');

        if (!title || !text || !chip || !card) {
            return;
        }

        // La burbuja aparece si Premium está activo, si hay trial activo o si hay solicitud pendiente en Firebase.
        if (info.isPaid) {
            card.style.display = 'flex';
            title.innerText = currentLang === 'es' ? '⭐ Premium activo' : '⭐ Premium active';
            text.innerText = '';
            chip.innerText = '';
            return;
        }

        if (info.isTrialActive) {
            card.style.display = 'flex';
            title.innerText = currentLang === 'es'
                ? `🎁 Prueba Premium: ${info.daysLeft} día(s) restantes`
                : `🎁 Premium trial: ${info.daysLeft} day(s) left`;
            text.innerText = '';
            chip.innerText = '';
            return;
        }

        if (info.firebaseState && info.firebaseState.userData && info.firebaseState.userData.solicitudActivacion === true) {
            card.style.display = 'flex';
            title.innerText = currentLang === 'es' ? '⏳ Activación pendiente' : '⏳ Activation pending';
            text.innerText = '';
            chip.innerText = '';
            return;
        }

        card.style.display = 'none';
        title.innerText = '';
        text.innerText = '';
        chip.innerText = '';
    }

    function showPaymentOverlay() {
        const overlay = document.getElementById('payment-overlay');
        const title = document.getElementById('payment-title');
        const text = document.getElementById('payment-text');

        if (title) {
            title.innerText = currentLang === 'es' ? '🔒 Plan Premium requerido' : '🔒 Premium plan required';
        }

        if (text) {
            text.innerText = currentLang === 'es'
                ? 'Tu prueba gratis de 30 días finalizó. Para seguir usando Excel profesional, recibos PDF y la función de copiar/pegar movimientos entre meses, elige un método de pago Premium: PayPal o ePayco.'
                : 'Your 30-day free trial has ended. To keep using professional Excel, PDF receipts and copy/paste transactions between months, choose a Premium payment method: PayPal or ePayco.';
        }

        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    function hidePaymentOverlay() {
        const overlay = document.getElementById('payment-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    function goToPaymentPlatform(plan = 'paypal_monthly') {
        const paymentUrls = {
            paypal_monthly: PAYPAL_MONTHLY_PAYMENT_URL,
            paypal_annual: PAYPAL_ANNUAL_PAYMENT_URL,
            epayco_monthly: EPAYCO_MONTHLY_PAYMENT_URL,
            epayco_annual: EPAYCO_ANNUAL_PAYMENT_URL,
            epayco: EPAYCO_MONTHLY_PAYMENT_URL
        };

        const targetUrl = paymentUrls[plan] || PAYPAL_MONTHLY_PAYMENT_URL;

        if (!targetUrl || targetUrl.includes('COLOCA_AQUI')) {
            alert(currentLang === 'es'
                ? 'Falta configurar el enlace de pago para este plan.'
                : 'The payment link for this plan is missing.');
            return;
        }

        localStorage.setItem(LAST_PAYMENT_REDIRECT_KEY, plan);
        window.open(targetUrl, '_blank');
    }

    function redirectToPaymentIfExpired(force = false) {
        const info = getTrialInfo();

        if (info.hasPremiumAccess) {
            return false;
        }

        if (force) {
            goToPaymentPlatform();
            return true;
        }

        showPaymentOverlay();
        return true;
    }

    function requirePremium(featureName) {
        const info = getTrialInfo();

        if (info.hasPremiumAccess) {
            return true;
        }

        if (!info.isLoggedIn) {
            alert(currentLang === 'es'
                ? 'Para activar tus 30 días gratis Premium, primero crea una cuenta o inicia sesión en Perfil. Puedes seguir usando las funciones básicas sin registro.'
                : 'To activate your 30-day Premium trial, first create an account or sign in from Profile. You can still use basic features without registration.'
            );

            const profileBtn = Array.from(document.querySelectorAll('.nav-item')).find(btn => btn.innerText.includes('Perfil') || btn.innerText.includes('Profile'));
            nav('scr-profile', profileBtn || null);
            return false;
        }

        showPaymentOverlay();
        return false;
    }

    // Usar esta función después de confirmar manualmente un pago.
    // En una versión con backend, esta marca debe venir desde la pasarela de pago.
    function activatePremiumManually() {
        alert(currentLang === 'es'
            ? 'La activación manual ahora se realiza desde Firebase en Perfil > Panel administrador.'
            : 'Manual activation is now done from Firebase in Profile > Admin panel.');
    }

    function loadProfileForm() {
        if (!document.getElementById('profile-name')) {
            return;
        }

        document.getElementById('profile-name').value = profile.name || "";
        document.getElementById('profile-id').value = profile.id || "";
        document.getElementById('profile-contact').value = profile.contact || "";
        document.getElementById('profile-email').value = profile.email || "";
        document.getElementById('profile-address').value = profile.address || "";
    }

    function saveProfile() {
        profile = {
            name: document.getElementById('profile-name').value.trim(),
            id: document.getElementById('profile-id').value.trim(),
            contact: document.getElementById('profile-contact').value.trim(),
            email: document.getElementById('profile-email').value.trim(),
            address: document.getElementById('profile-address').value.trim()
        };

        localStorage.setItem('finanzas_jl_profile_v1', JSON.stringify(profile));
        alert(translations[currentLang].profileSaved);
    }

    const currencyConfigs = {
        COP: { locale: 'es-CO', symbol: '$', name: 'COP' },
        USD: { locale: 'en-US', symbol: '$', name: 'USD' },
        EUR: { locale: 'de-DE', symbol: '€', name: 'EUR' },
        MXN: { locale: 'es-MX', symbol: '$', name: 'MXN' }
    };

    function getReceiptSequenceValue(receiptNumber) {
        const match = String(receiptNumber || '').match(/REC-\d{4}-(\d{6})/);
        return match ? Number(match[1]) : 0;
    }

    function getCurrentReceiptMaxSequence() {
        const storedSequence = Number(localStorage.getItem('receipt_sequence_v1')) || 0;
        const dbSequence = db.reduce((max, item) => Math.max(max, getReceiptSequenceValue(item.receiptNumber)), 0);
        return Math.max(storedSequence, dbSequence);
    }

    function generateReceiptNumber(dateValue) {
        const date = dateValue instanceof Date && !isNaN(dateValue.getTime()) ? dateValue : new Date();
        const nextSequence = getCurrentReceiptMaxSequence() + 1;
        localStorage.setItem('receipt_sequence_v1', String(nextSequence));
        return `REC-${date.getFullYear()}-${String(nextSequence).padStart(6, '0')}`;
    }

    function ensureReceiptNumbers() {
        let changed = false;
        let sequence = getCurrentReceiptMaxSequence();

        db.forEach(item => {
            if (!item.receiptNumber) {
                sequence += 1;
                const entryDate = parseEntryDate(item);
                item.receiptNumber = `REC-${entryDate.getFullYear()}-${String(sequence).padStart(6, '0')}`;
                changed = true;
            }
        });

        localStorage.setItem('receipt_sequence_v1', String(sequence));

        if (changed) {
            localStorage.setItem('freddy_db_v11', JSON.stringify(db));
        }
    }

    const translations = {
        es: {
            title: "FINANZAS JL",
            lock: "Acceso Seguro",
            act: "ACTIVAR",
            in: "Ingresos",
            out: "Gastos",
            deu: "Deudas",
            net: "Saldo Neto",
            excel: "⭐ Descargar Reporte Profesional",
            ter: "Tercero / Cliente",
            nit: "Identificación",
            des: "Concepto",
            amt: "Monto",
            typ: "Tipo",
            optIn: "Ingreso (+)",
            optOut: "Gasto (-)",
            optDeuUp: "Deuda (Aumentar +)",
            optDeuDown: "Deuda (Disminuir -)",
            sumar: "¿Sumar a los Ingresos Actuales?",
            afectar: "¿Descontar del Saldo Actual?",
            save: "✅ Guardar Registro",
            update: "🔄 Actualizar Registro",
            home: "Inicio",
            add: "Nuevo",
            hist: "Historial",
            rec: "Recibo",
            profile: "Perfil",
            profileTitle: "👤 Datos del emisor",
            profileHelp: "Estos datos aparecerán como emisor en los recibos generados por la app.",
            profileName: "Nombre / Razón social",
            profileId: "NIT / CC",
            profileContact: "Contacto",
            profileEmail: "Correo electrónico",
            profileAddress: "Dirección",
            profileSave: "💾 Guardar datos del emisor",
            profileSaved: "Datos del emisor guardados correctamente",
            share: "📄 Descargar recibo en PDF",
            receiptChoose: "Selecciona movimiento para recibo",
            receiptView: "📄 Recibo",
            receiptDefaultText: "Elige un registro para generar o imprimir su recibo.",
            empty: "Sin datos.",
            date: "FECHA",
            client: "TERCERO / CLIENTE",
            detail: "CONCEPTO",
            type: "TIPO MOVIMIENTO",
            amount: "MONTO TOTAL",
            taxId: "NIT / CÉDULA",
            lblCur: "Moneda de Trabajo:",
            generated: "Comprobante generado automáticamente",
            internalSupport: "Este comprobante fue generado como soporte interno del movimiento registrado.",
            signatureReceived: "Firma / Recibido",
            signatureResponsible: "Responsable",
            digitalReceipt: "Comprobante digital",
            noReceipt: "No hay recibo para descargar.",
            popupBlocked: "El navegador bloqueó la ventana emergente. Permite pop-ups para descargar el PDF.",
            incomeName: "Ingreso",
            expenseName: "Gasto",
            debtUpName: "Deuda aumentada",
            debtDownName: "Deuda disminuida",
            reportTitle: "REPORTE GERENCIAL",
            generatedReport: "Fecha de impresión",
            excelPrintDate: "Mes del reporte Excel",
            workingCurrency: "Moneda de trabajo",
            movementDetail: "DETALLE DE MOVIMIENTOS",
            currency: "MONEDA",
            autoReport: "Reporte generado automáticamente",
            histFilter: "Filtrar mes",
            allMovements: "Todos los movimientos",
            copyHelp: "Cada mes aparece en un bloque separado. Dentro de cada mes puedes filtrar por tipo de movimiento y copiar los registros repetidos hacia otro mes.",
            copyFrom: "Copiar desde",
            copyTo: "Pegar en mes",
            copyMonth: "📋 Copiar mes filtrado",
            copyPanel: "Copiar / pegar movimientos",
            noMonth: "No hay meses disponibles",
            copiedOk: "Registros copiados correctamente",
            selectTargetMonth: "Selecciona el mes destino.",
            sameMonthError: "El mes origen y destino no pueden ser el mismo.",
            nothingToCopy: "No hay registros para copiar con el filtro seleccionado.",
            copiedFrom: "Copiado desde",
            selectMonthTitle: "Selecciona mes y año",
            yearLabel: "Año",
            movementsCount: "movimientos",
            installTitle: "📲 Instalar Finanzas JL",
            installText: "Agrega la app a tu celular para abrirla como una aplicación normal.",
            installButton: "Instalar app",
            installHelp: "Si tu navegador no muestra la instalación automática, abre el menú y selecciona ‘Agregar a pantalla de inicio’."
        },
        en: {
            title: "FINANZAS JL",
            lock: "Secure Access",
            act: "ACTIVATE",
            in: "Incomes",
            out: "Expenses",
            deu: "Debts",
            net: "Balance",
            excel: "⭐ Download Professional Report",
            ter: "Client / Third Party",
            nit: "ID Number",
            des: "Concept",
            amt: "Amount",
            typ: "Type",
            optIn: "Income (+)",
            optOut: "Expense (-)",
            optDeuUp: "Debt (Increase +)",
            optDeuDown: "Debt (Decrease -)",
            sumar: "Add to Current Incomes?",
            afectar: "Deduct from Current Balance?",
            save: "✅ Save Record",
            update: "🔄 Update Record",
            home: "Home",
            add: "Add",
            hist: "History",
            rec: "Receipt",
            profile: "Profile",
            profileTitle: "👤 Issuer information",
            profileHelp: "This information will appear as the issuer on receipts generated by the app.",
            profileName: "Name / Business name",
            profileId: "Tax ID / ID",
            profileContact: "Contact",
            profileEmail: "Email",
            profileAddress: "Address",
            profileSave: "💾 Save issuer information",
            profileSaved: "Issuer information saved successfully",
            share: "📄 Download PDF Receipt",
            receiptChoose: "Select transaction for receipt",
            receiptView: "📄 Receipt",
            receiptDefaultText: "Choose a record to generate or print its receipt.",
            empty: "No data.",
            date: "DATE",
            client: "CLIENT / THIRD PARTY",
            detail: "DETAIL",
            type: "TRANSACTION TYPE",
            amount: "TOTAL AMOUNT",
            taxId: "TAX ID / ID",
            lblCur: "Working Currency:",
            generated: "Automatically generated receipt",
            internalSupport: "This receipt was generated as internal support for the registered transaction.",
            signatureReceived: "Signature / Received",
            signatureResponsible: "Responsible",
            digitalReceipt: "Digital receipt",
            noReceipt: "No receipt to download.",
            popupBlocked: "The browser blocked the popup. Please allow pop-ups to download the PDF.",
            incomeName: "Income",
            expenseName: "Expense",
            debtUpName: "Debt increased",
            debtDownName: "Debt decreased",
            reportTitle: "MANAGEMENT REPORT",
            generatedReport: "Print date",
            excelPrintDate: "Excel report month",
            workingCurrency: "Working currency",
            movementDetail: "TRANSACTION DETAILS",
            currency: "CURRENCY",
            autoReport: "Automatically generated report",
            histFilter: "Filter month",
            allMovements: "All transactions",
            copyHelp: "Each month appears in its own block. Inside each month you can filter by movement type and copy repeated records to another month.",
            copyFrom: "Copy from",
            copyTo: "Paste into month",
            copyMonth: "📋 Copy filtered month",
            copyPanel: "Copy / paste transactions",
            noMonth: "No available months",
            copiedOk: "Records copied successfully",
            selectTargetMonth: "Select the target month.",
            sameMonthError: "Source and target month cannot be the same.",
            nothingToCopy: "No records to copy with the selected filter.",
            copiedFrom: "Copied from",
            selectMonthTitle: "Select month and year",
            yearLabel: "Year",
            movementsCount: "transactions",
            installTitle: "📲 Install Finanzas JL",
            installText: "Add the app to your phone to open it like a normal application.",
            installButton: "Install app",
            installHelp: "If your browser does not show the automatic install option, open the menu and select ‘Add to home screen’."
        }
    };

    function formatMoney(amount) {
        const config = currencyConfigs[currentCurrency];
        return `${config.symbol} ${amount.toLocaleString(config.locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`;
    }


    function formatLocalDateTime(dateValue) {
        const date = dateValue instanceof Date && !isNaN(dateValue.getTime()) ? dateValue : new Date();
        const locale = currentLang === 'es' ? 'es-CO' : 'en-US';

        return date.toLocaleString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    function getCurrentInputMonth() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    function normalizeExcelMonth(value) {
        if (!value) {
            return getCurrentInputMonth();
        }
        // Si venía guardada una fecha completa anterior, ejemplo 2026-05-17,
        // se convierte automáticamente a mes, ejemplo 2026-05.
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value.slice(0, 7);
        }
        if (/^\d{4}-\d{2}$/.test(value)) {
            return value;
        }
        return getCurrentInputMonth();
    }

    function initExcelPrintDate() {
        const input = document.getElementById('excel-print-date');
        if (!input) {
            return;
        }
        const savedMonth = normalizeExcelMonth(
            localStorage.getItem('excel_print_month') || localStorage.getItem('excel_print_date')
        );
        input.value = savedMonth;
        localStorage.setItem('excel_print_month', savedMonth);
    }

    function saveExcelPrintDate() {
        const input = document.getElementById('excel-print-date');
        if (input && input.value) {
            localStorage.setItem('excel_print_month', normalizeExcelMonth(input.value));
        }
    }

    function formatReportDate(monthValue) {
        const safeValue = normalizeExcelMonth(monthValue);
        const date = new Date(`${safeValue}-01T00:00:00`);
        const locale = currentLang === 'es' ? 'es-CO' : 'en-US';
        return isNaN(date.getTime())
            ? new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })
            : date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    }

    function changeCurrency() {
        currentCurrency = document.getElementById('currency-select').value;
        localStorage.setItem('app_currency', currentCurrency);
        updateUI();
        renderHist();

        if (document.getElementById('scr-hist').classList.contains('active')) {
            renderHist();
        }
    }

    function applyLang() {
        const t = translations[currentLang];

        document.getElementById('app-title').innerText = t.title;
        if (document.getElementById('txt-lock-title')) {
            document.getElementById('txt-lock-title').innerText = t.lock;
            document.getElementById('txt-lock-btn').innerText = t.act;
        }
        document.getElementById('txt-kpi-in').innerText = t.in;
        document.getElementById('txt-kpi-out').innerText = t.out;
        document.getElementById('txt-kpi-deu').innerText = t.deu;
        document.getElementById('txt-kpi-net').innerText = t.net;
        document.getElementById('txt-btn-excel').innerText = t.excel;
        document.getElementById('lbl-excel-print-date').innerText = t.excelPrintDate;
        document.getElementById('lbl-ter').innerText = t.ter;
        document.getElementById('lbl-nit').innerText = t.nit;
        document.getElementById('lbl-des').innerText = t.des;
        document.getElementById('lbl-amt').innerText = t.amt;
        document.getElementById('lbl-typ').innerText = t.typ;
        document.getElementById('opt-in').innerText = t.optIn;
        document.getElementById('opt-out').innerText = t.optOut;
        document.getElementById('opt-deu-up').innerText = t.optDeuUp;
        document.getElementById('opt-deu-down').innerText = t.optDeuDown;
        document.getElementById('lbl-sumar').innerText = t.sumar;
        document.getElementById('lbl-afectar').innerText = t.afectar;
        document.getElementById('txt-nav-home').innerText = t.home;
        document.getElementById('txt-nav-add').innerText = t.add;
        document.getElementById('txt-nav-hist').innerText = t.hist;
        document.getElementById('txt-nav-profile').innerText = t.profile;
        document.getElementById('lbl-currency').innerText = t.lblCur;
        document.getElementById('lang-label').innerText = currentLang.toUpperCase();

        if (document.getElementById('txt-install-title')) {
            document.getElementById('txt-install-title').innerText = t.installTitle;
            document.getElementById('txt-install-text').innerText = t.installText;
            document.getElementById('install-btn').innerText = t.installButton;
            document.getElementById('txt-install-help').innerText = t.installHelp;
        }

        if (document.getElementById('txt-profile-title')) {
            document.getElementById('txt-profile-title').innerText = t.profileTitle;
            document.getElementById('txt-profile-help').innerText = t.profileHelp;
            document.getElementById('lbl-profile-name').innerText = t.profileName;
            document.getElementById('lbl-profile-id').innerText = t.profileId;
            document.getElementById('lbl-profile-contact').innerText = t.profileContact;
            document.getElementById('lbl-profile-email').innerText = t.profileEmail;
            document.getElementById('lbl-profile-address').innerText = t.profileAddress;
            document.getElementById('btn-profile-save').innerText = t.profileSave;
        }


        document.getElementById('btn-save').innerText =
            document.getElementById('edit-index').value === "-1" ? t.save : t.update;

        updatePremiumStatusUI();
    }

    function toggleLang() {
        currentLang = currentLang === 'es' ? 'en' : 'es';
        localStorage.setItem('app_lang', currentLang);
        applyLang();

        if (document.getElementById('scr-hist').classList.contains('active')) {
            renderHist();
        }
    }

    function toggleAbonoLogic() {
        const type = document.getElementById('type').value;

        document.getElementById('deuda-up-logic').style.display =
            type === 'deu_up' ? 'flex' : 'none';

        document.getElementById('deuda-down-logic').style.display =
            type === 'deu_down' ? 'flex' : 'none';
    }

    function nav(id, el) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        if (el) {
            el.classList.add('active');
        }

        if (id === 'scr-hist') {
            renderHist();
        }

        if (id === 'scr-profile') {
            loadProfileForm();
        }

        updateUI();
    }

    function saveData() {
        const idx = document.getElementById('edit-index').value;

        const entry = {
            ter: document.getElementById('ter').value,
            nit: document.getElementById('nit').value || 'N/A',
            desc: document.getElementById('desc').value || 'Sin concepto',
            amt: parseFloat(document.getElementById('amt').value),
            type: document.getElementById('type').value,
            afectarSaldo: document.getElementById('chk-afectar-saldo').checked,
            sumarIngreso: document.getElementById('chk-sumar-ingreso').checked,
            date: idx === "-1" ? formatLocalDateTime(new Date()) : db[idx].date,
            monthKey: idx === "-1" ? getMonthKeyFromDate(new Date()) : (db[idx].monthKey || getMonthKeyFromEntry(db[idx])),
            receiptNumber: idx === "-1"
                ? generateReceiptNumber(new Date())
                : (db[idx].receiptNumber || generateReceiptNumber(parseEntryDate(db[idx])))
        };

        if (!entry.ter || isNaN(entry.amt)) {
            return alert(currentLang === 'es' ? "Datos Incompletos" : "Incomplete Data");
        }

        if (idx === "-1") {
            db.push(entry);
            selectedReceiptIndex = db.length - 1;
            localStorage.setItem('selected_receipt_index', selectedReceiptIndex);
        } else {
            db[idx] = entry;
        }

        localStorage.setItem('freddy_db_v11', JSON.stringify(db));
        updateUI();
        limpiarForm();
        nav('scr-home', document.querySelector('.nav-item'));
    }

    function limpiarForm() {
        document.getElementById('edit-index').value = "-1";
        document.getElementById('ter').value = "";
        document.getElementById('nit').value = "";
        document.getElementById('desc').value = "";
        document.getElementById('amt').value = "";
        document.getElementById('type').value = "in";
        document.getElementById('chk-afectar-saldo').checked = false;
        document.getElementById('chk-sumar-ingreso').checked = false;

        toggleAbonoLogic();
        applyLang();
    }

    function updateUI() {
        let i = 0;
        let g = 0;
        let d = 0;

        db.forEach(item => {
            if (item.type == 'in') {
                i += item.amt;
            } else if (item.type == 'out') {
                g += item.amt;
            } else if (item.type == 'deu_up') {
                d += item.amt;

                if (item.sumarIngreso) {
                    i += item.amt;
                }
            } else if (item.type == 'deu_down') {
                d -= item.amt;

                if (item.afectarSaldo) {
                    g += item.amt;
                }
            }
        });

        document.getElementById('res-in').innerText = formatMoney(i);
        document.getElementById('res-out').innerText = formatMoney(g);
        document.getElementById('res-deuda').innerText = formatMoney(d);
        document.getElementById('res-net').innerText = formatMoney(i - g);
    }

    function getMonthKeyFromDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    function parseEntryDate(entry) {
        if (!entry || !entry.date) {
            return new Date();
        }

        const raw = String(entry.date).trim();

        const iso = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (iso) {
            return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
        }

        const normal = raw.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
        if (normal) {
            const day = Number(normal[1]);
            const month = Number(normal[2]);
            const year = Number(normal[3]);
            return new Date(year, month - 1, day);
        }

        const parsed = new Date(raw);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
    }

    function getMonthKeyFromEntry(entry) {
        if (entry.monthKey) {
            return entry.monthKey;
        }

        return getMonthKeyFromDate(parseEntryDate(entry));
    }

    function getMonthTitle(monthKey) {
        if (!monthKey || !monthKey.includes('-')) {
            return currentLang === 'es' ? 'Sin fecha' : 'No date';
        }

        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const locale = currentLang === 'es' ? 'es-CO' : 'en-US';
        return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    }

    function getTypeData(type) {
        const t = translations[currentLang];

        if (type === 'in') {
            return { label: t.optIn, color: 'var(--accent)', pill: 'income' };
        }

        if (type === 'out') {
            return { label: t.optOut, color: 'var(--danger)', pill: 'expense' };
        }

        if (type === 'deu_up') {
            return { label: t.optDeuUp, color: 'var(--warning)', pill: 'debt' };
        }

        if (type === 'deu_down') {
            return { label: t.optDeuDown, color: 'var(--warning)', pill: 'debt' };
        }

        return { label: type, color: 'var(--primary)', pill: 'income' };
    }

    function getMonthFilter(monthKey) {
        return localStorage.getItem(`hist_filter_${monthKey}`) || 'all';
    }

    function setMonthFilter(monthKey, value) {
        localStorage.setItem(`hist_filter_${monthKey}`, value);
        renderHist();
    }

    function matchesHistoryFilter(item, filterValue) {
        return filterValue === 'all' || item.type === filterValue;
    }

    function getMonthTotals(rows) {
        const totals = { in: 0, out: 0, deu_up: 0, deu_down: 0 };

        rows.forEach(row => {
            const item = row.item || row;
            const amount = Number(item.amt || 0);

            if (item.type === 'in') totals.in += amount;
            if (item.type === 'out') totals.out += amount;
            if (item.type === 'deu_up') totals.deu_up += amount;
            if (item.type === 'deu_down') totals.deu_down += amount;
        });

        return totals;
    }

    function getAvailableMonthKeys() {
        const months = new Set(db.map(item => getMonthKeyFromEntry(item)));

        // Mantiene visible el mes actual aunque todavía no tenga registros.
        months.add(getMonthKeyFromDate(new Date()));

        return [...months].sort().reverse();
    }

    let selectedHistoryYear = Number(localStorage.getItem('selected_history_year')) || new Date().getFullYear();
    let selectedHistoryMonth = localStorage.getItem('selected_history_month') || getMonthKeyFromDate(new Date());

    function getAvailableYears() {
        const years = new Set([new Date().getFullYear(), selectedHistoryYear]);
        db.forEach(item => {
            const key = getMonthKeyFromEntry(item);
            if (key && key.includes('-')) {
                years.add(Number(key.split('-')[0]));
            }
        });
        return [...years].filter(Boolean).sort((a, b) => b - a);
    }

    function getYearMonths(year) {
        return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`);
    }

    function getShortMonthTitle(monthKey) {
        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        const locale = currentLang === 'es' ? 'es-CO' : 'en-US';
        return date.toLocaleDateString(locale, { month: 'short' }).replace('.', '');
    }

    function setHistoryYear(value) {
        selectedHistoryYear = Number(value) || new Date().getFullYear();
        selectedHistoryMonth = `${selectedHistoryYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        localStorage.setItem('selected_history_year', selectedHistoryYear);
        localStorage.setItem('selected_history_month', selectedHistoryMonth);
        renderHist();
    }

    function selectHistoryMonth(monthKey) {
        selectedHistoryMonth = monthKey;
        selectedHistoryYear = Number(monthKey.split('-')[0]);
        localStorage.setItem('selected_history_month', selectedHistoryMonth);
        localStorage.setItem('selected_history_year', selectedHistoryYear);
        renderHist();
    }


    let monthPickerState = { targetId: null, currentValue: null };
    let monthPickerView = { month: new Date().getMonth() + 1, year: new Date().getFullYear() };

    function getMonthNamesForPicker() {
        if (currentLang === 'en') {
            return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        }
        return ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    }

    function wrapMonth(value) {
        if (value < 1) return 12;
        if (value > 12) return 1;
        return value;
    }

    function renderMonthPickerWheel() {
        const monthNames = getMonthNamesForPicker();
        const monthInput = document.getElementById('month-picker-month');
        const yearInput = document.getElementById('month-picker-year');

        if (monthInput) monthInput.value = monthPickerView.month;
        if (yearInput) yearInput.value = monthPickerView.year;

        const prevMonth = wrapMonth(monthPickerView.month - 1);
        const nextMonth = wrapMonth(monthPickerView.month + 1);

        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        setText('picker-prev-month', monthNames[prevMonth - 1]);
        setText('picker-current-month', monthNames[monthPickerView.month - 1]);
        setText('picker-next-month', monthNames[nextMonth - 1]);

        setText('picker-prev-year', monthPickerView.year - 1);
        setText('picker-current-year', monthPickerView.year);
        setText('picker-next-year', monthPickerView.year + 1);
    }

    function shiftPickerMonth(delta) {
        monthPickerView.month = wrapMonth(monthPickerView.month + delta);
        renderMonthPickerWheel();
    }

    function shiftPickerYear(delta) {
        monthPickerView.year += delta;
        renderMonthPickerWheel();
    }

    function openMonthPicker(targetId, currentValue) {
        const overlay = document.getElementById('month-picker-overlay');
        const monthInput = document.getElementById('month-picker-month');
        const yearInput = document.getElementById('month-picker-year');
        const title = document.getElementById('month-picker-title');

        if (!overlay || !monthInput || !yearInput) {
            return;
        }

        const safeValue = currentValue || getMonthKeyFromDate(new Date());
        const [year, month] = safeValue.split('-').map(Number);
        monthPickerState = { targetId, currentValue: safeValue };
        monthPickerView = { month: month || (new Date().getMonth() + 1), year: year || new Date().getFullYear() };

        title.innerText = currentLang === 'es' ? 'Establecer mes' : 'Set month';
        renderMonthPickerWheel();

        overlay.style.display = 'flex';
    }

    function hideMonthPicker() {
        const overlay = document.getElementById('month-picker-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    function closeMonthPicker(event) {
        if (event && event.target && event.target.id === 'month-picker-overlay') {
            hideMonthPicker();
        }
    }

    function applyMonthPicker() {
        const monthSelect = document.getElementById('month-picker-month');
        const yearSelect = document.getElementById('month-picker-year');

        if (!monthSelect || !yearSelect || !monthPickerState.targetId) {
            hideMonthPicker();
            return;
        }

        const month = String(monthSelect.value).padStart(2, '0');
        const year = yearSelect.value;
        const monthKey = `${year}-${month}`;

        if (monthPickerState.targetId === 'history') {
            hideMonthPicker();
            selectHistoryMonth(monthKey);
            return;
        }

        const input = document.getElementById(monthPickerState.targetId);
        const label = document.getElementById(`${monthPickerState.targetId}-label`);

        if (input) {
            input.value = monthKey;
        }

        if (label) {
            label.innerText = getMonthTitle(monthKey);
        }

        hideMonthPicker();
    }


    function renderFilterOptions(selectedValue) {
        const t = translations[currentLang];
        const options = [
            ['all', t.allMovements],
            ['in', t.in],
            ['out', t.out],
            ['deu_up', t.optDeuUp],
            ['deu_down', t.optDeuDown]
        ];

        return options.map(([value, label]) => `
            <option value="${value}" ${selectedValue === value ? 'selected' : ''}>${label}</option>
        `).join('');
    }

    function buildDateForCopiedEntry(originalEntry, targetMonthKey) {
        const originalDate = parseEntryDate(originalEntry);
        const [year, month] = targetMonthKey.split('-').map(Number);
        const maxDay = new Date(year, month, 0).getDate();
        const day = Math.min(originalDate.getDate(), maxDay);
        const copiedDate = new Date(
            year,
            month - 1,
            day,
            originalDate.getHours(),
            originalDate.getMinutes(),
            originalDate.getSeconds()
        );

        return formatLocalDateTime(copiedDate);
    }

    function copyMonthRecords(sourceMonth) {
        if (!requirePremium('copy_paste_months')) {
            return;
        }

        const targetInput = document.getElementById(`copy-target-${sourceMonth}`);
        const targetMonth = targetInput ? targetInput.value : '';
        const filterValue = getMonthFilter(sourceMonth);
        const t = translations[currentLang];

        if (!sourceMonth) {
            alert(t.noMonth);
            return;
        }

        if (!targetMonth) {
            alert(t.selectTargetMonth);
            return;
        }

        if (sourceMonth === targetMonth) {
            alert(t.sameMonthError);
            return;
        }

        const recordsToCopy = db.filter(item =>
            getMonthKeyFromEntry(item) === sourceMonth && matchesHistoryFilter(item, filterValue)
        );

        if (!recordsToCopy.length) {
            alert(t.nothingToCopy);
            return;
        }

        const copied = recordsToCopy.map(item => {
            const copiedDate = buildDateForCopiedEntry(item, targetMonth);
            const tempEntry = { ...item, date: copiedDate, monthKey: targetMonth };

            return {
                ...item,
                date: copiedDate,
                monthKey: targetMonth,
                copiedFromMonth: sourceMonth,
                receiptNumber: generateReceiptNumber(parseEntryDate(tempEntry))
            };
        });

        db = db.concat(copied);
        localStorage.setItem('freddy_db_v11', JSON.stringify(db));

        updateUI();
        renderHist();
        alert(`${t.copiedOk}: ${copied.length}`);
    }

    function renderHist() {
        const list = document.getElementById('hist-list');
        const t = translations[currentLang];

        if (!list) {
            return;
        }

        const groups = {};

        db.forEach((item, originalIndex) => {
            const monthKey = getMonthKeyFromEntry(item);

            if (!groups[monthKey]) {
                groups[monthKey] = [];
            }

            groups[monthKey].push({ item, originalIndex });
        });

        if (!selectedHistoryMonth) {
            selectedHistoryMonth = getMonthKeyFromDate(new Date());
        }

        selectedHistoryYear = Number(selectedHistoryMonth.split('-')[0]) || new Date().getFullYear();
        localStorage.setItem('selected_history_year', selectedHistoryYear);

        const selectedMonthCount = (groups[selectedHistoryMonth] || []).length;

        let html = `
            <div class="history-year-card">
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.82rem; font-weight:bold; color:var(--primary); text-transform:uppercase;">
                        ${t.selectMonthTitle}
                    </label>
                    <input
                        type="month"
                        value="${selectedHistoryMonth}"
                        onchange="selectHistoryMonth(this.value)"
                    >
                    <small style="display:block; margin-top:7px; color:#666; font-size:0.78rem;">
                        ${selectedMonthCount} ${t.movementsCount}
                    </small>
                </div>
            </div>
            <div class="selected-month-container">
        `;

        const monthKey = selectedHistoryMonth;
        const allRows = (groups[monthKey] || []).sort((a, b) => b.originalIndex - a.originalIndex);
        const filterValue = getMonthFilter(monthKey);
        const rows = allRows.filter(row => matchesHistoryFilter(row.item, filterValue));
        const targetDefault = getMonthKeyFromDate(new Date());

        html += `
            <div class="month-section">
                <div class="month-header">
                    <div class="month-title">${getMonthTitle(monthKey)}</div>
                </div>

                <div class="month-tools">
                    <div class="month-filter-title">${t.histFilter}</div>
                    <div class="form-group">
                        <select onchange="setMonthFilter('${monthKey}', this.value)">
                            ${renderFilterOptions(filterValue)}
                        </select>
                    </div>

                    <details class="copy-panel">
                        <summary>📋 ${t.copyPanel}</summary>
                        <div class="copy-panel-body">
                            <div class="month-tools-row">
                                <div class="form-group">
                                    <label>${t.copyTo}</label>
                                    <input
                                        type="month"
                                        id="copy-target-${monthKey}"
                                        value="${targetDefault}"
                                    >
                                </div>

                                <button onclick="copyMonthRecords('${monthKey}')" class="btn btn-primary month-copy-btn">
                                    ⭐ ${t.copyMonth}
                                </button>
                            </div>
                        </div>
                    </details>
                </div>
        `;

        if (!allRows.length) {
            html += `<div class="month-empty">${t.empty}</div>`;
        } else if (!rows.length) {
            html += `<div class="month-empty">${t.nothingToCopy}</div>`;
        } else {
            rows.forEach(({ item: d, originalIndex }) => {
                const typeData = getTypeData(d.type);
                const copiedInfo = d.copiedFromMonth
                    ? `<br><small style="color:#888;">${t.copiedFrom}: ${getMonthTitle(d.copiedFromMonth)}</small>`
                    : '';

                html += `
                    <div class="transaction-item">
                        <div>
                            <small>${d.date}</small><br>
                            <b>${d.ter}</b><br>
                            <span class="type-pill ${typeData.pill}">${typeData.label.replace(/[()+\-]/g, '').trim()}</span>
                            ${copiedInfo}
                        </div>

                        <div style="text-align:right;">
                            <div style="color:${typeData.color}; font-weight:bold;">
                                ${formatMoney(d.amt)}
                            </div>
                            <small style="color:#666;">${d.desc || ''}</small><br>
                            <button class="btn-edit" onclick="editItem(${originalIndex})">✏️</button>
                            <button class="btn-delete" onclick="deleteItem(${originalIndex})">🗑️</button>
                            <button class="btn-premium-action" onclick="descargarReciboPDF(${originalIndex})" title="⭐ ${t.receiptView}">⭐ 📄</button>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div></div>`;
        list.innerHTML = html;
    }

    function editItem(index) {
        const item = db[index];

        document.getElementById('ter').value = item.ter;
        document.getElementById('nit').value = item.nit || '';
        document.getElementById('desc').value = item.desc;
        document.getElementById('amt').value = item.amt;
        document.getElementById('type').value = item.type;
        document.getElementById('edit-index').value = index;
        document.getElementById('chk-afectar-saldo').checked = item.afectarSaldo || false;
        document.getElementById('chk-sumar-ingreso').checked = item.sumarIngreso || false;

        toggleAbonoLogic();
        nav('scr-add');
        applyLang();
    }

    function deleteItem(index) {
        if (confirm(currentLang === 'es' ? "¿Eliminar registro?" : "Delete record?")) {
            db.splice(index, 1);

            if (selectedReceiptIndex >= db.length) {
                selectedReceiptIndex = db.length ? db.length - 1 : 0;
                localStorage.setItem('selected_receipt_index', selectedReceiptIndex);
            }

            localStorage.setItem('freddy_db_v11', JSON.stringify(db));
            renderHist();
            updateUI();

        }
    }

    function getReceiptTypeData(type) {
        const t = translations[currentLang];

        if (type === 'out') {
            return { tipoTexto: t.optOut, badgeClass: "badge-out", movimientoTexto: t.expenseName };
        }

        if (type === 'deu_up') {
            return { tipoTexto: t.optDeuUp, badgeClass: "badge-deu", movimientoTexto: t.debtUpName };
        }

        if (type === 'deu_down') {
            return { tipoTexto: t.optDeuDown, badgeClass: "badge-deu", movimientoTexto: t.debtDownName };
        }

        return { tipoTexto: t.optIn, badgeClass: "badge-in", movimientoTexto: t.incomeName };
    }

    function getReceiptOptionLabel(item, index) {
        const cleanDesc = item.desc || '';
        const shortDesc = cleanDesc.length > 24 ? cleanDesc.slice(0, 24) + '...' : cleanDesc;
        return `${item.receiptNumber || ('REC-' + String(index + 1).padStart(5, "0"))} · ${item.date} · ${item.ter} · ${shortDesc} · ${formatMoney(item.amt)}`;
    }

    function ensureSelectedReceiptIndex() {
        if (!db.length) {
            selectedReceiptIndex = 0;
            return;
        }

        if (Number.isNaN(selectedReceiptIndex) || selectedReceiptIndex < 0 || selectedReceiptIndex >= db.length) {
            selectedReceiptIndex = db.length - 1;
        }

        localStorage.setItem('selected_receipt_index', selectedReceiptIndex);
    }

    function setSelectedReceiptIndex(value) {
        selectedReceiptIndex = Number(value);
        ensureSelectedReceiptIndex();
        renderReceiptByIndex(selectedReceiptIndex);
    }

    function viewReceipt(index) {
        descargarReciboPDF(index);
    }

    function renderReceiptScreen() {
        const card = document.getElementById('receipt-selector-card');

        if (card) {
            card.innerHTML = '';
        }

        if (!db.length) {
            renderReceiptByIndex(-1);
            return;
        }

        ensureSelectedReceiptIndex();
        renderReceiptByIndex(selectedReceiptIndex);
    }

    function renderReceiptByIndex(index) {
        const box = document.getElementById('rec-box');

        if (!db.length || index < 0 || index >= db.length) {
            box.innerHTML = `<p style='text-align:center; color:#888;'>${translations[currentLang].empty}</p>`;
            return;
        }

        const last = db[index];
        const t = translations[currentLang];
        const typeData = getReceiptTypeData(last.type);
        const receiptNumber = last.receiptNumber || ("REC-" + String(index + 1).padStart(5, "0"));

        box.innerHTML = `
            <div style="border-bottom: 4px solid var(--primary); padding-bottom: 15px; margin-bottom: 22px;">
                <div class="receipt-header">
                    <div>
                        <div class="receipt-brand">${t.title}</div>
                    </div>

                    <div style="text-align:right;">
                        <span class="receipt-badge ${typeData.badgeClass}">${typeData.movimientoTexto}</span>
                        <div style="font-size:0.8rem; color:#777; margin-top:8px;">
                            Nº ${receiptNumber}
                        </div>
                    </div>
                </div>
            </div>

            <div class="receipt-panel">
                <div class="receipt-row">
                    <span class="receipt-label">${t.date}:</span>
                    <span class="receipt-value">${last.date}</span>
                </div>

                <div class="receipt-row" style="margin-bottom:0;">
                    <span class="receipt-label">${t.type}:</span>
                    <span class="receipt-value bold">${typeData.tipoTexto}</span>
                </div>
            </div>

            <div class="receipt-row">
                <span class="receipt-label">${t.client}:</span>
                <span class="receipt-value bold">${last.ter}</span>
            </div>

            <div class="receipt-row">
                <span class="receipt-label">${t.taxId}:</span>
                <span class="receipt-value">${last.nit || 'N/A'}</span>
            </div>

            <div class="receipt-row">
                <span class="receipt-label">${t.detail}:</span>
                <span class="receipt-value">${last.desc}</span>
            </div>

            <div class="receipt-dash-line"></div>

            <div class="receipt-total-row">
                <span class="receipt-total-label">${t.amount}:</span>
                <span class="receipt-total-value">
                    ${formatMoney(last.amt)}
                    <small style="font-size:0.8rem; color:#666;">${currentCurrency}</small>
                </span>
            </div>

            <div style="margin-top:35px; padding-top:20px; border-top:1px solid #eee;">
                <div class="receipt-signatures">
                    <div class="receipt-signature">
                        ${t.signatureReceived}
                    </div>

                    <div class="receipt-signature">
                        ${t.signatureResponsible}
                    </div>
                </div>
            </div>

            <div class="receipt-footer">
                © 2026 FINANZAS JL · ${t.digitalReceipt}
            </div>
        `;
    }

    function exportarExcelFinal() {
        if (!requirePremium('excel')) {
            return;
        }

        if (!db.length) {
            alert(currentLang === 'es'
                ? "No hay datos para exportar."
                : "No data to export."
            );
            return;
        }

        const t = translations[currentLang];
        const conf = currencyConfigs[currentCurrency];
        const excelPrintDate = normalizeExcelMonth(document.getElementById('excel-print-date')?.value);
        localStorage.setItem('excel_print_month', excelPrintDate);
        const excelPrintDateLabel = formatReportDate(excelPrintDate);

        // Filtra el reporte para exportar únicamente el mes seleccionado.
        const selectedMonthRecords = db.filter(item => {
            return getMonthKeyFromEntry(item) === excelPrintDate;
        });

        if (!selectedMonthRecords.length) {
            alert(currentLang === 'es'
                ? "No hay movimientos registrados para el mes seleccionado."
                : "There are no transactions for the selected month."
            );
            return;
        }

        let totalIngresos = 0;
        let totalGastos = 0;
        let totalDeudas = 0;

        selectedMonthRecords.forEach(item => {
            const amount = Number(item.amt || 0);

            if (item.type === 'in') {
                totalIngresos += amount;
            } else if (item.type === 'out') {
                totalGastos += amount;
            } else if (item.type === 'deu_up') {
                totalDeudas += amount;

                if (item.sumarIngreso) {
                    totalIngresos += amount;
                }
            } else if (item.type === 'deu_down') {
                totalDeudas -= amount;

                if (item.afectarSaldo) {
                    totalGastos += amount;
                }
            }
        });

        const saldoNeto = totalIngresos - totalGastos;

        let html = `
            <html>
            <head>
                <meta charset="UTF-8">
            </head>

            <body>
                <table style="border-collapse:collapse; width:100%; font-family:Arial, sans-serif;">

                    <tr>
                        <th colspan="8" style="
                            background:#1F4E79;
                            color:white;
                            font-size:22px;
                            padding:18px;
                            text-align:center;
                            border:1px solid #1F4E79;">
                            ${t.title} - ${t.reportTitle}
                        </th>
                    </tr>

                    <tr>
                        <td colspan="8" style="
                            background:#D9EAF7;
                            color:#1F4E79;
                            font-size:13px;
                            padding:10px;
                            text-align:center;
                            border:1px solid #B7D7EF;">
                            ${t.workingCurrency}: <b>${conf.name}</b> |
                            ${currentLang === 'es' ? 'Mes del reporte' : 'Report month'}: <b>${excelPrintDateLabel}</b>
                        </td>
                    </tr>

                    <tr>
                        <td colspan="8" style="height:15px;"></td>
                    </tr>

                    <tr>
                        <th colspan="2" style="background:#70AD47; color:white; padding:10px; border:1px solid #999;">
                            ${t.in}
                        </th>
                        <th colspan="2" style="background:#C00000; color:white; padding:10px; border:1px solid #999;">
                            ${t.out}
                        </th>
                        <th colspan="2" style="background:#F1C40F; color:#333; padding:10px; border:1px solid #999;">
                            ${t.deu}
                        </th>
                        <th colspan="2" style="background:#1F4E79; color:white; padding:10px; border:1px solid #999;">
                            ${t.net}
                        </th>
                    </tr>

                    <tr>
                        <td colspan="2" style="font-size:16px; font-weight:bold; text-align:center; padding:12px; border:1px solid #999;">
                            ${conf.symbol} ${totalIngresos.toLocaleString(conf.locale)}
                        </td>
                        <td colspan="2" style="font-size:16px; font-weight:bold; text-align:center; padding:12px; border:1px solid #999;">
                            ${conf.symbol} ${totalGastos.toLocaleString(conf.locale)}
                        </td>
                        <td colspan="2" style="font-size:16px; font-weight:bold; text-align:center; padding:12px; border:1px solid #999;">
                            ${conf.symbol} ${totalDeudas.toLocaleString(conf.locale)}
                        </td>
                        <td colspan="2" style="font-size:16px; font-weight:bold; text-align:center; padding:12px; border:1px solid #999;">
                            ${conf.symbol} ${saldoNeto.toLocaleString(conf.locale)}
                        </td>
                    </tr>

                    <tr>
                        <td colspan="8" style="height:18px;"></td>
                    </tr>

                    <tr>
                        <th colspan="8" style="
                            background:#2E75B6;
                            color:white;
                            font-size:16px;
                            padding:12px;
                            text-align:left;
                            border:1px solid #2E75B6;">
                            ${t.movementDetail}
                        </th>
                    </tr>

                    <tr style="background:#1F4E79; color:white; font-weight:bold; text-align:center;">
                        <th style="padding:10px; border:1px solid #999; width:40px;">#</th>
                        <th style="padding:10px; border:1px solid #999; width:160px;">${t.date}</th>
                        <th style="padding:10px; border:1px solid #999; width:180px;">${t.client}</th>
                        <th style="padding:10px; border:1px solid #999; width:120px;">${t.taxId}</th>
                        <th style="padding:10px; border:1px solid #999; width:260px;">${t.detail}</th>
                        <th style="padding:10px; border:1px solid #999; width:150px;">${t.type}</th>
                        <th style="padding:10px; border:1px solid #999; width:140px;">${t.amount}</th>
                        <th style="padding:10px; border:1px solid #999; width:100px;">${t.currency}</th>
                    </tr>
        `;

        selectedMonthRecords.forEach((i, index) => {
            let tipoLegible = i.type;
            let rowBg = index % 2 === 0 ? "#FFFFFF" : "#F7F9FB";
            let tipoColor = "#1F4E79";
            const amount = Number(i.amt || 0);

            if (i.type === 'in') {
                tipoLegible = t.optIn;
                tipoColor = "#70AD47";
            } else if (i.type === 'out') {
                tipoLegible = t.optOut;
                tipoColor = "#C00000";
            } else if (i.type === 'deu_up') {
                tipoLegible = t.optDeuUp;
                tipoColor = "#B7950B";
            } else if (i.type === 'deu_down') {
                tipoLegible = t.optDeuDown;
                tipoColor = "#B7950B";
            }

            html += `
                <tr style="background:${rowBg};">
                    <td style="text-align:center; padding:9px; border:1px solid #ccc;">
                        ${index + 1}
                    </td>

                    <td style="text-align:center; padding:9px; border:1px solid #ccc;">
                        ${i.date}
                    </td>

                    <td style="padding:9px; border:1px solid #ccc; font-weight:bold;">
                        ${i.ter}
                    </td>

                    <td style="text-align:center; padding:9px; border:1px solid #ccc;">
                        ${i.nit || 'N/A'}
                    </td>

                    <td style="padding:9px; border:1px solid #ccc;">
                        ${i.desc}
                    </td>

                    <td style="text-align:center; padding:9px; border:1px solid #ccc; color:${tipoColor}; font-weight:bold;">
                        ${tipoLegible.replace(/[()+\\-]/g, '').trim()}
                    </td>

                    <td style="text-align:right; padding:9px; border:1px solid #ccc; font-weight:bold;">
                        ${conf.symbol} ${amount.toLocaleString(conf.locale)}
                    </td>

                    <td style="text-align:center; padding:9px; border:1px solid #ccc;">
                        ${conf.name}
                    </td>
                </tr>
            `;
        });

        html += `
                    <tr>
                        <td colspan="8" style="height:15px;"></td>
                    </tr>

                    <tr>
                        <td colspan="8" style="
                            font-size:11px;
                            color:#666;
                            padding:10px;
                            border-top:1px solid #ddd;
                            text-align:center;">
                            © 2026 FINANZAS JL · ${t.autoReport}
                        </td>
                    </tr>

                </table>
            </body>
            </html>
        `;

        const blob = new Blob([html], {
            type: 'application/vnd.ms-excel;charset=utf-8;'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `FINANZAS_JL_Reporte_${conf.name}_${excelPrintDate}.xls`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    function descargarReciboPDF(index) {
        if (!requirePremium('receipt_pdf')) {
            return;
        }

        if (!db.length) {
            alert(translations[currentLang].noReceipt);
            return;
        }

        const receiptIndex = typeof index === 'number' ? index : selectedReceiptIndex;

        if (receiptIndex < 0 || receiptIndex >= db.length) {
            alert(translations[currentLang].noReceipt);
            return;
        }

        selectedReceiptIndex = receiptIndex;
        localStorage.setItem('selected_receipt_index', selectedReceiptIndex);

        const item = db[receiptIndex];
        const t = translations[currentLang];
        const typeData = getReceiptTypeData(item.type);
        const receiptNumber = item.receiptNumber || ("REC-" + String(receiptIndex + 1).padStart(5, "0"));

        const issuerName = profile.name || t.title;
        const issuerId = profile.id ? `<div>CC/NIT: ${profile.id}</div>` : "";
        const issuerContact = profile.contact ? `<div>${currentLang === 'es' ? 'Contacto' : 'Contact'}: ${profile.contact}</div>` : "";
        const issuerEmail = profile.email ? `<div>${currentLang === 'es' ? 'Correo' : 'Email'}: ${profile.email}</div>` : "";
        const issuerAddress = profile.address ? `<div>${currentLang === 'es' ? 'Dirección' : 'Address'}: ${profile.address}</div>` : "";

        const receiptContent = `
            <div style="border-bottom: 4px solid var(--primary); padding-bottom: 15px; margin-bottom: 22px;">
                <div class="receipt-header">
                    <div>
                        <div class="receipt-brand">${issuerName}</div>
                        <div class="receipt-subtitle">
                            ${issuerId}
                            ${issuerContact}
                            ${issuerEmail}
                            ${issuerAddress}
                        </div>
                    </div>

                    <div style="text-align:right;">
                        <span class="receipt-badge ${typeData.badgeClass}">${typeData.movimientoTexto}</span>
                        <div style="font-size:0.8rem; color:#777; margin-top:8px;">
                            Nº ${receiptNumber}
                        </div>
                    </div>
                </div>
            </div>

            <div class="receipt-panel">
                <div class="receipt-row">
                    <span class="receipt-label">${t.date}:</span>
                    <span class="receipt-value">${item.date}</span>
                </div>

                <div class="receipt-row" style="margin-bottom:0;">
                    <span class="receipt-label">${t.type}:</span>
                    <span class="receipt-value bold">${typeData.tipoTexto}</span>
                </div>
            </div>

            <div class="receipt-row">
                <span class="receipt-label">${t.client}:</span>
                <span class="receipt-value bold">${item.ter}</span>
            </div>

            <div class="receipt-row">
                <span class="receipt-label">${t.taxId}:</span>
                <span class="receipt-value">${item.nit || 'N/A'}</span>
            </div>

            <div class="receipt-row">
                <span class="receipt-label">${t.detail}:</span>
                <span class="receipt-value">${item.desc}</span>
            </div>

            <div class="receipt-dash-line"></div>

            <div class="receipt-total-row">
                <span class="receipt-total-label">${t.amount}:</span>
                <span class="receipt-total-value">
                    ${formatMoney(item.amt)}
                    <small style="font-size:0.8rem; color:#666;">${currentCurrency}</small>
                </span>
            </div>

            <div style="margin-top:35px; padding-top:20px; border-top:1px solid #eee;">
                <div class="receipt-signatures">
                    <div class="receipt-signature">
                        ${t.signatureReceived}
                    </div>

                    <div class="receipt-signature">
                        ${t.signatureResponsible}
                    </div>
                </div>
            </div>

            <div class="receipt-footer">
                © 2026 FINANZAS JL · ${t.digitalReceipt}
            </div>
        `;

        const cssHref = new URL('css/styles.css', window.location.href).href;

        const printWindow = window.open('', '_blank', 'width=900,height=700');

        if (!printWindow) {
            alert(translations[currentLang].popupBlocked);
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="${currentLang}">
            <head>
                <meta charset="UTF-8">
                <title>Recibo FINANZAS JL</title>

                <link rel="stylesheet" href="${cssHref}">
                <style>
                    body {
                        background: white;
                        padding: 30px;
                        font-family: 'Segoe UI', sans-serif;
                    }

                    .receipt-box {
                        max-width: 780px;
                        margin: 0 auto;
                        box-shadow: none;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        padding: 35px;
                    }

                    @page {
                        size: A4;
                        margin: 18mm;
                    }

                    @media print {
                        body {
                            padding: 0;
                        }

                        .receipt-box {
                            border: 1px solid #ddd;
                            box-shadow: none;
                        }
                    }
                </style>
            </head>

            <body>
                <div class="receipt-box">
                    ${receiptContent}
                </div>

                <script>
                    window.onload = function() {
                        window.focus();
                        window.print();
                    };
                <\/script>
            </body>
            </html>
        `);

        printWindow.document.close();
    }


    // =========================
    // INSTALACIÓN PWA
    // =========================

    let deferredInstallPrompt = null;

    function isRunningAsInstalledApp() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    function showInstallCard(forceShow = false) {
        const installCard = document.getElementById('install-card');

        if (!installCard) {
            return;
        }

        if (isRunningAsInstalledApp()) {
            installCard.style.display = 'none';
            return;
        }

        installCard.style.display = forceShow ? 'block' : 'none';
    }

    window.addEventListener('beforeinstallprompt', function(event) {
        event.preventDefault();
        deferredInstallPrompt = event;
        showInstallCard(true);
    });

    window.addEventListener('appinstalled', function() {
        deferredInstallPrompt = null;
        showInstallCard(false);
    });

    function initInstallButton() {
        const installBtn = document.getElementById('install-btn');

        if (!installBtn) {
            return;
        }

        installBtn.addEventListener('click', async function() {
            if (isRunningAsInstalledApp()) {
                showInstallCard(false);
                return;
            }

            if (!deferredInstallPrompt) {
                alert(currentLang === 'es'
                    ? 'Si no aparece la instalación automática, abre el menú del navegador y selecciona “Agregar a pantalla de inicio”.'
                    : 'If the automatic install option does not appear, open the browser menu and select “Add to home screen”.'
                );
                return;
            }

            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;
            showInstallCard(false);
        });
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('service-worker.js')
                .then(function() {
                    console.log('Service Worker registrado correctamente');
                })
                .catch(function(error) {
                    console.log('Error al registrar Service Worker:', error);
                });
        });
    }

    initInstallButton();
    showInstallCard(false);

    ensureReceiptNumbers();

    document.getElementById('currency-select').value = currentCurrency;
    initExcelPrintDate();

    localStorage.setItem('app_act_v11', 'true');

    updatePremiumStatusUI();
    // No mostrar pantalla de pago automáticamente al abrir la app.
    // Solo se pedirá pago cuando el usuario use una función Premium después de vencer los 30 días.
    hidePaymentOverlay();

    applyLang();
    updateUI();
    loadProfileForm();
