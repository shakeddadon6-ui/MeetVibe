// ==========================================
// קובץ chat.js - ניהול הצ'אט של המפגש (מאובטח עם JWT)
// ==========================================

let currentChatGameId = null;
let chatInterval = null;

function openChat(gameId, courtName) {
    currentChatGameId = gameId;
    document.getElementById('chatTitle').innerText = "💬 " + courtName;
    document.getElementById('chatModal').style.display = 'flex';
    loadChatMessages();
    // רענון הצ'אט כל 2 שניות
    chatInterval = setInterval(loadChatMessages, 2000);
}
window.openChat = openChat;

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
    currentChatGameId = null;
    if (chatInterval) clearInterval(chatInterval);
}
window.closeChat = closeChat;

async function loadChatMessages() {
    if (!currentChatGameId) return;
    try {
        // שימוש בפונקציית הטוקן שהגדרנו ב-app.js
        const res = await fetch(`/api/games/${currentChatGameId}/chat?t=` + Date.now(), {
            headers: window.getAuthHeaders ? window.getAuthHeaders() : {}
        });
        
        if (!res.ok) return; // במידה ויש שגיאת הרשאה
        
        const messages = await res.json();
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#7f8c8d; padding:20px;">${window.t ? window.t('chatEmpty') : 'אין הודעות. תגיד שלום! 👋'}</p>`;
            return;
        }

        let isUserAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

        messages.forEach(msg => {
            const isMe = msg.SenderName === myUsername;
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-bubble ${isMe ? 'chat-me' : 'chat-other'}`;
            
            const senderSpan = document.createElement('span');
            senderSpan.className = 'chat-sender';
            senderSpan.innerText = msg.SenderName === 'מערכת' ? '🔔 מערכת' : (isMe ? (window.t ? window.t('chatMe') : 'אני') : msg.SenderName);
            
            // עיצוב מיוחד להודעות מערכת
            if(msg.SenderName === 'מערכת') {
                msgDiv.style.background = '#f1c40f';
                msgDiv.style.color = '#333';
                msgDiv.style.alignSelf = 'center';
            }

            const textSpan = document.createElement('span');
            textSpan.innerText = msg.MessageText;

            const timeSpan = document.createElement('div');
            timeSpan.className = 'chat-time';
            timeSpan.innerText = msg.SendTime ? msg.SendTime.substring(0, 5) : '';

            msgDiv.appendChild(senderSpan);
            msgDiv.appendChild(textSpan);
            msgDiv.appendChild(timeSpan);
            container.appendChild(msgDiv);
        });

        if (isUserAtBottom) {
            container.scrollTop = container.scrollHeight;
        }
    } catch (err) { console.error("Chat load error", err); }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !currentChatGameId) return;
    
    try {
        await fetch(`/api/games/${currentChatGameId}/chat`, {
            method: 'POST',
            // הוספת הטוקן לבקשת השליחה
            headers: window.getAuthHeaders ? window.getAuthHeaders() : { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderName: myUsername, messageText: text })
        });
        input.value = '';
        loadChatMessages();
    } catch (err) { console.error("Chat send error", err); }
}
window.sendChatMessage = sendChatMessage;

function handleChatEnter(e) {
    if (e.key === 'Enter') sendChatMessage();
}
window.handleChatEnter = handleChatEnter;