// ==========================================
// קובץ games.js - ניהול מפגשים, כרטיסים וסינון
// ==========================================

async function loadGames() {
    try { 
        // רשימה פתוחה - אין צורך בטוקן
        const response = await fetch('/api/games?t=' + Date.now()); 
        allGames = await response.json(); 
        
        if (myUserId) {
            // היסטוריה אישית - דורשת טוקן אבטחה
            const histRes = await fetch(`/api/games/history/${myUserId}?t=` + Date.now(), { headers: getAuthHeaders() });
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
        const noGamesTxt = window.t ? window.t("noGames") : "לא נמצאו מפגשים שתואמים את הסינון שבחרת.";
        container.innerHTML = `<p style="text-align:center; color:#7f8c8d; padding:20px;">${noGamesTxt}</p>`;
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
    const isAdmin = localStorage.getItem('sportMatchIsAdmin') === 'true' || localStorage.getItem('sportMatchIsAdmin') === '1';
    const joinedPlayers = game.JoinedPlayersStr ? game.JoinedPlayersStr.split(',').filter(id => id !== '') : [];
    const hasJoined = joinedPlayers.includes(String(myUserId));
    const chatName = game.EventType + ' ב' + game.City;
    
    let joinControlsHtml = '';
    if (!isCreator && !isAdmin && game.GameStatus !== 'Cancelled' && diffMins >= -120) {
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

    // כפתור דיווח וחסימה על יוצר המפגש (מוצג רק למשתמש רגיל שאינו היוצר ואינו אדמין)
    let creatorActionsHtml = '';
    if (!isCreator && !isAdmin && myUserId) {
        creatorActionsHtml = `
            <div style="margin-top: 8px; display: flex; gap: 10px; justify-content: center; font-size: 0.85em;">
                <button onclick="openReportModal(${game.CreatorPlayerID}, '${game.CreatorName.replace(/'/g, "\\'")}')" style="background: transparent; border: none; color: #e74c3c; cursor: pointer; text-decoration: underline;">🚨 דווח על היוצר</button>
                <button onclick="blockUser(${game.CreatorPlayerID}, '${game.CreatorName.replace(/'/g, "\\'")}')" style="background: transparent; border: none; color: #7f8c8d; cursor: pointer; text-decoration: underline;">🚫 חסום יוצר</button>
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
            ${creatorActionsHtml}
            ${timeBadgeHtml}
            ${ageHtml}
            <div class="badge">מחפשים עוד ${game.MissingPlayers} חבר'ה</div>
            <div class="btn-group">${joinControlsHtml} ${chatBtn}</div>
            ${creatorControlsHtml}`;
}

async function joinGame(gameId, courtName) {
    try {
        const response = await fetch(`/api/games/${gameId}/join`, { 
            method: 'PUT', 
            headers: getAuthHeaders(), 
            body: JSON.stringify({ userId: myUserId }) 
        });
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
        const response = await fetch(`/api/games/${gameId}/leave`, { 
            method: 'PUT', 
            headers: getAuthHeaders(), 
            body: JSON.stringify({ userId: myUserId }) 
        });
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
        const response = await fetch(`/api/games/${gameId}/status`, { 
            method: 'PUT', 
            headers: getAuthHeaders(), 
            body: JSON.stringify({ userId: myUserId, status: status }) 
        });
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

    if (!city || !eventType || !dateStr) { alert("אנא מלא את כל שדות החובה."); return; }
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
        city, eventType, missingPlayers: parseInt(missingPlayers), 
        minAge: minAgeVal, maxAge: maxAgeVal, prefGender, startTime: sqlStartTime
    };
    
    try {
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.innerText = "יוצר מפגש..."; submitBtn.disabled = true; 
        
        const response = await fetch('/api/games', { 
            method: 'POST', 
            headers: getAuthHeaders(), 
            body: JSON.stringify(payload) 
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

// ==========================================
// מנגנון חסימות משתמשים
// ==========================================
async function blockUser(userId, userName) {
    if (!confirm(`האם אתה בטוח שברצונך לחסום את ${userName}? לא תראו עוד מפגשים אחד של השני.`)) return;
    try {
        const res = await fetch('/api/users/block', {
            method: 'POST',
            headers: window.getAuthHeaders(),
            body: JSON.stringify({ blockedId: userId })
        });
        const data = await res.json();
        if (data.success) {
            alert(`חסמת את ${userName}.`);
            loadGames();
        } else {
            alert(data.error || "שגיאה בביצוע החסימה");
        }
    } catch (err) { alert("שגיאת רשת"); }
}
window.blockUser = blockUser;

// ==========================================
// מנגנון דיווח על משתמשים
// ==========================================
let currentReportUserId = null;

function openReportModal(userId, userName) {
    currentReportUserId = userId;
    document.getElementById('reportTargetName').innerText = `מדווח על: ${userName}`;
    document.getElementById('reportReason').value = '';
    document.getElementById('reportModal').style.display = 'flex';
}
window.openReportModal = openReportModal;

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    currentReportUserId = null;
}
window.closeReportModal = closeReportModal;

async function submitReport() {
    const reason = document.getElementById('reportReason').value.trim();
    if (!reason || !currentReportUserId) { alert('❌ חובה לציין סיבה לדיווח.'); return; }

    const reportedNameRaw = document.getElementById('reportTargetName').innerText.replace('מדווח על: ', '');

    try {
        const res = await fetch('/api/reports', {
            method: 'POST',
            headers: window.getAuthHeaders ? window.getAuthHeaders() : {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('sportMatchToken')
            },
            body: JSON.stringify({ reportedUserId: currentReportUserId, reason: reason })
        });
        
        const data = await res.json();
        if (data.success) {
            alert('✅ הדיווח נשלח בהצלחה למנהל המערכת.');
            closeReportModal();
            
            // שידור התראה אדומה בזמן אמת למנהל!
            if (typeof socket !== 'undefined') {
                socket.emit('send_report_alert', { reportedName: reportedNameRaw, reason: reason });
            }
        } else {
            alert('❌ שגיאה: ' + (data.error || 'תקלה בשליחת דיווח'));
        }
    } catch (err) { alert('❌ תקלה בשליחת הדיווח.'); }
}
window.submitReport = submitReport;