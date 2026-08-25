const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// חיבור לשרת הענן של Somee עם הסיסמה שלך!
const sqlConfig = {
    server: 'SportMatchDB.mssql.somee.com', 
    database: 'SportMatchDB',
    user: 'shakedadon_SQLLogin_1',
    password: 'vh6n15djcv',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// יצירת טבלאות אוטומטית בענן
async function initDB() {
    try {
        await sql.connect(sqlConfig);
        
        // 1. טבלת שחקנים
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Players' and xtype='U')
            BEGIN
                CREATE TABLE Players (
                    PlayerID INT IDENTITY(1,1) PRIMARY KEY,
                    FullName NVARCHAR(100),
                    Phone NVARCHAR(20),
                    Password NVARCHAR(100)
                )
            END
        `);

        // 2. טבלת מגרשים 
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Courts' and xtype='U')
            BEGIN
                CREATE TABLE Courts (
                    CourtID INT IDENTITY(1,1) PRIMARY KEY,
                    CourtName NVARCHAR(200),
                    Latitude FLOAT,
                    Longitude FLOAT,
                    SportType NVARCHAR(50)
                )
            END
        `);

        // 3. טבלת משחקים (ההערה תוקנה לסימון של SQL כדי למנוע קריסה!)
        await sql.query(`
            -- ליתר ביטחון
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Courts' and xtype='U') 
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Games' and xtype='U')
            BEGIN
                CREATE TABLE Games (
                    GameID INT IDENTITY(1,1) PRIMARY KEY,
                    CourtID INT,
                    CreatorPlayerID INT,
                    StartTime DATETIME,
                    MissingPlayers INT,
                    GameStatus NVARCHAR(20) DEFAULT 'Open'
                )
            END
        `);

        // 4. טבלת הודעות צ'אט
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GameMessages' and xtype='U')
            CREATE TABLE GameMessages (
                MessageID INT IDENTITY(1,1) PRIMARY KEY,
                GameID INT,
                SenderName NVARCHAR(100),
                MessageText NVARCHAR(500),
                SentAt DATETIME DEFAULT GETDATE()
            )
        `);
        console.log("✅ השרת מחובר בהצלחה למסד הנתונים בענן של Somee!");
    } catch (err) {
        console.error("DB Init Error:", err);
    }
}
initDB();

// הרשמה
app.post('/api/register', async (req, res) => {
    const { fullName, phone, password } = req.body;
    try {
        await sql.connect(sqlConfig);
        const checkUser = await sql.query(`SELECT PlayerID FROM Players WHERE Phone = '${phone}'`);
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ code: 'already_exists', error: "המספר כבר רשום במערכת. מעביר אותך להתחברות..." });
        }
        const safeName = fullName.replace(/'/g, "''");
        await sql.query(`INSERT INTO Players (FullName, Phone, Password) VALUES (N'${safeName}', '${phone}', '${password}')`);
        res.status(201).json({ success: true, message: "נרשמת בהצלחה!" });
    } catch (err) { res.status(500).json({ error: "תקלה בהרשמה." }); }
});

// התחברות
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        await sql.connect(sqlConfig);
        const checkUser = await sql.query(`SELECT PlayerID, FullName, Password FROM Players WHERE Phone = '${phone}'`);
        if (checkUser.recordset.length === 0) {
            return res.status(404).json({ code: 'not_found', error: "המספר לא קיים במערכת." });
        }
        const user = checkUser.recordset[0];
        if (user.Password !== password) {
            return res.status(401).json({ code: 'wrong_password', error: "סיסמה שגויה." });
        }
        res.json({ success: true, userId: user.PlayerID, userName: user.FullName });
    } catch (err) { res.status(500).json({ error: "תקלה בהתחברות." }); }
});

// איפוס סיסמה
app.post('/api/reset-password', async (req, res) => {
    const { phone, newPassword } = req.body;
    try {
        await sql.connect(sqlConfig);
        const userCheck = await sql.query(`SELECT PlayerID FROM Players WHERE Phone = '${phone}'`);
        if (userCheck.recordset.length === 0) {
            return res.status(404).json({ error: "המספר הזה לא קיים במערכת." });
        }
        await sql.query(`UPDATE Players SET Password = '${newPassword}' WHERE Phone = '${phone}'`);
        res.json({ success: true, message: "הסיסמה שונתה בהצלחה!" });
    } catch (err) { res.status(500).json({ error: "תקלה באיפוס סיסמה." }); }
});

// מגרשים
app.get('/api/courts', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const result = await sql.query(`SELECT CourtID, CourtName, Latitude, Longitude, SportType FROM Courts`);
        res.json(result.recordset);
    } catch (err) { 
        console.error("Courts API Error:", err);
        res.status(500).json({ error: "תקלה" }); 
    }
});

// משחקים - הנתיב תוקן כדי להציג את השגיאה האמיתית!
app.post('/api/games', async (req, res) => {
    try {
        const { courtId, creatorPlayerId, missingPlayers, startTime } = req.body;
        await sql.connect(sqlConfig);
        await sql.query(`INSERT INTO Games (CourtID, CreatorPlayerID, StartTime, MissingPlayers, GameStatus) VALUES (${courtId}, ${creatorPlayerId}, '${startTime}', ${missingPlayers}, 'Open');`);
        res.status(201).json({ success: true });
    } catch (err) { 
        console.error("❌ שגיאה בפתיחת משחק:", err);
        res.status(500).json({ error: err.message }); 
    }
});

app.get('/api/games', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const result = await sql.query(`
            SELECT Games.GameID, Players.FullName AS CreatorName, Courts.CourtName, CONVERT(varchar, Games.StartTime, 120) AS StartTimeStr, Games.MissingPlayers, Games.GameStatus
            FROM Games JOIN Players ON Games.CreatorPlayerID = Players.PlayerID JOIN Courts ON Games.CourtID = Courts.CourtID
            WHERE Games.GameStatus = 'Open' AND Games.StartTime >= DATEADD(hour, -2, GETDATE());
        `);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

app.put('/api/games/:id/join', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const check = await sql.query(`SELECT MissingPlayers FROM Games WHERE GameID = ${req.params.id}`);
        if (check.recordset.length === 0) return res.status(404).json({ error: "לא נמצא" });
        let missing = check.recordset[0].MissingPlayers;
        if (missing <= 0) return res.status(400).json({ error: "מלא!" });
        missing -= 1;
        await sql.query(`UPDATE Games SET MissingPlayers = ${missing}, GameStatus = '${missing === 0 ? 'Full' : 'Open'}' WHERE GameID = ${req.params.id}`);
        res.json({ success: true, missingPlayers: missing });
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

// צ'אט
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