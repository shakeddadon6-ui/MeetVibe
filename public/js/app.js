// ==========================================
// קובץ app.js - מנגנון הליבה: מפה, משחקים וסינון מתורגם!
// ==========================================

let myUserId = localStorage.getItem('sportMatchUserId');
let myUsername = localStorage.getItem('sportMatchUser');

window.onload = function() {
    if (myUserId && myUsername) { showMainApp(); } 
    else { document.getElementById('authScreen').style.display = 'flex'; document.getElementById('mainApp').style.display = 'none'; }
    
    const hourSelect = document.getElementById('gameHour');
    for (let i = 0; i < 24; i++) hourSelect.innerHTML += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;
    const minuteSelect = document.getElementById('gameMinute');
    for (let i = 0; i < 60; i++) minuteSelect.innerHTML += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;
};

function showMainApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // משיכת ברכת השלום מהמילון
    document.getElementById('welcomeMessage').innerText = t("welcome").replace('{name}', myUsername);
    
    setTimeout(() => { map.invalidateSize(); loadCourtsAndLocation(); loadGames(); }, 300);
}
window.showMainApp = showMainApp;

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
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
const basketballIcon = L.divIcon({ html: '<div style="font-size: 26px;">🏀</div>', className: 'empty-class', iconSize: [30, 30], iconAnchor: [15, 15] });
const footballIcon = L.divIcon({ html: '<div style="font-size: 26px;">⚽</div>', className: 'empty-class', iconSize: [30, 30], iconAnchor: [15, 15] });

let allCourts = []; let allGames = []; let userHasLocation = false; let selectedSportFilter = 'all'; 
let heatLayer = null; 

function updateHeatmap() {
    if (heatLayer) { map.removeLayer(heatLayer); } 
    const heatPoints = [];
    allGames.forEach(game => {
        const court = allCourts.find(c => c.CourtName === game.CourtName);
        if (court && (!userHasLocation || (court.distanceKm !== undefined && court.distanceKm <= 10))) {
            const intensity = Math.min(game.MissingPlayers * 0.2, 1.0); 
            heatPoints.push([court.Latitude, court.Longitude, intensity]);
        }
    });
    if (heatPoints.length > 0) {
        heatLayer = L.heatLayer(heatPoints, { radius: 35, blur: 25, maxZoom: 15, gradient: {0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red'} }).addTo(map);
    }
}

function setSportFilter(sport) {
    selectedSportFilter = sport;
    document.getElementById('btnAll').className = `sport-btn ${sport === 'all' ? 'active' : ''}`;
    document.getElementById('btnBasketball').className = `sport-btn ${sport === 'Basketball' ? 'active' : ''}`;
    document.getElementById('btnFootball').className = `sport-btn ${sport === 'Football' ? 'active' : ''}`;
    
    allCourts.forEach(court => {
        const matchSport = (selectedSportFilter === 'all' || court.SportType === selectedSportFilter);
        const isCloseEnough = !userHasLocation || (court.distanceKm !== undefined && court.distanceKm <= 10);
        if (matchSport && isCloseEnough) { 
            if (!map.hasLayer(court.marker)) map.addLayer(court.marker); 
        } else { 
            if (map.hasLayer(court.marker)) map.removeLayer(court.marker); 
        }
    });
    populateDropdown(document.getElementById('searchBox').value.trim()); 
    renderGamesList();
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
        const response = await fetch('/api/courts'); 
        allCourts = await response.json();
        allCourts.forEach(court => {
            const icon = court.SportType === 'Football' ? footballIcon : basketballIcon;
            const marker = L.marker([court.Latitude, court.Longitude], {icon: icon}); 
            marker.bindPopup(`<b>${court.CourtName}</b>`); 
            court.marker = marker; 
        });
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                userHasLocation = true; 
                const myLat = position.coords.latitude; const myLon = position.coords.longitude;
                map.setView([myLat, myLon], 13);
                // תרגום פופ-אפ מפה ("אתה כאן!")
                L.marker([myLat, myLon]).addTo(map).bindPopup(t("youAreHere"));
                allCourts.forEach(c => c.distanceKm = calcDistanceKm(myLat, myLon, c.Latitude, c.Longitude));
                allCourts.sort((a, b) => a.distanceKm - b.distanceKm); 
                setSportFilter('all');
            }, () => { setSportFilter('all'); });
        } else { setSportFilter('all'); }
    } catch (err) { console.error("שגיאה בטעינת המגרשים:", err); }
}
window.loadCourtsAndLocation = loadCourtsAndLocation;

function populateDropdown(searchTerm) {
    const courtSelect = document.getElementById('courtId'); 
    // תרגום פלייס-הולדר "-- בחר מגרש --"
    courtSelect.innerHTML = `<option value="">${t("selectPlaceholder")}</option>`; 
    allCourts.filter(c => {
        const matchName = c.CourtName.includes(searchTerm);
        const matchSport = (selectedSportFilter === 'all' || c.SportType === selectedSportFilter);
        const isCloseEnough = !userHasLocation || (c.distanceKm !== undefined && c.distanceKm <= 10);
        return matchName && matchSport && isCloseEnough;
    }).slice(0, 50).forEach(court => {
        const option = document.createElement('option'); option.value = court.CourtID;
        // תרגום מרחק "ק"מ" ברשימה
        option.textContent = `${court.CourtName} ${court.SportType === 'Football' ? '⚽' : '🏀'} ${(userHasLocation && court.distanceKm !== undefined) ? `(${court.distanceKm.toFixed(1)} ${t("distanceKm")})` : ''}`;
        courtSelect.appendChild(option);
    });
}
window.populateDropdown = populateDropdown;
document.getElementById('searchBox').addEventListener('input', e => populateDropdown(e.target.value.trim()));

async function loadGames() {
    try { const response = await fetch('/api/games'); allGames = await response.json(); renderGamesList(); } catch (error) {}
}
window.loadGames = loadGames;

function renderGamesList() {
    updateHeatmap(); 
    const container = document.getElementById('gamesList'); container.innerHTML = ''; 
    const filtered = allGames.filter(g => { 
        const c = allCourts.find(court => court.CourtName === g.CourtName); 
        return c && (selectedSportFilter === 'all' || c.SportType === selectedSportFilter) && (!userHasLocation || (c.distanceKm !== undefined && c.distanceKm <= 10)); 
    });
    
    // תרגום הודעת "אין משחקים פתוחים"
    if (filtered.length === 0) { 
        container.innerHTML = `<p>${t("noGames")}</p>`; 
        return; 
    }
    
    filtered.forEach(game => {
        const parts = game.StartTimeStr.split(/[- :]/); const gameDate = new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4]);
        const timeString = `${String(gameDate.getHours()).padStart(2, '0')}:${String(gameDate.getMinutes()).padStart(2, '0')}`;
        const diffMins = Math.floor((gameDate - new Date()) / 60000);
        const c = allCourts.find(court => court.CourtName === game.CourtName);
        const card = document.createElement('div'); card.className = 'game-card';
        
        // תרגום "קורה עכשיו" ו-"עתידי"
        const timeBadgeHtml = diffMins <= 30 ? `<div class="time-badge time-now">${t("happeningNow").replace('{time}', timeString)}</div>` : `<div class="time-badge time-future">${t("futureGame").replace('{time}', timeString)}</div>`;
        // תרגום "ק"מ ממך"
        const distanceHtml = userHasLocation && c.distanceKm ? `<div class="detail" style="color: #3498db; font-size: 0.95em; margin-top: 5px;">(${c.distanceKm.toFixed(1)} ${t("awayFromYou")})</div>` : '';
        
        card.innerHTML = `<div class="court-name">${c.SportType === 'Football' ? '⚽' : '🏀'} 📍 ${game.CourtName}</div><div class="detail"><strong>${t("creator")}</strong> ${game.CreatorName}</div>${timeBadgeHtml}${distanceHtml}<div class="badge">${t("missingBadge").replace('{count}', game.MissingPlayers)}</div><div class="btn-group"><button class="join-btn" onclick="joinGame(${game.GameID}, '${game.CourtName}')">${t("joinBtn")}</button><button class="chat-btn" onclick="openChat(${game.GameID}, '${game.CourtName}')">${t("chatBtn")}</button></div>`;
        container.appendChild(card);
    });
}
window.renderGamesList = renderGamesList;

async function joinGame(gameId, courtName) {
    try {
        const response = await fetch(`/api/games/${gameId}/join`, { method: 'PUT' });
        const data = await response.json();
        // תרגום הצטרפות בהצלחה
        if (response.ok) { alert(t("joinedSuccess")); loadGames(); openChat(gameId, courtName); } else { alert(data.error); }
    } catch (error) { alert(t("netError")); }
}
window.joinGame = joinGame;

async function createNewGame() {
    const courtId = document.getElementById('courtId').value; 
    const missingPlayers = document.getElementById('missingPlayers').value; 
    
    // תרגום התראות של חסר מגרש / שחקנים
    if (!courtId) { alert(t("selectCourtAlert")); return; }
    if (!missingPlayers || missingPlayers < 1) { alert(t("missingPlayersAlert")); return; }

    let sqlStartTime; const now = new Date();
    if (currentTimeMode === 'now') {
        sqlStartTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    } else {
        const hStr = document.getElementById('gameHour').value; const mStr = document.getElementById('gameMinute').value; const gameTime = new Date(); gameTime.setHours(parseInt(hStr), parseInt(mStr), 0, 0);
        if (gameTime < now && (now - gameTime) > 300000) { alert(t("timePastError")); return; } // תרגום שגיאת זמן
        sqlStartTime = `${gameTime.getFullYear()}-${String(gameTime.getMonth() + 1).padStart(2, '0')}-${String(gameTime.getDate()).padStart(2, '0')} ${hStr}:${mStr}:00`;
    }
    
    try {
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.innerText = t("creatingGame"); submitBtn.disabled = true; // תרגום "פותח משחק"
        const creatorId = parseInt(myUserId);
        const response = await fetch('/api/games', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courtId: parseInt(courtId), creatorPlayerId: creatorId, missingPlayers: parseInt(missingPlayers), startTime: sqlStartTime }) });
        
        if(response.ok) { document.getElementById('missingPlayers').value = ''; loadGames(); document.getElementById('whatsappModal').style.display = 'flex'; } 
        else { const data = await response.json(); alert(t("serverError") + (data.error || "")); }
        
        submitBtn.innerText = t("submitGameBtn"); submitBtn.disabled = false;
    } catch (error) { 
        alert(t("netError")); 
        document.querySelector('.submit-btn').innerText = t("submitGameBtn"); document.querySelector('.submit-btn').disabled = false;
    }
}
window.createNewGame = createNewGame;

function closeModal() { document.getElementById('whatsappModal').style.display = 'none'; }
window.closeModal = closeModal;