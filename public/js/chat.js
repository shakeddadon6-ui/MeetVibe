// ==========================================
// קובץ chat.js - ניהול הודעות וצ'אט (דו-לשוני)
// ==========================================

let activeChatGameId = null; 
let chatPollingInterval = null;

function openChat(gameId, eventName) {
    activeChatGameId = gameId; 
    document.getElementById('chatTitle').innerText = `${t("chatTitle")}: ${eventName}`; 
    document.getElementById('chatModal').style.display = 'flex';
    fetchChatMessages(); 
    chatPollingInterval = setInterval(fetchChatMessages, 2000);
}
window.openChat = openChat;

function closeChat() { 
    document.getElementById('chatModal').style.display = 'none'; 
    clearInterval(chatPollingInterval); 
    activeChatGameId = null; 
}
window.closeChat = closeChat;

async function fetchChatMessages() {
    if (!activeChatGameId) return;
    try {
        const response = await fetch(`/api/games/${activeChatGameId}/chat?t=` + Date.now()); 
        const messages = await response.json();
        const chatBox = document.getElementById('chatMessages'); 
        chatBox.innerHTML = ''; 
        
        if (messages.length === 0) { 
            chatBox.innerHTML = `<p style="text-align:center; color:gray; margin-top:20px;">${t("chatEmpty")}</p>`; 
            return; 
        }
        
        messages.forEach(msg => {
            const isMe = msg.SenderName === myUsername; 
            const msgDiv = document.createElement('div'); 
            msgDiv.className = `message ${isMe ? 'msg-me' : 'msg-other'}`;
            msgDiv.innerHTML = `<span class="msg-sender">${isMe ? t("chatMe") : msg.SenderName}</span>${msg.MessageText}<span class="msg-time">${msg.SendTime.substring(0, 5)}</span>`; 
            chatBox.appendChild(msgDiv);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error("שגיאה במשיכת הודעות:", error);
    }
}

async function sendChatMessage() {
    const text = document.getElementById('chatInput').value.trim(); 
    if (!text || !activeChatGameId) return; 
    
    document.getElementById('chatInput').value = ''; 
    
    try { 
        await fetch(`/api/games/${activeChatGameId}/chat`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ senderName: myUsername, messageText: text }) 
        }); 
        fetchChatMessages(); 
    } catch (error) {
        console.error("שגיאה בשליחת הודעה:", error);
    }
}
window.sendChatMessage = sendChatMessage;

function handleChatEnter(e) { 
    if (e.key === 'Enter') sendChatMessage(); 
}
window.handleChatEnter = handleChatEnter;