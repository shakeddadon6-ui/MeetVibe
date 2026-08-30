const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'MeetVibe_Super_Secret_Key_2026_Secure!@#';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const sqlConfig = {
    server: 'MeetVibe.mssql.somee.com', 
    database: 'MeetVibe',
    user: 'shakedadon_SQLLogin_1',
    password: 'vh6n15djcv',
    options: { encrypt: false, trustServerCertificate: true }
};

async function initDB() {
    try {
        await sql.connect(sqlConfig);
        console.log("✅ השרת מחובר בהצלחה למסד הנתונים MeetVibe (Admin & Socket Mode)!");
    } catch (err) { console.error("DB Init Error:", err); }
}
initDB();

// Middleware לבדיקת Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "גישה נדחתה. חסר טוקן אימות." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "טוקן לא חוקי או שפג תוקפו." });
        req.user = user;
        next();
    });
}

// Middleware לבדיקת הרשאת מנהל (Admin)
function requireAdmin(req, res, next) {
    authenticateToken(req, res, () => {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: "גישה נדחתה. נדרשות הרשאות מנהל מערכת." });
        }
        next();
    });
}

// חיבור ראוט הדיווחים החיצוני מתיקיית routes
app.use('/api', require('./routes/admin'));

// ==========================================
// Socket.io - ניהול תקשורת בזמן אמת
// ==========================================
io.on('connection', (socket) => {
    // רישום משתמשים ואדמינים לחדרים פרטיים לצורך התראות אישיות
    socket.on('register_user_socket', (data) => {
        if (data.userId) socket.join(`user_${data.userId}`);
        if (data.isAdmin) socket.join('admin_room');
    });

    // שידור התראת דיווח אדומה לכל המנהלים המחוברים
    socket.on('send_report_alert', (data) => {
        io.to('admin_room').emit('receive_admin_alert', data);
    });

    socket.on('join_game_room', (gameId) => {
        socket.join(`game_${gameId}`);
    });

    socket.on('send_message', async (data) => {
        try {
            const { gameId, senderName, messageText } = data;
            
            // שמירת ההודעה במסד הנתונים (ללא התחברות כפולה)
            await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${gameId}, N'${senderName.replace(/'/g, "''")}', N'${messageText.replace(/'/g, "''")}')`);
            
            const timeNow = new Date().toTimeString().substring(0, 5);
            
            // שידור ההודעה לכל המשתמשים שנמצאים באותו חדר משחק
            io.to(`game_${gameId}`).emit('receive_message', {
                SenderName: senderName,
                MessageText: messageText,
                SendTime: timeNow
            });
        } catch (err) {
            console.error("Socket chat error:", err);
            // שליחת התראה חזרה למשתמש שניסה לשלוח במקרה של שגיאה
            socket.emit('receive_message', {
                SenderName: 'מערכת',
                MessageText: '❌ שגיאה בשליחת ההודעה. נסה שוב.',
                SendTime: new Date().toTimeString().substring(0, 5)
            });
        }
    });
});

// ==========================================
// ראוטים (הרשמה, התחברות וניהול)
// ==========================================
app.post('/api/register', async (req, res) => {
    const { fullName, phone, password, age, gender } = req.body;
    try {
        await sql.connect(sqlConfig);
        const checkUser = await sql.query(`SELECT PlayerID FROM Players WHERE Phone = '${phone}'`);
        if (checkUser.recordset.length > 0) return res.status(400).json({ code: 'already_exists', error: "המספר כבר רשום במערכת." });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await sql.query(`INSERT INTO Players (FullName, Phone, Password, Age, Gender, IsAdmin) VALUES (N'${fullName.replace(/'/g, "''")}', '${phone}', '${hashedPassword}', ${age || 18}, N'${gender || 'לא מוגדר'}', 0)`);
        res.status(201).json({ success: true, message: "נרשמת בהצלחה!" });
    } catch (err) { res.status(500).json({ error: "תקלה בהרשמה." }); }
});

app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        await sql.connect(sqlConfig);
        const checkUser = await sql.query(`SELECT PlayerID, FullName, Password, Age, Gender, ISNULL(IsAdmin, 0) AS IsAdmin FROM Players WHERE Phone = '${phone}'`);
        if (checkUser.recordset.length === 0) return res.status(404).json({ code: 'not_found', error: "המספר לא קיים במערכת." });
        
        const user = checkUser.recordset[0];
        const validPassword = await bcrypt.compare(password, user.Password);
        if (!validPassword) return res.status(401).json({ code: 'wrong_password', error: "סיסמה שגויה." });
        
        const token = jwt.sign({ userId: user.PlayerID, phone: phone, isAdmin: user.IsAdmin === true || user.IsAdmin === 1 }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ 
            success: true, 
            token: token, 
            userId: user.PlayerID, 
            userName: user.FullName, 
            userAge: user.Age, 
            userGender: user.Gender,
            isAdmin: user.IsAdmin === true || user.IsAdmin === 1 
        });
    } catch (err) { res.status(500).json({ error: "תקלה בהתחברות." }); }
});

app.post('/api/reset-password', async (req, res) => {
    const { phone, newPassword } = req.body;
    try {
        await sql.connect(sqlConfig);
        const userCheck = await sql.query(`SELECT PlayerID FROM Players WHERE Phone = '${phone}'`);
        if (userCheck.recordset.length === 0) return res.status(404).json({ error: "המספר לא קיים." });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await sql.query(`UPDATE Players SET Password = '${hashedPassword}' WHERE Phone = '${phone}'`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "תקלה באיפוס." }); }
});

// ראוטים למשחקים (יצירה, צפייה, הצטרפות, מחיקה)
app.post('/api/games', authenticateToken, async (req, res) => {
    const creatorPlayerId = req.user.userId;
    const { missingPlayers, startTime, minAge, maxAge, city, prefGender, eventType } = req.body;
    try {
        await sql.connect(sqlConfig);
        await sql.query(`
            INSERT INTO Games (CreatorPlayerID, StartTime, MissingPlayers, GameStatus, MinAge, MaxAge, IsSocial, City, PrefGender, EventType) 
            VALUES (${creatorPlayerId}, '${startTime}', ${missingPlayers}, 'Open', ${minAge}, ${maxAge}, 1, N'${city.replace(/'/g, "''")}', N'${prefGender}', N'${eventType}')
        `);
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: "תקלה בפתיחת אירוע." }); }
});

app.get('/api/games', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const result = await sql.query(`
            SELECT Games.GameID, Games.CreatorPlayerID, Players.FullName AS CreatorName, 
                   CONVERT(varchar, Games.StartTime, 120) AS StartTimeStr, Games.MissingPlayers, Games.GameStatus, 
                   Games.MinAge, Games.MaxAge,
                   ISNULL(Games.City, '') AS City, ISNULL(Games.PrefGender, '') AS PrefGender, ISNULL(Games.EventType, '') AS EventType,
                   ISNULL((SELECT CAST(PlayerID AS VARCHAR) + ',' FROM GameParticipants WHERE GameID = Games.GameID FOR XML PATH('')), '') AS JoinedPlayersStr
            FROM Games 
            JOIN Players ON Games.CreatorPlayerID = Players.PlayerID 
            WHERE Games.GameStatus = 'Open' AND Games.StartTime >= DATEADD(hour, -2, GETDATE())
            ORDER BY Games.StartTime ASC;
        `);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

app.get('/api/games/history/:userId', authenticateToken, async (req, res) => {
    if (parseInt(req.params.userId) !== req.user.userId) return res.status(403).json({ error: "אין הרשאה." });
    try {
        await sql.connect(sqlConfig);
        const userId = req.user.userId;
        const result = await sql.query(`
            SELECT Games.GameID, Games.CreatorPlayerID, Players.FullName AS CreatorName, 
                   CONVERT(varchar, Games.StartTime, 120) AS StartTimeStr, Games.MissingPlayers, Games.GameStatus, 
                   Games.MinAge, Games.MaxAge,
                   ISNULL(Games.City, '') AS City, ISNULL(Games.PrefGender, '') AS PrefGender, ISNULL(Games.EventType, '') AS EventType,
                   ISNULL((SELECT CAST(PlayerID AS VARCHAR) + ',' FROM GameParticipants WHERE GameID = Games.GameID FOR XML PATH('')), '') AS JoinedPlayersStr
            FROM Games 
            JOIN Players ON Games.CreatorPlayerID = Players.PlayerID 
            WHERE Games.CreatorPlayerID = ${userId} OR Games.GameID IN (SELECT GameID FROM GameParticipants WHERE PlayerID = ${userId})
            ORDER BY Games.StartTime DESC
        `);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: "תקלה בהיסטוריה" }); }
});

app.put('/api/games/:id/join', authenticateToken, async (req, res) => {
    try {
        const gameId = req.params.id; 
        const userId = req.user.userId;
        await sql.connect(sqlConfig);
        
        const checkJoined = await sql.query(`SELECT * FROM GameParticipants WHERE GameID = ${gameId} AND PlayerID = ${userId}`);
        if (checkJoined.recordset.length > 0) return res.status(400).json({ error: "כבר נרשמת!" });

        const check = await sql.query(`SELECT MissingPlayers, CreatorPlayerID FROM Games WHERE GameID = ${gameId}`);
        if (check.recordset.length === 0) return res.status(404).json({ error: "לא נמצא" });
        if (check.recordset[0].CreatorPlayerID === parseInt(userId)) return res.status(400).json({ error: "אתה היוצר!" });

        const userCheck = await sql.query(`SELECT FullName FROM Players WHERE PlayerID = ${userId}`);
        const joiningUserName = userCheck.recordset.length > 0 ? userCheck.recordset[0].FullName : "משתמש";

        let missing = check.recordset[0].MissingPlayers;
        if (missing <= 0) return res.status(400).json({ error: "מלא!" });
        missing -= 1;
        
        await sql.query(`INSERT INTO GameParticipants (GameID, PlayerID) VALUES (${gameId}, ${userId})`);
        await sql.query(`UPDATE Games SET MissingPlayers = ${missing}, GameStatus = '${missing === 0 ? 'Full' : 'Open'}' WHERE GameID = ${gameId}`);
        await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${gameId}, N'מערכת', N'🔔 ${joiningUserName} הצטרף/ה!')`);

        io.to(`game_${gameId}`).emit('receive_message', {
            SenderName: 'מערכת',
            MessageText: `🔔 ${joiningUserName} הצטרף/ה!`,
            SendTime: new Date().toTimeString().substring(0, 5)
        });

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

app.put('/api/games/:id/leave', authenticateToken, async (req, res) => {
    try {
        const gameId = req.params.id; 
        const userId = req.user.userId;
        await sql.connect(sqlConfig);
        const userCheck = await sql.query(`SELECT FullName FROM Players WHERE PlayerID = ${userId}`);
        const leavingUserName = userCheck.recordset.length > 0 ? userCheck.recordset[0].FullName : "משתמש";

        await sql.query(`DELETE FROM GameParticipants WHERE GameID = ${gameId} AND PlayerID = ${userId}`);
        const check = await sql.query(`SELECT MissingPlayers FROM Games WHERE GameID = ${gameId}`);
        let missing = check.recordset[0].MissingPlayers + 1;
        await sql.query(`UPDATE Games SET MissingPlayers = ${missing}, GameStatus = 'Open' WHERE GameID = ${gameId}`);
        await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${gameId}, N'מערכת', N'❌ ${leavingUserName} ביטל/ה הגעה')`);

        io.to(`game_${gameId}`).emit('receive_message', {
            SenderName: 'מערכת',
            MessageText: `❌ ${leavingUserName} ביטל/ה הגעה`,
            SendTime: new Date().toTimeString().substring(0, 5)
        });

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

// ראוט לעדכון סטטוס משחק (ביטול או סימון כמלא)
app.put('/api/games/:id/status', authenticateToken, async (req, res) => {
    try {
        const gameId = req.params.id;
        const { userId, status } = req.body;
        
        await sql.connect(sqlConfig);
        
        const check = await sql.query(`SELECT CreatorPlayerID FROM Games WHERE GameID = ${gameId}`);
        if (check.recordset.length === 0) return res.status(404).json({ error: "המפגש לא נמצא" });
        if (check.recordset[0].CreatorPlayerID !== parseInt(userId)) {
            return res.status(403).json({ error: "רק יוצר המפגש יכול לשנות את הסטטוס שלו." });
        }

        await sql.query(`UPDATE Games SET GameStatus = '${status}' WHERE GameID = ${gameId}`);
        
        if (status === 'Cancelled') {
            await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${gameId}, N'מערכת', N'❌ המפגש בוטל על ידי היוצר')`);
            io.to(`game_${gameId}`).emit('receive_message', {
                SenderName: 'מערכת',
                MessageText: '❌ המפגש בוטל על ידי היוצר',
                SendTime: new Date().toTimeString().substring(0, 5)
            });
        }

        res.json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: "תקלה בעדכון סטטוס המפגש." }); 
    }
});

app.get('/api/games/:id/chat', authenticateToken, async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const result = await sql.query(`SELECT SenderName, MessageText, CONVERT(varchar, SentAt, 108) AS SendTime FROM GameMessages WHERE GameID = ${req.params.id} ORDER BY SentAt ASC`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

app.post('/api/games/:id/chat', authenticateToken, async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${req.params.id}, N'${req.body.senderName.replace(/'/g, "''")}', N'${req.body.messageText.replace(/'/g, "''")}')`);
        
        io.to(`game_${req.params.id}`).emit('receive_message', {
            SenderName: req.body.senderName,
            MessageText: req.body.messageText,
            SendTime: new Date().toTimeString().substring(0, 5)
        });

        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

// ==========================================
// ראוטים למנהל בלבד (Admin Dashboard APIs)
// ==========================================

app.get('/api/admin/players', requireAdmin, async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const result = await sql.query(`SELECT PlayerID, FullName, Phone, Age, Gender, ISNULL(IsAdmin, 0) AS IsAdmin FROM Players ORDER BY PlayerID DESC`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: "תקלה בשליפת משתמשים" }); }
});

app.delete('/api/admin/players/:id', requireAdmin, async (req, res) => {
    try {
        const playerId = req.params.id;
        await sql.connect(sqlConfig);
        await sql.query(`DELETE FROM GameParticipants WHERE PlayerID = ${playerId}`);
        await sql.query(`DELETE FROM Games WHERE CreatorPlayerID = ${playerId}`);
        await sql.query(`DELETE FROM Players WHERE PlayerID = ${playerId}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "תקלה במחיקת משתמש" }); }
});

// ראוט לשליחת אזהרה למשתמש 
app.post('/api/admin/warn', requireAdmin, async (req, res) => {
    try {
        const { userId, warningText } = req.body;
        // שולח התראה בזמן אמת רק למשתמש הספציפי
        io.to(`user_${userId}`).emit('receive_warning', { warningText });
        res.json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: "תקלה בשליחת האזהרה" }); 
    }
});

server.listen(PORT, () => { console.log(`Server is running with Admin Support on port ${PORT}`); });