// ==========================================
// קובץ auth.js - ניהול משתמשים והתחברות מתורגם 100%
// ==========================================

function switchAuthTab(tab) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotForm').style.display = 'none';
    
    if (tab === 'forgot') { 
        document.getElementById('authTabs').style.display = 'none'; 
        document.getElementById('forgotForm').style.display = 'block'; 
    } else {
        document.getElementById('authTabs').style.display = 'flex';
        if(tab === 'login') { 
            document.getElementById('tabLogin').classList.add('active'); 
            document.getElementById('tabRegister').classList.remove('active'); 
            document.getElementById('loginForm').style.display = 'block'; 
        } else { 
            document.getElementById('tabRegister').classList.add('active'); 
            document.getElementById('tabLogin').classList.remove('active'); 
            document.getElementById('registerForm').style.display = 'block'; 
        }
    }
}
window.switchAuthTab = switchAuthTab;

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('regName').value; 
    const phone = document.getElementById('regPhone').value; 
    const password = document.getElementById('regPassword').value;
    try {
        const res = await fetch('/api/register', { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName, phone, password }) 
        });
        const data = await res.json();
        if(res.ok) { 
            alert(t("authSuccess")); 
            switchAuthTab('login'); 
            document.getElementById('loginPhone').value = phone; 
        } else { 
            // שימוש במילון לפי קוד השגיאה
            alert(data.code ? t(data.code) : data.error); 
            if(data.code === 'already_exists') { 
                switchAuthTab('login'); 
                document.getElementById('loginPhone').value = phone; 
            } 
        }
    } catch(err) { alert(t("netError")); }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value; 
    const password = document.getElementById('loginPassword').value;
    try {
        const res = await fetch('/api/login', { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, password }) 
        });
        const data = await res.json();
        if(res.ok) { 
            localStorage.setItem('sportMatchUserId', data.userId); 
            localStorage.setItem('sportMatchUser', data.userName); 
            myUserId = data.userId; 
            myUsername = data.userName; 
            showMainApp(); 
        } else { 
            // שימוש במילון לפי קוד השגיאה
            alert(data.code ? t(data.code) : data.error); 
            if(data.code === 'not_found') { 
                switchAuthTab('register'); 
                document.getElementById('regPhone').value = phone; 
            } 
        }
    } catch(err) { alert(t("loginError")); }
});

document.getElementById('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('forgotPhone').value;
    const newPassword = document.getElementById('forgotNewPassword').value;
    try {
        const res = await fetch('/api/reset-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, newPassword })
        });
        const data = await res.json();
        
        if(res.ok) {
            alert(t("resetSuccess")); // תרגום איפוס בהצלחה
            switchAuthTab('login');
            document.getElementById('loginPhone').value = phone;
        } else {
            alert(t("resetNotFound")); // תרגום מספר לא קיים
        }
    } catch(err) { alert(t("netError")); }
});

function logout() { 
    localStorage.removeItem('sportMatchUserId'); 
    localStorage.removeItem('sportMatchUser'); 
    location.reload(); 
}
window.logout = logout;