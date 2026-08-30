// ==========================================
// קובץ lang.js - מערכת תרגום (עברית / English)
// ==========================================

let currentLang = localStorage.getItem('sportMatchLang') || 'he';

const translations = {
    he: {
        appTitle: "SportMatch", loginTab: "התחברות", registerTab: "הרשמה",
        phonePlaceholder: "מספר טלפון", passwordPlaceholder: "סיסמה", namePlaceholder: "שם מלא", choosePasswordPlaceholder: "בחר סיסמה", newPasswordPlaceholder: "סיסמה חדשה",
        
        agePlaceholder: "גיל", minAgePlaceholder: "גיל מינימלי", maxAgePlaceholder: "גיל מקסימלי",
        genderPlaceholder: "בחר מגדר", genderMale: "זכר", genderFemale: "נקבה", genderOther: "אחר",
        
        loginBtn: "היכנס למערכת", registerBtn: "צור משתמש חדש", resetTitle: "איפוס סיסמה", updatePasswordBtn: "עדכן סיסמה",
        forgotPassword: "שכחתי סיסמה 🤔", backToLogin: "חזור להתחברות",
        welcome: "👋 אהלן {name}! מה בא לך לעשות היום?",
        
        // התוספת לסינון
        filterAll: "🌍 הכל", filterBasketball: "🏀 כדורסל", filterFootball: "⚽ כדורגל", 
        filterPub: "🍻 ברים", filterPark: "🌳 פארקים", filterMyGames: "👤 הפעילויות שלי",
        
        formTitle: "➕ צור מפגש חדש", searchPlaceholder: "🔍 הקלד שם מיקום לחיפוש...", selectPlaceholder: "-- בחר מיקום --", searchingLocation: "מחפש מיקום... 📍",
        missingPlayersPlaceholder: "כמה אנשים חסרים?", btnNow: "⚡ עכשיו", btnFuture: "🕰️ עתידי", submitGameBtn: "צור מפגש!",
        activeGamesTitle: "🔥 מפגשים שקורים עכשיו:", noGames: "אין מפגשים פתוחים. צור אחד!", creator: "👤 יוצר:",
        missingBadge: "🔥 מחפשים עוד {count} חבר'ה!", joinBtn: "🙋‍♂️ אני בא!", chatBtn: "💬 צ'אט", logout: "🚪 התנתק",
        nightMode: "🌙 לילה", dayMode: "☀️ יום", chatTitle: "צ'אט", chatPlaceholder: "הקלד הודעה...",
        gameCreatedTitle: "🎉 המפגש נפתח!", whatsappBtn: "💬 שלח בוואטסאפ", closeBtn: "סגור",
        
        selectCourtAlert: "📍 היי! שכחת לבחור מיקום מהרשימה.", missingPlayersAlert: "👥 היי! אנא הזן כמה אנשים חסרים.",
        joinedSuccess: "הצטרפת בהצלחה! מעביר אותך לצ'אט...", timePastError: "❌ שגיאה: בחרת שעה שכבר עברה.",
        creatingGame: "יוצר מפגש... ⏳", serverError: "❌ השרת דחה את הבקשה: ", netError: "❌ תקלת תקשורת מול השרת.",
        youAreHere: "📍 אתה כאן!", distanceKm: 'ק"מ', awayFromYou: 'ק"מ ממך', 
        
        // טקסטים חדשים למשחקי עבר
        happeningNow: '🟢 קורה עכשיו (ב-{time})', futureGame: '🕰️ עתידי להיום (ב-{time})', pastGame: '⚪ הסתיים (היה ב-{time})', cancelledGame: '❌ מפגש שבוטל',
        
        chatMe: "אני", chatEmpty: "אין הודעות. תגיד שלום! 👋",
        
        authSuccess: "נרשמת בהצלחה! בבקשה התחבר.", loginError: "תקלה בהתחברות.",
        already_exists: "המספר כבר רשום במערכת. מעביר אותך להתחברות...",
        not_found: "המספר לא קיים במערכת. מעביר אותך להרשמה...",
        wrong_password: "❌ סיסמה שגויה.",
        resetSuccess: "✅ הסיסמה שונתה בהצלחה!",
        resetNotFound: "❌ המספר הזה לא קיים במערכת.",

        cancelGameBtn: "❌ בטל מפגש", markFullBtn: "✅ סמן כמלא",
        confirmCancel: "האם אתה בטוח שברצונך לבטל את המפגש?", confirmFull: "האם אתה בטוח שברצונך לסמן את המפגש כמלא?",
        gameCancelledStatus: "המפגש בוטל בהצלחה ונמחק מהמפה.", gameFullStatus: "המפגש סומן כמלא בהצלחה!",
        leaveGameBtn: "❌ ביטול הגעה", leftSuccess: "ביטלת את השתתפותך בהצלחה. נתראה בפעם הבאה!"
    },
    en: {
        appTitle: "SportMatch", loginTab: "Login", registerTab: "Register",
        phonePlaceholder: "Phone Number", passwordPlaceholder: "Password", namePlaceholder: "Full Name", choosePasswordPlaceholder: "Choose Password", newPasswordPlaceholder: "New Password",
        
        agePlaceholder: "Age", minAgePlaceholder: "Min Age", maxAgePlaceholder: "Max Age",
        genderPlaceholder: "Select Gender", genderMale: "Male", genderFemale: "Female", genderOther: "Other",
        
        loginBtn: "Enter System", registerBtn: "Create Account", resetTitle: "Reset Password", updatePasswordBtn: "Update Password",
        forgotPassword: "Forgot password? 🤔", backToLogin: "Back to Login",
        welcome: "👋 Hey {name}! What do you want to do today?",
        
        // Filter Additions
        filterAll: "🌍 All", filterBasketball: "🏀 Basketball", filterFootball: "⚽ Football", 
        filterPub: "🍻 Pubs", filterPark: "🌳 Parks", filterMyGames: "👤 My Activities",
        
        formTitle: "➕ Open New Event", searchPlaceholder: "🔍 Search location...", selectPlaceholder: "-- Select Location --", searchingLocation: "Searching location... 📍",
        missingPlayersPlaceholder: "Missing people?", btnNow: "⚡ Now", btnFuture: "🕰️ Later", submitGameBtn: "Create Event!",
        activeGamesTitle: "🔥 Active Events Right Now:", noGames: "No open events. Create one!", creator: "👤 Creator:",
        missingBadge: "🔥 Looking for {count} more!", joinBtn: "🙋‍♂️ I'm in!", chatBtn: "💬 Chat", logout: "🚪 Logout",
        nightMode: "🌙 Dark", dayMode: "☀️ Light", chatTitle: "Chat", chatPlaceholder: "Type a message...",
        gameCreatedTitle: "🎉 Event Created!", whatsappBtn: "💬 Share on WhatsApp", closeBtn: "Close",
        
        selectCourtAlert: "📍 Hey! You forgot to select a location.", missingPlayersAlert: "👥 Please enter missing people.",
        joinedSuccess: "Successfully joined! Opening chat...", timePastError: "❌ Error: Time already passed.",
        creatingGame: "Creating event... ⏳", serverError: "❌ Server error: ", netError: "❌ Network error.",
        youAreHere: "📍 You are here!", distanceKm: 'km', awayFromYou: 'km away', 
        
        // New texts for history
        happeningNow: '🟢 Happening now (at {time})', futureGame: '🕰️ Future today (at {time})', pastGame: '⚪ Ended (was at {time})', cancelledGame: '❌ Cancelled Event',
        
        chatMe: "Me", chatEmpty: "No messages yet. Say hi! 👋",
        
        authSuccess: "Registered successfully! Please login.", loginError: "Login error.",
        already_exists: "Phone number already registered. Redirecting to login...",
        not_found: "Phone number not found. Redirecting to registration...",
        wrong_password: "❌ Wrong password.",
        resetSuccess: "✅ Password reset successfully!",
        resetNotFound: "❌ This phone number does not exist.",

        cancelGameBtn: "❌ Cancel Event", markFullBtn: "✅ Mark Full",
        confirmCancel: "Are you sure you want to cancel this event?", confirmFull: "Are you sure you want to mark this event as full?",
        gameCancelledStatus: "Event cancelled successfully.", gameFullStatus: "Event marked as full successfully!",
        leaveGameBtn: "❌ Leave Event", leftSuccess: "Successfully left the event. See you next time!"
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