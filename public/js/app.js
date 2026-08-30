// ==========================================
// קובץ app.js - מנגנון הליבה (לאחר ניקוי ופיצול)
// ==========================================

let myUserId = localStorage.getItem('sportMatchUserId');
let myUsername = localStorage.getItem('sportMatchUser');
let allGames = [];
let myHistoryGames = [];
let globalCities = []; 

// פונקציית עזר להוספת הטוקן לכל בקשה לשרת
function getAuthHeaders() {
    const token = localStorage.getItem('sportMatchToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    };
}
window.getAuthHeaders = getAuthHeaders;

window.onload = function() {
    if (myUserId && myUsername && localStorage.getItem('sportMatchToken')) { 
        showMainApp(); 
    } else { 
        document.getElementById('authScreen').style.display = 'flex'; 
        document.getElementById('mainApp').style.display = 'none'; 
    }
    
    fetchIsraelCities();
    
    const hourSelect = document.getElementById('gameHour');
    if (hourSelect) {
        for (let i = 0; i < 24; i++) hourSelect.innerHTML += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;
    }
    const minuteSelect = document.getElementById('gameMinute');
    if (minuteSelect) {
        for (let i = 0; i < 60; i++) minuteSelect.innerHTML += `<option value="${String(i).padStart(2, '0')}">${String(i).padStart(2, '0')}</option>`;
    }
};

async function fetchIsraelCities() {
    try {
        const response = await fetch('https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&limit=1500');
        const data = await response.json();
        
        if (data && data.result && data.result.records) {
            globalCities = data.result.records
                .map(record => {
                    let englishName = (record['שם_ישוב_לועזי'] || '').trim().toLowerCase();
                    englishName = englishName.replace(/\b\w/g, char => char.toUpperCase());
                    
                    return {
                        he: record['שם_ישוב'].trim(),
                        en: englishName
                    };
                })
                .filter(city => city.he.length > 0 && city.he !== 'לא רשום');
            
            if (typeof currentLang !== 'undefined') {
                updateCityDatalist(currentLang);
            } else {
                updateCityDatalist('he');
            }
        }
    } catch (error) { console.error("שגיאה במשיכת נתונים ממאגר הערים:", error); }
}

function updateCityDatalist(lang) {
    const datalist = document.getElementById('israelCities');
    if (!datalist || globalCities.length === 0) return;
    
    datalist.innerHTML = '';
    const sortedCities = [...globalCities].sort((a, b) => a[lang].localeCompare(b[lang]));
    
    sortedCities.forEach(city => {
        if (city[lang]) {
            const option = document.createElement('option');
            option.value = city[lang];
            datalist.appendChild(option);
        }
    });
}
window.updateCityDatalist = updateCityDatalist; 

function showMainApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    const savedUsername = localStorage.getItem('sportMatchUser');
    if (savedUsername) { document.getElementById('welcomeMessage').innerText = "אהלן " + savedUsername + "!"; }

    const isAdmin = localStorage.getItem('sportMatchIsAdmin') === 'true';
    let adminBtn = document.getElementById('adminPanelBtn');
    
    if (isAdmin) {
        if (!adminBtn) {
            const headerContainer = document.querySelector('.header-container');
            adminBtn = document.createElement('button');
            adminBtn.id = 'adminPanelBtn';
            adminBtn.className = 'top-btn';
            adminBtn.style.backgroundColor = '#e67e22';
            adminBtn.innerText = '⚙️ פאנל ניהול';
            adminBtn.onclick = openAdminPanel;
            headerContainer.insertBefore(adminBtn, headerContainer.firstChild);
        }
    } else if (adminBtn) {
        adminBtn.remove();
    }

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
    if (!myUserId || !localStorage.getItem('sportMatchToken')) return;
    try {
        const allGamesRes = await fetch('/api/games?t=' + Date.now());
        const currentGames = await allGamesRes.json();
        
        if (lastKnownGamesCount > 0 && currentGames.length > lastKnownGamesCount) {
            showNotificationWithSound("🔥 מפגש חדש נפתח במערכת!");
            loadGames();
        }
        lastKnownGamesCount = currentGames.length;

        const histRes = await fetch(`/api/games/history/${myUserId}?t=` + Date.now(), { headers: getAuthHeaders() });
        const myGames = await histRes.json();
        
        for (const game of myGames) {
            const chatRes = await fetch(`/api/games/${game.GameID}/chat?t=` + Date.now(), { headers: getAuthHeaders() });
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