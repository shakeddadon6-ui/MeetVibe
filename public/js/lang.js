// ==========================================
// קובץ lang.js - מערכת תרגום מלאה (עברית / English)
// ==========================================

let currentLang = localStorage.getItem('sportMatchLang') || 'he';

const translations = {
    he: {
        appTitle: "MeetVibe", loginTab: "התחברות", registerTab: "הרשמה",
        phonePlaceholder: "מספר טלפון", passwordPlaceholder: "סיסמה", namePlaceholder: "שם מלא", choosePasswordPlaceholder: "בחר סיסמה", newPasswordPlaceholder: "סיסמה חדשה",
        
        agePlaceholder: "גיל", minAgePlaceholder: "גיל מינימלי", maxAgePlaceholder: "גיל מקסימלי",
        genderPlaceholder: "בחר מגדר", genderMale: "זכר", genderFemale: "נקבה", genderOther: "אחר",
        
        loginBtn: "היכנס למערכת", registerBtn: "צור משתמש חדש", resetTitle: "איפוס סיסמה", updatePasswordBtn: "עדכן סיסמה",
        forgotPassword: "שכחתי סיסמה 🤔", backToLogin: "חזור להתחברות",
        welcome: "👋 אהלן {name}! מה בא לך לעשות היום?",
        
        formTitle: "🥂 יצירת מפגש חדש", cityPlaceholder: "🏙️ הקלד או בחר עיר ברשימה...", 
        missingPlayersPlaceholder: "כמה אנשים חסרים?", submitGameBtn: "צור מפגש!",
        activeGamesTitle: "🔥 מפגשים פתוחים:", noGames: "לא נמצאו מפגשים שתואמים את הסינון שבחרת.", creator: "👤 יוצר:",
        joinBtn: "🙋‍♂️ אני בא!", leaveGameBtn: "ביטול הגעה", chatBtn: "💬 צ'אט לקביעת מיקום", logout: "🚪 התנתק",
        nightMode: "🌙 לילה", dayMode: "☀️ יום", chatTitle: "💬 צ'אט", chatPlaceholder: "הקלד הודעה...",
        gameCreatedTitle: "🎉 המפגש נפתח!", whatsappBtn: "💬 שלח בוואטסאפ", closeBtn: "סגור",
        
        chatMe: "אני", chatEmpty: "אין הודעות. תגיד שלום! 👋",
        
        authSuccess: "נרשמת בהצלחה! בבקשה התחבר.", loginError: "תקלה בהתחברות.",
        already_exists: "המספר כבר רשום במערכת.", not_found: "המספר לא קיים במערכת.",
        wrong_password: "❌ סיסמה שגויה.", resetSuccess: "✅ הסיסמה שונתה בהצלחה!",
        resetNotFound: "❌ המספר הזה לא קיים במערכת.",
        netError: "❌ תקלת תקשורת מול השרת.", serverError: "❌ שגיאה: ",

        cancelGameBtn: "בטל מפגש", markFullBtn: "סמן כמלא",
        confirmCancel: "האם אתה בטוח שברצונך לבטל את המפגש?", confirmFull: "האם המפגש מלא?",
        leaveSuccess: "עזבת את המפגש.",

        // תרגומים חדשים לטפסים ולסינונים
        timeLabel: "שעה:",
        eventTypePlaceholder: "-- בחר סוג בילוי / ספורט --",
        groupSport: "ספורט ומשחקי כדור", groupLeisure: "בילוי ופנאי", groupHobbies: "תחביבים והעשרה",
        typeFootball: "⚽ כדורגל", typeBasketball: "🏀 כדורסל", typeTennis: "🎾 טניס", typeVolleyball: "🏐 כדורעף", typePingPong: "🏓 פינג פונג", typeWorkout: "🏋️ אימון כושר בפארק", typeYoga: "🧘‍♀️ יוגה / פילאטיס", typeWalking: "🚶‍♂️ הליכה", typeRunning: "🏃‍♀️ ריצה משותפת", typeCycling: "🚴‍♂️ רכיבה על אופניים",
        typePub: "🍻 יציאה לבר/פאב", typeRestaurant: "🍽️ מסעדה / אוכל", typeCafe: "☕ ישיבה בבית קפה", typeBeach: "🏖️ הליכה או ישיבה בים", typeCinema: "🍿 סרט בקולנוע", typeConcert: "🎸 הופעה חיה / מוזיקה", typeStandup: "🎭 מופע סטנדאפ", typeWatchGame: "📺 צפייה במשחק ספורט",
        typeBoardGames: "🎲 משחקי קופסה", typeGaming: "🎮 גיימינג / קונסולות", typeNature: "🏕️ טיול בטבע", typeCooking: "🍳 סדנת בישול / אפייה", typeReading: "📖 מפגש קריאה / ספרים", typeOther: "✨ משהו אחר",
        
        prefGenderAny: "👥 מגדר מועדף: לא משנה", prefGenderMale: "♂️ רק גברים", prefGenderFemale: "♀️ רק נשים",
        filterCityPlaceholder: "🔍 סנן לפי עיר...", filterTypeAll: "🎭 הכל", filterTypeMyGames: "👤 הפעילויות שלי"
    },
    en: {
        appTitle: "MeetVibe", loginTab: "Login", registerTab: "Register",
        phonePlaceholder: "Phone Number", passwordPlaceholder: "Password", namePlaceholder: "Full Name", choosePasswordPlaceholder: "Choose Password", newPasswordPlaceholder: "New Password",
        
        agePlaceholder: "Age", minAgePlaceholder: "Min Age", maxAgePlaceholder: "Max Age",
        genderPlaceholder: "Select Gender", genderMale: "Male", genderFemale: "Female", genderOther: "Other",
        
        loginBtn: "Enter System", registerBtn: "Create Account", resetTitle: "Reset Password", updatePasswordBtn: "Update Password",
        forgotPassword: "Forgot password? 🤔", backToLogin: "Back to Login",
        welcome: "👋 Hey {name}! What do you want to do today?",
        
        formTitle: "➕ Create New Event", cityPlaceholder: "🏙️ Type or select city...", 
        missingPlayersPlaceholder: "Missing people?", submitGameBtn: "Create Event!",
        activeGamesTitle: "🔥 Open Events:", noGames: "No events found matching your filter.", creator: "👤 Creator:",
        joinBtn: "🙋‍♂️ I'm in!", leaveGameBtn: "Leave Event", chatBtn: "💬 Chat for Location", logout: "🚪 Logout",
        nightMode: "🌙 Dark", dayMode: "☀️ Light", chatTitle: "💬 Chat", chatPlaceholder: "Type a message...",
        gameCreatedTitle: "🎉 Event Created!", whatsappBtn: "💬 Share on WhatsApp", closeBtn: "Close",
        
        chatMe: "Me", chatEmpty: "No messages yet. Say hi! 👋",
        
        authSuccess: "Registered successfully! Please login.", loginError: "Login error.",
        already_exists: "Phone number already registered.", not_found: "Phone number not found.",
        wrong_password: "❌ Wrong password.", resetSuccess: "✅ Password reset successfully!",
        resetNotFound: "❌ This phone number does not exist.",
        netError: "❌ Network error.", serverError: "❌ Server error: ",

        cancelGameBtn: "Cancel Event", markFullBtn: "Mark Full",
        confirmCancel: "Are you sure you want to cancel this event?", confirmFull: "Mark event as full?",
        leaveSuccess: "Successfully left the event.",

        // תרגומים חדשים לטפסים ולסינונים באנגלית
        timeLabel: "Time:",
        eventTypePlaceholder: "-- Select Activity / Sport --",
        groupSport: "Sports & Ball Games", groupLeisure: "Leisure & Entertainment", groupHobbies: "Hobbies & Enrichment",
        typeFootball: "⚽ Football", typeBasketball: "🏀 Basketball", typeTennis: "🎾 Tennis", typeVolleyball: "🏐 Volleyball", typePingPong: "🏓 Ping Pong", typeWorkout: "🏋️ Outdoor Workout", typeYoga: "🧘‍♀️ Yoga / Pilates", typeWalking: "🚶‍♂️ Walking", typeRunning: "🏃‍♀️ Running", typeCycling: "🚴‍♂️ Cycling",
        typePub: "🍻 Pub / Bar", typeRestaurant: "🍽️ Restaurant / Food", typeCafe: "☕ Cafe", typeBeach: "🏖️ Beach", typeCinema: "🍿 Cinema", typeConcert: "🎸 Live Concert / Music", typeStandup: "🎭 Standup Comedy", typeWatchGame: "📺 Watch Sports Game",
        typeBoardGames: "🎲 Board Games", typeGaming: "🎮 Gaming / Consoles", typeNature: "🏕️ Nature Hike", typeCooking: "🍳 Cooking / Baking Class", typeReading: "📖 Book Club", typeOther: "✨ Something Else",
        
        prefGenderAny: "👥 Preferred Gender: Any", prefGenderMale: "♂️ Men Only", prefGenderFemale: "♀️ Women Only",
        filterCityPlaceholder: "🔍 Filter by city...", filterTypeAll: "🎭 All Activities", filterTypeMyGames: "👤 My Activities"
    }
};

function t(key) { return translations[currentLang][key] || key; }
window.t = t;

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('sportMatchLang', lang);
    document.documentElement.dir = (lang === 'he') ? 'rtl' : 'ltr';
    document.documentElement.lang = lang; // זה אמור לעזור עם לוח השנה בדפדפנים מודרניים
    
const langBtn = document.getElementById('langToggleBtn');
if (langBtn) { langBtn.innerText = (lang === 'he') ? 'English (EN)' : 'עברית (HE)'; }

const authLangBtn = document.getElementById('authLangToggleBtn');
if (authLangBtn) { authLangBtn.innerText = (lang === 'he') ? 'English (EN)' : 'עברית (HE)'; }

    // עדכון טקסטים רגילים
    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerText = t(el.getAttribute('data-i18n')); });
    // עדכון פלייסחולדרים
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.getAttribute('data-i18n-placeholder')); });
    // עדכון לייבלים (עבור optgroup)
    document.querySelectorAll('[data-i18n-label]').forEach(el => { el.label = t(el.getAttribute('data-i18n-label')); });

    const savedUsername = localStorage.getItem('sportMatchUser');
    if (savedUsername) {
        const welcomeEl = document.getElementById('welcomeMessage');
        if (welcomeEl) welcomeEl.innerText = t("welcome").replace('{name}', savedUsername);
    }
    
    if (typeof filterGamesList === 'function') filterGamesList();
}
window.setLanguage = setLanguage;

function toggleLanguage() { setLanguage(currentLang === 'he' ? 'en' : 'he'); }
window.toggleLanguage = toggleLanguage;

document.addEventListener('DOMContentLoaded', () => setLanguage(currentLang));