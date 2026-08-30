// ==========================================
// קובץ app.js - מנגנון הליבה (מפגשים ללא מפה + מאגר ערים ממשלתי)
// ==========================================

let myUserId = localStorage.getItem('sportMatchUserId');
let myUsername = localStorage.getItem('sportMatchUser');
let allGames = [];
let myHistoryGames = [];

window.onload = function() {
    if (myUserId && myUsername) { showMainApp(); } 
    else { 
        document.getElementById('authScreen').style.display = 'flex'; 
        document.getElementById('mainApp').style.display = 'none'; 
    }
    
    // טעינה אוטומטית של כל הערים והיישובים בישראל מהמאגר הממשלתי
    loadIsraelCities();
    
    // מילוי שעות ודקות
    const hourSelect = document.getElementById('gameHour');
    if (hourSelect) {
        for (let i = 0; i < 24; i++) hourSelect.innerHTML += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;
    }
    const minuteSelect = document.getElementById('gameMinute');
    if (minuteSelect) {
        for (let i = 0; i < 60; i++) minuteSelect.innerHTML += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;
    }
};

// ==========================================
// מאגר מקיף של כל הערים, המועצות והישובים בישראל (ללא פספוסים)
// ==========================================
function loadIsraelCities() {
    const datalist = document.getElementById('israelCities');
    if (!datalist) return;
    
    datalist.innerHTML = ''; 

    const israelSettlements = [
        "אבו גוש", "אבו סנאן", "אבטיח", "אבני אפק", "אבני חפץ", "אודם", "אופקים", "אור הגנוז", "אור יהודה", 
        "אור עקיבא", "אורה", "אורות", "אושה", "אזור", "אחיהוד", "אחיטוב", "אחיסמך", "אטירות", "איבטין", 
        "אייל", "איילת השחר", "אילון", "אילות", "אילת", "איקסאל", "איתמר", "אל-רום", "אל-ריינה", "אלון הגליל", 
        "אלון מורה", "אלון שבות", "אלומות", "אלונים", "אליכין", "אליפז", "אליפלט", "אליקים", "אלעד", "אלפי מנשה", 
        "אמציה", "אעבלין", "ארבל", "אריאל", "אשדוד", "אשדות יעקב (איחוד)", "אשדות יעקב (מאוחד)", "אשכולות", 
        "אשתאול", "אשקלון", "באקה אל-גרביה", "באר טוביה", "באר יעקב", "באר מילכה", "באר שבע", "בארות יצחק", 
        "בארותיים", "בארי", "ביריה", "בית אל", "בית אריה-עופרים", "בית גמליאל", "בית דגן", "בית הלל", 
        "בית הערבה", "בית השיטה", "בית זית", "בית חורון", "בית חלקיה", "בית חנן", "בית חנניה", "בית חרות", 
        "בית יהושע", "בית יוסף", "בית ינאי", "בית יצחק-שער חפר", "בית לחם הגלילית", "בית מאיר", "בית שערים", 
        "בית שמש", "ביתר עילית", "בלפוריה", "בן זכאי", "בן שמן", "בני דרום", "בני דרור", "בני ציון", 
        "בני ברק", "בני ראם", "בניה", "בצרה", "בקעות", "בר גיורא", "ברעם", "ברק", "ברקאי", "בת הדר", 
        "בת חן", "בת חפר", "בת ים", "גבע בנימין", "גבעות בר", "גבעון החדשה", "גבעת אלה", "גבעת ברנר", 
        "גבעת זאב", "גבעת חן", "גבעת חיים (איחוד)", "גבעת חיים (מאוחד)", "גבעת כוח", "גבעת ניל''י", "גבעת עוז", 
        "גבעת שמואל", "גבעתיים", "גברעם", "גדות", "גדיש", "גדרה", "גונן", "גורן", "גורנות הגליל", "גינוסר", 
        "גיבתון", "גינתון", "גילון", "גילת", "גיתה", "גיתית", "גלאון", "גלגל", "גלעד (אבן יצחק)", "גן יאשיה", 
        "גן יבנה", "גן נר", "גן שמואל", "גנות", "גנות הדר", "גני תקווה", "געש", "געתון", "גפן", "גשר", 
        "גשר הזיו", "גת", "גת רימון", "דבורה", "דבורייה", "דגניה א'", "דגניה ב'", "דובב", "דולב", "דור", 
        "דורות", "דחי", "דייר אל-אסד", "דייר חנא", "דימונה", "דישון", "דלתון", "דליה", "דלית אל-כרמל", 
        "דן", "דפנה", "האון", "הבונים", "הגושרים", "הזורע", "הזורעים", "החלוץ", "היוגב", "הר אדר", 
        "הר גילה", "הראל", "הרצליה", "הר ברכה", "הרדוף", "הושעיה", "זמר", "זמרת", "זיתן", "זכרון יעקב", 
        "זכריה", "זנוח", "זרועה", "חבצלת השרון", "חברון", "חגור", "חד נס", "חדרה", "חדיד", "חולדה", 
        "חולון", "חולית", "חומש", "חוסן", "חוקוק", "חיפה", "חלץ", "חמד", "חמדיה", "חמדת", "חניאל", 
        "חפץ חיים", "חפציבה", "חצבה", "חצור הגלילית", "חצור-אשדוד", "חריש", "חרמש", "חרשים", "טבריה", 
        "טובאס", "טורעאן", "טייבה", "טירה", "טירת כרמל", "טירת צבי", "טל שחר", "טללים", "טמרה", 
        "טנא עומרים", "יבנה", "יבניאל", "יד בנימין", "יד השמונה", "יד חנה", "יד מרדכי", "יד רמב''ם", 
        "יהוד-מונוסון", "יובל", "יובלים", "יודפת", "יונתן", "יושיביה", "יזרעאל", "יחיעם", "ייטב", "יכיני", 
        "ינוב", "יסוד המעלה", "יסודות", "יסעור", "יעל", "יעף", "יערה", "יפית", "יפעת", "יפתח", "יצהר", 
        "יציץ", "יקום", "יקנעם (מושבה)", "יקנעם עילית", "ירושלים", "ירחיב", "ירכא", "ישע", "ישעי", "יתיר", 
        "כאבול", "כאוכב אבו אל-היג'א", "כברי", "כדורי", "כוכב השחר", "כוכב יאיר", "כוכב מיכאל", "כוכב יעקב", 
        "כורזים", "כחל", "כיסופים", "כישור", "כפר אביב", "כפר אדומים", "כפר אוריה", "כפר ביאליק", "כפר בלום", 
        "כפר ברוך", "כפר גלעדי", "כפר דניאל", "כפר האורנים", "כפר החורש", "כפר הרא''ה", "כפר הנגיד", "כפר הס", 
        "כפר חסידים א'", "כפר חסידים ב'", "כפר חרוב", "כפר חזקיה", "כפר יובל", "כפר יונה", "כפר יחזקאל", 
        "כפר כמא", "כפר מנדא", "כפר מונש", "כפר מימון", "כפר מלל", "כפר סבא", "כפר סילבר", "כפר עציון", 
        "כפר קיש", "כפר רות", "כפר שמאי", "כפר שמריהו", "כפר תבור", "כפר תקווה", "כרמי יוסף", "כרמי צור", 
        "כרמיאל", "כרמיה", "כרמים", "לבון", "לביא", "להב", "להבים", "לוד", "לוזית", "לוחמי הגטאות", 
        "לטרון", "לימן", "לכיש", "מאור", "מבוא ביתר", "מבוא דותן", "מבוא חורון", "מבוא מודיעים", "מבואות יריחו", 
        "מבשרת ציון", "מגאר", "מגדל", "מגדל העמק", "מגדל עוז", "מגדלים", "מגידו", "מג'ד אל-כרום", "מג'דל שמס", 
        "מגל", "מגן", "מגן שאול", "מגשימים", "מדרשת בן גוריון", "מודיעין-מכבים-רעות", "מודיעין עילית", "מולדת", 
        "מוצא עילית", "מורן", "מטולה", "מטע", "מיצר", "מירון", "מישר", "מיתר", "מכמורת", "מכמנים", 
        "מלכיה", "מנוף", "מנות", "מסדה", "מסעדה", "מעברות", "מעגלים", "מעגן", "מעגן מיכאל", "מעוז חיים", 
        "מעון", "מעיליא", "מעלה אדומים", "מעלה גלבוע", "מעלה החמישה", "מעלה עירון", "מעלה צביה", "מעלה שומרון", 
        "מעלות-תרשיחא", "מפלסים", "מצובה", "מצליח", "מצפה אביב", "מצפה אילן", "מצפה רמון", "מרגליות", 
        "מרחביה", "משאבי שדה", "משואות יצחק", "משמר איילון", "משמר דוד", "משמר הירדן", "משמר השבעה", 
        "משמר השרון", "משמר העמק", "משמרת", "משען", "מתת", "מתתיהו", "נאות גולן", "נאות הכיכר", "נאות מרדכי", 
        "נבטים", "נגבה", "נגוהות", "נהלל", "נהריה", "נוב", "נווה אטי''ב", "נווה אילן", "נווה איתן", 
        "נווה דניאל", "נווה זוהר", "נווה מיכאל", "נווה שלום", "נוף הגליל", "נופית", "נופך", "נורית", 
        "נחלה", "נחליאל", "נחלים", "נחף", "נחשון", "נחשונים", "נטועה", "נטור", "נטע", "נטפים", "ניין", 
        "נמרוד", "נס הרים", "נס ציונה", "נעלה", "נעמה", "נצרת", "נשר", "נתיב הגדוד", "נתיב הל''ה", 
        "נתיבות", "נתניה", "סאסא", "סח'נין", "סלמה", "סעד", "ספיר", "סתריה", "עברון", "עגור", "עודים", 
        "עומר", "עופר", "עוצם", "עזה", "עטרת", "עין אפק", "עין גב", "עין גדי", "עין הדור", "עין החורש", 
        "עין המפרץ", "עין הנצי''ב", "עין השופט", "עין השלושה", "עין ורד", "עין חוד", "עין חצבה", "עין יעקב", 
        "עין כרם", "עין צורים", "עין קניה", "עין ראפא", "עין שמר", "עין תמר", "עינב", "עירון", "עכו", 
        "עלמה", "עלומים", "עמיר", "עמיקם", "עמינדב", "עמנואל", "ענב", "עספיא", "עפולה", "עץ אפרים", 
        "צבעון", "צובה", "צוחר", "צופית", "צופים", "צור הדסה", "צור משה", "צור נתן", "ציפורי", "צלפון", 
        "צפת", "קבוצת שילר", "קדומים", "קדימה-צורן", "קדמה", "קדש ברנע", "קדר", "קדרים", "קוממיות", 
        "קציר", "קצרין", "קרית אונו", "קרית אתא", "קרית ביאליק", "קרית גת", "קרית טבעון", "קרית ים", 
        "קרית יערים", "קרית מוצקין", "קרית מלאכי", "קרית שמונה", "ראמה", "ראס אל-עין", "רביבים", "רביד", 
        "רגבה", "רגבים", "רהט", "רווחה", "רוחמה", "רועי", "רחוב", "רחובות", "ריחאניה", "רימונים", 
        "ריחן", "רכסים", "רמלה", "רמת השופט", "רמת השרון", "רמת אפעל", "רמת דוד", "רמת יוחנן", "רמת צבי", 
        "רמת רחל", "רמת גן", "רנן", "רעים", "רשפון", "רשפים", "שבי ציון", "שגב-שלום", "שדה בוקר", 
        "שדה דוד", "שדה אליהו", "שדה יעקב", "שדה יצחק", "שדה משה", "שדה נחמיה", "שדה נחום", "שדה צבי", 
        "שדות מיכה", "שדי חמד", "שדי אברהם", "שדי תרומות", "שדרות", "שובה", "שומרת", "שומרה", "שזור", 
        "שחר", "שיבלי", "שילה", "שילת", "שמיר", "שמרת", "שמשית", "שניר", "שעב", "שערי תקווה", "שפיר", 
        "שפרעם", "שקף", "שרונה", "שריגים (לי-און)", "שריד", "שאר ישוב", "תאשור", "תגל", "תושיה", "תירוש", 
        "תל אביב-יפו", "תל תאמים", "תל קציר", "תל מונד", "תל עדשים", "תעוז", "תפרח", "תקוע", "תרדיון"
    ];

    // מיון אלפבתי עברי נקי ומניעת כפיליות באופן מוחלט
    const sortedCities = Array.from(new Set(israelSettlements)).sort((a, b) => a.localeCompare(b, 'he'));

    sortedCities.forEach(cityName => {
        const option = document.createElement('option');
        option.value = cityName;
        datalist.appendChild(option);
    });
}

function showMainApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    const savedUsername = localStorage.getItem('sportMatchUser');
    if (savedUsername) { document.getElementById('welcomeMessage').innerText = "אהלן " + savedUsername + "!"; }

    // קביעת תאריך ושעה לברירת מחדל בטופס היצירה
    const now = new Date(); 
    const dateInput = document.getElementById('gameDate');
    if (dateInput) dateInput.value = now.toISOString().split('T')[0];
    
    now.setHours(now.getHours() + 1);
    if(document.getElementById('gameHour')) document.getElementById('gameHour').value = String(now.getHours()).padStart(2, '0'); 
    if(document.getElementById('gameMinute')) document.getElementById('gameMinute').value = String(now.getMinutes()).padStart(2, '0');
    
    loadGames(); 
}
window.showMainApp = showMainApp;

function toggleDarkMode() { document.body.classList.toggle('dark-mode'); }
window.toggleDarkMode = toggleDarkMode;

async function loadGames() {
    try { 
        const response = await fetch('/api/games?t=' + Date.now()); 
        allGames = await response.json(); 
        
        if (myUserId) {
            const histRes = await fetch(`/api/games/history/${myUserId}?t=` + Date.now());
            myHistoryGames = await histRes.json();
        }

        filterGamesList(); 
    } catch (error) { console.error("שגיאה בטעינת המפגשים", error); }
}
window.loadGames = loadGames;

function filterGamesList() {
    const filterCity = (document.getElementById('filterCity')?.value || '').trim().toLowerCase();
    const filterType = document.getElementById('filterType')?.value || 'all';

    const container = document.getElementById('gamesList');
    if (!container) return;
    container.innerHTML = '';

    let gamesToRender = (filterType === 'my_games') ? myHistoryGames : allGames;
    let matchedCount = 0;

    gamesToRender.forEach(game => {
        const matchCity = !filterCity || (game.City && game.City.toLowerCase().includes(filterCity));
        const matchType = (filterType === 'all' || filterType === 'my_games') || (game.EventType && game.EventType.includes(filterType));

        if (matchCity && matchType) {
            const parts = game.StartTimeStr.split(/[- :]/); 
            const gameDate = new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4]);
            
            const formattedDate = gameDate.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
            const timeString = `${String(gameDate.getHours()).padStart(2, '0')}:${String(gameDate.getMinutes()).padStart(2, '0')}`;
            const diffMins = Math.floor((gameDate - new Date()) / 60000);

            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = createGameCardHtml(game, diffMins, formattedDate, timeString);
            container.appendChild(card);
            matchedCount++;
        }
    });

    if (matchedCount === 0) {
        container.innerHTML = `<p style="text-align:center; color:#7f8c8d; padding:20px;">לא נמצאו מפגשים שתואמים את הסינון שבחרת.</p>`;
    }
}
window.filterGamesList = filterGamesList;

function createGameCardHtml(game, diffMins, formattedDate, timeString) {
    let timeBadgeHtml = '';
    if (game.GameStatus === 'Cancelled') {
        timeBadgeHtml = `<div class="time-badge" style="background:#e74c3c;color:white;">מבוטל - ${formattedDate} (${timeString})</div>`;
    } else if (diffMins < -120) {
        timeBadgeHtml = `<div class="time-badge" style="background:#95a5a6;color:white;">⚪ ${formattedDate} | ${timeString}</div>`;
    } else if (diffMins <= 30) {
        timeBadgeHtml = `<div class="time-badge time-now">🟢 ${formattedDate} | ${timeString} (קורה עכשיו)</div>`;
    } else {
        timeBadgeHtml = `<div class="time-badge time-future">🕰️ ${formattedDate} | ${timeString}</div>`;
    }

    const isCreator = parseInt(myUserId) === game.CreatorPlayerID;
    const joinedPlayers = game.JoinedPlayersStr ? game.JoinedPlayersStr.split(',').filter(id => id !== '') : [];
    const hasJoined = joinedPlayers.includes(String(myUserId));
    
    const chatName = game.EventType + ' ב' + game.City;
    
    let joinControlsHtml = '';
    if (!isCreator && game.GameStatus !== 'Cancelled' && diffMins >= -120) {
        if (hasJoined) {
            joinControlsHtml = `<button class="join-btn" style="background-color: #95a5a6;" onclick="leaveGame(${game.GameID})">ביטול הגעה</button>`;
        } else {
            joinControlsHtml = `<button class="join-btn" onclick="joinGame(${game.GameID}, '${chatName}')">🙋‍♂️ אני בא!</button>`;
        }
    }

    let creatorControlsHtml = '';
    if (isCreator && game.GameStatus === 'Open' && diffMins >= -120) {
        creatorControlsHtml = `
        <div class="btn-group" style="margin-top: 10px;">
            <button onclick="updateGameStatus(${game.GameID}, 'Cancelled')" style="background-color: #e74c3c; color: white; padding: 8px; border: none; border-radius: 8px; cursor: pointer; flex: 1; font-weight: bold;">בטל מפגש</button>
            <button onclick="updateGameStatus(${game.GameID}, 'Full')" style="background-color: #f39c12; color: white; padding: 8px; border: none; border-radius: 8px; cursor: pointer; flex: 1; font-weight: bold;">סמן כמלא</button>
        </div>`;
    }

    const chatBtn = `<button class="chat-btn" onclick="openChat(${game.GameID}, '${chatName}')">💬 צ'אט לקביעת מיקום</button>`;

    const ageHtml = `<div class="detail" style="color: #8e44ad; font-weight: bold; font-size: 0.95em; margin-top: 5px;">🎯 גילאים: ${game.MinAge} - ${game.MaxAge} | מגדר: ${game.PrefGender}</div>`;
    
    let iconStr = '🥂';
    if(game.EventType.includes('כדורגל')) iconStr = '⚽';
    if(game.EventType.includes('כדורסל')) iconStr = '🏀';
    if(game.EventType.includes('טניס')) iconStr = '🎾';
    if(game.EventType.includes('כדורעף')) iconStr = '🏐';
    
    return `<div class="court-name">${iconStr} ${game.EventType} ב${game.City}</div>
            <div class="detail"><strong>👤 יוצר:</strong> ${game.CreatorName}</div>
            ${timeBadgeHtml}
            ${ageHtml}
            <div class="badge">מחפשים עוד ${game.MissingPlayers} חבר'ה</div>
            <div class="btn-group">${joinControlsHtml} ${chatBtn}</div>
            ${creatorControlsHtml}`;
}

async function joinGame(gameId, courtName) {
    try {
        const response = await fetch(`/api/games/${gameId}/join`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: myUserId }) });
        const data = await response.json();
        if (response.ok) { 
            showToast("הצטרפת בהצלחה! 🎉"); 
            alert("הצטרפת למפגש בהצלחה! תוכל כעת להכנס לצ'אט ולקבוע מיקום מדויק."); 
            loadGames(); 
            openChat(gameId, courtName); 
        } else { alert(data.error); }
    } catch (error) { alert("שגיאת רשת"); }
}
window.joinGame = joinGame;

async function leaveGame(gameId) {
    try {
        const response = await fetch(`/api/games/${gameId}/leave`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: myUserId }) });
        const data = await response.json();
        if (response.ok) { 
            alert("עזבת את המפגש."); 
            loadGames(); 
        } else { alert(data.error); }
    } catch (error) { alert("שגיאת רשת"); }
}
window.leaveGame = leaveGame;

async function updateGameStatus(gameId, status) {
    const confirmMsg = status === 'Cancelled' ? "האם אתה בטוח שברצונך לבטל את המפגש?" : "האם המפגש מלא?";
    if (!confirm(confirmMsg)) return;
    try {
        const response = await fetch(`/api/games/${gameId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: myUserId, status: status }) });
        const data = await response.json();
        if (response.ok) { 
            alert(status === 'Cancelled' ? "המפגש בוטל." : "המפגש סומן כמלא."); 
            loadGames(); 
        } else { alert(data.error || "שגיאת שרת"); }
    } catch (error) { alert("שגיאת רשת"); }
}
window.updateGameStatus = updateGameStatus;

async function createNewGame() {
    const city = document.getElementById('gameCity').value.trim();
    const eventType = document.getElementById('gameEventType').value;
    const missingPlayers = document.getElementById('gameMissingPlayers').value;
    const minAgeVal = parseInt(document.getElementById('gameMinAge').value) || 10;
    const maxAgeVal = parseInt(document.getElementById('gameMaxAge').value) || 99;
    const prefGender = document.getElementById('gamePrefGender').value;
    const dateStr = document.getElementById('gameDate').value;

    if (!city) { alert("אנא בחר או הקלד עיר."); return; }
    if (!eventType) { alert("אנא בחר סוג בילוי/ספורט."); return; }
    if (!dateStr) { alert("אנא בחר תאריך."); return; }
    if (!missingPlayers || missingPlayers < 1) { alert("אנא הזן כמה אנשים חסרים."); return; }
    if (minAgeVal > maxAgeVal) { alert("הגיל המינימלי לא יכול להיות גדול מהמקסימלי."); return; }

    const hStr = document.getElementById('gameHour').value; 
    const mStr = document.getElementById('gameMinute').value; 
    
    const now = new Date();
    const gameTime = new Date(dateStr);
    gameTime.setHours(parseInt(hStr), parseInt(mStr), 0, 0);
    
    if (gameTime < now && (now - gameTime) > 300000) { alert("❌ שגיאה: בחרת תאריך או שעה שכבר עברו."); return; }
    
    const sqlStartTime = `${gameTime.getFullYear()}-${String(gameTime.getMonth() + 1).padStart(2, '0')}-${String(gameTime.getDate()).padStart(2, '0')} ${hStr}:${mStr}:00`;

    const payload = {
        creatorPlayerId: parseInt(myUserId),
        city, eventType, missingPlayers: parseInt(missingPlayers), 
        minAge: minAgeVal, maxAge: maxAgeVal, prefGender, startTime: sqlStartTime
    };
    
    try {
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.innerText = "יוצר מפגש..."; submitBtn.disabled = true; 
        
        const response = await fetch('/api/games', { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) 
        });
        
        if(response.ok) { 
            document.getElementById('gameCity').value = '';
            document.getElementById('gameMissingPlayers').value = '';
            document.getElementById('gameMinAge').value = ''; 
            document.getElementById('gameMaxAge').value = '';
            document.getElementById('gameEventType').value = '';
            
            loadGames(); 
            document.getElementById('whatsappModal').style.display = 'flex'; 
        } 
        else { const data = await response.json(); alert("שגיאה: " + (data.error || "")); }
        submitBtn.innerText = "צור מפגש!"; submitBtn.disabled = false;
    } catch (error) { 
        alert("שגיאת רשת"); 
        document.querySelector('.submit-btn').innerText = "צור מפגש!"; 
        document.querySelector('.submit-btn').disabled = false; 
    }
}
window.createNewGame = createNewGame;

function closeModal() { document.getElementById('whatsappModal').style.display = 'none'; }
window.closeModal = closeModal;

function showToast(message) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 4000);
}
window.showToast = showToast;

function showNotificationWithSound(message) {
    showToast(message); 
    try {
        const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        sound.volume = 0.2;
        let playPromise = sound.play();
        if (playPromise !== undefined) playPromise.catch(e => {});
    } catch (err) {}
}

let lastKnownGamesCount = 0;
async function checkBackgroundNotifications() {
    if (!myUserId) return;
    try {
        const allGamesRes = await fetch('/api/games?t=' + Date.now());
        const currentGames = await allGamesRes.json();
        
        if (lastKnownGamesCount > 0 && currentGames.length > lastKnownGamesCount) {
            showNotificationWithSound("🔥 מפגש חדש נפתח במערכת!");
            loadGames();
        }
        lastKnownGamesCount = currentGames.length;

        const histRes = await fetch(`/api/games/history/${myUserId}?t=` + Date.now());
        const myGames = await histRes.json();
        
        for (const game of myGames) {
            const chatRes = await fetch(`/api/games/${game.GameID}/chat?t=` + Date.now());
            const messages = await chatRes.json();
            
            if (messages && messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg.SenderName === 'מערכת') {
                    const msgKey = `notified_msg_${game.GameID}_${messages.length}`;
                    if (!localStorage.getItem(msgKey)) {
                        localStorage.setItem(msgKey, 'true');
                        showNotificationWithSound(lastMsg.MessageText);
                        loadGames();
                    }
                }
            }
        }
    } catch (e) {}
}
setInterval(checkBackgroundNotifications, 1500);