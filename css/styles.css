/* FINANZAS JL V2 - estilos separados desde index.html */
:root {
            --primary: #1F4E79;
            --secondary: #2E75B6;
            --accent: #70AD47;
            --danger: #C00000;
            --warning: #f1c40f;
            --light: #F2F2F2;
            --white: #FFFFFF;
            --shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            font-family: 'Segoe UI', sans-serif;
            background: var(--light);
            padding-bottom: 80px;
            overflow-x: hidden;
        }

        .header {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 25px 20px;
            text-align: center;
            box-shadow: var(--shadow);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .lang-switch {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: bold;
        }

        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            display: flex;
            justify-content: space-around;
            padding: 10px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }

        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            color: #888;
            font-size: 0.65rem;
            cursor: pointer;
            border: none;
            background: none;
            font-weight: bold;
        }

        .nav-item.active {
            color: var(--primary);
        }

        .screen {
            display: none;
            padding: 16px;
            max-width: 550px;
            margin: 0 auto;
        }

        .screen.active {
            display: block;
            animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .card {
            background: white;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: var(--shadow);
        }

        .kpi-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }

        .kpi-card {
            background: white;
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            box-shadow: var(--shadow);
            border-top: 4px solid var(--primary);
        }

        .form-group {
            margin-bottom: 12px;
            text-align: left;
        }

        .form-group label {
            display: block;
            font-size: 0.8rem;
            font-weight: bold;
            color: #555;
            margin-bottom: 5px;
        }

        input,
        select {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            outline: none;
        }

        .btn {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            color: white;
            margin-top: 10px;
            font-size: 1rem;
        }

        .btn-primary {
            background: var(--primary);
        }

        .btn-excel {
            background: #1D6F42;
        }

        .transaction-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid #eee;
        }

        .btn-edit,
        .btn-delete {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 5px;
        }

        .btn-premium-action {
            background: #fff8dc;
            border: 1px solid #f1c40f;
            border-radius: 999px;
            font-size: 0.95rem;
            cursor: pointer;
            padding: 5px 9px;
            margin-left: 2px;
            color: #111827;
            font-weight: 900;
            display: inline-flex;
            align-items: center;
            gap: 3px;
        }

        .checkbox-group {
            display: none;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
            background: #fffde7;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #fff59d;
        }



        /* =========================
           HISTORIAL POR MESES
        ========================= */

        .hist-intro {
            background: #ffffff;
            border-left: 5px solid var(--primary);
            color: #555;
            font-size: 0.86rem;
            line-height: 1.45;
        }



        .history-year-card {
            background: white;
            border-radius: 16px;
            padding: 14px;
            margin-bottom: 14px;
            box-shadow: var(--shadow);
            border: 1px solid #e2e6ea;
        }

        .month-picker-field {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            outline: none;
            background: white;
            color: #222;
            text-align: left;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .month-picker-field::after {
            content: "⌄";
            color: #333;
            font-size: 1.1rem;
        }

        .month-picker-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.45);
            z-index: 12000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 18px;
        }

        .month-picker-card {
            width: 100%;
            max-width: 520px;
            background: #fbfaff;
            border-radius: 24px;
            padding: 24px;
            box-shadow: 0 14px 35px rgba(0,0,0,0.25);
        }

        .month-picker-title {
            font-size: 1.35rem;
            margin-bottom: 18px;
            color: #111;
        }

        .month-picker-controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            margin: 26px auto 34px;
            max-width: 300px;
        }

        .picker-wheel-column {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        .picker-wheel-item {
            border: none;
            background: transparent;
            width: 100%;
            min-height: 36px;
            font-size: 1.15rem;
            color: #9b9b9b;
            cursor: pointer;
            text-align: center;
        }

        .picker-wheel-item.active {
            color: #111;
            font-weight: 500;
            font-size: 1.2rem;
            border-top: 3px solid #555;
            border-bottom: 3px solid #555;
            padding: 10px 0;
        }

        .month-picker-actions {
            display: flex;
            justify-content: flex-end;
            gap: 24px;
            margin-top: 8px;
        }

        .month-picker-action {
            border: none;
            background: transparent;
            color: var(--primary);
            font-weight: bold;
            font-size: 0.95rem;
            padding: 10px 0;
            cursor: pointer;
        }


        .history-year-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            align-items: end;
        }

        .months-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 12px;
        }

        .month-button {
            border: 1px solid #dce3e8;
            background: #f8fafc;
            color: #333;
            border-radius: 12px;
            padding: 12px 6px;
            font-weight: bold;
            cursor: pointer;
            min-height: 62px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }

        .month-button.active {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border-color: var(--primary);
        }

        .month-button.empty-month {
            opacity: 0.65;
        }

        .month-button small {
            display: block;
            margin-top: 4px;
            font-size: 0.7rem;
            font-weight: normal;
        }

        .selected-month-container {
            margin-top: 12px;
        }

        .month-section {
            margin-bottom: 18px;
            overflow: hidden;
            border-radius: 16px;
            border: 1px solid #e2e6ea;
            background: white;
            box-shadow: var(--shadow);
        }

        .month-header {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 14px 14px 12px;
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: flex-start;
            font-weight: bold;
        }

        .month-title {
            font-size: 1rem;
            text-transform: capitalize;
        }

        .month-total {
            font-size: 0.78rem;
            opacity: 0.95;
            text-align: right;
            line-height: 1.35;
        }

        .month-tools {
            padding: 12px;
            background: #ffffff;
            border-bottom: 1px solid #edf0f2;
        }

        .month-filter-title {
            font-size: 0.82rem;
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 6px;
            text-transform: uppercase;
        }

        .copy-panel {
            margin-top: 10px;
            border: 1px solid #e1e7ec;
            border-radius: 12px;
            overflow: hidden;
            background: #f9fbfd;
        }

        .copy-panel summary {
            list-style: none;
            cursor: pointer;
            padding: 12px;
            background: #eef5fb;
            color: var(--primary);
            font-weight: bold;
            font-size: 0.9rem;
        }

        .copy-panel summary::-webkit-details-marker {
            display: none;
        }

        .copy-panel-body {
            padding: 12px;
            border-top: 1px solid #e1e7ec;
        }

        .month-tools-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            align-items: end;
        }

        .month-copy-btn {
            margin-top: 0;
            padding: 12px;
            font-size: 0.9rem;
        }

        .month-empty {
            text-align: center;
            padding: 16px;
            color: #888;
            font-size: 0.88rem;
        }

        .type-pill {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 20px;
            color: white;
            font-size: 0.7rem;
            font-weight: bold;
            margin-top: 4px;
        }

        .type-pill.income {
            background: var(--accent);
        }

        .type-pill.expense {
            background: var(--danger);
        }

        .type-pill.debt {
            background: var(--warning);
            color: #333;
        }

        @media (max-width: 420px) {
            .month-tools-row {
                grid-template-columns: 1fr;
            }
        }

        /* =========================
           RECIBO PROFESIONAL
        ========================= */

        .receipt-box {
            background: white;
            border: none;
            padding: 25px;
            font-family: 'Segoe UI', sans-serif;
            text-align: left;
            box-shadow: var(--shadow);
            border-radius: 12px;
            width: 100%;
            max-width: 550px;
            margin: 0 auto;
        }

        .receipt-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            gap: 15px;
        }

        .receipt-brand {
            font-size: 1.2rem;
            font-weight: bold;
            color: var(--primary);
            letter-spacing: 0.5px;
        }

        .receipt-subtitle {
            font-size: 0.82rem;
            color: #777;
            margin-top: 4px;
        }

        .receipt-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: bold;
            text-transform: uppercase;
            color: white;
            display: inline-block;
        }

        .badge-in {
            background-color: var(--accent);
        }

        .badge-out {
            background-color: var(--danger);
        }

        .badge-deu {
            background-color: var(--warning);
            color: #333;
        }

        .receipt-line {
            border: 0;
            border-top: 1px solid #eee;
            margin: 12px 0;
        }

        .receipt-dash-line {
            border: 0;
            border-top: 2px dashed #ddd;
            margin: 18px 0;
        }

        .receipt-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 14px;
            gap: 10px;
        }

        .receipt-label {
            color: #666;
            font-size: 0.9rem;
            font-weight: bold;
            min-width: 130px;
            text-transform: uppercase;
        }

        .receipt-value {
            color: #222;
            font-size: 0.95rem;
            text-align: right;
            word-break: break-word;
        }

        .receipt-value.bold {
            font-weight: 600;
            color: #000;
        }

        .receipt-total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 5px;
            gap: 15px;
        }

        .receipt-total-label {
            font-size: 1.1rem;
            font-weight: bold;
            color: #333;
        }

        .receipt-total-value {
            font-size: 1.4rem;
            font-weight: bold;
            color: var(--primary);
            text-align: right;
        }

        .receipt-panel {
            background: #f7f9fb;
            padding: 14px;
            border-radius: 10px;
            margin-bottom: 20px;
        }

        .receipt-note {
            font-size: 0.82rem;
            color: #777;
            line-height: 1.5;
            margin-bottom: 20px;
        }

        .receipt-signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-top: 30px;
        }

        .receipt-signature {
            border-top: 1px solid #999;
            padding-top: 8px;
            text-align: center;
            font-size: 0.8rem;
            color: #666;
        }

        .receipt-footer {
            margin-top: 25px;
            text-align: center;
            font-size: 0.75rem;
            color: #aaa;
        }




        /* =========================
           FIREBASE AUTH / ADMIN
        ========================= */

        .auth-card {
            border-left: 5px solid var(--primary);
        }

        .auth-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
        }

        .auth-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 6px;
        }

        .btn-secondary {
            background: #475569;
        }

        .btn-success {
            background: var(--accent);
        }

        .btn-warning {
            background: #B7950B;
        }

        .btn-light {
            background: #eef2f7;
            color: #334155;
        }

        .auth-status {
            margin-top: 12px;
            padding: 10px;
            border-radius: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #334155;
            font-size: 0.86rem;
            line-height: 1.4;
        }

        .activation-box {
            display: none;
            margin-top: 12px;
            padding: 12px;
            border-radius: 14px;
            background: #fffdf2;
            border: 1px solid #fde68a;
        }

        .activation-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .admin-panel {
            display: none;
            margin-top: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 12px;
        }

        .admin-user-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 12px;
            margin-top: 10px;
            font-size: 0.86rem;
        }

        .admin-user-card b {
            color: var(--primary);
        }

        .admin-user-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 10px;
        }

        .payment-confirm-btn {
            border: 1px solid #dbeafe;
            border-radius: 999px;
            padding: 9px 12px;
            color: var(--primary);
            background: #eff6ff;
            font-weight: 900;
            font-size: 0.74rem;
            line-height: 1;
            cursor: pointer;
            flex: 1;
            min-width: 110px;
        }

        @media (max-width: 520px) {
            .auth-actions,
            .activation-actions,
            .admin-user-actions {
                grid-template-columns: 1fr;
            }
        }

        /* =========================
           PREMIUM / PRUEBA GRATIS
        ========================= */

        .premium-banner {
            display: none;
        }

        .premium-bubble {
            display: none;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: fit-content;
            max-width: 100%;
            margin: 0 auto 14px;
            padding: 10px 16px;
            border-radius: 999px;
            background: linear-gradient(135deg, #111827, var(--primary));
            color: white;
            box-shadow: var(--shadow);
            font-size: 0.88rem;
            font-weight: 900;
            text-align: center;
        }

        .premium-bubble span {
            display: inline-flex;
            align-items: center;
        }

        .premium-chip {
            display: none;
        }

        .premium-lock {
            position: relative;
        }

        .premium-lock::after {
            content: "";
            display: none;
        }

        .payment-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.72);
            z-index: 20000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 16px;
            backdrop-filter: blur(4px);
        }

        .payment-card {
            width: 100%;
            max-width: 560px;
            max-height: 92vh;
            overflow-y: auto;
            background: #ffffff;
            border-radius: 26px;
            padding: 0;
            box-shadow: 0 22px 60px rgba(0,0,0,0.35);
            text-align: center;
        }

        .payment-hero {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 24px 20px 20px;
            border-radius: 26px 26px 0 0;
        }

        .payment-hero-icon {
            width: 54px;
            height: 54px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 10px;
            border-radius: 50%;
            background: rgba(255,255,255,0.16);
            font-size: 1.6rem;
        }

        .payment-card h2 {
            color: white;
            margin-bottom: 8px;
            font-size: 1.3rem;
        }

        .payment-card p {
            color: rgba(255,255,255,0.92);
            font-size: 0.88rem;
            line-height: 1.45;
            margin: 0 auto;
            max-width: 460px;
        }

        .payment-body {
            padding: 18px;
        }

        .premium-feature-list {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            text-align: center;
            background: #f7f9fb;
            border-radius: 18px;
            padding: 10px;
            margin: 0 0 14px;
            color: #333;
            font-size: 0.76rem;
            line-height: 1.35;
        }

        .premium-feature-list span {
            background: white;
            border: 1px solid #e7edf3;
            border-radius: 14px;
            padding: 8px 6px;
            font-weight: 700;
        }

        .premium-section-title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #111827;
            font-size: 0.86rem;
            font-weight: 900;
            text-align: left;
            margin: 14px 2px 8px;
        }

        .premium-section-title::after {
            content: "";
            flex: 1;
            height: 1px;
            background: #e5e7eb;
        }

        .premium-plans {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 0 0 12px;
        }

        .premium-plan-card {
            background: #ffffff;
            border: 1px solid #e1e7ec;
            border-radius: 20px;
            padding: 12px;
            text-align: left;
            box-shadow: 0 6px 18px rgba(0,0,0,0.06);
            position: relative;
        }

        .premium-plan-card.recommended {
            border: 2px solid var(--warning);
            background: linear-gradient(180deg, #fffdf2, #ffffff);
        }

        .premium-plan-badge {
            display: inline-block;
            background: var(--warning);
            color: #222;
            border-radius: 999px;
            padding: 4px 8px;
            font-size: 0.64rem;
            font-weight: 900;
            margin-bottom: 7px;
        }

        .premium-plan-title {
            font-weight: 900;
            color: var(--primary);
            margin-bottom: 4px;
            font-size: 0.95rem;
        }

        .premium-plan-price {
            font-weight: 800;
            color: #111827;
            font-size: 0.82rem;
            margin-bottom: 5px;
        }

        .premium-plan-note {
            color: #667085;
            font-size: 0.72rem;
            line-height: 1.3;
            margin-bottom: 10px;
            min-height: 34px;
        }

        .premium-buttons-row {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
        }

        .payment-pill-btn {
            border: none;
            border-radius: 999px;
            padding: 9px 12px;
            color: white;
            font-weight: 900;
            font-size: 0.75rem;
            line-height: 1;
            cursor: pointer;
            flex: 1;
            min-width: 110px;
            box-shadow: 0 6px 14px rgba(0,0,0,0.13);
        }

        .payment-pill-btn:hover {
            transform: translateY(-2px);
            opacity: 0.94;
        }

        .payment-paypal {
            background: linear-gradient(135deg, #003087, #0070ba);
        }

        .payment-epayco {
            background: linear-gradient(135deg, #111827, #70AD47);
        }

        .payment-back-btn {
            width: auto;
            min-width: 210px;
            display: inline-block;
            border: none;
            border-radius: 999px;
            background: #eef2f7;
            color: #334155;
            font-weight: 900;
            padding: 11px 16px;
            margin-top: 4px;
            cursor: pointer;
        }

        .payment-safe-note {
            color: #667085;
            font-size: 0.72rem;
            line-height: 1.35;
            margin-top: 10px;
        }

        @media (max-width: 520px) {
            .payment-card {
                border-radius: 22px;
            }

            .payment-hero {
                border-radius: 22px 22px 0 0;
                padding: 20px 15px 16px;
            }

            .payment-body {
                padding: 14px;
            }

            .premium-feature-list {
                grid-template-columns: 1fr;
            }

            .premium-plans {
                grid-template-columns: 1fr;
            }

            .payment-pill-btn {
                min-width: 0;
            }
        }

        /* =========================
           IMPRESIÓN PROFESIONAL PDF
        ========================= */

        @media print {
            body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
            }

            .header,
            .bottom-nav,
            #lock-screen,
            #txt-btn-print,
            .screen:not(#scr-rec) {
                display: none !important;
            }

            #scr-rec {
                display: block !important;
                max-width: none !important;
                padding: 0 !important;
                margin: 0 !important;
            }

            .receipt-box {
                width: 100% !important;
                max-width: 780px !important;
                margin: 0 auto !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                border: 1px solid #ddd !important;
                padding: 35px !important;
                page-break-inside: avoid;
            }

            .receipt-brand {
                font-size: 1.5rem !important;
            }

            .receipt-total-value {
                font-size: 1.6rem !important;
            }
        }


        .auth-reset-link {
            width: 100%;
            margin-top: 8px;
            padding: 10px 12px;
            border: none;
            background: transparent;
            color: var(--primary);
            font-size: 0.9rem;
            font-weight: 700;
            text-decoration: underline;
            cursor: pointer;
        }

        .auth-reset-link:hover {
            color: var(--secondary);
        }

        /* =========================
           PERFIL EN ACORDEÓN
        ========================= */

        .collapsible-card {
            padding: 0;
            overflow: hidden;
        }

        .accordion-header {
            width: 100%;
            min-height: 56px;
            padding: 16px;
            border: none;
            background: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            cursor: pointer;
            text-align: left;
        }

        .accordion-title {
            color: var(--primary);
            font-size: 1.05rem;
            font-weight: 800;
        }

        .accordion-icon {
            width: 28px;
            height: 28px;
            border-radius: 999px;
            background: #eef4fb;
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.15rem;
            font-weight: 800;
            transition: transform 0.2s ease, background 0.2s ease;
            flex-shrink: 0;
        }

        .accordion-content {
            padding: 0 16px 16px;
            animation: fadeIn 0.2s ease;
        }

        .collapsible-card.collapsed .accordion-content {
            display: none;
        }

        .collapsible-card:not(.collapsed) .accordion-icon {
            transform: rotate(180deg);
            background: #dcecff;
        }
