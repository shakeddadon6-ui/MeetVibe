// ==========================================
// פאנל ניהול (Admin Dashboard)
// ==========================================

async function openAdminPanel() {
    let modal = document.getElementById('adminModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="chat-modal" style="max-width: 600px; height: 85vh; background: var(--bg-color, white);">
                <div class="chat-header" style="background: #d35400;">
                    <span>⚙️ פאנל ניהול מערכת</span>
                    <button class="chat-close-btn" onclick="closeAdminPanel()">&times;</button>
                </div>
                <div id="adminContent" style="padding: 20px; overflow-y: auto; flex: 1; text-align: right;">
                    <p>טוען משתמשים...</p>
                </div>
            </div>`;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    loadAdminPlayers();
}
window.openAdminPanel = openAdminPanel;

function closeAdminPanel() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.style.display = 'none';
}
window.closeAdminPanel = closeAdminPanel;

async function loadAdminPlayers() {
    const container = document.getElementById('adminContent');
    if (!container) return;
    
    try {
        // שליפת משתמשים ודיווחים במקביל
        const [playersRes, reportsRes] = await Promise.all([
            fetch('/api/admin/players', { headers: getAuthHeaders() }),
            fetch('/api/admin/reports', { headers: getAuthHeaders() })
        ]);

        if (!playersRes.ok || !reportsRes.ok) {
            container.innerHTML = `<p style="color:red; text-align:center;">אין לך הרשאה לצפות בפאנל זה.</p>`;
            return;
        }

        const players = await playersRes.json();
        const reports = await reportsRes.json();
        
        let html = '';

        // הצגת התראות אדומות על דיווחים חדשים אם יש
        if (reports.length > 0) {
            html += `
                <div style="background: #fde8e8; border: 2px solid #e74c3c; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="color: #c0392b; margin-top: 0; margin-bottom: 10px;">🚨 דיווחים ממתינים לטיפול (${reports.length})</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">`;
            
            reports.forEach(r => {
                html += `
                    <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #f5c6cb; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>מדווח:</strong> ${r.ReporterName} | <strong>מוזהר/מדווח עליו:</strong> <span style="color: #c0392b;">${r.ReportedName}</span><br>
                            <strong>סיבה:</strong> ${r.Reason} <br><small style="color: #7f8c8d;">${r.ReportDateStr}</small>
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button onclick="warnUser(${r.ReportedUserID}, '${r.ReportedName.replace(/'/g, "\\'")}')" style="background:#f39c12; color:white; padding:6px 10px; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size: 0.9em;">⚠️ אזהרה</button>
                            <button onclick="deletePlayer(${r.ReportedUserID})" style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.9em;">מחק פוגע</button>
                        </div>
                    </div>`;
            });
            html += `</div></div>`;
        }

        // רשימת המשתמשים הרגילה
        html += `<h3 style="margin-bottom: 15px; color: #2c3e50;">👥 רשומים במערכת (${players.length})</h3>`;
        html += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
        
        players.forEach(p => {
            html += `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${p.FullName}</strong> (${p.Phone})<br>
                        <small style="color: #64748b;">גיל: ${p.Age} | מגדר: ${p.Gender} ${p.IsAdmin ? ' | ⭐ מנהל מערכת' : ''}</small>
                    </div>
                    ${!p.IsAdmin ? `
                    <div style="display: flex; gap: 5px;">
                        <button onclick="warnUser(${p.PlayerID}, '${p.FullName.replace(/'/g, "\\'")}')" style="background:#f39c12; color:white; padding:8px 12px; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">⚠️ אזהרה</button>
                        <button onclick="deletePlayer(${p.PlayerID})" style="background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">מחק משתמש</button>
                    </div>` : ''}
                </div>`;
        });
        html += `</div>`;
        
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p style="color:red; text-align:center;">שגיאה בטעינת הנתונים מהשרת.</p>`;
    }
}

async function deletePlayer(playerId) {
    if (!confirm("האם אתה בטוח שברצונך למחוק את המשתמש לצמיתות?")) return;
    try {
        const res = await fetch(`/api/admin/players/${playerId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            alert("המשתמש נמחק בהצלחה.");
            loadAdminPlayers();
            loadGames();
        } else {
            alert("תקלה במחיקת המשתמש.");
        }
    } catch (err) {
        alert("שגיאת רשת.");
    }
}
window.deletePlayer = deletePlayer;

async function warnUser(userId, userName) {
    const warningText = prompt(`⚠️ איזו הודעת אזהרה תרצה לשלוח למשתמש ${userName}?`);
    if (!warningText) return;

    try {
        const res = await fetch('/api/admin/warn', {
            method: 'POST',
            headers: window.getAuthHeaders(),
            body: JSON.stringify({ userId, warningText })
        });
        
        const data = await res.json();
        if (data.success) {
            alert(`✅ האזהרה נשלחה בהצלחה ל-${userName}! (אם הוא מחובר, היא קפצה לו כרגע בענק על המסך).`);
        } else {
            alert("❌ שגיאה בשליחת אזהרה.");
        }
    } catch (err) { alert("❌ תקלה ברשת."); }
}
window.warnUser = warnUser;

// פתיחת חלון דיווח על משתמש
function openReportModal(reportedUserId, reportedUserName) {
    const reason = prompt(`למה אתה רוצה לדווח על ${reportedUserName}?\n(לדוגמה: התנהגות לא הולמת, הטרדה וכו')`);
    if (!reason || reason.trim() === '') return;

    fetch('/api/reports', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reportedUserId, reason })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("הדיווח נשלח בהצלחה למנהלי המערכת. תודה שאתה שומר על הקהילה.");
        } else {
            alert(data.error || "שגיאה בשליחת הדיווח");
        }
    })
    .catch(() => alert("שגיאת רשת"));
}
window.openReportModal = openReportModal;