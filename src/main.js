"use strict";

/* ==========================================================================
   GTPO mini app
   Вкладки: Главная · Сигнал · Журнал · TOP
   Версия (basic / vip) и адрес API задаются в config.js
   ========================================================================== */

const CONFIG = Object.assign({ tier: "basic", apiBase: "" }, window.APP_CONFIG || {});
const IS_VIP = CONFIG.tier === "vip";
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const INIT_DATA = tg && tg.initData ? tg.initData : "";
const TG_USER = tg && tg.initDataUnsafe ? tg.initDataUnsafe.user : null;

// API: явный адрес из config.js; при локальном тесте (страница отдаётся
// самим ботом по /app/...) — тот же адрес, что у страницы.
const API_BASE = (CONFIG.apiBase || (location.pathname.startsWith("/app/") ? location.origin : "")).replace(/\/$/, "");

const LANGS = ["ru", "en", "es", "hi"];

/* ---------------------------------------------------------------- тексты */

const I18N = {
    ru: {
        tabs: { home: "Главная", signal: "Сигнал", journal: "Журнал", top: "TOP" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `Привет, ${n}` : "Привет"),
        home: {
            myStats: "Моя статистика",
            selfReported: "по вашим отметкам",
            statsEmpty: "Отмечайте результат после каждой сделки — здесь появится статистика.",
            toSignal: "Получить сигнал",
        },
        stats: { total: "Сделок", wins: "Плюс", losses: "Минус", rate: "Плюс, %" },
        market: {
            title: "Крипто сейчас",
            more: "Все",
            less: "Свернуть",
            source: "Цены CoinGecko, обновляются каждые 30 секунд",
            error: "Не удалось загрузить цены. Проверьте интернет.",
        },
        faq: {
            title: "Вопросы",
            items: [
                ["Как появляются сигналы?",
                    "Направление «вверх» или «вниз» выбирается случайно. Это демо-сигнал для тренировки, а не прогноз рынка и не инвестиционная рекомендация."],
                ["Что даёт VIP?",
                    "Больше инструментов и все режимы. На направление сигнала VIP не влияет: он одинаково случайный."],
                ["Зачем отмечать результат?",
                    "Так вы видите свою реальную статистику, а лучшие результаты попадают в TOP. Отметки делаете вы сами, бот к вашему счёту доступа не имеет."],
                ["Это безопасно для депозита?",
                    "Бинарные опционы — высокий риск: большинство трейдеров теряют деньги. Торгуйте только суммой, которую готовы потерять."],
            ],
        },
        signal: {
            title: "Сигнал",
            lead: "Выберите инструмент, время экспирации и режим.",
            pair: "Инструмент",
            expiry: "Экспирация",
            mode: "Режим",
            choose: "Выбрать",
            get: "Получить сигнал",
            demoNote: "Демо-сигнал: направление случайное, это не прогноз.",
            demoTag: "Случайный демо-сигнал",
            generating: "Генерируем сигнал…",
            up: "Вверх",
            down: "Вниз",
            issued: "Выдан",
            left: "Осталось",
            expired: "истёк",
            askResult: "Чем закончилась сделка?",
            win: "В плюс",
            loss: "В минус",
            saved: "Записано в журнал",
            savedLocal: "Записано в журнал на этом устройстве",
            again: "Новый сигнал",
        },
        picker: {
            pair: "Инструмент",
            time: "Экспирация",
            mode: "Режим",
            search: "Поиск",
            nothing: "Ничего не найдено",
            cats: { fiat: "Валюты", crypto: "Крипто", commod: "Сырьё", stocks: "Акции", indices: "Индексы" },
            otc: "OTC · круглосуточно",
            reg: "Биржевой · закрыт в выходные",
            vipOnly: "Доступно в VIP",
            modeNote: "Режим — это название пресета. Направление сигнала во всех режимах случайное.",
        },
        expiry: {
            S5: "Сверхкороткая", S15: "Очень короткая", S30: "Короткая", M1: "Минута",
            M3: "Три минуты", M5: "Пять минут", M30: "Полчаса", H1: "Час", H4: "Четыре часа",
        },
        journal: {
            title: "Журнал",
            lead: "Ваши сделки по сигналам и их результат.",
            empty: "Журнал пуст. Получите сигнал и отметьте, чем закончилась сделка.",
            clear: "Очистить журнал на устройстве",
            confirmClear: "Удалить все записи журнала с этого устройства?",
        },
        top: {
            title: "TOP трейдеров",
            lead: (n) => `По отметкам самих пользователей. В рейтинг попадают от ${n} сделок.`,
            week: "Неделя", month: "Месяц", all: "Всё время",
            you: "Вы",
            empty: "Пока никто не набрал нужное число сделок. Будьте первым.",
            noApi: "Рейтинг появится, когда к мини-приложению подключат сервер.",
            noTg: "Откройте мини-приложение из Telegram, чтобы участвовать в рейтинге.",
            error: "Не удалось загрузить рейтинг. Попробуйте позже.",
            row: (w, l) => `${w} в плюс · ${l} в минус`,
        },
        common: {
            risk: "Сигналы случайные и не являются инвестиционной рекомендацией. Торговля бинарными опционами связана с высоким риском потери средств.",
            vipToast: "Доступно в VIP-версии",
        },
    },

    en: {
        tabs: { home: "Home", signal: "Signal", journal: "Journal", top: "TOP" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `Hi, ${n}` : "Hi there"),
        home: {
            myStats: "My stats",
            selfReported: "based on your marks",
            statsEmpty: "Mark the result after each trade and your stats will show up here.",
            toSignal: "Get a signal",
        },
        stats: { total: "Trades", wins: "Won", losses: "Lost", rate: "Won, %" },
        market: {
            title: "Crypto now",
            more: "All",
            less: "Less",
            source: "Prices by CoinGecko, refreshed every 30 seconds",
            error: "Couldn't load prices. Check your connection.",
        },
        faq: {
            title: "Questions",
            items: [
                ["Where do signals come from?",
                    "The up/down direction is picked at random. It's a demo signal for practice, not a market forecast or investment advice."],
                ["What does VIP add?",
                    "More instruments and all modes. VIP doesn't change the direction: it's just as random."],
                ["Why mark the result?",
                    "You see your real stats, and the best results make it to TOP. You mark trades yourself — the bot has no access to your account."],
                ["Is my deposit safe?",
                    "Binary options are high risk: most traders lose money. Only trade an amount you're ready to lose."],
            ],
        },
        signal: {
            title: "Signal",
            lead: "Pick an instrument, expiry time and mode.",
            pair: "Instrument",
            expiry: "Expiry",
            mode: "Mode",
            choose: "Choose",
            get: "Get signal",
            demoNote: "Demo signal: the direction is random, not a forecast.",
            demoTag: "Random demo signal",
            generating: "Generating signal…",
            up: "Up",
            down: "Down",
            issued: "Issued",
            left: "Left",
            expired: "expired",
            askResult: "How did the trade end?",
            win: "Won",
            loss: "Lost",
            saved: "Saved to journal",
            savedLocal: "Saved to journal on this device",
            again: "New signal",
        },
        picker: {
            pair: "Instrument",
            time: "Expiry",
            mode: "Mode",
            search: "Search",
            nothing: "Nothing found",
            cats: { fiat: "Forex", crypto: "Crypto", commod: "Commodities", stocks: "Stocks", indices: "Indices" },
            otc: "OTC · 24/7",
            reg: "Exchange · closed on weekends",
            vipOnly: "Available in VIP",
            modeNote: "A mode is just a preset name. The direction is random in every mode.",
        },
        expiry: {
            S5: "Ultra-short", S15: "Very short", S30: "Short", M1: "One minute",
            M3: "Three minutes", M5: "Five minutes", M30: "Half an hour", H1: "One hour", H4: "Four hours",
        },
        journal: {
            title: "Journal",
            lead: "Your trades on signals and how they ended.",
            empty: "Your journal is empty. Get a signal and mark how the trade ended.",
            clear: "Clear journal on this device",
            confirmClear: "Delete all journal entries from this device?",
        },
        top: {
            title: "Top traders",
            lead: (n) => `Based on users' own marks. You need at least ${n} trades to be ranked.`,
            week: "Week", month: "Month", all: "All time",
            you: "You",
            empty: "Nobody has enough trades yet. Be the first.",
            noApi: "The ranking will appear once a server is connected to the mini app.",
            noTg: "Open the mini app from Telegram to join the ranking.",
            error: "Couldn't load the ranking. Try again later.",
            row: (w, l) => `${w} won · ${l} lost`,
        },
        common: {
            risk: "Signals are random and are not investment advice. Binary options trading carries a high risk of losing money.",
            vipToast: "Available in the VIP version",
        },
    },

    es: {
        tabs: { home: "Inicio", signal: "Señal", journal: "Diario", top: "TOP" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `Hola, ${n}` : "Hola"),
        home: {
            myStats: "Mis estadísticas",
            selfReported: "según tus marcas",
            statsEmpty: "Marca el resultado tras cada operación y aquí verás tus estadísticas.",
            toSignal: "Obtener señal",
        },
        stats: { total: "Operaciones", wins: "Ganadas", losses: "Perdidas", rate: "Ganadas, %" },
        market: {
            title: "Cripto ahora",
            more: "Todo",
            less: "Menos",
            source: "Precios de CoinGecko, se actualizan cada 30 segundos",
            error: "No se pudieron cargar los precios. Revisa tu conexión.",
        },
        faq: {
            title: "Preguntas",
            items: [
                ["¿De dónde salen las señales?",
                    "La dirección arriba/abajo se elige al azar. Es una señal demo para practicar, no un pronóstico ni una recomendación de inversión."],
                ["¿Qué añade VIP?",
                    "Más instrumentos y todos los modos. VIP no cambia la dirección: es igual de aleatoria."],
                ["¿Por qué marcar el resultado?",
                    "Ves tus estadísticas reales y los mejores resultados entran en el TOP. Marcas tú mismo: el bot no tiene acceso a tu cuenta."],
                ["¿Es seguro para mi depósito?",
                    "Las opciones binarias son de alto riesgo: la mayoría pierde dinero. Opera solo con lo que estés dispuesto a perder."],
            ],
        },
        signal: {
            title: "Señal",
            lead: "Elige instrumento, tiempo de expiración y modo.",
            pair: "Instrumento",
            expiry: "Expiración",
            mode: "Modo",
            choose: "Elegir",
            get: "Obtener señal",
            demoNote: "Señal demo: la dirección es aleatoria, no un pronóstico.",
            demoTag: "Señal demo aleatoria",
            generating: "Generando señal…",
            up: "Arriba",
            down: "Abajo",
            issued: "Emitida",
            left: "Quedan",
            expired: "expiró",
            askResult: "¿Cómo terminó la operación?",
            win: "Ganada",
            loss: "Perdida",
            saved: "Guardado en el diario",
            savedLocal: "Guardado en el diario de este dispositivo",
            again: "Nueva señal",
        },
        picker: {
            pair: "Instrumento",
            time: "Expiración",
            mode: "Modo",
            search: "Buscar",
            nothing: "No se encontró nada",
            cats: { fiat: "Divisas", crypto: "Cripto", commod: "Materias primas", stocks: "Acciones", indices: "Índices" },
            otc: "OTC · 24/7",
            reg: "Bolsa · cerrado los fines de semana",
            vipOnly: "Disponible en VIP",
            modeNote: "El modo es solo el nombre de un preset. La dirección es aleatoria en todos.",
        },
        expiry: {
            S5: "Ultracorta", S15: "Muy corta", S30: "Corta", M1: "Un minuto",
            M3: "Tres minutos", M5: "Cinco minutos", M30: "Media hora", H1: "Una hora", H4: "Cuatro horas",
        },
        journal: {
            title: "Diario",
            lead: "Tus operaciones con señales y su resultado.",
            empty: "El diario está vacío. Obtén una señal y marca cómo terminó la operación.",
            clear: "Borrar el diario de este dispositivo",
            confirmClear: "¿Borrar todas las entradas del diario de este dispositivo?",
        },
        top: {
            title: "TOP de traders",
            lead: (n) => `Según las marcas de los propios usuarios. Para entrar se necesitan ${n} operaciones.`,
            week: "Semana", month: "Mes", all: "Siempre",
            you: "Tú",
            empty: "Nadie tiene aún suficientes operaciones. Sé el primero.",
            noApi: "El ranking aparecerá cuando se conecte un servidor a la mini app.",
            noTg: "Abre la mini app desde Telegram para participar en el ranking.",
            error: "No se pudo cargar el ranking. Inténtalo más tarde.",
            row: (w, l) => `${w} ganadas · ${l} perdidas`,
        },
        common: {
            risk: "Las señales son aleatorias y no son una recomendación de inversión. Operar con opciones binarias implica un alto riesgo de perder dinero.",
            vipToast: "Disponible en la versión VIP",
        },
    },

    hi: {
        tabs: { home: "होम", signal: "सिग्नल", journal: "जर्नल", top: "TOP" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `नमस्ते, ${n}` : "नमस्ते"),
        home: {
            myStats: "मेरे आंकड़े",
            selfReported: "आपके निशानों के आधार पर",
            statsEmpty: "हर ट्रेड के बाद नतीजा दर्ज करें — यहां आपके आंकड़े दिखेंगे।",
            toSignal: "सिग्नल पाएं",
        },
        stats: { total: "ट्रेड", wins: "मुनाफ़ा", losses: "नुकसान", rate: "मुनाफ़ा, %" },
        market: {
            title: "क्रिप्टो अभी",
            more: "सभी",
            less: "कम",
            source: "CoinGecko की कीमतें, हर 30 सेकंड में अपडेट",
            error: "कीमतें लोड नहीं हुईं। इंटरनेट जांचें।",
        },
        faq: {
            title: "सवाल",
            items: [
                ["सिग्नल कैसे बनते हैं?",
                    "ऊपर/नीचे की दिशा रैंडम चुनी जाती है। यह अभ्यास के लिए डेमो सिग्नल है, बाज़ार का पूर्वानुमान या निवेश सलाह नहीं।"],
                ["VIP से क्या मिलता है?",
                    "ज़्यादा इंस्ट्रूमेंट और सभी मोड। VIP दिशा नहीं बदलता: वह भी उतनी ही रैंडम है।"],
                ["नतीजा क्यों दर्ज करें?",
                    "आप अपने असली आंकड़े देखते हैं और सबसे अच्छे नतीजे TOP में आते हैं। निशान आप खुद लगाते हैं — बॉट को आपके अकाउंट का एक्सेस नहीं है।"],
                ["क्या मेरा डिपॉज़िट सुरक्षित है?",
                    "बाइनरी ऑप्शंस में जोखिम बहुत ज़्यादा है: ज़्यादातर ट्रेडर पैसा खोते हैं। सिर्फ़ उतनी रकम से ट्रेड करें जिसे खोने के लिए आप तैयार हैं।"],
            ],
        },
        signal: {
            title: "सिग्नल",
            lead: "इंस्ट्रूमेंट, एक्सपायरी और मोड चुनें।",
            pair: "इंस्ट्रूमेंट",
            expiry: "एक्सपायरी",
            mode: "मोड",
            choose: "चुनें",
            get: "सिग्नल पाएं",
            demoNote: "डेमो सिग्नल: दिशा रैंडम है, यह पूर्वानुमान नहीं है।",
            demoTag: "रैंडम डेमो सिग्नल",
            generating: "सिग्नल बन रहा है…",
            up: "ऊपर",
            down: "नीचे",
            issued: "जारी",
            left: "बाकी",
            expired: "समाप्त",
            askResult: "ट्रेड का नतीजा क्या रहा?",
            win: "मुनाफ़ा",
            loss: "नुकसान",
            saved: "जर्नल में सेव हुआ",
            savedLocal: "इस डिवाइस के जर्नल में सेव हुआ",
            again: "नया सिग्नल",
        },
        picker: {
            pair: "इंस्ट्रूमेंट",
            time: "एक्सपायरी",
            mode: "मोड",
            search: "खोजें",
            nothing: "कुछ नहीं मिला",
            cats: { fiat: "फ़ॉरेक्स", crypto: "क्रिप्टो", commod: "कमोडिटी", stocks: "शेयर", indices: "इंडेक्स" },
            otc: "OTC · 24/7",
            reg: "एक्सचेंज · वीकेंड पर बंद",
            vipOnly: "VIP में उपलब्ध",
            modeNote: "मोड सिर्फ़ प्रीसेट का नाम है। हर मोड में दिशा रैंडम है।",
        },
        expiry: {
            S5: "बहुत छोटी", S15: "बहुत कम", S30: "छोटी", M1: "एक मिनट",
            M3: "तीन मिनट", M5: "पांच मिनट", M30: "आधा घंटा", H1: "एक घंटा", H4: "चार घंटे",
        },
        journal: {
            title: "जर्नल",
            lead: "सिग्नल पर आपके ट्रेड और उनके नतीजे।",
            empty: "जर्नल खाली है। सिग्नल लें और ट्रेड का नतीजा दर्ज करें।",
            clear: "इस डिवाइस का जर्नल साफ़ करें",
            confirmClear: "इस डिवाइस से जर्नल की सभी एंट्री हटाएं?",
        },
        top: {
            title: "TOP ट्रेडर",
            lead: (n) => `यूज़र्स के अपने निशानों के आधार पर। रैंकिंग के लिए कम से कम ${n} ट्रेड चाहिए।`,
            week: "हफ़्ता", month: "महीना", all: "हमेशा",
            you: "आप",
            empty: "अभी किसी के पास पर्याप्त ट्रेड नहीं हैं। पहले बनें।",
            noApi: "सर्वर जुड़ने के बाद रैंकिंग दिखेगी।",
            noTg: "रैंकिंग में शामिल होने के लिए Telegram से मिनी-ऐप खोलें।",
            error: "रैंकिंग लोड नहीं हुई। बाद में कोशिश करें।",
            row: (w, l) => `${w} मुनाफ़ा · ${l} नुकसान`,
        },
        common: {
            risk: "सिग्नल रैंडम हैं और निवेश सलाह नहीं हैं। बाइनरी ऑप्शंस ट्रेडिंग में पैसा खोने का जोखिम बहुत अधिक है।",
            vipToast: "VIP वर्ज़न में उपलब्ध",
        },
    },
};

let lang = "en";

function T(path) {
    const pick = (dict) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), dict);
    const v = pick(I18N[lang]);
    return v === undefined ? pick(I18N.en) : v;
}

/* ---------------------------------------------------------------- данные */

// Инструменты Pocket Option (перенесено из исходной версии без изменений)
const CP_DATA = {
    fiat: [
        { id: "AUD_CAD_OTC", name: "AUD/CAD OTC", market: "OTC" },
        { id: "EUR_CHF_OTC", name: "EUR/CHF OTC", market: "OTC" },
        { id: "EUR_USD_OTC", name: "EUR/USD OTC", market: "OTC" },
        { id: "GBP_AUD_OTC", name: "GBP/AUD OTC", market: "OTC" },
        { id: "LBP_USD_OTC", name: "LBP/USD OTC", market: "OTC" },
        { id: "NZD_JPY_OTC", name: "NZD/JPY OTC", market: "OTC" },
        { id: "OMR_CNY_OTC", name: "OMR/CNY OTC", market: "OTC" },
        { id: "USD_BDT_OTC", name: "USD/BDT OTC", market: "OTC" },
        { id: "USD_CNH_OTC", name: "USD/CNH OTC", market: "OTC" },
        { id: "USD_COP_OTC", name: "USD/COP OTC", market: "OTC" },
        { id: "USD_IDR_OTC", name: "USD/IDR OTC", market: "OTC" },
        { id: "USD_INR_OTC", name: "USD/INR OTC", market: "OTC" },
        { id: "USD_PHP_OTC", name: "USD/PHP OTC", market: "OTC" },
        { id: "USD_VND_OTC", name: "USD/VND OTC", market: "OTC" },
        { id: "ZAR_USD_OTC", name: "ZAR/USD OTC", market: "OTC" },
        { id: "EUR_HUF_OTC", name: "EUR/HUF OTC", market: "OTC" },
        { id: "EUR_USD", name: "EUR/USD", market: "" },
        { id: "NGN_USD_OTC", name: "NGN/USD OTC", market: "OTC" },
        { id: "USD_CLP_OTC", name: "USD/CLP OTC", market: "OTC" },
        { id: "AUD_USD_OTC", name: "AUD/USD OTC", market: "OTC" },
        { id: "EUR_NZD_OTC", name: "EUR/NZD OTC", market: "OTC" },
        { id: "YER_USD_OTC", name: "YER/USD OTC", market: "OTC" },
        { id: "AED_CNY_OTC", name: "AED/CNY OTC", market: "OTC" },
        { id: "AUD_USD", name: "AUD/USD", market: "" },
        { id: "GBP_CAD", name: "GBP/CAD", market: "" },
        { id: "USD_EGP_OTC", name: "USD/EGP OTC", market: "OTC" },
        { id: "AUD_CAD", name: "AUD/CAD", market: "" },
        { id: "CAD_CHF", name: "CAD/CHF", market: "" },
        { id: "EUR_CAD", name: "EUR/CAD", market: "" },
        { id: "EUR_CHF", name: "EUR/CHF", market: "" },
        { id: "EUR_GBP_OTC", name: "EUR/GBP OTC", market: "OTC" },
        { id: "GBP_USD", name: "GBP/USD", market: "" },
        { id: "USD_JPY", name: "USD/JPY", market: "" },
        { id: "EUR_JPY_OTC", name: "EUR/JPY OTC", market: "OTC" },
        { id: "AUD_CHF", name: "AUD/CHF", market: "" },
        { id: "AUD_JPY_OTC", name: "AUD/JPY OTC", market: "OTC" },
        { id: "GBP_JPY", name: "GBP/JPY", market: "" },
        { id: "GBP_USD_OTC", name: "GBP/USD OTC", market: "OTC" },
        { id: "USD_SGD_OTC", name: "USD/SGD OTC", market: "OTC" },
        { id: "EUR_TRY_OTC", name: "EUR/TRY OTC", market: "OTC" },
        { id: "USD_MXN_OTC", name: "USD/MXN OTC", market: "OTC" },
        { id: "CHF_JPY", name: "CHF/JPY", market: "" },
        { id: "UAH_USD_OTC", name: "UAH/USD OTC", market: "OTC" },
        { id: "GBP_AUD", name: "GBP/AUD", market: "" },
        { id: "JOD_CNY_OTC", name: "JOD/CNY OTC", market: "OTC" },
        { id: "EUR_AUD", name: "EUR/AUD", market: "" },
        { id: "CAD_CHF_OTC", name: "CAD/CHF OTC", market: "OTC" },
        { id: "CAD_JPY", name: "CAD/JPY", market: "" },
        { id: "EUR_RUB_OTC", name: "EUR/RUB OTC", market: "OTC" },
        { id: "QAR_CNY_OTC", name: "QAR/CNY OTC", market: "OTC" },
        { id: "USD_DZD_OTC", name: "USD/DZD OTC", market: "OTC" },
        { id: "USD_CHF_OTC", name: "USD/CHF OTC", market: "OTC" },
        { id: "CHF_NOK_OTC", name: "CHF/NOK OTC", market: "OTC" },
        { id: "GBP_JPY_OTC", name: "GBP/JPY OTC", market: "OTC" },
        { id: "AUD_NZD_OTC", name: "AUD/NZD OTC", market: "OTC" },
        { id: "USD_BRL_OTC", name: "USD/BRL OTC", market: "OTC" },
        { id: "USD_ARS_OTC", name: "USD/ARS OTC", market: "OTC" },
        { id: "AUD_CHF_OTC", name: "AUD/CHF OTC", market: "OTC" },
        { id: "SAR_CNY_OTC", name: "SAR/CNY OTC", market: "OTC" },
        { id: "CHF_JPY_OTC", name: "CHF/JPY OTC", market: "OTC" },
        { id: "USD_CHF", name: "USD/CHF", market: "" },
        { id: "EUR_JPY", name: "EUR/JPY", market: "" },
        { id: "MAD_USD_OTC", name: "MAD/USD OTC", market: "OTC" },
        { id: "NZD_USD_OTC", name: "NZD/USD OTC", market: "OTC" },
        { id: "AUD_JPY", name: "AUD/JPY", market: "" },
        { id: "USD_JPY_OTC", name: "USD/JPY OTC", market: "OTC" },
        { id: "USD_MYR_OTC", name: "USD/MYR OTC", market: "OTC" },
        { id: "EUR_GBP", name: "EUR/GBP", market: "" },
        { id: "KES_USD_OTC", name: "KES/USD OTC", market: "OTC" },
        { id: "USD_RUB_OTC", name: "USD/RUB OTC", market: "OTC" },
        { id: "BHD_CNY_OTC", name: "BHD/CNY OTC", market: "OTC" },
        { id: "USD_CAD", name: "USD/CAD", market: "" },
        { id: "USD_PKR_OTC", name: "USD/PKR OTC", market: "OTC" },
        { id: "USD_THB_OTC", name: "USD/THB OTC", market: "OTC" },
        { id: "GBP_CHF", name: "GBP/CHF", market: "" },
        { id: "TND_USD_OTC", name: "TND/USD OTC", market: "OTC" },
        { id: "CAD_JPY_OTC", name: "CAD/JPY OTC", market: "OTC" },
        { id: "USD_CAD_OTC", name: "USD/CAD OTC", market: "OTC" },
    ],
    crypto: [
        { id: "Avalanche_OTC", name: "Avalanche OTC", market: "OTC" },
        { id: "Bitcoin_ETF_OTC", name: "Bitcoin ETF OTC", market: "OTC" },
        { id: "BNB_OTC", name: "BNB OTC", market: "OTC" },
        { id: "Bitcoin_OTC", name: "Bitcoin OTC", market: "OTC" },
        { id: "Dogecoin_OTC", name: "Dogecoin OTC", market: "OTC" },
        { id: "Solana_OTC", name: "Solana OTC", market: "OTC" },
        { id: "TRON_OTC", name: "TRON OTC", market: "OTC" },
        { id: "Polkadot_OTC", name: "Polkadot OTC", market: "OTC" },
        { id: "Cardano_OTC", name: "Cardano OTC", market: "OTC" },
        { id: "Polygon_OTC", name: "Polygon OTC", market: "OTC" },
        { id: "Ethereum_OTC", name: "Ethereum OTC", market: "OTC" },
        { id: "Litecoin_OTC", name: "Litecoin OTC", market: "OTC" },
        { id: "Toncoin_OTC", name: "Toncoin OTC", market: "OTC" },
        { id: "Chainlink_OTC", name: "Chainlink OTC", market: "OTC" },
        { id: "Bitcoin", name: "Bitcoin", market: "" },
        { id: "Ethereum", name: "Ethereum", market: "" },
        { id: "Dash", name: "Dash", market: "" },
        { id: "BCH_EUR", name: "BCH/EUR", market: "" },
        { id: "BCH_GBP", name: "BCH/GBP", market: "" },
        { id: "BCH_JPY", name: "BCH/JPY", market: "" },
        { id: "BTC_GBP", name: "BTC/GBP", market: "" },
        { id: "BTC_JPY", name: "BTC/JPY", market: "" },
        { id: "Chainlink", name: "Chainlink", market: "" },
    ],
    commod: [
        { id: "Brent_Oil_OTC", name: "Brent Oil OTC", market: "OTC" },
        { id: "WTI_Crude_Oil_OTC", name: "WTI Crude Oil OTC", market: "OTC" },
        { id: "Silver_OTC", name: "Silver OTC", market: "OTC" },
        { id: "Gold_OTC", name: "Gold OTC", market: "OTC" },
        { id: "Natural_Gas_OTC", name: "Natural Gas OTC", market: "OTC" },
        { id: "Palladium_spot_OTC", name: "Palladium spot OTC", market: "OTC" },
        { id: "Platinum_spot_OTC", name: "Platinum spot OTC", market: "OTC" },
        { id: "Brent_Oil", name: "Brent Oil", market: "" },
        { id: "WTI_Crude_Oil", name: "WTI Crude Oil", market: "" },
        { id: "XAG_EUR", name: "XAG/EUR", market: "" },
        { id: "Silver", name: "Silver", market: "" },
        { id: "XAU_EUR", name: "XAU/EUR", market: "" },
        { id: "Gold", name: "Gold", market: "" },
        { id: "Natural_Gas", name: "Natural Gas", market: "" },
        { id: "Palladium_spot", name: "Palladium spot", market: "" },
        { id: "Platinum_spot", name: "Platinum spot", market: "" },
    ],
    stocks: [
        { id: "American_Express_OTC", name: "American Express OTC", market: "OTC" },
        { id: "Microsoft_OTC", name: "Microsoft OTC", market: "OTC" },
        { id: "Amazon_OTC", name: "Amazon OTC", market: "OTC" },
        { id: "FedEx_OTC", name: "FedEx OTC", market: "OTC" },
        { id: "Intel_OTC", name: "Intel OTC", market: "OTC" },
        { id: "FACEBOOK_INC_OTC", name: "FACEBOOK INC OTC", market: "OTC" },
        { id: "GameStop_Corp_OTC", name: "GameStop Corp OTC", market: "OTC" },
        { id: "Marathon_Digital_Holdings_OTC", name: "Marathon Digital Holdings OTC", market: "OTC" },
        { id: "Johnson_Johnson_OTC", name: "Johnson & Johnson OTC", market: "OTC" },
        { id: "McDonalds_OTC", name: "McDonald's OTC", market: "OTC" },
        { id: "Apple_OTC", name: "Apple OTC", market: "OTC" },
        { id: "Citigroup_Inc_OTC", name: "Citigroup Inc OTC", market: "OTC" },
        { id: "Tesla_OTC", name: "Tesla OTC", market: "OTC" },
        { id: "AMD_OTC", name: "Advanced Micro Devices OTC", market: "OTC" },
        { id: "ExxonMobil_OTC", name: "ExxonMobil OTC", market: "OTC" },
        { id: "Palantir_Technologies_OTC", name: "Palantir Technologies OTC", market: "OTC" },
        { id: "Alibaba_OTC", name: "Alibaba OTC", market: "OTC" },
        { id: "VISA_OTC", name: "VISA OTC", market: "OTC" },
        { id: "Boeing_Company_OTC", name: "Boeing Company OTC", market: "OTC" },
        { id: "Pfizer_Inc_OTC", name: "Pfizer Inc OTC", market: "OTC" },
        { id: "Netflix_OTC", name: "Netflix OTC", market: "OTC" },
        { id: "VIX_OTC", name: "VIX OTC", market: "OTC" },
        { id: "Cisco_OTC", name: "Cisco OTC", market: "OTC" },
        { id: "Coinbase_Global_OTC", name: "Coinbase Global OTC", market: "OTC" },
        { id: "Apple", name: "Apple", market: "" },
        { id: "American_Express", name: "American Express", market: "" },
        { id: "Boeing_Company", name: "Boeing Company", market: "" },
        { id: "FACEBOOK_INC", name: "FACEBOOK INC", market: "" },
        { id: "Johnson_Johnson", name: "Johnson & Johnson", market: "" },
        { id: "JPMorgan", name: "JPMorgan Chase & Co", market: "" },
        { id: "McDonalds", name: "McDonald's", market: "" },
        { id: "Microsoft", name: "Microsoft", market: "" },
        { id: "Pfizer_Inc", name: "Pfizer Inc", market: "" },
        { id: "Tesla", name: "Tesla", market: "" },
        { id: "Alibaba", name: "Alibaba", market: "" },
        { id: "Citigroup_Inc", name: "Citigroup Inc", market: "" },
        { id: "Netflix", name: "Netflix", market: "" },
        { id: "Cisco", name: "Cisco", market: "" },
        { id: "ExxonMobil", name: "ExxonMobil", market: "" },
        { id: "Intel", name: "Intel", market: "" },
    ],
    indices: [
        { id: "AUS_200_OTC", name: "AUS 200 OTC", market: "OTC" },
        { id: "100GBP_OTC", name: "100GBP OTC", market: "OTC" },
        { id: "CAC_40", name: "CAC 40", market: "" },
        { id: "D30EUR_OTC", name: "D30EUR OTC", market: "OTC" },
        { id: "E35EUR", name: "E35EUR", market: "" },
        { id: "E35EUR_OTC", name: "E35EUR OTC", market: "OTC" },
        { id: "E50EUR_OTC", name: "E50EUR OTC", market: "OTC" },
        { id: "F40EUR_OTC", name: "F40EUR OTC", market: "OTC" },
        { id: "US100", name: "US100", market: "" },
        { id: "SMI_20", name: "SMI 20", market: "" },
        { id: "SP500", name: "SP500", market: "" },
        { id: "SP500_OTC", name: "SP500 OTC", market: "OTC" },
        { id: "100GBP", name: "100GBP", market: "" },
        { id: "AEX_25", name: "AEX 25", market: "" },
        { id: "D30_EUR", name: "D30/EUR", market: "" },
        { id: "DJI30", name: "DJI30", market: "" },
        { id: "DJI30_OTC", name: "DJI30 OTC", market: "OTC" },
        { id: "E50_EUR", name: "E50/EUR", market: "" },
        { id: "F40_EUR", name: "F40/EUR", market: "" },
        { id: "HONG_KONG_33", name: "HONG KONG 33", market: "" },
        { id: "JPN225", name: "JPN225", market: "" },
        { id: "JPN225_OTC", name: "JPN225 OTC", market: "OTC" },
        { id: "US100_OTC", name: "US100 OTC", market: "OTC" },
        { id: "AUS_200", name: "AUS 200", market: "" },
    ],
};

// Инструменты, доступные в Basic (из исходной basic-версии)
const BASIC_PAIR_IDS = new Set([
    "EUR_USD_OTC",
    "GBP_USD_OTC",
    "USD_JPY_OTC",
    "EUR_GBP_OTC",
    "AUD_USD_OTC",
    "EUR_CHF_OTC",
    "EUR_JPY_OTC",
    "GBP_JPY_OTC",
    "USD_CHF_OTC",
    "AUD_JPY_OTC",
    "NZD_USD_OTC",
    "USD_CAD_OTC",
    "USD_RUB_OTC",
    "EUR_RUB_OTC",
    "USD_MXN_OTC",
    "USD_SGD_OTC",

    "Bitcoin_OTC",
    "Ethereum_OTC",
    "Litecoin_OTC",
    "Avalanche_OTC",
    "BNB_OTC",
    "Solana_OTC",
    "TRON_OTC",
    "Dogecoin_OTC",
    "Polkadot_OTC",
    "Cardano_OTC",
    "Polygon_OTC",
    "Toncoin_OTC",
    "Chainlink_OTC",

    "Gold_OTC",
    "Silver_OTC",
    "Brent_Oil_OTC",
    "WTI_Crude_Oil_OTC",
    "Natural_Gas_OTC",

    "Apple_OTC",
    "Tesla_OTC",
    "Microsoft_OTC",
    "Amazon_OTC",
    "Netflix_OTC",
    "AMD_OTC",
    "VISA_OTC",
    "Coinbase_Global_OTC",

    "US100_OTC",
    "SP500_OTC",
    "DJI30_OTC",
    "JPN225_OTC",
    "AUS_200_OTC",
    "E35EUR_OTC",
]);

const EXPIRY_PRESETS = [
    { id: "S5", seconds: 5 },
    { id: "S15", seconds: 15 },
    { id: "S30", seconds: 30 },
    { id: "M1", seconds: 60 },
    { id: "M3", seconds: 180 },
    { id: "M5", seconds: 300 },
    { id: "M30", seconds: 1800 },
    { id: "H1", seconds: 3600 },
    { id: "H4", seconds: 14400 },
];

const MODES = [
    { id: "orion", title: "Orion v3" },
    { id: "mega", title: "Mega" },
    { id: "atlas", title: "Atlas" },
    { id: "unity", title: "Unity" },
];
const BASIC_MODE_IDS = new Set(["orion"]);

const PAIR_CATS = ["fiat", "crypto", "commod", "stocks", "indices"];

const MARKET_ASSETS = [
    { id: "bitcoin", sym: "BTC", name: "Bitcoin", icon: "btc" },
    { id: "ethereum", sym: "ETH", name: "Ethereum", icon: "eth" },
    { id: "solana", sym: "SOL", name: "Solana", icon: "sol" },
    { id: "ripple", sym: "XRP", name: "XRP", icon: "xrp" },
    { id: "litecoin", sym: "LTC", name: "Litecoin", icon: "ltc" },
    { id: "cardano", sym: "ADA", name: "Cardano", icon: "ada" },
    { id: "polkadot", sym: "DOT", name: "Polkadot", icon: "dot" },
    { id: "chainlink", sym: "LINK", name: "Chainlink", icon: "link" },
    { id: "avalanche-2", sym: "AVAX", name: "Avalanche", icon: "avax" },
    { id: "crypto-com-chain", sym: "CRO", name: "Cronos", icon: "cro" },
];

function isPairAllowed(id) {
    return IS_VIP || BASIC_PAIR_IDS.has(id);
}
function isModeAllowed(id) {
    return IS_VIP || BASIC_MODE_IDS.has(id);
}

/* ---------------------------------------------------------------- генерация сигнала
   Логика как в исходной версии: направление — Math.random(),
   время выдачи — сейчас, действует до «сейчас + экспирация». */

function generateSignal(st) {
    const direction = Math.random() > 0.5 ? "up" : "down";
    const issuedAt = Date.now();
    return {
        id: issuedAt.toString(36) + Math.random().toString(36).slice(2, 6),
        direction,
        pair: st.pair.name,
        market: st.pair.market || "",
        expiry: st.expiry.id,
        mode: st.mode.title,
        issuedAt,
        validUntil: issuedAt + st.expiry.seconds * 1000,
    };
}

/* ---------------------------------------------------------------- хранилище */

const store = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw == null ? fallback : JSON.parse(raw);
        } catch {
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch { /* приватный режим — просто не сохраняем */ }
    },
};

const KEY_LANG = "gtpo_lang";
const KEY_FAVS = "gtpo_pair_favs_v1";
const KEY_JOURNAL = "gtpo_journal_v1";
const KEY_FORM = "gtpo_form_v1";

/* ---------------------------------------------------------------- утилиты */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
}

function pad2(n) {
    return String(n).padStart(2, "0");
}

function hhmm(ts) {
    const d = new Date(ts);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fmtLeft(ms) {
    if (ms <= 0) return T("signal.expired");
    const s = Math.ceil(ms / 1000);
    if (s >= 3600) return `${Math.floor(s / 3600)}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
    return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
}

function haptic(kind) {
    try {
        if (!tg || !tg.HapticFeedback) return;
        if (kind === "select") tg.HapticFeedback.selectionChanged();
        else if (kind === "success" || kind === "error" || kind === "warning") tg.HapticFeedback.notificationOccurred(kind);
        else tg.HapticFeedback.impactOccurred(kind || "light");
    } catch { /* старый клиент Telegram */ }
}

let toastTimer = null;
function toast(text) {
    const t = $("[data-toast]");
    t.textContent = text;
    t.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-visible"), 2200);
}

async function api(path, options = {}) {
    if (!API_BASE) throw new Error("no_api");
    const res = await fetch(API_BASE + path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": INIT_DATA,
            ...(options.headers || {}),
        },
    });
    if (!res.ok) throw new Error("http_" + res.status);
    return res.json();
}

/* ---------------------------------------------------------------- журнал */

const journal = {
    items: store.get(KEY_JOURNAL, []),
    save() {
        store.set(KEY_JOURNAL, this.items.slice(0, 500));
    },
    add(entry) {
        this.items.unshift(entry);
        this.save();
    },
    stats() {
        const total = this.items.length;
        const wins = this.items.filter((x) => x.outcome === "win").length;
        return { total, wins, losses: total - wins, rate: total ? Math.round((wins / total) * 100) : 0 };
    },
};

/* ---------------------------------------------------------------- навигация */

let currentView = "home";

function showView(name) {
    while (openSheets.length) closeTopSheet();
    currentView = name;
    $$("[data-view]").forEach((v) => v.classList.toggle("is-active", v.dataset.view === name));
    $$("[data-tab]").forEach((b) => {
        const on = b.dataset.tab === name;
        b.classList.toggle("is-active", on);
        if (on) b.setAttribute("aria-current", "page");
        else b.removeAttribute("aria-current");
    });
    window.scrollTo({ top: 0 });
    if (name === "top") loadBoard();
    if (name === "journal") renderJournal();
}

/* ---------------------------------------------------------------- шиты (нижние листы) */

const openSheets = [];

function openSheet(sheet) {
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    openSheets.push(sheet);
    document.body.style.overflow = "hidden";
    if (tg && tg.BackButton) tg.BackButton.show();
}

function closeSheet(sheet) {
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
    const i = openSheets.indexOf(sheet);
    if (i >= 0) openSheets.splice(i, 1);
    if (!openSheets.length) {
        document.body.style.overflow = "";
        if (tg && tg.BackButton) tg.BackButton.hide();
    }
    if (sheet.dataset.signalSheet !== undefined) stopCountdown();
}

function closeTopSheet() {
    const top = openSheets[openSheets.length - 1];
    if (top) closeSheet(top);
}

/* ---------------------------------------------------------------- шапка и язык */

function renderChrome() {
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach((node) => {
        const v = T(node.dataset.i18n);
        if (typeof v === "string") node.textContent = v;
    });
    $("[data-lang-btn]").textContent = lang.toUpperCase();

    const chip = $("[data-tier-chip]");
    chip.textContent = T(IS_VIP ? "tier.vip" : "tier.basic");
    chip.classList.toggle("is-vip", IS_VIP);

    const name = TG_USER && TG_USER.first_name ? TG_USER.first_name : "";
    $("[data-hello]").textContent = T("hello")(name);
    $("[data-top-lead]").textContent = T("top.lead")(5);
    $("[data-picker-search]").placeholder = T("picker.search");
}

function setLang(next) {
    lang = next;
    store.set(KEY_LANG, lang);
    renderAll();
}

function renderAll() {
    renderChrome();
    renderStats();
    renderMarket();
    renderFaq();
    renderForm();
    renderJournal();
    if (currentView === "top") loadBoard();
}

/* ---------------------------------------------------------------- главная */

function statCells(s, compact) {
    const cells = [
        ["total", s.total, ""],
        ["wins", s.wins, "stat--up"],
        ["losses", s.losses, "stat--down"],
        ["rate", s.total ? s.rate : "—", ""],
    ];
    const frag = document.createDocumentFragment();
    cells.forEach(([key, value, cls]) => {
        const box = el("div", "stat " + cls);
        box.append(el("span", "stat__num", String(value)), el("span", "stat__label", T("stats." + key)));
        frag.append(box);
    });
    return frag;
}

function renderStats() {
    const s = journal.stats();
    const row = $("[data-stats-row]");
    row.replaceChildren(statCells(s));
    $("[data-stats-card]").classList.toggle("is-empty", !s.total);
    row.hidden = !s.total;
    $(".winbar").hidden = !s.total;
    $("[data-stats-empty]").hidden = !!s.total;
    $("[data-winbar]").style.width = s.total ? s.rate + "%" : "0";
}

let marketExpanded = false;
let marketData = null;
let marketError = false;

function renderMarket() {
    const list = $("[data-market]");
    const items = marketExpanded ? MARKET_ASSETS : MARKET_ASSETS.slice(0, 4);
    list.replaceChildren();
    items.forEach((a) => {
        const li = el("li");
        const img = el("img");
        img.src = `src/assets/icon/${a.icon}.svg`;
        img.alt = "";
        const name = el("div");
        name.append(el("span", "market__name", a.name), el("span", "market__sym", a.sym));
        const price = el("div", "market__price");
        const d = marketData && marketData[a.id];
        if (d && typeof d.usd === "number") {
            const decimals = d.usd < 1 ? 4 : 2;
            price.append(document.createTextNode("$" + d.usd.toLocaleString("en-US", {
                minimumFractionDigits: decimals, maximumFractionDigits: decimals,
            })));
            const ch = d.usd_24h_change;
            if (typeof ch === "number") {
                price.append(el("span", "market__chg " + (ch >= 0 ? "is-pos" : "is-neg"),
                    (ch >= 0 ? "+" : "") + ch.toFixed(2) + "%"));
            }
        } else {
            price.textContent = "—";
        }
        li.append(img, name, price);
        list.append(li);
    });
    $("[data-market-toggle]").textContent = T(marketExpanded ? "market.less" : "market.more");
    $("[data-market-source]").textContent = T(marketError && !marketData ? "market.error" : "market.source");
}

async function loadMarket() {
    const ids = MARKET_ASSETS.map((a) => a.id).join(",");
    try {
        const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=" + encodeURIComponent(ids) +
            "&vs_currencies=usd&include_24hr_change=true"
        );
        if (!res.ok) throw new Error("http_" + res.status);
        marketData = await res.json();
        marketError = false;
    } catch (e) {
        marketError = true;
        console.warn("Не удалось загрузить цены:", e);
    }
    renderMarket();
}

function renderFaq() {
    const root = $("[data-faq]");
    root.replaceChildren();
    T("faq.items").forEach(([q, a]) => {
        const d = el("details");
        d.append(el("summary", null, q), el("p", null, a));
        root.append(d);
    });
}

/* ---------------------------------------------------------------- форма сигнала */

const ALL_PAIRS = PAIR_CATS.flatMap((cat) => (CP_DATA[cat] || []).map((p) => ({ ...p, cat })));

const form = (() => {
    const saved = store.get(KEY_FORM, {});
    const pair = ALL_PAIRS.find((p) => p.id === saved.pair && isPairAllowed(p.id)) || null;
    const expiry = EXPIRY_PRESETS.find((e) => e.id === saved.expiry) || null;
    const mode = MODES.find((m) => m.id === saved.mode && isModeAllowed(m.id)) || null;
    return { pair, expiry, mode };
})();

function saveForm() {
    store.set(KEY_FORM, {
        pair: form.pair && form.pair.id,
        expiry: form.expiry && form.expiry.id,
        mode: form.mode && form.mode.id,
    });
}

function renderForm() {
    const values = {
        pair: form.pair && form.pair.name,
        time: form.expiry && form.expiry.id,
        mode: form.mode && form.mode.title,
    };
    $$("[data-field]").forEach((f) => {
        const v = values[f.dataset.field];
        const out = $("[data-field-value]", f);
        out.textContent = v || T("signal.choose");
        out.classList.toggle("is-placeholder", !v);
    });
    $("[data-get-signal]").disabled = !(form.pair && form.expiry && form.mode);
}

/* ---------------------------------------------------------------- выбор из списка */

const picker = {
    sheet: null,
    type: null,
    cat: "fiat",
    favOnly: false,
    favs: new Set(store.get(KEY_FAVS, [])),
};

function openPicker(type) {
    picker.type = type;
    $("[data-picker-title]").textContent = T("picker." + type);
    $("[data-picker-tools]").hidden = type !== "pair";
    const search = $("[data-picker-search]");
    search.value = "";
    if (type === "pair" && form.pair) picker.cat = form.pair.cat;
    renderPicker();
    openSheet(picker.sheet);
}

function optionRow({ title, sub, badge, badgeCls, selected, locked, star }) {
    const li = el("li", "option");
    li.setAttribute("role", "button");
    li.tabIndex = 0;
    if (selected) li.classList.add("is-selected");
    if (locked) li.classList.add("is-locked");
    if (star) li.append(star); else li.append(el("span"));
    const main = el("div");
    main.append(el("span", "opt-title", title));
    if (sub) main.append(el("span", "opt-sub", sub));
    li.append(main);
    li.append(badge ? el("span", "opt-badge " + (badgeCls || ""), badge) : el("span"));
    return li;
}

function choose(li, handler) {
    li.addEventListener("click", handler);
    li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handler();
        }
    });
}

function renderPicker() {
    const list = $("[data-picker-list]");
    list.replaceChildren();

    if (picker.type === "pair") {
        const cats = $("[data-picker-cats]");
        cats.replaceChildren();
        PAIR_CATS.forEach((cat) => {
            const b = el("button", cat === picker.cat ? "is-active" : "", T("picker.cats." + cat));
            b.type = "button";
            b.addEventListener("click", () => {
                picker.cat = cat;
                haptic("select");
                renderPicker();
            });
            cats.append(b);
        });
        const favBtn = $("[data-fav-filter]");
        favBtn.setAttribute("aria-pressed", String(picker.favOnly));

        const term = $("[data-picker-search]").value.trim().toLowerCase();
        let items = term ? ALL_PAIRS : ALL_PAIRS.filter((p) => p.cat === picker.cat);
        if (term) items = items.filter((p) => p.name.toLowerCase().includes(term));
        if (picker.favOnly) items = items.filter((p) => picker.favs.has(p.id));
        // доступные — выше заблокированных
        items = items.slice().sort((a, b) => Number(isPairAllowed(b.id)) - Number(isPairAllowed(a.id)));

        if (!items.length) {
            list.append(el("li", "empty", T("picker.nothing")));
            return;
        }
        items.forEach((p) => {
            const allowed = isPairAllowed(p.id);
            const isOtc = p.market === "OTC";
            const star = el("button", "opt-star" + (picker.favs.has(p.id) ? " is-on" : ""),
                picker.favs.has(p.id) ? "★" : "☆");
            star.type = "button";
            star.setAttribute("aria-label", "Favorite");
            star.addEventListener("click", (e) => {
                e.stopPropagation();
                if (picker.favs.has(p.id)) picker.favs.delete(p.id);
                else picker.favs.add(p.id);
                store.set(KEY_FAVS, [...picker.favs]);
                haptic("select");
                renderPicker();
            });
            const li = optionRow({
                title: p.name,
                sub: allowed ? T(isOtc ? "picker.otc" : "picker.reg") : T("picker.vipOnly"),
                badge: allowed ? (isOtc ? "OTC" : "REG") : "VIP",
                badgeCls: allowed ? "" : "is-vip",
                selected: form.pair && form.pair.id === p.id,
                locked: !allowed,
                star,
            });
            choose(li, () => {
                if (!allowed) {
                    haptic("warning");
                    toast(T("common.vipToast"));
                    return;
                }
                form.pair = p;
                afterChoose();
            });
            list.append(li);
        });
        return;
    }

    if (picker.type === "time") {
        EXPIRY_PRESETS.forEach((e) => {
            const li = optionRow({
                title: e.id,
                sub: T("expiry." + e.id),
                selected: form.expiry && form.expiry.id === e.id,
            });
            choose(li, () => {
                form.expiry = e;
                afterChoose();
            });
            list.append(li);
        });
        return;
    }

    if (picker.type === "mode") {
        MODES.forEach((m) => {
            const allowed = isModeAllowed(m.id);
            const li = optionRow({
                title: m.title,
                sub: allowed ? "" : T("picker.vipOnly"),
                badge: allowed ? "" : "VIP",
                badgeCls: "is-vip",
                selected: form.mode && form.mode.id === m.id,
                locked: !allowed,
            });
            choose(li, () => {
                if (!allowed) {
                    haptic("warning");
                    toast(T("common.vipToast"));
                    return;
                }
                form.mode = m;
                afterChoose();
            });
            list.append(li);
        });
        list.append(el("li", "empty", T("picker.modeNote")));
    }
}

function afterChoose() {
    haptic("select");
    saveForm();
    renderForm();
    closeSheet(picker.sheet);
}

/* ---------------------------------------------------------------- лист сигнала */

let currentSignal = null;
let countdownTimer = null;
let generating = false;

function stopCountdown() {
    clearInterval(countdownTimer);
    countdownTimer = null;
}

function startCountdown() {
    stopCountdown();
    const out = $("[data-sig-left]");
    const tick = () => {
        if (!currentSignal) return;
        const left = currentSignal.validUntil - Date.now();
        out.textContent = fmtLeft(left);
        if (left <= 0) stopCountdown();
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
}

function renderSignal(sig) {
    const dir = $("[data-sig-dir]");
    dir.classList.toggle("is-down", sig.direction === "down");
    // перезапуск анимации стрелки
    const svg = $("svg", dir);
    svg.style.animation = "none";
    void svg.getBoundingClientRect();
    svg.style.animation = "";
    $("[data-sig-dir-text]").textContent = T("signal." + sig.direction);
    $("[data-sig-pair]").textContent = sig.pair;
    $("[data-sig-expiry]").textContent = sig.expiry;
    $("[data-sig-issued]").textContent = hhmm(sig.issuedAt);

    const recorded = journal.items.find((x) => x.id === sig.id);
    $$("[data-result]").forEach((b) => {
        b.disabled = !!recorded;
        b.classList.toggle("is-chosen", !!recorded && recorded.outcome === b.dataset.result);
    });
    $("[data-sig-saved]").hidden = !recorded;
    startCountdown();
}

function requestSignal() {
    if (generating || !(form.pair && form.expiry && form.mode)) return;
    generating = true;
    haptic("medium");
    const sheet = $("[data-signal-sheet]");
    $("[data-sig-loading]").hidden = false;
    $("[data-sig]").hidden = true;
    if (!sheet.classList.contains("is-open")) openSheet(sheet);

    setTimeout(() => {
        currentSignal = generateSignal(form);
        generating = false;
        $("[data-sig-loading]").hidden = true;
        $("[data-sig]").hidden = false;
        renderSignal(currentSignal);
        haptic("success");
    }, 900);
}

async function recordResult(outcome) {
    const sig = currentSignal;
    if (!sig || journal.items.some((x) => x.id === sig.id)) return;

    const entry = {
        id: sig.id,
        pair: sig.pair,
        expiry: sig.expiry,
        direction: sig.direction,
        outcome,
        ts: Date.now(),
        synced: false,
    };
    journal.add(entry);
    haptic(outcome === "win" ? "success" : "warning");
    renderSignal(sig);
    renderStats();

    const savedEl = $("[data-sig-saved]");
    savedEl.textContent = T("signal.savedLocal");
    if (API_BASE && INIT_DATA) {
        try {
            await api("/api/results", {
                method: "POST",
                body: JSON.stringify({ pair: entry.pair, expiry: entry.expiry, direction: entry.direction, outcome }),
            });
            entry.synced = true;
            journal.save();
            savedEl.textContent = T("signal.saved");
        } catch (e) {
            console.warn("Результат не отправлен на сервер:", e);
        }
    }
}

/* ---------------------------------------------------------------- журнал */

function renderJournal() {
    const list = $("[data-journal]");
    const s = journal.stats();
    $("[data-journal-stats]").replaceChildren(statCells(s));
    $("[data-journal-stats]").hidden = !s.total;
    $("[data-journal-empty]").hidden = !!s.total;
    $("[data-journal-clear]").hidden = !s.total;

    list.replaceChildren();
    journal.items.slice(0, 200).forEach((x) => {
        const li = el("li");
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("class", "j-arrow " + (x.direction === "up" ? "is-up" : "is-down"));
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M12 19V5M6 11l6-6 6 6");
        svg.append(path);

        const d = new Date(x.ts);
        const when = `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)} ${hhmm(x.ts)}`;
        const main = el("div");
        main.append(el("span", "j-pair", x.pair), el("span", "j-meta", `${x.expiry} · ${T("signal." + x.direction)} · ${when}`));
        const res = el("span", "j-res " + (x.outcome === "win" ? "is-win" : "is-loss"),
            T(x.outcome === "win" ? "signal.win" : "signal.loss"));
        li.append(svg, main, res);
        list.append(li);
    });
}

/* ---------------------------------------------------------------- TOP */

let boardPeriod = "week";
let boardReq = 0;

async function loadBoard() {
    const list = $("[data-board]");
    const empty = $("[data-board-empty]");
    const me = $("[data-board-me]");
    me.hidden = true;

    if (!API_BASE) {
        list.replaceChildren();
        empty.textContent = T("top.noApi");
        empty.hidden = false;
        return;
    }

    const req = ++boardReq;
    try {
        const data = await api("/api/leaderboard?period=" + boardPeriod);
        if (req !== boardReq) return;
        list.replaceChildren();
        data.rows.forEach((r) => list.append(boardRow(r)));
        empty.hidden = data.rows.length > 0;
        empty.textContent = INIT_DATA ? T("top.empty") : T("top.empty") + " " + T("top.noTg");
        if (data.me && !data.rows.some((r) => r.is_me)) {
            me.replaceChildren(...boardRow(data.me).childNodes);
            me.hidden = false;
        }
    } catch (e) {
        if (req !== boardReq) return;
        list.replaceChildren();
        empty.textContent = T("top.error");
        empty.hidden = false;
    }
}

function boardRow(r) {
    const li = el("li", r.is_me ? "is-me" : "");
    const name = el("div");
    name.append(
        el("span", "b-name", r.is_me ? `${r.name} · ${T("top.you")}` : r.name),
        el("span", "b-sub", T("top.row")(r.wins, r.losses)),
    );
    li.append(el("span", "b-rank", String(r.rank)), name, el("span", "b-rate", Math.round(r.win_rate) + "%"));
    return li;
}

/* ---------------------------------------------------------------- старт */

function initLang() {
    const saved = store.get(KEY_LANG, null);
    const tgLang = TG_USER && TG_USER.language_code ? TG_USER.language_code.slice(0, 2) : "";
    lang = LANGS.includes(saved) ? saved : LANGS.includes(tgLang) ? tgLang : "en";
}

function initTelegram() {
    if (!tg) return;
    try {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor("#0F1729");
        if (tg.setBackgroundColor) tg.setBackgroundColor("#0F1729");
        if (tg.BackButton) tg.BackButton.onClick(closeTopSheet);
    } catch (e) {
        console.warn("Telegram WebApp:", e);
    }
}

function bindEvents() {
    $$("[data-tab]").forEach((b) => b.addEventListener("click", () => {
        haptic("select");
        showView(b.dataset.tab);
    }));
    $$("[data-goto]").forEach((b) => b.addEventListener("click", () => showView(b.dataset.goto)));

    $("[data-lang-btn]").addEventListener("click", () => {
        haptic("select");
        setLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]);
    });

    $("[data-market-toggle]").addEventListener("click", () => {
        marketExpanded = !marketExpanded;
        renderMarket();
    });

    picker.sheet = $("[data-picker]");
    $$("[data-field]").forEach((f) => f.addEventListener("click", () => openPicker(f.dataset.field)));
    $("[data-picker-search]").addEventListener("input", renderPicker);
    $("[data-fav-filter]").addEventListener("click", () => {
        picker.favOnly = !picker.favOnly;
        renderPicker();
    });

    $$("[data-close]").forEach((n) => n.addEventListener("click", () => closeSheet(n.closest(".sheet"))));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeTopSheet();
    });

    $("[data-get-signal]").addEventListener("click", requestSignal);
    $("[data-sig-again]").addEventListener("click", requestSignal);
    $$("[data-result]").forEach((b) => b.addEventListener("click", () => recordResult(b.dataset.result)));

    $("[data-journal-clear]").addEventListener("click", () => {
        if (!window.confirm(T("journal.confirmClear"))) return;
        journal.items = [];
        journal.save();
        renderJournal();
        renderStats();
    });

    $$("[data-period]").forEach((b) => b.addEventListener("click", () => {
        boardPeriod = b.dataset.period;
        $$("[data-period]").forEach((x) => x.classList.toggle("is-active", x === b));
        haptic("select");
        loadBoard();
    }));
}

document.addEventListener("DOMContentLoaded", () => {
    initLang();
    initTelegram();
    bindEvents();
    renderAll();
    loadMarket();
    setInterval(loadMarket, 30000);
});
