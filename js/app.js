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

    // =========================
    // COPIA DE SEGURIDAD / IMPORTACIÓN
    // =========================

    function getBackupPayload() {
        return {
            app: "FINANZAS JL",
            backupType: "finanzas_jl_local_backup",
            version: "2.1",
            exportDate: new Date().toISOString(),
            data: {
                movements: db || [],
                profile: profile || {},
                currency: currentCurrency || "COP",
                language: currentLang || "es",
                receiptSequence: localStorage.getItem('receipt_sequence_v1') || "0",
                excelPrintMonth: localStorage.getItem('excel_print_month') || getCurrentInputMonth(),
                selectedReceiptIndex: localStorage.getItem('selected_receipt_index') || "0",
                selectedHistoryMonth: localStorage.getItem('selected_history_month') || getMonthKeyFromDate(new Date()),
                selectedHistoryYear: localStorage.getItem('selected_history_year') || String(new Date().getFullYear())
            }
        };
    }

    function exportBackupData() {
        const payload = getBackupPayload();
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const datePart = new Date().toISOString().slice(0, 10);

        a.href = url;
        a.download = `FINANZAS_JL_Backup_${datePart}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(translations[currentLang].backupExportOk);
    }

    function openImportBackupFile() {
        const input = document.getElementById('backup-file-input');
        if (!input) return;
        input.value = "";
        input.click();
    }

    function validateBackupPayload(payload) {
        return payload &&
            payload.app === "FINANZAS JL" &&
            payload.backupType === "finanzas_jl_local_backup" &&
            payload.data &&
            Array.isArray(payload.data.movements);
    }

    function applyImportedBackup(payload) {
        const data = payload.data || {};

        db = Array.isArray(data.movements) ? data.movements : [];
        profile = data.profile && typeof data.profile === 'object' ? data.profile : {};
        currentCurrency = data.currency || "COP";
        currentLang = data.language || "es";
        selectedReceiptIndex = Number(data.selectedReceiptIndex || 0);
        selectedHistoryMonth = data.selectedHistoryMonth || getMonthKeyFromDate(new Date());
        selectedHistoryYear = Number(data.selectedHistoryYear || new Date().getFullYear());

        localStorage.setItem('freddy_db_v11', JSON.stringify(db));
        localStorage.setItem('finanzas_jl_profile_v1', JSON.stringify(profile));
        localStorage.setItem('app_currency', currentCurrency);
        localStorage.setItem('app_lang', currentLang);
        localStorage.setItem('receipt_sequence_v1', String(data.receiptSequence || getCurrentReceiptMaxSequence()));
        localStorage.setItem('excel_print_month', normalizeExcelMonth(data.excelPrintMonth || getCurrentInputMonth()));
        localStorage.setItem('selected_receipt_index', String(selectedReceiptIndex));
        localStorage.setItem('selected_history_month', selectedHistoryMonth);
        localStorage.setItem('selected_history_year', String(selectedHistoryYear));

        ensureReceiptNumbers();

        const currencySelect = document.getElementById('currency-select');
        if (currencySelect) currencySelect.value = currentCurrency;

        initExcelPrintDate();
        applyLang();
        updateUI();
        loadProfileForm();

        if (document.getElementById('scr-hist')?.classList.contains('active')) {
            renderHist();
        }
    }

    function importBackupData(event) {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const payload = JSON.parse(e.target.result);

                if (!validateBackupPayload(payload)) {
                    alert(translations[currentLang].backupInvalid);
                    return;
                }

                if (!confirm(translations[currentLang].backupImportConfirm)) {
                    return;
                }

                applyImportedBackup(payload);
                alert(translations[currentLang].backupImportOk);
            } catch (error) {
                alert(translations[currentLang].backupImportError);
            }
        };

        reader.onerror = function() {
            alert(translations[currentLang].backupImportError);
        };

        reader.readAsText(file);
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
            ter: "Nombre / Razón social",
            nit: "NIT / CC",
            terContact: "Contacto",
            terEmail: "Correo electrónico",
            terAddress: "Dirección",
            addOptionalTitle: "📇 Datos adicionales (opcionales)",
            addOptionalHelp: "Completa esta sección solo si deseas guardar datos de contacto para recibos o seguimiento.",
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
            client: "NOMBRE / RAZÓN SOCIAL",
            clientContact: "CONTACTO",
            clientEmail: "CORREO ELECTRÓNICO",
            clientAddress: "DIRECCIÓN",
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
            installHelp: "Si tu navegador no muestra la instalación automática, abre el menú y selecciona ‘Agregar a pantalla de inicio’.",
            backupTitle: "📦 Copia de seguridad",
            backupHelp: "Exporta tus datos para guardarlos en tu celular, Google Drive o WhatsApp. Si cambias de dispositivo, puedes importar el archivo y recuperar tu información.",
            backupExport: "⬇️ Exportar datos",
            backupImport: "⬆️ Importar datos",
            backupWarning: "Importante: esta copia guarda movimientos, perfil, moneda, idioma y configuración local. No reemplaza tu cuenta Premium de Firebase.",
            backupExportOk: "Copia de seguridad descargada correctamente.",
            backupInvalid: "El archivo seleccionado no parece ser una copia válida de FINANZAS JL.",
            backupImportConfirm: "Esto reemplazará los datos actuales de esta app por los datos del archivo importado. ¿Deseas continuar?",
            backupImportOk: "Datos importados correctamente. La app se actualizará ahora.",
            backupImportError: "No se pudo importar el archivo. Revisa que sea una copia de seguridad válida."
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
            ter: "Name / Business name",
            nit: "Tax ID / ID",
            terContact: "Contact",
            terEmail: "Email",
            terAddress: "Address",
            addOptionalTitle: "📇 Additional details (optional)",
            addOptionalHelp: "Complete this section only if you want to save contact details for receipts or follow-up.",
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
            client: "NAME / BUSINESS NAME",
            clientContact: "CONTACT",
            clientEmail: "EMAIL",
            clientAddress: "ADDRESS",
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
            installHelp: "If your browser does not show the automatic install option, open the menu and select ‘Add to home screen’.",
            backupTitle: "📦 Backup",
            backupHelp: "Export your data to save it on your phone, Google Drive or WhatsApp. If you change devices, you can import the file and recover your information.",
            backupExport: "⬇️ Export data",
            backupImport: "⬆️ Import data",
            backupWarning: "Important: this backup saves movements, profile, currency, language and local settings. It does not replace your Firebase Premium account.",
            backupExportOk: "Backup downloaded successfully.",
            backupInvalid: "The selected file does not seem to be a valid FINANZAS JL backup.",
            backupImportConfirm: "This will replace the current data in this app with the imported file data. Do you want to continue?",
            backupImportOk: "Data imported successfully. The app will now refresh.",
            backupImportError: "The file could not be imported. Check that it is a valid backup."
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
        if (document.getElementById('lbl-ter-contact')) document.getElementById('lbl-ter-contact').innerText = t.terContact;
        if (document.getElementById('lbl-ter-email')) document.getElementById('lbl-ter-email').innerText = t.terEmail;
        if (document.getElementById('lbl-ter-address')) document.getElementById('lbl-ter-address').innerText = t.terAddress;
        if (document.getElementById('txt-add-optional-title')) document.getElementById('txt-add-optional-title').innerText = t.addOptionalTitle;
        if (document.getElementById('txt-add-optional-help')) document.getElementById('txt-add-optional-help').innerText = t.addOptionalHelp;
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

        if (document.getElementById('txt-backup-title')) {
            document.getElementById('txt-backup-title').innerText = t.backupTitle;
            document.getElementById('txt-backup-help').innerText = t.backupHelp;
            document.getElementById('btn-backup-export').innerText = t.backupExport;
            document.getElementById('btn-backup-import').innerText = t.backupImport;
            document.getElementById('txt-backup-warning').innerText = t.backupWarning;
        }


        document.getElementById('btn-save').innerText =
            document.getElementById('edit-index').value === "-1" ? t.save : t.update;

        updatePremiumStatusUI();
    }


    function setAccordionState(cardId, expand = false) {
        const card = document.getElementById(cardId);
        if (!card) return;

        card.classList.toggle('collapsed', !expand);
        const header = card.querySelector('.accordion-header');
        if (header) {
            header.setAttribute('aria-expanded', String(expand));
        }
    }

    function toggleAccordion(cardId) {
        const card = document.getElementById(cardId);
        if (!card) return;

        const willExpand = card.classList.contains('collapsed');
        setAccordionState(cardId, willExpand);
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
            contact: document.getElementById('ter-contact') ? document.getElementById('ter-contact').value.trim() : '',
            email: document.getElementById('ter-email') ? document.getElementById('ter-email').value.trim() : '',
            address: document.getElementById('ter-address') ? document.getElementById('ter-address').value.trim() : '',
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
        if (document.getElementById('ter-contact')) document.getElementById('ter-contact').value = "";
        if (document.getElementById('ter-email')) document.getElementById('ter-email').value = "";
        if (document.getElementById('ter-address')) document.getElementById('ter-address').value = "";
        document.getElementById('desc').value = "";
        document.getElementById('amt').value = "";
        document.getElementById('type').value = "in";
        document.getElementById('chk-afectar-saldo').checked = false;
        document.getElementById('chk-sumar-ingreso').checked = false;

        toggleAbonoLogic();
        setAccordionState('add-optional-accordion', false);
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
                            ${d.nit ? `<small style="color:#666;">${t.taxId}: ${d.nit}</small><br>` : ''}
                            ${d.contact ? `<small style="color:#666;">${t.clientContact}: ${d.contact}</small><br>` : ''}
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
        if (document.getElementById('ter-contact')) document.getElementById('ter-contact').value = item.contact || '';
        if (document.getElementById('ter-email')) document.getElementById('ter-email').value = item.email || '';
        if (document.getElementById('ter-address')) document.getElementById('ter-address').value = item.address || '';
        document.getElementById('desc').value = item.desc;
        document.getElementById('amt').value = item.amt;
        document.getElementById('type').value = item.type;
        document.getElementById('edit-index').value = index;
        document.getElementById('chk-afectar-saldo').checked = item.afectarSaldo || false;
        document.getElementById('chk-sumar-ingreso').checked = item.sumarIngreso || false;

        toggleAbonoLogic();
        const hasOptionalData = Boolean((item.contact || '').trim() || (item.email || '').trim() || (item.address || '').trim());
        setAccordionState('add-optional-accordion', hasOptionalData);
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

            ${last.contact ? `<div class="receipt-row"><span class="receipt-label">${t.clientContact}:</span><span class="receipt-value">${last.contact}</span></div>` : ''}
            ${last.email ? `<div class="receipt-row"><span class="receipt-label">${t.clientEmail}:</span><span class="receipt-value">${last.email}</span></div>` : ''}
            ${last.address ? `<div class="receipt-row"><span class="receipt-label">${t.clientAddress}:</span><span class="receipt-value">${last.address}</span></div>` : ''}

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

        if (typeof XLSX === "undefined") {
            alert(currentLang === 'es'
                ? "No se pudo cargar el generador de Excel. Revisa tu conexión a internet e intenta nuevamente."
                : "The Excel generator could not be loaded. Check your internet connection and try again."
            );
            return;
        }

        const t = translations[currentLang];
        const conf = currencyConfigs[currentCurrency];
        const excelPrintDate = normalizeExcelMonth(document.getElementById('excel-print-date')?.value);
        localStorage.setItem('excel_print_month', excelPrintDate);

        const excelPrintDateLabel = formatReportDate(excelPrintDate);
        const generatedAt = formatLocalDateTime(new Date());
        const reportLocale = currentLang === 'es' ? 'es-CO' : 'en-US';

        // El reporte se genera únicamente con los movimientos del mes seleccionado.
        // Se ordena por fecha, cliente y concepto para que el Excel salga como informe profesional.
        const selectedMonthRecords = db
            .filter(item => getMonthKeyFromEntry(item) === excelPrintDate)
            .slice()
            .sort((a, b) => {
                const dateDiff = parseEntryDate(a).getTime() - parseEntryDate(b).getTime();
                if (dateDiff !== 0) return dateDiff;

                const clientDiff = String(a.ter || '').localeCompare(String(b.ter || ''), reportLocale, { sensitivity: 'base' });
                if (clientDiff !== 0) return clientDiff;

                return String(a.desc || '').localeCompare(String(b.desc || ''), reportLocale, { sensitivity: 'base' });
            });

        if (!selectedMonthRecords.length) {
            alert(currentLang === 'es'
                ? "No hay movimientos registrados para el mes seleccionado."
                : "There are no transactions for the selected month."
            );
            return;
        }

        const typeLabels = {
            in: t.incomeName,
            out: t.expenseName,
            deu_up: t.debtUpName,
            deu_down: t.debtDownName
        };

        const formatDateForExcel = (entry) => {
            const date = parseEntryDate(entry);
            if (isNaN(date.getTime())) return entry.date || "";
            return date.toLocaleDateString(reportLocale, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        };

        const totals = selectedMonthRecords.reduce((acc, item) => {
            const amount = Number(item.amt || 0);

            if (item.type === 'in') {
                acc.income += amount;
                acc.incomeCount += 1;
            } else if (item.type === 'out') {
                acc.expense += amount;
                acc.expenseCount += 1;
            } else if (item.type === 'deu_up') {
                acc.debt += amount;
                acc.debtUp += amount;
                acc.debtUpCount += 1;

                if (item.sumarIngreso) {
                    acc.income += amount;
                }
            } else if (item.type === 'deu_down') {
                acc.debt -= amount;
                acc.debtDown += amount;
                acc.debtDownCount += 1;

                if (item.afectarSaldo) {
                    acc.expense += amount;
                }
            }

            return acc;
        }, {
            income: 0,
            expense: 0,
            debt: 0,
            debtUp: 0,
            debtDown: 0,
            incomeCount: 0,
            expenseCount: 0,
            debtUpCount: 0,
            debtDownCount: 0
        });

        const saldoNeto = totals.income - totals.expense;
        const totalMovimientos = selectedMonthRecords.length;
        const promedioMovimiento = selectedMonthRecords.reduce((sum, item) => sum + Number(item.amt || 0), 0) / totalMovimientos;

        const rows = [];

        rows.push(["FINANZAS JL"]);
        rows.push([currentLang === 'es' ? "INFORME FINANCIERO PROFESIONAL" : "PROFESSIONAL FINANCIAL REPORT"]);
        rows.push([]);
        rows.push([currentLang === 'es' ? "Periodo" : "Period", excelPrintDateLabel, currentLang === 'es' ? "Fecha de generación" : "Generated at", generatedAt]);
        rows.push([t.workingCurrency, conf.name, currentLang === 'es' ? "Total movimientos" : "Total transactions", totalMovimientos]);
        rows.push([]);

        rows.push([currentLang === 'es' ? "RESUMEN EJECUTIVO" : "EXECUTIVE SUMMARY"]);
        rows.push([t.in, totals.income, t.out, totals.expense]);
        rows.push([t.deu, totals.debt, t.net, saldoNeto]);
        rows.push([currentLang === 'es' ? "Promedio por movimiento" : "Average per transaction", promedioMovimiento, currentLang === 'es' ? "Moneda" : "Currency", conf.name]);
        rows.push([]);

        rows.push([currentLang === 'es' ? "RESUMEN POR TIPO DE MOVIMIENTO" : "SUMMARY BY TRANSACTION TYPE"]);
        rows.push([currentLang === 'es' ? "Tipo" : "Type", currentLang === 'es' ? "Cantidad" : "Count", currentLang === 'es' ? "Valor" : "Amount", currentLang === 'es' ? "Participación" : "Share"]);

        const absoluteTotal = Math.max(1, Math.abs(totals.income) + Math.abs(totals.expense) + Math.abs(totals.debtUp) + Math.abs(totals.debtDown));
        rows.push([t.incomeName, totals.incomeCount, totals.income, Math.abs(totals.income) / absoluteTotal]);
        rows.push([t.expenseName, totals.expenseCount, totals.expense, Math.abs(totals.expense) / absoluteTotal]);
        rows.push([t.debtUpName, totals.debtUpCount, totals.debtUp, Math.abs(totals.debtUp) / absoluteTotal]);
        rows.push([t.debtDownName, totals.debtDownCount, totals.debtDown, Math.abs(totals.debtDown) / absoluteTotal]);
        rows.push([]);

        rows.push([t.movementDetail]);
        const detailHeaderRow = rows.length;
        rows.push([
            "#",
            t.date,
            currentLang === 'es' ? "Mes" : "Month",
            t.client,
            t.taxId,
            t.clientContact,
            t.clientEmail,
            t.clientAddress,
            t.detail,
            t.type,
            t.amount,
            currentLang === 'es' ? "Efecto en saldo" : "Balance effect",
            t.currency
        ]);

        selectedMonthRecords.forEach((item, index) => {
            const amount = Number(item.amt || 0);
            const typeLabel = typeLabels[item.type] || item.type || "";
            let effect = amount;

            if (item.type === 'out') effect = -amount;
            if (item.type === 'deu_up') effect = item.sumarIngreso ? amount : 0;
            if (item.type === 'deu_down') effect = item.afectarSaldo ? -amount : 0;

            rows.push([
                index + 1,
                formatDateForExcel(item),
                getMonthTitle(getMonthKeyFromEntry(item)),
                item.ter || "",
                item.nit || "N/A",
                item.contact || "",
                item.email || "",
                item.address || "",
                item.desc || "",
                typeLabel,
                amount,
                effect,
                conf.name
            ]);
        });

        rows.push([]);
        rows.push([currentLang === 'es' ? "TOTALES DEL REPORTE" : "REPORT TOTALS"]);
        rows.push([t.in, totals.income]);
        rows.push([t.out, totals.expense]);
        rows.push([t.deu, totals.debt]);
        rows.push([t.net, saldoNeto]);
        rows.push([]);
        rows.push([`© 2026 FINANZAS JL · ${t.autoReport}`]);

        const worksheet = XLSX.utils.aoa_to_sheet(rows);

        worksheet["!cols"] = [
            { wch: 6 },
            { wch: 16 },
            { wch: 20 },
            { wch: 30 },
            { wch: 20 },
            { wch: 18 },
            { wch: 28 },
            { wch: 34 },
            { wch: 42 },
            { wch: 22 },
            { wch: 18 },
            { wch: 18 },
            { wch: 12 }
        ];

        worksheet["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
            { s: { r: 6, c: 0 }, e: { r: 6, c: 12 } },
            { s: { r: 11, c: 0 }, e: { r: 11, c: 12 } },
            { s: { r: detailHeaderRow - 1, c: 0 }, e: { r: detailHeaderRow - 1, c: 12 } }
        ];

        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        const moneyFormat = `"${conf.symbol}" #,##0`;
        const percentFormat = "0.00%";

        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = worksheet[cellAddress];

                if (!cell) continue;

                if (typeof cell.v === "number") {
                    cell.t = "n";
                    if ([1, 2, 3, 10, 11].includes(col)) {
                        cell.z = moneyFormat;
                    }
                    if (col === 3 && row >= 13 && row <= 16) {
                        cell.z = percentFormat;
                    }
                }
            }
        }

        // Filtro automático en la tabla de movimientos para ordenar y filtrar desde Excel.
        worksheet["!autofilter"] = {
            ref: XLSX.utils.encode_range({
                s: { r: detailHeaderRow, c: 0 },
                e: { r: detailHeaderRow + selectedMonthRecords.length, c: 12 }
            })
        };

        // Congelar visualmente desde la tabla en programas que soporten esta propiedad.
        worksheet["!freeze"] = { xSplit: 0, ySplit: detailHeaderRow + 1 };

        const workbook = XLSX.utils.book_new();
        workbook.Props = {
            Title: "FINANZAS JL - Reporte financiero profesional",
            Subject: excelPrintDateLabel,
            Author: profile.name || "FINANZAS JL",
            Company: "FINANZAS JL",
            CreatedDate: new Date()
        };

        XLSX.utils.book_append_sheet(workbook, worksheet, "Informe profesional");

        const safeMonth = excelPrintDate.replace(/[^0-9-]/g, '');
        const fileName = `FINANZAS_JL_Informe_${conf.name}_${safeMonth}.xlsx`;
        XLSX.writeFile(workbook, fileName);
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

            ${item.contact ? `<div class="receipt-row"><span class="receipt-label">${t.clientContact}:</span><span class="receipt-value">${item.contact}</span></div>` : ''}
            ${item.email ? `<div class="receipt-row"><span class="receipt-label">${t.clientEmail}:</span><span class="receipt-value">${item.email}</span></div>` : ''}
            ${item.address ? `<div class="receipt-row"><span class="receipt-label">${t.clientAddress}:</span><span class="receipt-value">${item.address}</span></div>` : ''}

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
