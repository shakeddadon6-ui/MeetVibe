const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// חיבור לשרת הענן של Somee עם מסד הנתונים החדש MeetVibe
const sqlConfig = {
    server: 'SportMatchDB.mssql.somee.com', 
    database: 'MeetVibe',
    user: 'shakedadon_SQLLogin_1',
    password: 'vh6n15djcv',
    options: { encrypt: false, trustServerCertificate: true }
};

async function initDB() {
    try {
        await sql.connect(sqlConfig);
        console.log("✅ השרת מחובר בהצלחה למסד הנתונים MeetVibe (תצורת מפגשים חברתיים בלבד)!");
    } catch (err) { console.error("DB Init Error:", err); }
}
initDB();

app.post('/api/register', async (req, res) => {
    const { fullName, phone, password, age, gender } = req.body;
    try {
        await sql.connect(sqlConfig);
        const checkUser = await sql.query(`SELECT PlayerID FROM Players WHERE Phone = '${phone}'`);
        if (checkUser.recordset.length > 0) return res.status(400).json({ code: 'already_exists', error: "המספר כבר רשום במערכת." });
        
        await sql.query(`INSERT INTO Players (FullName, Phone, Password, Age, Gender) VALUES (N'${fullName.replace(/'/g, "''")}', '${phone}', '${password}', ${age || 18}, N'${gender || 'לא מוגדר'}')`);
        res.status(201).json({ success: true, message: "נרשמת בהצלחה!" });
    } catch (err) { res.status(500).json({ error: "תקלה בהרשמה." }); }
});

app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        await sql.connect(sqlConfig);
        const checkUser = await sql.query(`SELECT PlayerID, FullName, Password, Age, Gender FROM Players WHERE Phone = '${phone}'`);
        if (checkUser.recordset.length === 0) return res.status(404).json({ code: 'not_found', error: "המספר לא קיים במערכת." });
        
        const user = checkUser.recordset[0];
        if (user.Password !== password) return res.status(401).json({ code: 'wrong_password', error: "סיסמה שגויה." });
        res.json({ success: true, userId: user.PlayerID, userName: user.FullName, userAge: user.Age, userGender: user.Gender });
    } catch (err) { res.status(500).json({ error: "תקלה בהתחברות." }); }
});

app.post('/api/reset-password', async (req, res) => {
    const { phone, newPassword } = req.body;
    try {
        await sql.connect(sqlConfig);
        const userCheck = await sql.query(`SELECT PlayerID FROM Players WHERE Phone = '${phone}'`);
        if (userCheck.recordset.length === 0) return res.status(404).json({ error: "המספר הזה לא קיים במערכת." });
        await sql.query(`UPDATE Players SET Password = '${newPassword}' WHERE Phone = '${phone}'`);
        res.json({ success: true, message: "הסיסמה שונתה בהצלחה!" });
    } catch (err) { res.status(500).json({ error: "תקלה באיפוס סיסמה." }); }
});

// יצירת מפגש חברתי
app.post('/api/games', async (req, res) => {
    const { creatorPlayerId, missingPlayers, startTime, minAge, maxAge, city, prefGender, eventType } = req.body;
    try {
        await sql.connect(sqlConfig);
        await sql.query(`
            INSERT INTO Games (CreatorPlayerID, StartTime, MissingPlayers, GameStatus, MinAge, MaxAge, IsSocial, City, PrefGender, EventType) 
            VALUES (${creatorPlayerId}, '${startTime}', ${missingPlayers}, 'Open', ${minAge}, ${maxAge}, 1, N'${city.replace(/'/g, "''")}', N'${prefGender}', N'${eventType}')
        `);
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: "תקלה בפתיחת האירוע." }); }
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

app.get('/api/games/history/:userId', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const userId = parseInt(req.params.userId);
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
    } catch (err) { res.status(500).json({ error: "תקלה במשיכת היסטוריה" }); }
});

app.put('/api/games/:id/join', async (req, res) => {
    try {
        const gameId = req.params.id; const { userId } = req.body;
        await sql.connect(sqlConfig);
        
        const checkJoined = await sql.query(`SELECT * FROM GameParticipants WHERE GameID = ${gameId} AND PlayerID = ${userId}`);
        if (checkJoined.recordset.length > 0) return res.status(400).json({ error: "כבר נרשמת לאירוע הזה!" });

        const check = await sql.query(`SELECT MissingPlayers, CreatorPlayerID FROM Games WHERE GameID = ${gameId}`);
        if (check.recordset.length === 0) return res.status(404).json({ error: "לא נמצא" });
        if (check.recordset[0].CreatorPlayerID === parseInt(userId)) return res.status(400).json({ error: "אתה היוצר!" });

        const userCheck = await sql.query(`SELECT FullName FROM Players WHERE PlayerID = ${userId}`);
        const joiningUserName = userCheck.recordset.length > 0 ? userCheck.recordset[0].FullName : "משתמש חדש";

        let missing = check.recordset[0].MissingPlayers;
        if (missing <= 0) return res.status(400).json({ error: "מלא!" });
        missing -= 1;
        
        await sql.query(`INSERT INTO GameParticipants (GameID, PlayerID) VALUES (${gameId}, ${userId})`);
        await sql.query(`UPDATE Games SET MissingPlayers = ${missing}, GameStatus = '${missing === 0 ? 'Full' : 'Open'}' WHERE GameID = ${gameId}`);
        await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${gameId}, N'מערכת', N'🔔 ${joiningUserName} הצטרף/ה!')`);

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

app.put('/api/games/:id/leave', async (req, res) => {
    try {
        const gameId = req.params.id; const { userId } = req.body;
        await sql.connect(sqlConfig);
        const userCheck = await sql.query(`SELECT FullName FROM Players WHERE PlayerID = ${userId}`);
        const leavingUserName = userCheck.recordset.length > 0 ? userCheck.recordset[0].FullName : "משתמש";

        await sql.query(`DELETE FROM GameParticipants WHERE GameID = ${gameId} AND PlayerID = ${userId}`);
        const check = await sql.query(`SELECT MissingPlayers FROM Games WHERE GameID = ${gameId}`);
        let missing = check.recordset[0].MissingPlayers + 1;
        await sql.query(`UPDATE Games SET MissingPlayers = ${missing}, GameStatus = 'Open' WHERE GameID = ${gameId}`);
        await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${gameId}, N'מערכת', N'❌ ${leavingUserName} ביטל/ה הגעה')`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

app.put('/api/games/:id/status', async (req, res) => {
    try {
        const gameId = req.params.id; const { userId, status } = req.body; 
        await sql.connect(sqlConfig);
        const check = await sql.query(`SELECT CreatorPlayerID FROM Games WHERE GameID = ${gameId}`);
        if (check.recordset.length === 0) return res.status(404).json({ error: "האירוע לא נמצא." });
        if (check.recordset[0].CreatorPlayerID !== parseInt(userId)) return res.status(403).json({ error: "אין לך הרשאה!" });
        
        await sql.query(`UPDATE Games SET GameStatus = '${status}' WHERE GameID = ${gameId}`);
        if (status === 'Cancelled') {
            await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${gameId}, N'מערכת', N'❌ האירוע בוטל על ידי היוצר')`);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

app.get('/api/games/:id/chat', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const result = await sql.query(`SELECT SenderName, MessageText, CONVERT(varchar, SentAt, 108) AS SendTime FROM GameMessages WHERE GameID = ${req.params.id} ORDER BY SentAt ASC`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

app.post('/api/games/:id/chat', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${req.params.id}, N'${req.body.senderName.replace(/'/g, "''")}', N'${req.body.messageText.replace(/'/g, "''")}')`);
        res.status(201).json({ success: true });
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });