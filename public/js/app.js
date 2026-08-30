// ==========================================
// קובץ app.js - מנגנון הליבה 
// ==========================================

let myUserId = localStorage.getItem('sportMatchUserId');
let myUsername = localStorage.getItem('sportMatchUser');

window.onload = function() {
    if (myUserId && myUsername) { showMainApp(); } 
    else { document.getElementById('authScreen').style.display = 'flex'; document.getElementById('mainApp').style.display = 'none'; document.getElementById('homeScreen').style.display = 'none'; document.getElementById('socialApp').style.display = 'none';}
    
    // מילוי שעות ודקות עבור משחקי ספורט
    const hourSelect = document.getElementById('gameHour');
    for (let i = 0; i < 24; i++) hourSelect.innerHTML += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;
    const minuteSelect = document.getElementById('gameMinute');
    for (let i = 0; i < 60; i++) minuteSelect.innerHTML += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;

    // מילוי שעות ודקות עבור מפגשים חברתיים (ללא מפה)
    const socialHourSelect = document.getElementById('socialGameHour');
    if (socialHourSelect) {
        for (let i = 0; i < 24; i++) socialHourSelect.innerHTML += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;
    }
    const socialMinuteSelect = document.getElementById('socialGameMinute');
    if (socialMinuteSelect) {
        for (let i = 0; i < 60; i++) socialMinuteSelect.innerHTML += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;
    }
};

function showMainApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none'; 
    document.getElementById('socialApp').style.display = 'none'; 
    document.getElementById('homeScreen').style.display = 'block'; 
    
    const savedUsername = localStorage.getItem('sportMatchUser');
    if (savedUsername) { document.getElementById('welcomeMessage').innerText = "אהלן " + savedUsername + "!"; }
}
window.showMainApp = showMainApp;

function openCategory(categoryType) {
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('socialApp').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    setTimeout(() => { 
        map.invalidateSize(); 
        loadCourtsAndLocation(); 
        loadGames();
        setSportFilter(categoryType); 
    }, 300);
}
window.openCategory = openCategory;

// פונקציה חדשה לפתיחת מסך מפגשים חברתיים
function openSocialApp() {
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('socialApp').style.display = 'block';
    
    // קביעת תאריך ושעה לברירת מחדל
    const now = new Date(); 
    
    // הזנת תאריך של היום
    const dateInput = document.getElementById('socialGameDate');
    if (dateInput) {
        dateInput.value = now.toISOString().split('T')[0];
    }
    
    now.setHours(now.getHours() + 1);
    document.getElementById('socialGameHour').value = String(now.getHours()).padStart(2, '0'); 
    document.getElementById('socialGameMinute').value = String(now.getMinutes()).padStart(2, '0');
    
    loadGames(); 
}
window.openSocialApp = openSocialApp;

function backToHome() {
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('socialApp').style.display = 'none';
    document.getElementById('homeScreen').style.display = 'block';
}
window.backToHome = backToHome;

let currentTimeMode = 'now'; 

function setTimeMode(mode) {
    currentTimeMode = mode;
    if (mode === 'now') {
        document.getElementById('btnTimeNow').classList.add('active'); document.getElementById('btnTimeFuture').classList.remove('active'); document.getElementById('timePickerWrapper').style.display = 'none';
    } else {
        document.getElementById('btnTimeFuture').classList.add('active'); document.getElementById('btnTimeNow').classList.remove('active'); document.getElementById('timePickerWrapper').style.display = 'flex';
        const now = new Date(); now.setHours(now.getHours() + 1);
        document.getElementById('gameHour').value = String(now.getHours()).padStart(2, '0'); document.getElementById('gameMinute').value = String(now.getMinutes()).padStart(2, '0');
    }
}
window.setTimeMode = setTimeMode;
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); }
window.toggleDarkMode = toggleDarkMode;

const map = L.map('map').setView([31.9685, 34.7700], 13); 
let currentTileLayer = null;

function updateMapLanguage(lang) {
    if (currentTileLayer) { map.removeLayer(currentTileLayer); }
    if (lang === 'en') {
        currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' });
    } else {
        currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' });
    }
    currentTileLayer.addTo(map);
}
window.updateMapLanguage = updateMapLanguage;

const basketballIcon = L.divIcon({ html: '<div style="font-size: 26px;">🏀</div>', className: 'empty-class', iconSize: [30, 30], iconAnchor: [15, 15] });
const footballIcon = L.divIcon({ html: '<div style="font-size: 26px;">⚽</div>', className: 'empty-class', iconSize: [30, 30], iconAnchor: [15, 15] });

let allCourts = []; let allGames = []; let userHasLocation = false; let selectedSportFilter = 'all'; 
let heatLayer = null; 

function getDisplayCourtName(court) {
    return (currentLang === 'en' && court.CourtNameEn) ? court.CourtNameEn : court.CourtName;
}

function updateHeatmap() {
    if (heatLayer) { map.removeLayer(heatLayer); } 
    const heatPoints = [];
    allGames.forEach(game => {
        if (!game.IsSocial) { // מפת חום רק למשחקים פיזיים עם מגרש
            const court = allCourts.find(c => c.CourtName === game.CourtName);
            if (court && (!userHasLocation || (court.distanceKm !== undefined && court.distanceKm <= 10)) && game.GameStatus === 'Open') {
                const intensity = Math.min(game.MissingPlayers * 0.2, 1.0); 
                heatPoints.push([court.Latitude, court.Longitude, intensity]);
            }
        }
    });
    if (heatPoints.length > 0) {
        heatLayer = L.heatLayer(heatPoints, { radius: 35, blur: 25, maxZoom: 15, gradient: {0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red'} }).addTo(map);
    }
}

async function setSportFilter(filter) {
    selectedSportFilter = filter;
    document.getElementById('btnAll').className = `sport-btn ${filter === 'all' ? 'active' : ''}`;
    document.getElementById('btnBasketball').className = `sport-btn ${filter === 'Basketball' ? 'active' : ''}`;
    document.getElementById('btnFootball').className = `sport-btn ${filter === 'Football' ? 'active' : ''}`;
    document.getElementById('btnMyGames').className = `sport-btn ${filter === 'my_games' ? 'active' : ''}`;
    
    allCourts.forEach(court => {
        const matchSport = (filter === 'all' || filter === 'my_games' || court.SportType === filter);
        const isCloseEnough = !userHasLocation || (court.distanceKm !== undefined && court.distanceKm <= 10);
        
        if (matchSport && isCloseEnough) { 
            if (!map.hasLayer(court.marker)) map.addLayer(court.marker); 
        } else { 
            if (map.hasLayer(court.marker)) map.removeLayer(court.marker); 
        }
    });
    
    populateDropdown(document.getElementById('searchBox').value.trim()); 
    
    if (filter === 'my_games') {
        try {
            const response = await fetch(`/api/games/history/${myUserId}?t=` + Date.now());
            const historyGames = await response.json();
            renderGamesList(historyGames);
        } catch (e) { console.error(e); }
    } else {
        loadGames(); 
    }
}
window.setSportFilter = setSportFilter;

function calcDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function loadCourtsAndLocation() {
    try {
        const response = await fetch('/api/courts?t=' + Date.now()); 
        allCourts = await response.json();
        allCourts.forEach(court => {
            let icon = basketballIcon; 
            if (court.SportType === 'Football') icon = footballIcon;

            const marker = L.marker([court.Latitude, court.Longitude], {icon: icon}); 
            marker.bindPopup(`<b>${getDisplayCourtName(court)}</b>`); 
            court.marker = marker; 
        });
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                userHasLocation = true; 
                const myLat = position.coords.latitude; const myLon = position.coords.longitude;
                map.setView([myLat, myLon], 13);
                L.marker([myLat, myLon]).addTo(map).bindPopup(t("youAreHere"));
                allCourts.forEach(c => c.distanceKm = calcDistanceKm(myLat, myLon, c.Latitude, c.Longitude));
                allCourts.sort((a, b) => a.distanceKm - b.distanceKm); 
            }, () => {  });
        } else {  }
    } catch (err) { console.error("שגיאה בטעינת המיקומים:", err); }
}
window.loadCourtsAndLocation = loadCourtsAndLocation;

function populateDropdown(searchTerm) {
    const courtSelect = document.getElementById('courtId'); 
    courtSelect.innerHTML = `<option value="">${t("selectPlaceholder")}</option>`; 
    allCourts.filter(c => {
        const matchName = c.CourtName.includes(searchTerm) || (c.CourtNameEn && c.CourtNameEn.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchSport = (selectedSportFilter === 'all' || selectedSportFilter === 'my_games' || c.SportType === selectedSportFilter);
        const isCloseEnough = !userHasLocation || (c.distanceKm !== undefined && c.distanceKm <= 10);
        return matchName && matchSport && isCloseEnough;
    }).slice(0, 50).forEach(court => {
        let typeEmoji = '📍';
        if (court.SportType === 'Football') typeEmoji = '⚽';
        else if (court.SportType === 'Basketball') typeEmoji = '🏀';

        const option = document.createElement('option'); option.value = court.CourtID;
        option.textContent = `${getDisplayCourtName(court)} ${typeEmoji} ${(userHasLocation && court.distanceKm !== undefined) ? `(${court.distanceKm.toFixed(1)} ${t("distanceKm")})` : ''}`;
        courtSelect.appendChild(option);
    });
}
window.populateDropdown = populateDropdown;
document.getElementById('searchBox').addEventListener('input', e => populateDropdown(e.target.value.trim()));

async function loadGames() {
    try { 
        const response = await fetch('/api/games?t=' + Date.now()); 
        allGames = await response.json(); 
        
        if (selectedSportFilter !== 'my_games') {
            renderGamesList(allGames); 
        }
    } catch (error) {}
}
window.loadGames = loadGames;

function createGameCardHtml(game, c, diffMins, formattedDate, timeString) {
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
    
    let joinControlsHtml = '';
    if (!isCreator && game.GameStatus !== 'Cancelled' && diffMins >= -120) {
        if (hasJoined) {
            joinControlsHtml = `<button class="join-btn" style="background-color: #95a5a6;" onclick="leaveGame(${game.GameID})">${t("leaveGameBtn")}</button>`;
        } else {
            const chatName = game.IsSocial ? (game.EventType + ' ב' + game.City) : game.CourtName;
            joinControlsHtml = `<button class="join-btn" onclick="joinGame(${game.GameID}, '${chatName}')">${t("joinBtn")}</button>`;
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

    const chatName = game.IsSocial ? (game.EventType + ' ב' + game.City) : game.CourtName;
    const chatBtn = `<button class="chat-btn" onclick="openChat(${game.GameID}, '${chatName}')">${t("chatBtn")}</button>`;

    if (game.IsSocial) {
        const ageHtml = `<div class="detail" style="color: #8e44ad; font-weight: bold; font-size: 0.95em; margin-top: 5px;">🎯 גילאים: ${game.MinAge} - ${game.MaxAge} | מגדר מועדף: ${game.PrefGender}</div>`;
        return `<div class="court-name">🥂 ${game.EventType} ב${game.City}</div>
                <div class="detail"><strong>${t("creator")}</strong> ${game.CreatorName}</div>
                ${timeBadgeHtml}
                ${ageHtml}
                <div class="badge">מחפשים עוד ${game.MissingPlayers} חבר'ה</div>
                <div class="btn-group">${joinControlsHtml} ${chatBtn}</div>
                ${creatorControlsHtml}`;
    } else {
        const distanceHtml = userHasLocation && c && c.distanceKm ? `<div class="detail" style="color: #3498db; font-size: 0.95em; margin-top: 5px;">(${c.distanceKm.toFixed(1)} ${t("distanceKm")})</div>` : '';
        const ageHtml = `<div class="detail" style="color: #8e44ad; font-weight: bold; font-size: 0.95em; margin-top: 5px;">🎯 גילאים: ${game.MinAge} - ${game.MaxAge}</div>`;
        let typeEmoji = '📍';
        if (c && c.SportType === 'Football') typeEmoji = '⚽';
        else if (c && c.SportType === 'Basketball') typeEmoji = '🏀';

        return `<div class="court-name">${typeEmoji} ${c ? getDisplayCourtName(c) : 'מגרש לא ידוע'}</div>
                <div class="detail"><strong>${t("creator")}</strong> ${game.CreatorName}</div>
                ${timeBadgeHtml}
                ${distanceHtml}
                ${ageHtml}
                <div class="badge">מחפשים עוד ${game.MissingPlayers} שחקנים</div>
                <div class="btn-group">${joinControlsHtml} ${chatBtn}</div>
                ${creatorControlsHtml}`;
    }
}

function renderGamesList(gamesToRender = allGames) {
    updateHeatmap(); 
    const container = document.getElementById('gamesList'); 
    const socialContainer = document.getElementById('socialGamesList');
    
    if (container) container.innerHTML = ''; 
    if (socialContainer) socialContainer.innerHTML = '';
    
    let hasSportGames = false;
    let hasSocialGames = false;

    gamesToRender.forEach(game => {
        const parts = game.StartTimeStr.split(/[- :]/); 
        const gameDate = new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4]);
        
        const optionsDate = { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' };
        const formattedDate = gameDate.toLocaleDateString(currentLang === 'he' ? 'he-IL' : 'en-US', optionsDate);
        const timeString = `${String(gameDate.getHours()).padStart(2, '0')}:${String(gameDate.getMinutes()).padStart(2, '0')}`;
        const diffMins = Math.floor((gameDate - new Date()) / 60000);
        
        const card = document.createElement('div'); card.className = 'game-card';
        
        if (game.IsSocial) {
            card.innerHTML = createGameCardHtml(game, null, diffMins, formattedDate, timeString);
            if (socialContainer) socialContainer.appendChild(card);
            hasSocialGames = true;
        } else {
            const c = allCourts.find(court => court.CourtName === game.CourtName); 
            let showSportGame = true;
            if (selectedSportFilter !== 'all' && selectedSportFilter !== 'my_games') {
                if (c && c.SportType !== selectedSportFilter) showSportGame = false;
            }
            if (c && userHasLocation && (c.distanceKm === undefined || c.distanceKm > 10)) showSportGame = false;

            if (showSportGame) {
                card.innerHTML = createGameCardHtml(game, c, diffMins, formattedDate, timeString);
                if (container) container.appendChild(card);
                hasSportGames = true;
            }
        }
    });

    if (!hasSportGames && container) container.innerHTML = `<p>${t("noGames")}</p>`; 
    if (!hasSocialGames && socialContainer) socialContainer.innerHTML = `<p>אין כרגע מפגשים חברתיים פתוחים. תהיה הראשון לפתוח אחד!</p>`;
}
window.renderGamesList = renderGamesList;

async function joinGame(gameId, courtName) {
    try {
        const response = await fetch(`/api/games/${gameId}/join`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: myUserId }) });
        const data = await response.json();
        if (response.ok) { 
            showToast("הצטרפת בהצלחה! 🎉"); 
            alert("הצטרפת למפגש בהצלחה!"); 
            loadGames(); 
            openChat(gameId, courtName); 
        } else { 
            alert(data.error); 
        }
    } catch (error) { alert(t("netError")); }
}
window.joinGame = joinGame;

async function leaveGame(gameId) {
    try {
        const response = await fetch(`/api/games/${gameId}/leave`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: myUserId }) });
        const data = await response.json();
        if (response.ok) { 
            alert("עזבת את המפגש."); 
            if(selectedSportFilter === 'my_games') setSportFilter('my_games'); 
            else loadGames(); 
        } else { alert(data.error); }
    } catch (error) { alert(t("netError")); }
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
            if(selectedSportFilter === 'my_games') setSportFilter('my_games'); 
            else loadGames(); 
        } else { alert(data.error || t("serverError")); }
    } catch (error) { alert(t("netError")); }
}
window.updateGameStatus = updateGameStatus;

async function createNewGame(isSocial = false) {
    let payload = {
        creatorPlayerId: parseInt(myUserId),
        isSocial: isSocial
    };

    let sqlStartTime; 
    const now = new Date();

    if (isSocial) {
        const city = document.getElementById('socialCity').value.trim();
        const eventType = document.getElementById('socialEventType').value;
        const missingPlayers = document.getElementById('socialMissingPlayers').value;
        const minAgeVal = parseInt(document.getElementById('socialMinAge').value) || 10;
        const maxAgeVal = parseInt(document.getElementById('socialMaxAge').value) || 99;
        const prefGender = document.getElementById('socialPrefGender').value;
        const dateStr = document.getElementById('socialGameDate').value;

        if (!city) { alert("אנא הקלד עיר."); return; }
        if (!eventType) { alert("אנא בחר סוג בילוי."); return; }
        if (!dateStr) { alert("אנא בחר תאריך."); return; }
        if (!missingPlayers || missingPlayers < 1) { alert("אנא הזן כמה אנשים חסרים."); return; }
        if (minAgeVal > maxAgeVal) { alert("הגיל המינימלי לא יכול להיות גדול מהמקסימלי."); return; }

        const hStr = document.getElementById('socialGameHour').value; 
        const mStr = document.getElementById('socialGameMinute').value; 
        
        // יצירת אובייקט תאריך מהקלט ושילוב השעה
        const gameTime = new Date(dateStr);
        gameTime.setHours(parseInt(hStr), parseInt(mStr), 0, 0);
        
        if (gameTime < now && (now - gameTime) > 300000) { alert("❌ שגיאה: בחרת תאריך או שעה שכבר עברו."); return; }
        
        sqlStartTime = `${gameTime.getFullYear()}-${String(gameTime.getMonth() + 1).padStart(2, '0')}-${String(gameTime.getDate()).padStart(2, '0')} ${hStr}:${mStr}:00`;

        payload = { ...payload, city, eventType, missingPlayers: parseInt(missingPlayers), minAge: minAgeVal, maxAge: maxAgeVal, prefGender, startTime: sqlStartTime, courtId: null };
    } else {
        const courtId = document.getElementById('courtId').value; 
        const missingPlayers = document.getElementById('missingPlayers').value; 
        const minAgeVal = parseInt(document.getElementById('minAge').value) || 10;
        const maxAgeVal = parseInt(document.getElementById('maxAge').value) || 99;
        
        if (!courtId) { alert("אנא בחר מיקום מהרשימה."); return; }
        if (!missingPlayers || missingPlayers < 1) { alert("אנא הזן כמה שחקנים חסרים."); return; }
        if (minAgeVal > maxAgeVal) { alert("הגיל המינימלי לא יכול להיות גדול מהמקסימלי."); return; }

        if (currentTimeMode === 'now') {
            sqlStartTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
        } else {
            const hStr = document.getElementById('gameHour').value; const mStr = document.getElementById('gameMinute').value; const gameTime = new Date(); gameTime.setHours(parseInt(hStr), parseInt(mStr), 0, 0);
            if (gameTime < now && (now - gameTime) > 300000) { alert(t("timePastError")); return; }
            sqlStartTime = `${gameTime.getFullYear()}-${String(gameTime.getMonth() + 1).padStart(2, '0')}-${String(gameTime.getDate()).padStart(2, '0')} ${hStr}:${mStr}:00`;
        }

        payload = { ...payload, courtId: parseInt(courtId), missingPlayers: parseInt(missingPlayers), minAge: minAgeVal, maxAge: maxAgeVal, startTime: sqlStartTime };
    }
    
    try {
        const submitBtn = isSocial ? document.querySelector('#socialApp .submit-btn') : document.querySelector('#mainApp .submit-btn');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "יוצר מפגש..."; submitBtn.disabled = true; 
        
        const response = await fetch('/api/games', { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) 
        });
        
        if(response.ok) { 
            if (isSocial) {
                document.getElementById('socialCity').value = '';
                document.getElementById('socialMissingPlayers').value = '';
                document.getElementById('socialMinAge').value = ''; 
                document.getElementById('socialMaxAge').value = '';
                document.getElementById('socialEventType').value = '';
            } else {
                document.getElementById('missingPlayers').value = ''; 
                document.getElementById('minAge').value = ''; 
                document.getElementById('maxAge').value = ''; 
            }
            loadGames(); 
            document.getElementById('whatsappModal').style.display = 'flex'; 
        } 
        else { const data = await response.json(); alert(t("serverError") + (data.error || "")); }
        submitBtn.innerText = originalText; submitBtn.disabled = false;
    } catch (error) { 
        alert(t("netError")); 
        const submitBtn = isSocial ? document.querySelector('#socialApp .submit-btn') : document.querySelector('#mainApp .submit-btn');
        submitBtn.innerText = isSocial ? "צור מפגש חברתי!" : "צור משחק!"; 
        submitBtn.disabled = false; 
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
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
window.showToast = showToast;

function showNotificationWithSound(message) {
    showToast(message); 
    try {
        const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        sound.volume = 0.2;
        let playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {});
        }
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
            if (typeof loadGames === 'function' && selectedSportFilter !== 'my_games') {
                loadGames();
            }
        }
        lastKnownGamesCount = currentGames.length;

        const response = await fetch(`/api/games/history/${myUserId}?t=` + Date.now());
        const myGames = await response.json();
        
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
                        
                        if (typeof loadGames === 'function' && selectedSportFilter !== 'my_games') {
                            loadGames();
                        } else if (selectedSportFilter === 'my_games') {
                            setSportFilter('my_games');
                        }
                    }
                }
            }
        }
    } catch (e) {
    }
}

setInterval(checkBackgroundNotifications, 1500);