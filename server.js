const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// חיבור לשרת הענן של Somee
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

// יצירת טבלאות ושדרוגן אוטומטית בענן
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
        
        // 3. טבלת משחקים
        await sql.query(`
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

        // ==========================================
        // עדכון טבלאות קימות לתמיכה בגילאים (מבלי למחוק מידע!)
        // ==========================================
        await sql.query(`
            IF COL_LENGTH('Players', 'Age') IS NULL ALTER TABLE Players ADD Age INT DEFAULT 18;
            IF COL_LENGTH('Games', 'MinAge') IS NULL ALTER TABLE Games ADD MinAge INT DEFAULT 10;
            IF COL_LENGTH('Games', 'MaxAge') IS NULL ALTER TABLE Games ADD MaxAge INT DEFAULT 99;
        `);

        console.log("✅ השרת מחובר בהצלחה למסד הנתונים בענן (וכולל תמיכה בגילאים)!");
    } catch (err) {
        console.error("DB Init Error:", err);
    }
}
initDB();

// הרשמה - מקבל עכשיו גם גיל
app.post('/api/register', async (req, res) => {
    const { fullName, phone, password, age } = req.body;
    try {
        await sql.connect(sqlConfig);
        const checkUser = await sql.query(`SELECT PlayerID FROM Players WHERE Phone = '${phone}'`);
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ code: 'already_exists', error: "המספר כבר רשום במערכת. מעביר אותך להתחברות..." });
        }
        const safeName = fullName.replace(/'/g, "''");
        const playerAge = age || 18; // ברירת מחדל אם לא הוזן
        
        await sql.query(`INSERT INTO Players (FullName, Phone, Password, Age) VALUES (N'${safeName}', '${phone}', '${password}', ${playerAge})`);
        res.status(201).json({ success: true, message: "נרשמת בהצלחה!" });
    } catch (err) { res.status(500).json({ error: "תקלה בהרשמה." }); }
});

// התחברות - מחזיר עכשיו גם את גיל המשתמש
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        await sql.connect(sqlConfig);
        const checkUser = await sql.query(`SELECT PlayerID, FullName, Password, Age FROM Players WHERE Phone = '${phone}'`);
        if (checkUser.recordset.length === 0) {
            return res.status(404).json({ code: 'not_found', error: "המספר לא קיים במערכת." });
        }
        const user = checkUser.recordset[0];
        if (user.Password !== password) {
            return res.status(401).json({ code: 'wrong_password', error: "סיסמה שגויה." });
        }
        // מחזירים לממשק גם את הגיל!
        res.json({ success: true, userId: user.PlayerID, userName: user.FullName, userAge: user.Age });
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
        const result = await sql.query(`SELECT CourtID, CourtName, CourtNameEn, Latitude, Longitude, SportType FROM Courts`);
        res.json(result.recordset);
    } catch (err) { 
        console.error("Courts API Error:", err);
        res.status(500).json({ error: "תקלה" }); 
    }
});

// משחקים - פתיחת משחק עם הגבלת גיל
app.post('/api/games', async (req, res) => {
    try {
        const { courtId, creatorPlayerId, missingPlayers, startTime, minAge, maxAge } = req.body;
        await sql.connect(sqlConfig);
        await sql.query(`INSERT INTO Games (CourtID, CreatorPlayerID, StartTime, MissingPlayers, GameStatus, MinAge, MaxAge) 
                         VALUES (${courtId}, ${creatorPlayerId}, '${startTime}', ${missingPlayers}, 'Open', ${minAge || 10}, ${maxAge || 99});`);
        res.status(201).json({ success: true });
    } catch (err) { 
        console.error("❌ שגיאה בפתיחת משחק:", err);
        res.status(500).json({ error: err.message }); 
    }
});

// משיכת משחקים - כולל טווח הגילאים
app.get('/api/games', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const result = await sql.query(`
            SELECT Games.GameID, Players.FullName AS CreatorName, Courts.CourtName, Courts.CourtNameEn, 
                   CONVERT(varchar, Games.StartTime, 120) AS StartTimeStr, Games.MissingPlayers, Games.GameStatus, 
                   Games.MinAge, Games.MaxAge
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