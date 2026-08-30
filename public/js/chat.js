// ==========================================
// קובץ chat.js - ניהול הצ'אט בזמן אמת עם Socket.io
// ==========================================

let socket = io(); // התחברות לשרת ה-WebSocket
let currentChatGameId = null;

function openChat(gameId, courtName) {
    currentChatGameId = gameId;
    document.getElementById('chatTitle').innerText = "💬 " + courtName;
    document.getElementById('chatModal').style.display = 'flex';
    
    // הצטרפות לחדר בשרת
    socket.emit('join_game_room', gameId);
    
    // טעינת ההודעות ההיסטוריות פעם אחת בפתיחה
    loadChatMessages();
}
window.openChat = openChat;

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
    currentChatGameId = null;
}
window.closeChat = closeChat;

// האזנה להודעות חדשות בזמן אמת מהשרת
socket.on('receive_message', (msg) => {
    if (!currentChatGameId) return;
    appendMessageToDOM(msg);
});

async function loadChatMessages() {
    if (!currentChatGameId) return;
    try {
        const res = await fetch(`/api/games/${currentChatGameId}/chat?t=` + Date.now(), {
            headers: window.getAuthHeaders ? window.getAuthHeaders() : {}
        });
        
        if (!res.ok) return;
        
        const messages = await res.json();
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#7f8c8d; padding:20px;">${window.t ? window.t('chatEmpty') : 'אין הודעות. תגיד שלום! 👋'}</p>`;
            return;
        }

        messages.forEach(msg => appendMessageToDOM(msg));
        container.scrollTop = container.scrollHeight;
    } catch (err) { console.error("Chat load error", err); }
}

function appendMessageToDOM(msg) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    // הסרת הודעת "אין הודעות" במידה וקיימת
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();

    let isUserAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

    // תיקון: שליפת שם המשתמש המחובר ישירות מ-localStorage
    const currentUsername = localStorage.getItem('sportMatchUser') || '';
    const isMe = msg.SenderName === currentUsername;

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isMe ? 'msg-me' : 'msg-other'}`;
    
    const senderSpan = document.createElement('span');
    senderSpan.className = 'msg-sender';
    senderSpan.innerText = msg.SenderName === 'מערכת' ? '🔔 מערכת' : (isMe ? (window.t ? window.t('chatMe') : 'אני') : msg.SenderName);
    
    if(msg.SenderName === 'מערכת') {
        msgDiv.style.background = '#f1c40f';
        msgDiv.style.color = '#333';
        msgDiv.style.alignSelf = 'center';
    }

    const textSpan = document.createElement('span');
    textSpan.innerText = msg.MessageText;

    const timeSpan = document.createElement('div');
    timeSpan.className = 'msg-time';
    timeSpan.innerText = msg.SendTime ? msg.SendTime.substring(0, 5) : '';

    msgDiv.appendChild(senderSpan);
    msgDiv.appendChild(textSpan);
    msgDiv.appendChild(timeSpan);
    container.appendChild(msgDiv);

    if (isUserAtBottom || isMe) {
        container.scrollTop = container.scrollHeight;
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    // עצירה אם לא הוקלד טקסט
    if (!text) return;
    
    // התיקון: בדיקה מפורשת ל-null ו-undefined כדי ש-0 יעבור בהצלחה
    if (currentChatGameId === null || currentChatGameId === undefined) return;
    
    const senderName = localStorage.getItem('sportMatchUser') || 'משתמש';

    // שליחת הודעה דרך Socket.io לשרת
    socket.emit('send_message', {
        gameId: currentChatGameId,
        senderName: senderName,
        messageText: text
    });

    input.value = '';
}
window.sendChatMessage = sendChatMessage;


function handleChatEnter(e) {
    if (e.key === 'Enter') sendChatMessage();
}
window.handleChatEnter = handleChatEnter;