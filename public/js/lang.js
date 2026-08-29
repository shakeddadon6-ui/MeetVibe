// ==========================================
// קובץ lang.js - מערכת תרגום (עברית / English)
// ==========================================

let currentLang = localStorage.getItem('sportMatchLang') || 'he';

const translations = {
    he: {
        appTitle: "SportMatch", loginTab: "התחברות", registerTab: "הרשמה",
        phonePlaceholder: "מספר טלפון", passwordPlaceholder: "סיסמה", namePlaceholder: "שם מלא", choosePasswordPlaceholder: "בחר סיסמה", newPasswordPlaceholder: "סיסמה חדשה",
        
        agePlaceholder: "גיל", minAgePlaceholder: "גיל מינימלי", maxAgePlaceholder: "גיל מקסימלי",
        
        loginBtn: "היכנס למגרש", registerBtn: "צור משתמש חדש", resetTitle: "איפוס סיסמה", updatePasswordBtn: "עדכן סיסמה",
        forgotPassword: "שכחתי סיסמה 🤔", backToLogin: "חזור להתחברות",
        welcome: "👋 אהלן {name}! מה נשחק היום?",
        
        // התוספת לסינון
        filterAll: "🌍 הכל", filterBasketball: "🏀 כדורסל", filterFootball: "⚽ כדורגל", filterMyGames: "👤 המשחקים שלי",
        
        formTitle: "➕ פתח משחק חדש", searchPlaceholder: "🔍 הקלד שם מגרש לחיפוש מהיר...", selectPlaceholder: "-- בחר מגרש --", searchingLocation: "מחפש מיקום... 📍",
        missingPlayersPlaceholder: "כמה שחקנים חסרים?", btnNow: "⚡ עכשיו", btnFuture: "🕰️ עתידי", submitGameBtn: "פתח משחק!",
        activeGamesTitle: "🔥 משחקים שקורים עכשיו:", noGames: "אין משחקים פתוחים. פתח אחד!", creator: "👤 יוצר:",
        missingBadge: "🔥 חסרים {count} שחקנים!", joinBtn: "🙋‍♂️ אני בא!", chatBtn: "💬 צ'אט", logout: "🚪 התנתק",
        nightMode: "🌙 לילה", dayMode: "☀️ יום", chatTitle: "צ'אט", chatPlaceholder: "הקלד הודעה...",
        gameCreatedTitle: "🎉 המשחק נפתח!", whatsappBtn: "💬 שלח בוואטסאפ", closeBtn: "סגור",
        
        selectCourtAlert: "📍 היי! שכחת לבחור מגרש מהרשימה.", missingPlayersAlert: "👥 היי! אנא הזן כמה שחקנים חסרים.",
        joinedSuccess: "הצטרפת בהצלחה! מעביר אותך לצ'אט...", timePastError: "❌ שגיאה: בחרת שעה שכבר עברה.",
        creatingGame: "פותח משחק... ⏳", serverError: "❌ השרת דחה את הבקשה: ", netError: "❌ תקלת תקשורת מול השרת.",
        youAreHere: "📍 אתה כאן!", distanceKm: 'ק"מ', awayFromYou: 'ק"מ ממך', happeningNow: '🟢 קורה עכשיו (ב-{time})', futureGame: '🕰️ עתידי להיום (ב-{time})',
        chatMe: "אני", chatEmpty: "אין הודעות. תגיד שלום! 👋",
        
        authSuccess: "נרשמת בהצלחה! בבקשה התחבר.", loginError: "תקלה בהתחברות.",
        already_exists: "המספר כבר רשום במערכת. מעביר אותך להתחברות...",
        not_found: "המספר לא קיים במערכת. מעביר אותך להרשמה...",
        wrong_password: "❌ סיסמה שגויה.",
        resetSuccess: "✅ הסיסמה שונתה בהצלחה!",
        resetNotFound: "❌ המספר הזה לא קיים במערכת.",

        cancelGameBtn: "❌ בטל משחק", markFullBtn: "✅ סמן כמלא",
        confirmCancel: "האם אתה בטוח שברצונך לבטל את המשחק?", confirmFull: "האם אתה בטוח שברצונך לסמן את המשחק כמלא?",
        gameCancelledStatus: "המשחק בוטל בהצלחה ונמחק מהמפה.", gameFullStatus: "המשחק סומן כמלא בהצלחה!",
        leaveGameBtn: "❌ ביטול הגעה", leftSuccess: "ביטלת את השתתפותך בהצלחה. נתראה בפעם הבאה!"
    },
    en: {
        appTitle: "SportMatch", loginTab: "Login", registerTab: "Register",
        phonePlaceholder: "Phone Number", passwordPlaceholder: "Password", namePlaceholder: "Full Name", choosePasswordPlaceholder: "Choose Password", newPasswordPlaceholder: "New Password",
        
        agePlaceholder: "Age", minAgePlaceholder: "Min Age", maxAgePlaceholder: "Max Age",
        
        loginBtn: "Enter Court", registerBtn: "Create Account", resetTitle: "Reset Password", updatePasswordBtn: "Update Password",
        forgotPassword: "Forgot password? 🤔", backToLogin: "Back to Login",
        welcome: "👋 Hey {name}! What are we playing today?",
        
        // Filter Additions
        filterAll: "🌍 All", filterBasketball: "🏀 Basketball", filterFootball: "⚽ Football", filterMyGames: "👤 My Games",
        
        formTitle: "➕ Open New Game", searchPlaceholder: "🔍 Search court...", selectPlaceholder: "-- Select Court --", searchingLocation: "Searching location... 📍",
        missingPlayersPlaceholder: "Missing players?", btnNow: "⚡ Now", btnFuture: "🕰️ Later", submitGameBtn: "Open Game!",
        activeGamesTitle: "🔥 Active Games Right Now:", noGames: "No open games. Open one!", creator: "👤 Creator:",
        missingBadge: "🔥 Missing {count} players!", joinBtn: "🙋‍♂️ I'm in!", chatBtn: "💬 Chat", logout: "🚪 Logout",
        nightMode: "🌙 Dark", dayMode: "☀️ Light", chatTitle: "Chat", chatPlaceholder: "Type a message...",
        gameCreatedTitle: "🎉 Game Created!", whatsappBtn: "💬 Share on WhatsApp", closeBtn: "Close",
        
        selectCourtAlert: "📍 Hey! You forgot to select a court.", missingPlayersAlert: "👥 Please enter missing players.",
        joinedSuccess: "Successfully joined! Opening chat...", timePastError: "❌ Error: Time already passed.",
        creatingGame: "Opening game... ⏳", serverError: "❌ Server error: ", netError: "❌ Network error.",
        youAreHere: "📍 You are here!", distanceKm: 'km', awayFromYou: 'km away', happeningNow: '🟢 Happening now (at {time})', futureGame: '🕰️ Future today (at {time})',
        chatMe: "Me", chatEmpty: "No messages yet. Say hi! 👋",
        
        authSuccess: "Registered successfully! Please login.", loginError: "Login error.",
        already_exists: "Phone number already registered. Redirecting to login...",
        not_found: "Phone number not found. Redirecting to registration...",
        wrong_password: "❌ Wrong password.",
        resetSuccess: "✅ Password reset successfully!",
        resetNotFound: "❌ This phone number does not exist.",

        cancelGameBtn: "❌ Cancel Game", markFullBtn: "✅ Mark Full",
        confirmCancel: "Are you sure you want to cancel this game?", confirmFull: "Are you sure you want to mark this game as full?",
        gameCancelledStatus: "Game cancelled successfully.", gameFullStatus: "Game marked as full successfully!",
        leaveGameBtn: "❌ Leave Game", leftSuccess: "Successfully left the game. See you next time!"
    }
};

function t(key) { return translations[currentLang][key] || key; }
window.t = t;

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('sportMatchLang', lang);
    document.documentElement.dir = (lang === 'he') ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) { langBtn.innerText = (lang === 'he') ? 'English (EN)' : 'Hebrew (HE)'; }

    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerText = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.getAttribute('data-i18n-placeholder')); });

    const savedUsername = localStorage.getItem('sportMatchUser');
    if (savedUsername) {
        const welcomeEl = document.getElementById('welcomeMessage');
        if (welcomeEl) welcomeEl.innerText = t("welcome").replace('{name}', savedUsername);
    }
    
    if (window.updateMapLanguage) window.updateMapLanguage(lang);
    if (typeof renderGamesList === 'function' && typeof allGames !== 'undefined') renderGamesList();
    if (typeof populateDropdown === 'function') {
        const searchBox = document.getElementById('searchBox');
        populateDropdown(searchBox ? searchBox.value.trim() : '');
    }
}
window.setLanguage = setLanguage;
function toggleLanguage() { setLanguage(currentLang === 'he' ? 'en' : 'he'); }
window.toggleLanguage = toggleLanguage;
document.addEventListener('DOMContentLoaded', () => setLanguage(currentLang));