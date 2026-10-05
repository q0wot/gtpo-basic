"use strict";

/* ==========================================================================
   GTPO mini app
   Вкладки: Главная · Сигнал
   Версия (basic / vip): параметр ?tier= в адресе, иначе config.js
   ========================================================================== */

const CONFIG = Object.assign({ tier: "basic", apiBase: "", brokerUrl: "https://pocketoption.com/" }, window.APP_CONFIG || {});
// Бот открывает одну и ту же страницу с ?tier=basic или ?tier=vip
const URL_TIER = new URLSearchParams(location.search).get("tier");
if (URL_TIER === "basic" || URL_TIER === "vip") CONFIG.tier = URL_TIER;
const IS_VIP = CONFIG.tier === "vip";

// Ссылка брокера: бот передаёт реф-ссылку пользователя в ?broker= (та же, что при регистрации).
// Принимаем только https; иначе — общий сайт брокера из config.js.
const BROKER_URL = (() => {
    try {
        const u = new URL(new URLSearchParams(location.search).get("broker") || "");
        if (u.protocol === "https:") return u.href;
    } catch { /* параметра нет или он кривой */ }
    return CONFIG.brokerUrl;
})();
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
// Вне Telegram (проверка в браузере) имя можно передать в адресе: ?name=Никита
const TG_USER = (tg && tg.initDataUnsafe && tg.initDataUnsafe.user)
    || (new URLSearchParams(location.search).get("name")
        ? { first_name: new URLSearchParams(location.search).get("name").slice(0, 40) }
        : null);


// Сервер бота: задаётся в config.js; если страницу отдаёт сам бот (/app/...), то тот же адрес
const API_BASE = (CONFIG.apiBase || (location.pathname.startsWith("/app/") ? location.origin : "")).replace(/\/$/, "");
const INIT_DATA = tg && tg.initData ? tg.initData : "";

const LANGS = ["ru", "en", "kk", "ky", "uz", "ar", "es", "hi"];
const RTL_LANGS = new Set(["ar"]);

// Названия языков на самих языках + подпись по-английски
const LANG_META = {
    ru: { name: "Русский", sub: "Russian" },
    en: { name: "English", sub: "English" },
    es: { name: "Español", sub: "Spanish" },
    hi: { name: "हिन्दी", sub: "Hindi" },
    kk: { name: "Қазақша", sub: "Kazakh" },
    ky: { name: "Кыргызча", sub: "Kyrgyz" },
    uz: { name: "Oʻzbekcha", sub: "Uzbek" },
    ar: { name: "العربية", sub: "Arabic" },
};

// Флаги в SVG: эмодзи-флаги не отображаются в Telegram для Windows
const FLAGS = {
    ru: '<svg viewBox="0 0 30 30"><rect width="30" height="10" fill="#fff"/><rect y="10" width="30" height="10" fill="#1C57A7"/><rect y="20" width="30" height="10" fill="#D52B1E"/></svg>',
    en: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#012169"/><path d="M0 0L60 60M60 0L0 60" stroke="#fff" stroke-width="12"/><path d="M0 0L60 60M60 0L0 60" stroke="#C8102E" stroke-width="5"/><path d="M30 0V60M0 30H60" stroke="#fff" stroke-width="18"/><path d="M30 0V60M0 30H60" stroke="#C8102E" stroke-width="10"/></svg>',
    es: '<svg viewBox="0 0 30 30"><rect width="30" height="30" fill="#AA151B"/><rect y="8" width="30" height="14" fill="#F1BF00"/></svg>',
    hi: '<svg viewBox="0 0 30 30"><rect width="30" height="10" fill="#FF9933"/><rect y="10" width="30" height="10" fill="#fff"/><rect y="20" width="30" height="10" fill="#138808"/><circle cx="15" cy="15" r="3.6" fill="none" stroke="#000080" stroke-width="1.1"/><circle cx="15" cy="15" r="0.9" fill="#000080"/></svg>',
    kk: '<svg viewBox="0 0 30 30"><rect width="30" height="30" fill="#00AFCA"/><circle cx="15" cy="13" r="5" fill="#FEC50C"/><path d="M8 21.5q7 3 14 0" stroke="#FEC50C" stroke-width="1.6" fill="none"/></svg>',
    ky: '<svg viewBox="0 0 30 30"><rect width="30" height="30" fill="#E8112D"/><circle cx="15" cy="15" r="6.5" fill="#FFEF00"/><circle cx="15" cy="15" r="4.2" fill="#E8112D"/><circle cx="15" cy="15" r="2.8" fill="#FFEF00"/></svg>',
    uz: '<svg viewBox="0 0 30 30"><rect width="30" height="10" fill="#0099B5"/><rect y="10" width="30" height="10" fill="#fff"/><rect y="20" width="30" height="10" fill="#1EB53A"/><rect y="9.4" width="30" height="1.2" fill="#CE1126"/><rect y="19.4" width="30" height="1.2" fill="#CE1126"/><circle cx="9" cy="5" r="2.6" fill="#fff"/><circle cx="10" cy="4.6" r="2.3" fill="#0099B5"/></svg>',
    ar: '<svg viewBox="0 0 30 30"><rect width="30" height="10" fill="#00732F"/><rect y="10" width="30" height="10" fill="#fff"/><rect y="20" width="30" height="10" fill="#000"/><rect width="9" height="30" fill="#FF0000"/></svg>',
};

function flagEl(code) {
    const span = document.createElement("span");
    span.className = "flag";
    span.innerHTML = FLAGS[code] || "";  // статичные SVG из кода, не пользовательские данные
    return span;
}

/* ---------------------------------------------------------------- тексты */

const I18N = {
    ru: {
        langMenu: "Язык приложения",
        tabs: { home: "Главная", signal: "Сигнал", top: "Лидерборд" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `Привет, ${n}` : "Привет"),
        market: {
            title: "Крипто сейчас",
            more: "Все",
            less: "Свернуть",
            source: "Цены Binance и CoinGecko, обновляются каждые 30 секунд",
            error: "Не удалось загрузить цены. Проверьте интернет.",
        },
        faq: {
            title: "Вопросы",
            items: [
                ["Как появляются сигналы?",
                    "Направление «вверх» или «вниз» выбирается случайно. Это демо-сигнал для тренировки, а не прогноз рынка и не инвестиционная рекомендация."],
                ["Что даёт VIP?",
                    "Больше инструментов и все режимы. На направление сигнала VIP не влияет: он одинаково случайный."],
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
            demoTag: "Случайный демо-сигнал",
            generating: "Генерирую сигнал",
            steps: ["Беру пару {pair}", "Применяю режим {mode}", "Генерирую направление", "Запускаю таймер на {expiry}"],
            up: "Вверх",
            down: "Вниз",
            issued: "Выдан",
            left: "Осталось",
            expired: "истёк",
            again: "Новый сигнал",
            recent: "Недавние",
            yourTime: "Ваше время",
            brokerSub: "Перейти на сайт брокера",
            expiredMsg: "⏱ Время экспирации вышло",
            expiredToast: (p) => `⏱ Время сделки по ${p} вышло`,
            chart: (s) => `${s} · Binance · последний час. Реальная цена для справки, не прогноз.`,
        },
        picker: {
            pair: "Инструмент",
            time: "Экспирация",
            mode: "Режим",
            search: "Поиск",
            nothing: "Ничего не найдено",
            cats: { all: "Все", fiat: "Валюты", crypto: "Крипто", commod: "Сырьё", stocks: "Акции", indices: "Индексы" },
            otc: "OTC · круглосуточно",
            reg: "Биржевой · закрыт в выходные",
            vipOnly: "Доступно в VIP",
            modeNote: "Режим — это название пресета. Направление сигнала во всех режимах случайное.",
        },
        expiry: {
            S3: "Три секунды", S5: "Сверхкороткая", S10: "Десять секунд", S15: "Очень короткая", S30: "Короткая", M1: "Минута",
            M3: "Три минуты", M5: "Пять минут", M30: "Полчаса", H1: "Час", H4: "Четыре часа",
        },
        calc: {
            title: "Калькулятор риска",
            hint: "сколько ставить на сделку",
            deposit: "Ваш депозит",
            stake: "Сумма сделки",
            min: "У брокера минимальная сделка — 1$. Увеличьте депозит или процент.",
            empty: "Введите сумму депозита.",
        },
        hours: {
            closed: "Закрыт",
            opensFx: (w) => `Биржа закрыта · откроется ${w}`,
            opensStock: "Биржа закрыта · откроется в понедельник",
            warnFx: (p, w) => `Биржевая пара ${p} сейчас закрыта (выходные), обычно открывается ${w}. OTC-пары работают круглосуточно.`,
            warnStock: (p) => `Биржевая пара ${p} закрыта на выходные. OTC-пары работают круглосуточно.`,
        },
        top: {
            title: "Лидерборд",
            you: "Вы",
            noData: "Пока нет результатов",
            need: (n) => `Нужно ${n} сделок для рейтинга`,
            demo: "Демо-данные",
            resetWeek: (d, h) => `Новая неделя через ${d} д ${h} ч`,
            resetMonth: (d, h) => `Новый месяц через ${d} д ${h} ч`,
            week: "Неделя", month: "Месяц", all: "Всё время",
            row: (w, l) => `${w} в плюс · ${l} в минус`,
            meRow: (w, l) => `${w} в плюс · ${l} в минус`,
            guest: "Вы",
        },
        status: { open: "Биржа открыта", closed: "Биржа закрыта", crypto: "Крипто · 24/7" },
        common: {
            risk: "Сигналы случайные и не являются инвестиционной рекомендацией. Торговля бинарными опционами связана с высоким риском потери средств.",
            vipToast: "Доступно в VIP-версии",
        },
    },

    en: {
        langMenu: "App language",
        tabs: { home: "Home", signal: "Signal", top: "Leaderboard" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `Hi, ${n}` : "Hi there"),
        market: {
            title: "Crypto now",
            more: "All",
            less: "Less",
            source: "Prices by Binance and CoinGecko, refreshed every 30 seconds",
            error: "Couldn't load prices. Check your connection.",
        },
        faq: {
            title: "Questions",
            items: [
                ["Where do signals come from?",
                    "The up/down direction is picked at random. It's a demo signal for practice, not a market forecast or investment advice."],
                ["What does VIP add?",
                    "More instruments and all modes. VIP doesn't change the direction: it's just as random."],
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
            demoTag: "Random demo signal",
            generating: "Generating signal",
            steps: ["Taking pair {pair}", "Applying {mode} mode", "Generating direction", "Starting {expiry} timer"],
            up: "Up",
            down: "Down",
            issued: "Issued",
            left: "Left",
            expired: "expired",
            again: "New signal",
            recent: "Recent",
            yourTime: "Your time",
            brokerSub: "Open the broker website",
            expiredMsg: "⏱ Expiry time is up",
            expiredToast: (p) => `⏱ Time is up for ${p}`,
            chart: (s) => `${s} · Binance · last hour. Real price for reference, not a forecast.`,
        },
        picker: {
            pair: "Instrument",
            time: "Expiry",
            mode: "Mode",
            search: "Search",
            nothing: "Nothing found",
            cats: { all: "All", fiat: "Forex", crypto: "Crypto", commod: "Commodities", stocks: "Stocks", indices: "Indices" },
            otc: "OTC · 24/7",
            reg: "Exchange · closed on weekends",
            vipOnly: "Available in VIP",
            modeNote: "A mode is just a preset name. The direction is random in every mode.",
        },
        expiry: {
            S3: "Three seconds", S5: "Ultra-short", S10: "Ten seconds", S15: "Very short", S30: "Short", M1: "One minute",
            M3: "Three minutes", M5: "Five minutes", M30: "Half an hour", H1: "One hour", H4: "Four hours",
        },
        calc: {
            title: "Risk calculator",
            hint: "how much to trade",
            deposit: "Your deposit",
            stake: "Trade amount",
            min: "The broker's minimum trade is $1. Raise your deposit or percentage.",
            empty: "Enter your deposit amount.",
        },
        hours: {
            closed: "Closed",
            opensFx: (w) => `Market closed · opens ${w}`,
            opensStock: "Market closed · opens on Monday",
            warnFx: (p, w) => `${p} is closed for the weekend and usually opens ${w}. OTC pairs trade 24/7.`,
            warnStock: (p) => `${p} is closed for the weekend. OTC pairs trade 24/7.`,
        },
        top: {
            title: "Leaderboard",
            you: "You",
            noData: "No results yet",
            need: (n) => `${n} trades needed to join`,
            demo: "Demo data",
            resetWeek: (d, h) => `New week in ${d}d ${h}h`,
            resetMonth: (d, h) => `New month in ${d}d ${h}h`,
            week: "Week", month: "Month", all: "All time",
            row: (w, l) => `${w} won · ${l} lost`,
            meRow: (w, l) => `${w} won · ${l} lost`,
            guest: "You",
        },
        status: { open: "Market open", closed: "Market closed", crypto: "Crypto · 24/7" },
        common: {
            risk: "Signals are random and are not investment advice. Binary options trading carries a high risk of losing money.",
            vipToast: "Available in the VIP version",
        },
    },

    es: {
        langMenu: "Idioma de la app",
        tabs: { home: "Inicio", signal: "Señal", top: "Ranking" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `Hola, ${n}` : "Hola"),
        market: {
            title: "Cripto ahora",
            more: "Todo",
            less: "Menos",
            source: "Precios de Binance y CoinGecko, se actualizan cada 30 segundos",
            error: "No se pudieron cargar los precios. Revisa tu conexión.",
        },
        faq: {
            title: "Preguntas",
            items: [
                ["¿De dónde salen las señales?",
                    "La dirección arriba/abajo se elige al azar. Es una señal demo para practicar, no un pronóstico ni una recomendación de inversión."],
                ["¿Qué añade VIP?",
                    "Más instrumentos y todos los modos. VIP no cambia la dirección: es igual de aleatoria."],
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
            demoTag: "Señal demo aleatoria",
            generating: "Generando señal",
            steps: ["Tomo el par {pair}", "Aplico el modo {mode}", "Genero la dirección", "Inicio el temporizador de {expiry}"],
            up: "Arriba",
            down: "Abajo",
            issued: "Emitida",
            left: "Quedan",
            expired: "expiró",
            again: "Nueva señal",
            recent: "Recientes",
            yourTime: "Tu hora",
            brokerSub: "Abrir la web del bróker",
            expiredMsg: "⏱ Terminó el tiempo de expiración",
            expiredToast: (p) => `⏱ Terminó el tiempo de ${p}`,
            chart: (s) => `${s} · Binance · última hora. Precio real como referencia, no un pronóstico.`,
        },
        picker: {
            pair: "Instrumento",
            time: "Expiración",
            mode: "Modo",
            search: "Buscar",
            nothing: "No se encontró nada",
            cats: { all: "Todo", fiat: "Divisas", crypto: "Cripto", commod: "Materias primas", stocks: "Acciones", indices: "Índices" },
            otc: "OTC · 24/7",
            reg: "Bolsa · cerrado los fines de semana",
            vipOnly: "Disponible en VIP",
            modeNote: "El modo es solo el nombre de un preset. La dirección es aleatoria en todos.",
        },
        expiry: {
            S3: "Tres segundos", S5: "Ultracorta", S10: "Diez segundos", S15: "Muy corta", S30: "Corta", M1: "Un minuto",
            M3: "Tres minutos", M5: "Cinco minutos", M30: "Media hora", H1: "Una hora", H4: "Cuatro horas",
        },
        calc: {
            title: "Calculadora de riesgo",
            hint: "cuánto operar",
            deposit: "Tu depósito",
            stake: "Monto por operación",
            min: "La operación mínima del bróker es 1$. Aumenta el depósito o el porcentaje.",
            empty: "Introduce el monto del depósito.",
        },
        hours: {
            closed: "Cerrado",
            opensFx: (w) => `Bolsa cerrada · abre ${w}`,
            opensStock: "Bolsa cerrada · abre el lunes",
            warnFx: (p, w) => `${p} está cerrado el fin de semana y suele abrir ${w}. Los pares OTC funcionan 24/7.`,
            warnStock: (p) => `${p} está cerrado el fin de semana. Los pares OTC funcionan 24/7.`,
        },
        top: {
            title: "Ranking",
            you: "Tú",
            noData: "Aún sin resultados",
            need: (n) => `Necesitas ${n} operaciones para entrar en el ranking`,
            demo: "Datos demo",
            resetWeek: (d, h) => `Nueva semana en ${d} d ${h} h`,
            resetMonth: (d, h) => `Nuevo mes en ${d} d ${h} h`,
            week: "Semana", month: "Mes", all: "Siempre",
            row: (w, l) => `${w} ganadas · ${l} perdidas`,
            meRow: (w, l) => `${w} ganadas · ${l} perdidas`,
            guest: "Tú",
        },
        status: { open: "Mercado abierto", closed: "Mercado cerrado", crypto: "Cripto · 24/7" },
        common: {
            risk: "Las señales son aleatorias y no son una recomendación de inversión. Operar con opciones binarias implica un alto riesgo de perder dinero.",
            vipToast: "Disponible en la versión VIP",
        },
    },

    hi: {
        langMenu: "ऐप की भाषा",
        tabs: { home: "होम", signal: "सिग्नल", top: "लीडरबोर्ड" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `नमस्ते, ${n}` : "नमस्ते"),
        market: {
            title: "क्रिप्टो अभी",
            more: "सभी",
            less: "कम",
            source: "Binance और CoinGecko की कीमतें, हर 30 सेकंड में अपडेट",
            error: "कीमतें लोड नहीं हुईं। इंटरनेट जांचें।",
        },
        faq: {
            title: "सवाल",
            items: [
                ["सिग्नल कैसे बनते हैं?",
                    "ऊपर/नीचे की दिशा रैंडम चुनी जाती है। यह अभ्यास के लिए डेमो सिग्नल है, बाज़ार का पूर्वानुमान या निवेश सलाह नहीं।"],
                ["VIP से क्या मिलता है?",
                    "ज़्यादा इंस्ट्रूमेंट और सभी मोड। VIP दिशा नहीं बदलता: वह भी उतनी ही रैंडम है।"],
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
            choose: "चुनें",
            demoTag: "रैंडम डेमो सिग्नल",
            generating: "सिग्नल बन रहा है",
            steps: ["{pair} पेयर ले रहे हैं", "{mode} मोड लगा रहे हैं", "दिशा बना रहे हैं", "{expiry} का टाइमर शुरू कर रहे हैं"],
            up: "ऊपर",
            down: "नीचे",
            issued: "जारी",
            left: "बाकी",
            expired: "समाप्त",
            again: "नया सिग्नल",
            recent: "हाल के",
            yourTime: "आपका समय",
            brokerSub: "ब्रोकर की वेबसाइट खोलें",
            expiredMsg: "⏱ एक्सपायरी का समय खत्म",
            expiredToast: (p) => `⏱ ${p} का समय खत्म`,
            chart: (s) => `${s} · Binance · पिछला घंटा। असली कीमत संदर्भ के लिए, पूर्वानुमान नहीं।`,
        },
        picker: {
            pair: "इंस्ट्रूमेंट",
            time: "एक्सपायरी",
            mode: "मोड",
            search: "खोजें",
            nothing: "कुछ नहीं मिला",
            cats: { all: "सभी", fiat: "फ़ॉरेक्स", crypto: "क्रिप्टो", commod: "कमोडिटी", stocks: "शेयर", indices: "इंडेक्स" },
            otc: "OTC · 24/7",
            reg: "एक्सचेंज · वीकेंड पर बंद",
            vipOnly: "VIP में उपलब्ध",
            modeNote: "मोड सिर्फ़ प्रीसेट का नाम है। हर मोड में दिशा रैंडम है।",
        },
        expiry: {
            S3: "तीन सेकंड", S5: "बहुत छोटी", S10: "दस सेकंड", S15: "बहुत कम", S30: "छोटी", M1: "एक मिनट",
            M3: "तीन मिनट", M5: "पांच मिनट", M30: "आधा घंटा", H1: "एक घंटा", H4: "चार घंटे",
        },
        calc: {
            title: "रिस्क कैलकुलेटर",
            hint: "एक ट्रेड पर कितना लगाएं",
            deposit: "आपका डिपॉज़िट",
            stake: "ट्रेड की रकम",
            min: "ब्रोकर पर न्यूनतम ट्रेड 1$ है। डिपॉज़िट या प्रतिशत बढ़ाएं।",
            empty: "डिपॉज़िट की रकम डालें।",
        },
        hours: {
            closed: "बंद",
            opensFx: (w) => `मार्केट बंद · खुलेगा ${w}`,
            opensStock: "मार्केट बंद · सोमवार को खुलेगा",
            warnFx: (p, w) => `${p} वीकेंड पर बंद है, आमतौर पर ${w} खुलता है। OTC पेयर 24/7 चलते हैं।`,
            warnStock: (p) => `${p} वीकेंड पर बंद है। OTC पेयर 24/7 चलते हैं।`,
        },
        top: {
            title: "लीडरबोर्ड",
            you: "आप",
            noData: "अभी कोई नतीजा नहीं",
            need: (n) => `रैंकिंग में आने के लिए ${n} ट्रेड चाहिए`,
            demo: "डेमो डेटा",
            resetWeek: (d, h) => `नया हफ़्ता ${d} दिन ${h} घंटे में`,
            resetMonth: (d, h) => `नया महीना ${d} दिन ${h} घंटे में`,
            week: "हफ़्ता", month: "महीना", all: "हमेशा",
            row: (w, l) => `${w} मुनाफ़ा · ${l} नुकसान`,
            meRow: (w, l) => `${w} मुनाफ़ा · ${l} नुकसान`,
            guest: "आप",
        },
        status: { open: "मार्केट खुला", closed: "मार्केट बंद", crypto: "क्रिप्टो · 24/7" },
        common: {
            risk: "सिग्नल रैंडम हैं और निवेश सलाह नहीं हैं। बाइनरी ऑप्शंस ट्रेडिंग में पैसा खोने का जोखिम बहुत अधिक है।",
            vipToast: "VIP वर्ज़न में उपलब्ध",
        },
    },
    kk: {
        langMenu: "Қосымша тілі",
        tabs: { home: "Басты", signal: "Сигнал", top: "Көшбасшылар" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `Сәлем, ${n}` : "Сәлем"),
        market: {
            title: "Крипто қазір",
            more: "Барлығы",
            less: "Жасыру",
            source: "Binance және CoinGecko бағалары, әр 30 секунд сайын жаңарады",
            error: "Бағалар жүктелмеді. Интернетті тексеріңіз.",
        },
        faq: {
            title: "Сұрақтар",
            items: [
                ["Сигналдар қайдан алынады?",
                    "«Жоғары» не «төмен» бағыты кездейсоқ таңдалады. Бұл жаттығуға арналған демо-сигнал, нарық болжамы да, инвестициялық кеңес те емес."],
                ["VIP не береді?",
                    "Көбірек құралдар мен барлық режимдер. VIP бағытқа әсер етпейді: ол да кездейсоқ."],
                ["Депозитім үшін қауіпсіз бе?",
                    "Бинарлық опциондар — жоғары тәуекел: трейдерлердің көбі ақша жоғалтады. Тек жоғалтуға дайын сомамен ғана сауда жасаңыз."],
            ],
        },
        signal: {
            title: "Сигнал",
            pair: "Құрал",
            expiry: "Экспирация",
            mode: "Режим",
            get: "Сигнал алу",
            choose: "Таңдау",
            demoTag: "Кездейсоқ демо-сигнал",
            generating: "Сигнал жасалуда",
            steps: ["{pair} жұбын аламын", "{mode} режимін қолданамын", "Бағытты жасаймын", "{expiry} таймерін іске қосамын"],
            up: "Жоғары",
            down: "Төмен",
            issued: "Берілді",
            left: "Қалды",
            expired: "аяқталды",
            again: "Жаңа сигнал",
            recent: "Соңғылар",
            yourTime: "Сіздің уақытыңыз",
            brokerSub: "Брокер сайтына өту",
            expiredMsg: "⏱ Экспирация уақыты аяқталды",
            expiredToast: (p) => `⏱ ${p} бойынша мәміле уақыты аяқталды`,
            chart: (s) => `${s} · Binance · соңғы сағат. Анықтама үшін нақты баға, болжам емес.`,
        },
        picker: {
            search: "Іздеу",
            nothing: "Ештеңе табылмады",
            cats: { all: "Барлығы", fiat: "Валюталар", crypto: "Крипто", commod: "Шикізат", stocks: "Акциялар", indices: "Индекстер" },
            vipOnly: "VIP-те қолжетімді",
            modeNote: "Режим — тек пресет атауы. Барлық режимде сигнал бағыты кездейсоқ.",
        },
        expiry: {
            S3: "Үш секунд", S5: "Өте қысқа", S10: "Он секунд", S15: "Қысқа", S30: "Жарты минут", M1: "Бір минут",
            M3: "Үш минут", M5: "Бес минут", M30: "Жарты сағат", H1: "Бір сағат", H4: "Төрт сағат",
        },
        calc: {
            title: "Тәуекел калькуляторы",
            hint: "бір мәмілеге қанша салу керек",
            deposit: "Депозитіңіз",
            stake: "Мәміле сомасы",
            min: "Брокердегі ең аз мәміле — 1$. Депозитті немесе пайызды көбейтіңіз.",
            empty: "Депозит сомасын енгізіңіз.",
        },
        hours: {
            closed: "Жабық",
            opensFx: (w) => `Биржа жабық · ашылады ${w}`,
            opensStock: "Биржа жабық · дүйсенбіде ашылады",
            warnFx: (p, w) => `${p} демалыс күндері жабық, әдетте ${w} ашылады. OTC жұптары тәулік бойы жұмыс істейді.`,
            warnStock: (p) => `${p} демалыс күндері жабық. OTC жұптары тәулік бойы жұмыс істейді.`,
        },
        top: {
            title: "Көшбасшылар",
            you: "Сіз",
            noData: "Әзірге нәтиже жоқ",
            need: (n) => `Рейтингке кіру үшін ${n} мәміле қажет`,
            demo: "Демо-деректер",
            resetWeek: (d, h) => `Жаңа апта ${d} к ${h} сағ кейін`,
            resetMonth: (d, h) => `Жаңа ай ${d} к ${h} сағ кейін`,
            week: "Апта", month: "Ай", all: "Барлық уақыт",
            row: (w, l) => `${w} пайда · ${l} шығын`,
            meRow: (w, l) => `${w} пайда · ${l} шығын`,
            guest: "Сіз",
        },
        status: { open: "Биржа ашық", closed: "Биржа жабық", crypto: "Крипто · 24/7" },
        common: {
            risk: "Сигналдар кездейсоқ және инвестициялық кеңес емес. Бинарлық опциондармен сауда ақша жоғалту қаупі жоғары.",
            vipToast: "VIP нұсқасында қолжетімді",
        },
    },

    ky: {
        langMenu: "Колдонмо тили",
        tabs: { home: "Башкы", signal: "Сигнал", top: "Лидерлер" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `Салам, ${n}` : "Салам"),
        market: {
            title: "Крипто азыр",
            more: "Баары",
            less: "Жашыруу",
            source: "Binance жана CoinGecko баалары, ар 30 секундда жаңыланат",
            error: "Баалар жүктөлгөн жок. Интернетти текшериңиз.",
        },
        faq: {
            title: "Суроолор",
            items: [
                ["Сигналдар кайдан келет?",
                    "«Өйдө» же «ылдый» багыты кокустан тандалат. Бул машыгуу үчүн демо-сигнал, рыноктун божомолу да, инвестициялык кеңеш да эмес."],
                ["VIP эмне берет?",
                    "Көбүрөөк куралдар жана бардык режимдер. VIP багытка таасир этпейт: ал да кокустан."],
                ["Депозитим үчүн коопсузбу?",
                    "Бинардык опциондор — жогорку тобокелдик: трейдерлердин көбү акча жоготот. Жоготууга даяр болгон сумма менен гана соода кылыңыз."],
            ],
        },
        signal: {
            title: "Сигнал",
            pair: "Курал",
            expiry: "Экспирация",
            mode: "Режим",
            get: "Сигнал алуу",
            choose: "Тандоо",
            demoTag: "Кокустан демо-сигнал",
            generating: "Сигнал түзүлүүдө",
            steps: ["{pair} жуптун алам", "{mode} режимин колдоном", "Багытты түзөм", "{expiry} таймерин иштетем"],
            up: "Өйдө",
            down: "Ылдый",
            issued: "Берилди",
            left: "Калды",
            expired: "бүттү",
            again: "Жаңы сигнал",
            recent: "Акыркылар",
            yourTime: "Сиздин убакыт",
            brokerSub: "Брокердин сайтына өтүү",
            expiredMsg: "⏱ Экспирация убактысы бүттү",
            expiredToast: (p) => `⏱ ${p} боюнча бүтүмдүн убактысы бүттү`,
            chart: (s) => `${s} · Binance · акыркы саат. Маалымат үчүн чыныгы баа, божомол эмес.`,
        },
        picker: {
            search: "Издөө",
            nothing: "Эч нерсе табылган жок",
            cats: { all: "Баары", fiat: "Валюталар", crypto: "Крипто", commod: "Чийки зат", stocks: "Акциялар", indices: "Индекстер" },
            vipOnly: "VIP'те жеткиликтүү",
            modeNote: "Режим — пресеттин аты гана. Бардык режимде сигналдын багыты кокустан.",
        },
        expiry: {
            S3: "Үч секунд", S5: "Өтө кыска", S10: "Он секунд", S15: "Кыска", S30: "Жарым мүнөт", M1: "Бир мүнөт",
            M3: "Үч мүнөт", M5: "Беш мүнөт", M30: "Жарым саат", H1: "Бир саат", H4: "Төрт саат",
        },
        calc: {
            title: "Тобокелдик калькулятору",
            hint: "бир бүтүмгө канча коюу керек",
            deposit: "Депозитиңиз",
            stake: "Бүтүмдүн суммасы",
            min: "Брокердеги эң аз бүтүм — 1$. Депозитти же пайызды көбөйтүңүз.",
            empty: "Депозиттин суммасын киргизиңиз.",
        },
        hours: {
            closed: "Жабык",
            opensFx: (w) => `Биржа жабык · ачылат ${w}`,
            opensStock: "Биржа жабык · дүйшөмбүдө ачылат",
            warnFx: (p, w) => `${p} дем алыш күндөрү жабык, адатта ${w} ачылат. OTC жуптары сутка бою иштейт.`,
            warnStock: (p) => `${p} дем алыш күндөрү жабык. OTC жуптары сутка бою иштейт.`,
        },
        top: {
            title: "Лидерлер",
            you: "Сиз",
            noData: "Азырынча жыйынтык жок",
            need: (n) => `Рейтингге кирүү үчүн ${n} бүтүм керек`,
            demo: "Демо-маалымат",
            resetWeek: (d, h) => `Жаңы апта ${d} к ${h} с кийин`,
            resetMonth: (d, h) => `Жаңы ай ${d} к ${h} с кийин`,
            week: "Апта", month: "Ай", all: "Бардык убакыт",
            row: (w, l) => `${w} пайда · ${l} чыгаша`,
            meRow: (w, l) => `${w} пайда · ${l} чыгаша`,
            guest: "Сиз",
        },
        status: { open: "Биржа ачык", closed: "Биржа жабык", crypto: "Крипто · 24/7" },
        common: {
            risk: "Сигналдар кокустан жана инвестициялык кеңеш эмес. Бинардык опциондор менен соода акча жоготуу коркунучу жогору.",
            vipToast: "VIP версиясында жеткиликтүү",
        },
    },

    uz: {
        langMenu: "Ilova tili",
        tabs: { home: "Asosiy", signal: "Signal", top: "Reyting" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `Salom, ${n}` : "Salom"),
        market: {
            title: "Kripto hozir",
            more: "Barchasi",
            less: "Yashirish",
            source: "Binance va CoinGecko narxlari, har 30 soniyada yangilanadi",
            error: "Narxlar yuklanmadi. Internetni tekshiring.",
        },
        faq: {
            title: "Savollar",
            items: [
                ["Signallar qayerdan olinadi?",
                    "«Yuqoriga» yoki «pastga» yo‘nalishi tasodifiy tanlanadi. Bu mashq uchun demo-signal, bozor bashorati ham, investitsiya maslahati ham emas."],
                ["VIP nima beradi?",
                    "Ko‘proq vositalar va barcha rejimlar. VIP yo‘nalishga ta’sir qilmaydi: u ham tasodifiy."],
                ["Depozitim uchun xavfsizmi?",
                    "Binar optsionlar — yuqori xavf: treyderlarning ko‘pchiligi pul yo‘qotadi. Faqat yo‘qotishga tayyor bo‘lgan summa bilan savdo qiling."],
            ],
        },
        signal: {
            title: "Signal",
            pair: "Vosita",
            expiry: "Ekspiratsiya",
            mode: "Rejim",
            get: "Signal olish",
            choose: "Tanlash",
            demoTag: "Tasodifiy demo-signal",
            generating: "Signal yaratilmoqda",
            steps: ["{pair} juftligini olaman", "{mode} rejimini qo‘llayman", "Yo‘nalishni yarataman", "{expiry} taymerini ishga tushiraman"],
            up: "Yuqoriga",
            down: "Pastga",
            issued: "Berildi",
            left: "Qoldi",
            expired: "tugadi",
            again: "Yangi signal",
            recent: "Oxirgilar",
            yourTime: "Sizning vaqtingiz",
            brokerSub: "Broker saytiga o‘tish",
            expiredMsg: "⏱ Ekspiratsiya vaqti tugadi",
            expiredToast: (p) => `⏱ ${p} bo‘yicha savdo vaqti tugadi`,
            chart: (s) => `${s} · Binance · so‘nggi soat. Ma’lumot uchun haqiqiy narx, bashorat emas.`,
        },
        picker: {
            search: "Qidirish",
            nothing: "Hech narsa topilmadi",
            cats: { all: "Barchasi", fiat: "Valyutalar", crypto: "Kripto", commod: "Xomashyo", stocks: "Aksiyalar", indices: "Indekslar" },
            vipOnly: "VIP’da mavjud",
            modeNote: "Rejim — faqat preset nomi. Barcha rejimlarda signal yo‘nalishi tasodifiy.",
        },
        expiry: {
            S3: "Uch soniya", S5: "Juda qisqa", S10: "O‘n soniya", S15: "Qisqa", S30: "Yarim daqiqa", M1: "Bir daqiqa",
            M3: "Uch daqiqa", M5: "Besh daqiqa", M30: "Yarim soat", H1: "Bir soat", H4: "To‘rt soat",
        },
        calc: {
            title: "Xavf kalkulyatori",
            hint: "bitta savdoga qancha qo‘yish kerak",
            deposit: "Depozitingiz",
            stake: "Savdo summasi",
            min: "Brokerdagi eng kam savdo — 1$. Depozit yoki foizni oshiring.",
            empty: "Depozit summasini kiriting.",
        },
        hours: {
            closed: "Yopiq",
            opensFx: (w) => `Birja yopiq · ochiladi ${w}`,
            opensStock: "Birja yopiq · dushanba kuni ochiladi",
            warnFx: (p, w) => `${p} dam olish kunlari yopiq, odatda ${w} ochiladi. OTC juftliklari kecha-kunduz ishlaydi.`,
            warnStock: (p) => `${p} dam olish kunlari yopiq. OTC juftliklari kecha-kunduz ishlaydi.`,
        },
        top: {
            title: "Reyting",
            you: "Siz",
            noData: "Hozircha natija yo‘q",
            need: (n) => `Reytingga kirish uchun ${n} ta savdo kerak`,
            demo: "Demo-ma’lumotlar",
            resetWeek: (d, h) => `Yangi hafta ${d} kun ${h} soatdan keyin`,
            resetMonth: (d, h) => `Yangi oy ${d} kun ${h} soatdan keyin`,
            week: "Hafta", month: "Oy", all: "Butun vaqt",
            row: (w, l) => `${w} foyda · ${l} zarar`,
            meRow: (w, l) => `${w} foyda · ${l} zarar`,
            guest: "Siz",
        },
        status: { open: "Birja ochiq", closed: "Birja yopiq", crypto: "Kripto · 24/7" },
        common: {
            risk: "Signallar tasodifiy va investitsiya maslahati emas. Binar optsionlar savdosida pul yo‘qotish xavfi yuqori.",
            vipToast: "VIP versiyasida mavjud",
        },
    },

    ar: {
        langMenu: "لغة التطبيق",
        tabs: { home: "الرئيسية", signal: "الإشارة", top: "المتصدرون" },
        tier: { basic: "Basic", vip: "VIP" },
        hello: (n) => (n ? `مرحبًا، ${n}` : "مرحبًا"),
        market: {
            title: "العملات الرقمية الآن",
            more: "الكل",
            less: "إخفاء",
            source: "الأسعار من Binance وCoinGecko، تُحدَّث كل 30 ثانية",
            error: "تعذّر تحميل الأسعار. تحقّق من الاتصال.",
        },
        faq: {
            title: "أسئلة",
            items: [
                ["من أين تأتي الإشارات؟",
                    "يتم اختيار الاتجاه «صعود» أو «هبوط» عشوائيًا. هذه إشارة تجريبية للتدريب، وليست توقعًا للسوق ولا نصيحة استثمارية."],
                ["ماذا يضيف VIP؟",
                    "أدوات أكثر وجميع الأوضاع. لا يغيّر VIP الاتجاه: فهو عشوائي أيضًا."],
                ["هل إيداعي آمن؟",
                    "الخيارات الثنائية عالية المخاطر: يخسر معظم المتداولين أموالهم. تداول فقط بمبلغ أنت مستعد لخسارته."],
            ],
        },
        signal: {
            title: "الإشارة",
            pair: "الأداة",
            expiry: "مدة الانتهاء",
            mode: "الوضع",
            get: "احصل على إشارة",
            choose: "اختر",
            demoTag: "إشارة تجريبية عشوائية",
            generating: "جارٍ إنشاء الإشارة",
            steps: ["أختار الزوج {pair}", "أطبّق وضع {mode}", "أُنشئ الاتجاه", "أشغّل مؤقّت {expiry}"],
            up: "صعود",
            down: "هبوط",
            issued: "صدرت",
            left: "المتبقي",
            expired: "انتهت",
            again: "إشارة جديدة",
            recent: "الأخيرة",
            yourTime: "وقتك",
            brokerSub: "الانتقال إلى موقع الوسيط",
            expiredMsg: "⏱ انتهت مدة الصفقة",
            expiredToast: (p) => `⏱ انتهى وقت صفقة ${p}`,
            chart: (s) => `${s} · Binance · آخر ساعة. سعر حقيقي للاطلاع، وليس توقعًا.`,
        },
        picker: {
            search: "بحث",
            nothing: "لا توجد نتائج",
            cats: { all: "الكل", fiat: "العملات", crypto: "رقمية", commod: "سلع", stocks: "أسهم", indices: "مؤشرات" },
            vipOnly: "متاح في VIP",
            modeNote: "الوضع مجرد اسم لإعداد مسبق. اتجاه الإشارة عشوائي في جميع الأوضاع.",
        },
        expiry: {
            S3: "ثلاث ثوانٍ", S5: "قصيرة جدًا", S10: "عشر ثوانٍ", S15: "قصيرة", S30: "نصف دقيقة", M1: "دقيقة",
            M3: "ثلاث دقائق", M5: "خمس دقائق", M30: "نصف ساعة", H1: "ساعة", H4: "أربع ساعات",
        },
        calc: {
            title: "حاسبة المخاطر",
            hint: "كم تضع في الصفقة",
            deposit: "إيداعك",
            stake: "مبلغ الصفقة",
            min: "الحد الأدنى للصفقة لدى الوسيط 1$. زد الإيداع أو النسبة.",
            empty: "أدخل مبلغ الإيداع.",
        },
        hours: {
            closed: "مغلق",
            opensFx: (w) => `السوق مغلق · يفتح ${w}`,
            opensStock: "السوق مغلق · يفتح يوم الاثنين",
            warnFx: (p, w) => `${p} مغلق في عطلة نهاية الأسبوع ويفتح عادةً ${w}. أزواج OTC تعمل على مدار الساعة.`,
            warnStock: (p) => `${p} مغلق في عطلة نهاية الأسبوع. أزواج OTC تعمل على مدار الساعة.`,
        },
        top: {
            title: "المتصدرون",
            you: "أنت",
            noData: "لا توجد نتائج بعد",
            need: (n) => `تحتاج إلى ${n} صفقة للدخول في التصنيف`,
            demo: "بيانات تجريبية",
            resetWeek: (d, h) => `أسبوع جديد بعد ${d} يوم و${h} ساعة`,
            resetMonth: (d, h) => `شهر جديد بعد ${d} يوم و${h} ساعة`,
            week: "أسبوع", month: "شهر", all: "كل الوقت",
            row: (w, l) => `${w} ربح · ${l} خسارة`,
            meRow: (w, l) => `${w} ربح · ${l} خسارة`,
            guest: "أنت",
        },
        status: { open: "السوق مفتوح", closed: "السوق مغلق", crypto: "رقمية · 24/7" },
        common: {
            risk: "الإشارات عشوائية وليست نصيحة استثمارية. تداول الخيارات الثنائية ينطوي على مخاطر عالية لخسارة الأموال.",
            vipToast: "متاح في نسخة VIP",
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
    { id: "S3", seconds: 3 },
    { id: "S5", seconds: 5 },
    { id: "S10", seconds: 10 },
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
    { id: "bitcoin", binance: "BTCUSDT", sym: "BTC", name: "Bitcoin", icon: "btc" },
    { id: "ethereum", binance: "ETHUSDT", sym: "ETH", name: "Ethereum", icon: "eth" },
    { id: "solana", binance: "SOLUSDT", sym: "SOL", name: "Solana", icon: "sol" },
    { id: "ripple", binance: "XRPUSDT", sym: "XRP", name: "XRP", icon: "xrp" },
    { id: "litecoin", binance: "LTCUSDT", sym: "LTC", name: "Litecoin", icon: "ltc" },
    { id: "cardano", binance: "ADAUSDT", sym: "ADA", name: "Cardano", icon: "ada" },
    { id: "polkadot", binance: "DOTUSDT", sym: "DOT", name: "Polkadot", icon: "dot" },
    { id: "chainlink", binance: "LINKUSDT", sym: "LINK", name: "Chainlink", icon: "link" },
    { id: "avalanche-2", binance: "AVAXUSDT", sym: "AVAX", name: "Avalanche", icon: "avax" },
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
const KEY_FORM = "gtpo_form_v1";
const KEY_RECENT = "gtpo_recent_pairs_v1";
const KEY_CALC = "gtpo_calc_v1";

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

/* ---------------------------------------------------------------- навигация */

let currentView = "home";

function showView(name) {
    while (openSheets.length) closeTopSheet();
    closeLangMenu();
    currentView = name;
    $$("[data-view]").forEach((v) => v.classList.toggle("is-active", v.dataset.view === name));
    $$("[data-tab]").forEach((b) => {
        const on = b.dataset.tab === name;
        b.classList.toggle("is-active", on);
        if (on) b.setAttribute("aria-current", "page");
        else b.removeAttribute("aria-current");
    });
    window.scrollTo({ top: 0 });
    if (name === "top") loadLeaderboard();
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
    if (sheet.dataset.signalSheet !== undefined) {
        stopCountdown();
        stopLoadingSteps();
        generating = false;
    }
}

function closeTopSheet() {
    const top = openSheets[openSheets.length - 1];
    if (top) closeSheet(top);
}

/* ---------------------------------------------------------------- шапка и язык */

function renderChrome() {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
    $$("[data-i18n]").forEach((node) => {
        const v = T(node.dataset.i18n);
        if (typeof v === "string") node.textContent = v;
    });
    $("[data-lang-btn-code]").textContent = lang.toUpperCase();
    $("[data-lang-btn-flag]").innerHTML = FLAGS[lang];

    const chip = $("[data-tier-chip]");
    chip.textContent = T(IS_VIP ? "tier.vip" : "tier.basic");
    chip.classList.toggle("is-vip", IS_VIP);

    // Имя есть только внутри Telegram; если имени нет — username, иначе просто «Привет»
    const name = TG_USER ? (TG_USER.first_name || TG_USER.username || "").trim() : "";
    $("[data-hello]").textContent = T("hello")(name);
    $("[data-pair-search]").placeholder = T("picker.search");
}

/* ---------------------------------------------------------------- меню языков */

function renderLangMenu() {
    const menu = $("[data-lang-menu]");
    menu.replaceChildren(el("p", "lang-menu__title", T("langMenu")));
    LANGS.forEach((code) => {
        const item = el("button", "lang-item" + (code === lang ? " is-active" : ""));
        item.type = "button";
        item.setAttribute("role", "menuitemradio");
        item.setAttribute("aria-checked", String(code === lang));
        const text = el("span");
        text.append(el("span", "lang-item__name", LANG_META[code].name),
            el("span", "lang-item__sub", LANG_META[code].sub));
        item.append(flagEl(code), text);
        if (code === lang) {
            const check = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            check.setAttribute("viewBox", "0 0 24 24");
            check.setAttribute("class", "lang-item__check");
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M5 12.5l4.5 4.5L19 7.5");
            check.append(path);
            item.append(check);
        } else {
            item.append(el("span"));
        }
        item.addEventListener("click", () => {
            haptic("select");
            closeLangMenu();
            if (code !== lang) setLang(code);
        });
        menu.append(item);
    });
}

function openLangMenu() {
    renderLangMenu();
    $("[data-lang-menu]").hidden = false;
    $("[data-lang-backdrop]").hidden = false;
    $("[data-lang-btn]").setAttribute("aria-expanded", "true");
    const active = $(".lang-item.is-active");
    if (active) active.focus({ preventScroll: true });
}

function closeLangMenu() {
    $("[data-lang-menu]").hidden = true;
    $("[data-lang-backdrop]").hidden = true;
    $("[data-lang-btn]").setAttribute("aria-expanded", "false");
}

function setLang(next) {
    lang = next;
    store.set(KEY_LANG, lang);
    renderAll();
}

function renderAll() {
    renderChrome();
    renderLeaderboard();
    renderCalc();
    renderMarket();
    renderFaq();
    renderForm();
    renderRecent();
}

/* ---------------------------------------------------------------- главная */

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

const KEY_PRICES = "gtpo_prices_v1";
const PRICE_INTERVAL = 30000;      // обычное обновление
const PRICE_MAX_BACKOFF = 300000;  // при ошибках — не чаще раза в 5 минут
let priceDelay = PRICE_INTERVAL;
let priceTimer = null;
let geckoNextAt = 0;

// Binance: одна заявка на все монеты, высокие лимиты
async function pricesFromBinance() {
    const symbols = MARKET_ASSETS.filter((a) => a.binance).map((a) => a.binance);
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbols=" +
        encodeURIComponent(JSON.stringify(symbols)));
    if (!res.ok) throw new Error("binance_" + res.status);
    const out = {};
    for (const row of await res.json()) {
        const asset = MARKET_ASSETS.find((a) => a.binance === row.symbol);
        if (asset) out[asset.id] = { usd: +row.lastPrice, usd_24h_change: +row.priceChangePercent };
    }
    return out;
}

// CoinGecko: запасной источник и монеты, которых нет на Binance
async function pricesFromCoinGecko(ids) {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=" +
        encodeURIComponent(ids.join(",")) + "&vs_currencies=usd&include_24hr_change=true");
    if (!res.ok) throw new Error("coingecko_" + res.status);
    return res.json();
}

async function loadMarket() {
    const fresh = {};
    try {
        Object.assign(fresh, await pricesFromBinance());
    } catch (e) {
        console.warn("Binance недоступен:", e.message);
    }
    // CoinGecko строже ограничивает запросы: не чаще раза в 2 минуты, после отказа — раз в 5
    const missing = MARKET_ASSETS.filter((a) => !fresh[a.id]).map((a) => a.id);
    if (missing.length && Date.now() >= geckoNextAt) {
        try {
            Object.assign(fresh, await pricesFromCoinGecko(missing));
            geckoNextAt = Date.now() + 120000;
        } catch (e) {
            geckoNextAt = Date.now() + 300000;
            console.warn("CoinGecko недоступен:", e.message);
        }
    }

    const gotAny = Object.keys(fresh).length > 0;
    if (gotAny) {
        marketData = Object.assign({}, marketData, fresh);
        store.set(KEY_PRICES, marketData);
        marketError = false;
        priceDelay = PRICE_INTERVAL;
    } else {
        marketError = true;
        priceDelay = Math.min(priceDelay * 2, PRICE_MAX_BACKOFF);
    }
    renderMarket();
    schedulePrices();
}

function schedulePrices() {
    clearTimeout(priceTimer);
    if (document.hidden) return;              // свёрнуто — не тратим запросы
    priceTimer = setTimeout(loadMarket, priceDelay);
}

function initPrices() {
    marketData = store.get(KEY_PRICES, null);  // последние известные цены — сразу
    renderMarket();
    loadMarket();
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) clearTimeout(priceTimer);
        else loadMarket();
    });
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
    renderCatRow();
    renderPairGrid();
    renderExpGrid();
    renderModeGrid();
    renderStatus();
    renderPickValues();
    $("[data-get-signal]").disabled = !(form.pair && form.expiry && form.mode);

    const warn = $("[data-market-warn]");
    const st = form.pair ? marketStatus(form.pair) : null;
    warn.hidden = !(st && st.closed);
    if (st && st.closed) {
        warn.textContent = st.kind === "fx"
            ? T("hours.warnFx")(form.pair.name, st.opensText)
            : T("hours.warnStock")(form.pair.name);
    }
}

/* ---------------------------------------------------------------- выбор на экране: пары, экспирация, режим */

// Единые линейные иконки режимов (статичные SVG из кода)
const MODE_ICONS = {
    orion: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
    mega: '<svg viewBox="0 0 24 24"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>',
    atlas: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    unity: '<svg viewBox="0 0 24 24"><path d="M8 8.5a3.5 3.5 0 1 0 0 7c2.5 0 5.5-7 8-7a3.5 3.5 0 1 1 0 7c-2.5 0-5.5-7-8-7z"/></svg>',
};
const pairUi = { cat: "all", term: "" };

function selectPair(p, fromPicker = false) {
    form.pair = p;
    haptic("select");
    saveForm();
    renderForm();
    renderRecent();
    if (fromPicker) afterPick();
}

function renderCatRow() {
    const row = $("[data-cat-row]");
    row.replaceChildren();
    ["all", ...PAIR_CATS].forEach((cat) => {
        const b = el("button", cat === pairUi.cat ? "is-active" : "", T("picker.cats." + cat));
        b.type = "button";
        b.addEventListener("click", () => {
            pairUi.cat = cat;
            haptic("select");
            renderCatRow();
            renderPairGrid();
        });
        row.append(b);
    });
}

function renderPairGrid() {
    const grid = $("[data-pair-grid]");
    grid.replaceChildren();
    const term = pairUi.term.trim().toLowerCase();
    let items = pairUi.cat === "all" ? ALL_PAIRS : ALL_PAIRS.filter((p) => p.cat === pairUi.cat);
    if (term) items = ALL_PAIRS.filter((p) => p.name.toLowerCase().includes(term));
    // доступные и открытые — выше
    const rank = (p) => (isPairAllowed(p.id) ? 0 : 2) + (marketStatus(p).closed ? 1 : 0);
    items = items.slice().sort((a, b) => rank(a) - rank(b));
    if (!items.length) {
        grid.append(el("p", "empty", T("picker.nothing")));
        return;
    }
    items.forEach((p) => {
        const allowed = isPairAllowed(p.id);
        const closed = marketStatus(p).closed;
        const tile = el("button", "tile" + (form.pair && form.pair.id === p.id ? " is-selected" : "")
            + (allowed ? "" : " is-locked"), p.name);
        tile.type = "button";
        if (!allowed) tile.append(el("span", "tile__tag", "VIP"));
        else if (closed) tile.append(el("span", "tile__tag is-closed", T("hours.closed")));
        tile.addEventListener("click", () => {
            if (!allowed) {
                haptic("warning");
                toast(T("common.vipToast"));
                return;
            }
            selectPair(p, true);
        });
        grid.append(tile);
    });
}

function renderExpGrid() {
    const grid = $("[data-exp-grid]");
    grid.replaceChildren();
    EXPIRY_PRESETS.forEach((e) => {
        const tile = el("button", "tile" + (form.expiry && form.expiry.id === e.id ? " is-selected" : ""), e.id);
        tile.type = "button";
        tile.title = T("expiry." + e.id);
        tile.addEventListener("click", () => {
            form.expiry = e;
            haptic("select");
            saveForm();
            renderForm();
            afterPick();
        });
        grid.append(tile);
    });
}

function renderModeGrid() {
    const grid = $("[data-mode-grid]");
    grid.replaceChildren();
    MODES.forEach((m) => {
        const allowed = isModeAllowed(m.id);
        const card = el("button", "mode-card" + (form.mode && form.mode.id === m.id ? " is-selected" : "")
            + (allowed ? "" : " is-locked"));
        card.type = "button";
        const icon = el("span", "mode-card__icon");
        icon.innerHTML = MODE_ICONS[m.id] || "";
        card.append(icon, el("span", "mode-card__name", m.title));
        if (!allowed) card.append(el("span", "mode-card__sub", T("picker.vipOnly")));
        card.addEventListener("click", () => {
            if (!allowed) {
                haptic("warning");
                toast(T("common.vipToast"));
                return;
            }
            form.mode = m;
            haptic("select");
            saveForm();
            renderForm();
            afterPick();
        });
        grid.append(card);
    });
    let note = grid.nextElementSibling;
    if (!note || !note.classList.contains("mode-note")) {
        note = el("p", "mode-note");
        grid.after(note);
    }
    note.textContent = T("picker.modeNote");
}

/* ---------------------------------------------------------------- строки выбора и окно выбора */

function renderPickValues() {
    const values = {
        pair: form.pair && form.pair.name,
        time: form.expiry && form.expiry.id,
        mode: form.mode && form.mode.title,
    };
    $$("[data-pick]").forEach((row) => {
        const v = values[row.dataset.pick];
        const out = $("[data-pick-value]", row);
        out.textContent = v || T("signal.choose");
        out.classList.toggle("is-empty", !v);
    });
}

const PICK_TITLES = { pair: "signal.pair", time: "signal.expiry", mode: "signal.mode" };
let pickOpen = null;

function openPick(name) {
    pickOpen = name;
    $("[data-picker-title]").textContent = T(PICK_TITLES[name]);
    $$("[data-pick-body]").forEach((b) => (b.hidden = b.dataset.pickBody !== name));
    if (name === "pair") {
        if (form.pair && !pairUi.term) pairUi.cat = "all";
        renderCatRow();
        renderPairGrid();
    }
    haptic("select");
    openSheet($("[data-picker]"));
    // выбранная пара — сразу в поле зрения (прокручиваем только список, не окно)
    const grid = $("[data-pair-grid]");
    const sel = name === "pair" && $(".is-selected", grid);
    grid.scrollTop = sel ? Math.max(0, sel.offsetTop - grid.offsetTop - grid.clientHeight / 2 + sel.offsetHeight / 2) : 0;
}

function afterPick() {
    closeSheet($("[data-picker]"));
    pickOpen = null;
}

function renderStatus() {
    const box = $("[data-status]");
    if (!form.pair) {
        box.hidden = true;
        return;
    }
    const st = marketStatus(form.pair);
    const isOtc = form.pair.market === "OTC" || form.pair.cat === "crypto";
    box.hidden = false;
    box.classList.toggle("is-closed", !!st.closed);
    $("[data-status-text]").textContent = st.closed
        ? T("status.closed")
        : isOtc ? (form.pair.market === "OTC" ? "OTC · 24/7" : T("status.crypto")) : T("status.open");
}

function tickClock() {
    $("[data-clock]").textContent = hhmm(Date.now());
    tickReset();
}

function openBroker() {
    haptic("medium");
    const url = BROKER_URL;
    try {
        if (tg && tg.openLink) tg.openLink(url);
        else window.open(url, "_blank", "noopener");
    } catch {
        window.open(url, "_blank", "noopener");
    }
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
    const bar = $("[data-sig-timebar]");
    const card = $("[data-sig]");
    const tick = () => {
        if (!currentSignal) return;
        const total = currentSignal.validUntil - currentSignal.issuedAt;
        const left = currentSignal.validUntil - Date.now();
        out.textContent = fmtLeft(left);
        bar.style.width = Math.max(0, Math.min(100, (left / total) * 100)) + "%";
        const expired = left <= 0;
        card.classList.toggle("is-expired", expired);
        $("[data-sig-expired]").hidden = !expired;
        if (expired) stopCountdown();
    };
    $("[data-sig-expired]").textContent = T("signal.expiredMsg");
    tick();
    countdownTimer = setInterval(tick, 1000);
}

// Уведомление об окончании экспирации — даже если карточка уже закрыта
let expiryTimer = null;
function scheduleExpiryAlert(sig) {
    clearTimeout(expiryTimer);
    const ms = sig.validUntil - Date.now();
    if (ms <= 0) return;
    expiryTimer = setTimeout(() => {
        if (currentSignal !== sig) return;
        haptic("warning");
        try {
            if (tg && tg.HapticFeedback) setTimeout(() => tg.HapticFeedback.impactOccurred("heavy"), 250);
        } catch { /* старый клиент */ }
        if (!$("[data-signal-sheet]").classList.contains("is-open")) toast(T("signal.expiredToast")(sig.pair));
    }, ms);
}

function renderSignal(sig) {
    const dir = $("[data-sig-dir]");
    dir.classList.toggle("is-down", sig.direction === "down");
    // перезапуск сценария появления (стрелка, волны, частицы, текст)
    const card = $("[data-sig]");
    card.classList.remove("is-reveal");
    void card.offsetWidth;
    card.classList.add("is-reveal");
    $("[data-sig-dir-text]").textContent = T("signal." + sig.direction);
    $("[data-sig-pair]").textContent = sig.pair;
    $("[data-sig-expiry]").textContent = sig.expiry;
    $("[data-sig-issued]").textContent = hhmm(sig.issuedAt);

    startCountdown();
    loadChart(sig);
}

const STEP_MS = 650;           // длительность одного шага анимации
let loadingTimers = [];

function stopLoadingSteps() {
    loadingTimers.forEach(clearTimeout);
    loadingTimers = [];
}

function buildLoadingSteps() {
    const list = $("[data-sig-steps]");
    list.replaceChildren();
    T("signal.steps").forEach((tpl) => {
        const text = tpl.replace("{pair}", form.pair.name).replace("{expiry}", form.expiry.id)
            .replace("{mode}", form.mode.title);
        const li = el("li", "step");
        const icon = el("span", "step__icon");
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 16 16");
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M3.5 8.5l3 3 6-6.5");
        svg.append(path);
        icon.append(svg);
        li.append(icon, el("span", null, text));
        list.append(li);
    });
    return $$(".step", list);
}

function requestSignal() {
    if (generating || !(form.pair && form.expiry && form.mode)) return;
    generating = true;
    haptic("medium");
    const sheet = $("[data-signal-sheet]");
    stopLoadingSteps();
    $("[data-sig-loading]").hidden = false;
    $("[data-sig]").hidden = true;
    $("[data-sig-loading-pair]").textContent = `${form.pair.name} · ${form.expiry.id} · ${form.mode.title}`;
    if (!sheet.classList.contains("is-open")) openSheet(sheet);

    // Шаги по очереди: крутящийся кружок → галочка
    const steps = buildLoadingSteps();
    const bar = $("[data-sig-steps-bar]");
    bar.style.width = "0";
    steps.forEach((step, i) => {
        loadingTimers.push(setTimeout(() => {
            if (i > 0) steps[i - 1].classList.replace("is-active", "is-done");
            step.classList.add("is-active");
            bar.style.width = `${(i / steps.length) * 100 + 8}%`;
            if (i > 0) haptic("select");
        }, i * STEP_MS));
    });

    loadingTimers.push(setTimeout(() => {
        steps[steps.length - 1].classList.replace("is-active", "is-done");
        bar.style.width = "100%";
    }, steps.length * STEP_MS));

    loadingTimers.push(setTimeout(() => {
        currentSignal = generateSignal(form);
        pushRecent(form.pair.id);
        scheduleExpiryAlert(currentSignal);
        generating = false;
        $("[data-sig-loading]").hidden = true;
        $("[data-sig]").hidden = false;
        renderSignal(currentSignal);
        haptic("success");
    }, steps.length * STEP_MS + 450));
}

/* ---------------------------------------------------------------- калькулятор риска */

const RISK_OPTIONS = [5, 8, 10, 15];
const calc = Object.assign({ deposit: "", risk: 5 }, store.get(KEY_CALC, {}));
if (!RISK_OPTIONS.includes(calc.risk)) calc.risk = RISK_OPTIONS[0];

function parseMoney(v) {
    const n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
}

function fmtMoney(n) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: n < 100 ? 2 : 0, maximumFractionDigits: 2 });
}

function renderCalc() {
    const input = $("[data-calc-deposit]");
    if (document.activeElement !== input) input.value = calc.deposit;
    const group = $("[data-calc-risk]");
    group.replaceChildren();
    RISK_OPTIONS.forEach((r) => {
        const b = el("button", null, r + "%");
        b.type = "button";
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(calc.risk === r));
        b.addEventListener("click", () => {
            calc.risk = r;
            store.set(KEY_CALC, calc);
            haptic("select");
            renderCalc();
        });
        group.append(b);
    });

    const deposit = parseMoney(calc.deposit);
    const stake = Math.floor(deposit * calc.risk) / 100;
    const out = $("[data-calc-stake]");
    const note = $("[data-calc-note]");
    if (!deposit) {
        out.textContent = "—";
        note.textContent = T("calc.empty");
    } else if (stake < 1) {
        out.textContent = fmtMoney(stake);
        note.textContent = T("calc.min");
    } else {
        out.textContent = fmtMoney(stake);
        note.textContent = "";
    }
    note.hidden = !note.textContent;
}

/* ---------------------------------------------------------------- недавние пары */

function pushRecent(id) {
    const list = store.get(KEY_RECENT, []).filter((x) => x !== id);
    list.unshift(id);
    store.set(KEY_RECENT, list.slice(0, 6));
    renderRecent();
}

function renderRecent() {
    const ids = store.get(KEY_RECENT, []);
    const pairs = ids.map((id) => ALL_PAIRS.find((p) => p.id === id)).filter((p) => p && isPairAllowed(p.id));
    const box = $("[data-recent]");
    box.hidden = pairs.length === 0;
    const chips = $("[data-recent-chips]");
    chips.replaceChildren();
    pairs.forEach((p) => {
        const b = el("button", "chip" + (form.pair && form.pair.id === p.id ? " is-selected" : ""), p.name);
        b.type = "button";
        b.addEventListener("click", () => {
            form.pair = p;
            haptic("select");
            saveForm();
            renderForm();
            renderRecent();
        });
        chips.append(b);
    });
}

/* ---------------------------------------------------------------- часы работы рынка
   OTC и криптовалюты торгуются круглосуточно. Биржевые пары закрыты на выходные:
   валюты и сырьё — примерно с пт 22:00 до вс 22:00 UTC, акции и индексы — сб–вс. */

const WEEKDAY = {
    ru: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    es: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
    hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
    kk: ["жс", "дс", "сс", "ср", "бс", "жм", "сб"],
    ky: ["жк", "дш", "шй", "шр", "бш", "жм", "иш"],
    uz: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
    ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};

function marketStatus(pair, now = new Date()) {
    if (pair.market === "OTC" || pair.cat === "crypto") return { closed: false };
    const kind = pair.cat === "fiat" || pair.cat === "commod" ? "fx" : "stock";
    const d = now.getUTCDay();
    const h = now.getUTCHours();
    if (kind === "fx") {
        const closed = (d === 5 && h >= 22) || d === 6 || (d === 0 && h < 22);
        if (!closed) return { closed: false, kind };
        const open = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22, 0));
        open.setUTCDate(open.getUTCDate() + ((7 - d) % 7));    // ближайшее воскресенье
        const opensText = `${(WEEKDAY[lang] || WEEKDAY.en)[open.getDay()]} ${hhmm(open.getTime())}`;
        return { closed: true, kind, opensText };
    }
    return { closed: d === 6 || d === 0, kind };
}

/* ---------------------------------------------------------------- график (только реальные крипто-пары) */

const CHART_SYMBOLS = { Bitcoin: "BTCUSDT", Ethereum: "ETHUSDT", Chainlink: "LINKUSDT", Dash: "DASHUSDT" };
let chartReq = 0;

async function loadChart(sig) {
    const fig = $("[data-sig-chart]");
    const pair = ALL_PAIRS.find((p) => p.name === sig.pair);
    const symbol = pair && CHART_SYMBOLS[pair.id];
    fig.hidden = true;
    if (!symbol) return;                 // OTC и валюты — котировки брокера, данных нет
    const req = ++chartReq;
    try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=60`);
        if (!res.ok) throw new Error("http_" + res.status);
        const closes = (await res.json()).map((k) => +k[4]);
        if (req !== chartReq || closes.length < 2) return;
        const min = Math.min(...closes), max = Math.max(...closes);
        const span = max - min || 1;
        const pts = closes.map((c, i) => [(i / (closes.length - 1)) * 300, 76 - ((c - min) / span) * 70]);
        const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
        $("[data-chart-line]").setAttribute("d", line);
        $("[data-chart-area]").setAttribute("d", `${line} L300 80 L0 80 Z`);
        // Цвет — по реальному движению цены за час, а не по направлению сигнала
        fig.classList.toggle("is-down", closes[closes.length - 1] < closes[0]);
        $("[data-chart-caption]").textContent = T("signal.chart")(symbol.replace("USDT", "/USDT"));
        fig.hidden = false;
    } catch (e) {
        console.warn("График недоступен:", e.message);
    }
}

/* ---------------------------------------------------------------- полноэкранный режим Telegram */

function applyInsets() {
    if (!tg) return;
    const top = tg.isFullscreen
        ? ((tg.safeAreaInset && tg.safeAreaInset.top) || 0) + ((tg.contentSafeAreaInset && tg.contentSafeAreaInset.top) || 0)
        : 0;
    document.documentElement.style.setProperty("--top-inset", top + "px");
}

function initFullscreen() {
    const ver = (v) => tg.isVersionAtLeast && tg.isVersionAtLeast(v);
    if (ver("7.7") && tg.disableVerticalSwipes) tg.disableVerticalSwipes();   // не закрывать свайпом при прокрутке
    if (!ver("8.0")) return;
    ["fullscreenChanged", "safeAreaChanged", "contentSafeAreaChanged"].forEach((ev) => tg.onEvent(ev, applyInsets));
    if (["ios", "android"].includes(tg.platform) && tg.requestFullscreen) {
        try { tg.requestFullscreen(); } catch { /* клиент не поддерживает */ }
    }
    applyInsets();
}

/* ---------------------------------------------------------------- лидерборд (превью)
   До запуска рейтинга показываем только оформление: вместо имён и цифр — заглушки.
   Настоящие данные подключатся, когда бот переедет на сервер. */

const CUP_COLORS = { 1: ["#FFD978", "#E59E1F"], 2: ["#EEF2F8", "#9AA6BC"], 3: ["#F2B587", "#B36A36"] };

function cupSvg(place) {
    const [a, b] = CUP_COLORS[place];
    const id = "cup-g" + place;
    return `<svg class="pod__cup" viewBox="0 0 48 48" aria-hidden="true">
        <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
        <path fill="url(#${id})" d="M14 6h20v10a10 10 0 0 1-20 0zM14 9H7v3a7 7 0 0 0 7 7zM34 9h7v3a7 7 0 0 1-7 7zM21 26h6v8h-6zM15 36h18v6H15z"/>
        <text x="24" y="17" text-anchor="middle" font-size="10" font-weight="800" fill="rgba(0,0,0,0.45)">${place}</text>
    </svg>`;
}

// В аватарке: для «ID ****3214» — две последние цифры, иначе первая буква
function initials(name) {
    const n = (name || "").trim();
    if (/^ID \*+\d+$/.test(n)) return n.slice(-2);
    return (n || "★").slice(0, 1).toUpperCase();
}

function maskedId(id) {
    return id ? `ID ****${String(id).slice(-4)}` : "";
}

function renderLeaderboardSkeleton() {
    const podium = $("[data-podium]");
    podium.replaceChildren();
    podium.setAttribute("aria-hidden", "true");
    [2, 1, 3].forEach((place) => {
        const col = el("div", "pod pod--" + place);
        col.insertAdjacentHTML("beforeend", cupSvg(place));   // статичный SVG из кода
        col.append(el("span", "avatar skel"), el("span", "skel pod__name"), el("span", "skel pod__val"),
            el("div", "pod__base", String(place)));
        podium.append(col);
    });
    const list = $("[data-lb]");
    list.replaceChildren();
    list.setAttribute("aria-hidden", "true");
    for (let i = 4; i <= 10; i++) {
        const li = el("li");
        const lines = el("span", "lb__lines");
        lines.append(el("span", "skel lb__l1"), el("span", "skel lb__l2"));
        li.append(el("span", "lb-rank", String(i)), el("span", "avatar skel"), lines, el("span", "skel lb__val"));
        list.append(li);
    }
}

let lastBoard = null;
const DEFAULT_MIN_TRADES = 20;   // как на сервере (leaderboard.MIN_TRADES)

function renderLeaderboardData(data) {
    lastBoard = data;
    const rows = data.rows || [];
    const podium = $("[data-podium]");
    podium.replaceChildren();
    podium.removeAttribute("aria-hidden");
    [2, 1, 3].forEach((place) => {
        const r = rows[place - 1];
        const col = el("div", "pod pod--" + place);
        col.insertAdjacentHTML("beforeend", cupSvg(place));
        if (r) {
            col.append(el("span", "avatar avatar--real", initials(r.name)), el("span", "pod__nm", r.name),
                el("span", "pod__rate", Math.round(r.win_rate) + "%"), el("span", "pod__wl", `${r.wins} / ${r.losses}`));
        } else {
            col.append(el("span", "avatar skel"), el("span", "skel pod__name"), el("span", "skel pod__val"));
        }
        col.append(el("div", "pod__base", String(place)));
        podium.append(col);
    });

    const list = $("[data-lb]");
    list.replaceChildren();
    list.removeAttribute("aria-hidden");
    rows.slice(3).forEach((r) => {
        const li = el("li", r.is_me ? "is-me" : "");
        const lines = el("span", "lb__lines");
        lines.append(el("span", "lb__name", r.name), el("span", "lb__sub", T("top.row")(r.wins, r.losses)));
        li.append(el("span", "lb-rank", String(r.rank)), el("span", "avatar avatar--real", initials(r.name)),
            lines, el("span", "lb__rate", Math.round(r.win_rate) + "%"));
        list.append(li);
    });

    const me = data.me;
    $("[data-lb-me-rank]").textContent = me ? String(me.rank) : "—";
    $("[data-lb-me-sub]").textContent = me
        ? T("top.meRow")(me.wins, me.losses)
        : T("top.need")(data.min_trades || DEFAULT_MIN_TRADES);
    $("[data-top-demo]").hidden = !data.demo;
}

let topPeriod = "week";
let topEndsAt = null;   // когда текущий период рейтинга обнулится (с сервера)

// Таймер «Новая неделя через …»; когда время вышло — рейтинг перезагружается сам
function tickReset() {
    const note = $("[data-top-reset]");
    if (!topEndsAt || topPeriod === "all") {
        note.hidden = true;
        return;
    }
    const left = topEndsAt - Date.now();
    if (left <= 0) {
        topEndsAt = null;
        note.hidden = true;
        loadLeaderboard();
        return;
    }
    const d = Math.floor(left / 86400000);
    const h = Math.floor((left % 86400000) / 3600000);
    note.textContent = T(topPeriod === "week" ? "top.resetWeek" : "top.resetMonth")(d, h);
    note.hidden = false;
}
let topReq = 0;

async function loadLeaderboard() {
    if (!API_BASE) return;                    // без сервера — только превью
    const req = ++topReq;
    try {
        const res = await fetch(`${API_BASE}/api/leaderboard?period=${topPeriod}`, {
            headers: INIT_DATA ? { "X-Telegram-Init-Data": INIT_DATA } : {},
        });
        if (!res.ok) throw new Error("http_" + res.status);
        const data = await res.json();
        if (req !== topReq) return;
        topEndsAt = data.ends_at ? Date.parse(data.ends_at) : null;
        tickReset();
        if ((data.rows || []).length) renderLeaderboardData(data);
        else {
            lastBoard = null;
            renderLeaderboardSkeleton();
            $("[data-lb-me-sub]").textContent = T("top.need")(data.min_trades || DEFAULT_MIN_TRADES);
        }
    } catch (e) {
        console.warn("Лидерборд недоступен:", e.message);
    }
}

function renderLeaderboard() {
    // Переключатель периода показываем сразу, если есть сервер, — без скачка страницы
    $("[data-top-period]").hidden = !API_BASE;
    // Своя строка — тоже в виде ID, как у всех в рейтинге (в браузере без Telegram — «Вы»)
    const name = TG_USER && TG_USER.id ? maskedId(TG_USER.id) : "";
    $("[data-lb-me-name]").textContent = name || T("top.guest");
    $("[data-lb-me-avatar]").textContent = initials(name);
    if (lastBoard) {
        renderLeaderboardData(lastBoard);         // перерисовать на новом языке
    } else {
        if (!$("[data-podium]").childElementCount) renderLeaderboardSkeleton();
        $("[data-lb-me-sub]").textContent = T("top.need")(DEFAULT_MIN_TRADES);
    }
    loadLeaderboard();
}

/* ---------------------------------------------------------------- звёздное небо */

function initSky() {
    const canvas = $("[data-sky]");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, stars = [], shooting = null, nextShootAt = 0, raf = 0, lastTs = 0;

    function makeStar(anywhere) {
        const z = Math.random();                     // глубина: 0 — далеко, 1 — близко
        return {
            x: Math.random() * w,
            y: anywhere ? Math.random() * h : h + 4,
            z,
            r: 0.35 + z * 1.25,
            vy: 3 + z * 13,                          // px/с — ближние летят быстрее
            vx: 0.6 + z * 2.4,
            phase: Math.random() * Math.PI * 2,
            twinkle: 0.7 + Math.random() * 1.8,
            warm: Math.random() < 0.12,              // редкие тёплые звёзды
        };
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.round(Math.min(150, (w * h) / 3000));
        stars = Array.from({ length: count }, () => makeStar(true));
    }

    function drawStar(s, t) {
        const a = (0.35 + 0.65 * s.z) * (0.55 + 0.45 * Math.sin(t * s.twinkle + s.phase));
        ctx.fillStyle = s.warm ? `rgba(243,180,63,${a})` : `rgba(233,237,246,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.z > 0.82) {                            // мягкое свечение, плавно гаснет к краю
            const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
            glow.addColorStop(0, `rgba(233,237,246,${a * 0.22})`);
            glow.addColorStop(1, "rgba(233,237,246,0)");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function spawnShooting(t) {
        const fromX = w * (0.35 + Math.random() * 0.65);
        shooting = { x: fromX, y: -10, vx: -(260 + Math.random() * 160), vy: 170 + Math.random() * 90, life: 0, max: 1.1 };
        nextShootAt = t + 8 + Math.random() * 7;
    }

    function drawShooting(dt) {
        const s = shooting;
        s.life += dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const k = 1 - s.life / s.max;
        if (k <= 0) { shooting = null; return; }
        const len = 0.22;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * len, s.y - s.vy * len);
        grad.addColorStop(0, `rgba(255,255,255,${0.9 * k})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * len, s.y - s.vy * len);
        ctx.stroke();
    }

    function frame(ts) {
        const t = ts / 1000;
        const dt = Math.min(0.05, lastTs ? t - lastTs : 0.016);
        lastTs = t;
        ctx.clearRect(0, 0, w, h);
        for (const s of stars) {
            s.y -= s.vy * dt;
            s.x += s.vx * dt;
            if (s.y < -4 || s.x > w + 4) Object.assign(s, makeStar(false), { x: Math.random() * w });
            drawStar(s, t);
        }
        if (!nextShootAt) nextShootAt = t + 3;
        if (!shooting && t > nextShootAt) spawnShooting(t);
        if (shooting) drawShooting(dt);
        raf = requestAnimationFrame(frame);
    }

    function start() {
        if (raf || reduceMotion) return;
        lastTs = 0;
        raf = requestAnimationFrame(frame);
    }
    function stop() {
        cancelAnimationFrame(raf);
        raf = 0;
    }

    resize();
    if (reduceMotion) {
        stars.forEach((s) => drawStar(s, 0));     // статичное небо
    } else {
        start();
    }
    window.addEventListener("resize", () => {
        resize();
        if (reduceMotion) stars.forEach((s) => drawStar(s, 0));
    });
    // Свёрнутое приложение не тратит батарею
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
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
        initFullscreen();
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
        if ($("[data-lang-menu]").hidden) openLangMenu();
        else closeLangMenu();
    });
    $("[data-lang-backdrop]").addEventListener("click", closeLangMenu);

    $("[data-market-toggle]").addEventListener("click", () => {
        marketExpanded = !marketExpanded;
        renderMarket();
    });

    $("[data-pair-search]").addEventListener("input", (e) => {
        pairUi.term = e.target.value;
        renderPairGrid();
    });
    $("[data-broker]").addEventListener("click", openBroker);
    $$("[data-pick]").forEach((row) => row.addEventListener("click", () => openPick(row.dataset.pick)));

    $$("[data-close]").forEach((n) => n.addEventListener("click", () => closeSheet(n.closest(".sheet"))));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (!$("[data-lang-menu]").hidden) closeLangMenu();
            else closeTopSheet();
        }
    });

    $("[data-get-signal]").addEventListener("click", requestSignal);

    $$("[data-period]").forEach((b) => b.addEventListener("click", () => {
        topPeriod = b.dataset.period;
        $$("[data-period]").forEach((x) => x.classList.toggle("is-active", x === b));
        haptic("select");
        loadLeaderboard();
    }));

    $("[data-calc-deposit]").addEventListener("input", (e) => {
        calc.deposit = e.target.value.replace(/[^0-9.,\s]/g, "").slice(0, 12);
        e.target.value = calc.deposit;
        store.set(KEY_CALC, calc);
        renderCalc();
    });
    $("[data-sig-again]").addEventListener("click", requestSignal);
}

document.addEventListener("DOMContentLoaded", () => {
    initSky();
    initLang();
    initTelegram();
    bindEvents();
    renderAll();
    initPrices();
    tickClock();
    setInterval(tickClock, 1000);
    const topbar = $(".topbar");
    const onScroll = () => topbar.classList.toggle("is-scrolled", window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
});
