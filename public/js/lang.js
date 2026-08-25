// ==========================================
// קובץ lang.js - מערכת תרגום (עברית / English)
// ==========================================

let currentLang = localStorage.getItem('sportMatchLang') || 'he';

const translations = {
    he: {
        appTitle: "SportMatch", loginTab: "התחברות", registerTab: "הרשמה",
        phonePlaceholder: "מספר טלפון", passwordPlaceholder: "סיסמה", namePlaceholder: "שם מלא", choosePasswordPlaceholder: "בחר סיסמה", newPasswordPlaceholder: "סיסמה חדשה",
        loginBtn: "היכנס למגרש", registerBtn: "צור משתמש חדש", resetTitle: "איפוס סיסמה", updatePasswordBtn: "עדכן סיסמה",
        forgotPassword: "שכחתי סיסמה 🤔", backToLogin: "חזור להתחברות",
        welcome: "👋 אהלן {name}! מה נשחק היום?",
        filterAll: "🌍 הכל", filterBasketball: "🏀 כדורסל", filterFootball: "⚽ כדורגל",
        formTitle: "➕ פתח משחק חדש", searchPlaceholder: "🔍 הקלד שם מגרש לחיפוש...", selectPlaceholder: "-- בחר מגרש --", searchingLocation: "מחפש מיקום... 📍",
        missingPlayersPlaceholder: "כמה שחקנים חסרים?", btnNow: "⚡ עכשיו", btnFuture: "🕰️ עתידי", submitGameBtn: "פתח משחק!",
        activeGamesTitle: "🔥 משחקים שקורים עכשיו:", noGames: "אין משחקים פתוחים. פתח אחד!", creator: "👤 יוצר:",
        missingBadge: "🔥 חסרים {count} שחקנים!", joinBtn: "🙋‍♂️ אני בא!", chatBtn: "💬 צ'אט", logout: "🚪 התנתק",
        nightMode: "🌙 לילה", dayMode: "☀️ יום", chatTitle: "💬 צ'אט", chatPlaceholder: "הקלד הודעה...",
        gameCreatedTitle: "🎉 המשחק נפתח!", whatsappBtn: "💬 שלח בוואטסאפ", closeBtn: "סגור"
    },
    en: {
        appTitle: "SportMatch", loginTab: "Login", registerTab: "Register",
        phonePlaceholder: "Phone Number", passwordPlaceholder: "Password", namePlaceholder: "Full Name", choosePasswordPlaceholder: "Choose Password", newPasswordPlaceholder: "New Password",
        loginBtn: "Enter Court", registerBtn: "Create Account", resetTitle: "Reset Password", updatePasswordBtn: "Update Password",
        forgotPassword: "Forgot password? 🤔", backToLogin: "Back to Login",
        welcome: "👋 Hey {name}! What are we playing today?",
        filterAll: "🌍 All", filterBasketball: "🏀 Basketball", filterFootball: "⚽ Football",
        formTitle: "➕ Open New Game", searchPlaceholder: "🔍 Search court...", selectPlaceholder: "-- Select Court --", searchingLocation: "Searching location... 📍",
        missingPlayersPlaceholder: "Missing players?", btnNow: "⚡ Now", btnFuture: "🕰️ Later", submitGameBtn: "Open Game!",
        activeGamesTitle: "🔥 Active Games Right Now:", noGames: "No open games. Open one!", creator: "👤 Creator:",
        missingBadge: "🔥 Missing {count} players!", joinBtn: "🙋‍♂️ I'm in!", chatBtn: "💬 Chat", logout: "🚪 Logout",
        nightMode: "🌙 Dark", dayMode: "☀️ Light", chatTitle: "💬 Chat", chatPlaceholder: "Type a message...",
        gameCreatedTitle: "🎉 Game Created!", whatsappBtn: "💬 Share on WhatsApp", closeBtn: "Close"
    }
};

// הפונקציה ששולפת את המילה הנכונה לפי השפה
function t(key) { 
    return translations[currentLang][key] || key; 
}
window.t = t; // חושפים לכל שאר הקבצים

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('sportMatchLang', lang);
    
    // משנה את כיוון העמוד מימין-לשמאל או משמאל-לימין
    document.documentElement.dir = (lang === 'he') ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // עדכון כפתור השפה
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) langBtn.innerText = (lang === 'he') ? '🇬🇧 English' : '🇮🇱 עברית';

    // עובר על כל האלמנטים ב-HTML שדורשים תרגום ומתרגם אותם
    document.querySelectorAll('[data-i18n]').forEach(el => { 
        el.innerText = t(el.getAttribute('data-i18n')); 
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { 
        el.placeholder = t(el.getAttribute('data-i18n-placeholder')); 
    });

    // עדכון משפט הפתיחה (אם המשתמש מחובר)
    if (window.myUsername) {
        const welcomeEl = document.getElementById('welcomeMessage');
        if (welcomeEl) welcomeEl.innerText = t("welcome").replace('{name}', window.myUsername);
    }
}
window.setLanguage = setLanguage;

function toggleLanguage() { 
    setLanguage(currentLang === 'he' ? 'en' : 'he'); 
    
    // מרענן את רשימת המשחקים כדי שגם היא תתורגם (אם הקובץ נטען)
    if (typeof renderGamesList === 'function') renderGamesList();
}
window.toggleLanguage = toggleLanguage;

// מפעיל את השפה ברגע שהעמוד נטען
document.addEventListener('DOMContentLoaded', () => setLanguage(currentLang));