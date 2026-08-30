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

// יצירת טבלאות ושדרוגן
async function initDB() {
    try {
        await sql.connect(sqlConfig);
        
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
        
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Games' and xtype='U')
            BEGIN
                CREATE TABLE Games (
                    GameID INT IDENTITY(1,1) PRIMARY KEY,
                    CourtID INT NULL,
                    CreatorPlayerID INT,
                    StartTime DATETIME,
                    MissingPlayers INT,
                    GameStatus NVARCHAR(20) DEFAULT 'Open'
                )
            END
        `);

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

        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GameParticipants' and xtype='U')
            BEGIN
                CREATE TABLE GameParticipants (
                    ParticipantID INT IDENTITY(1,1) PRIMARY KEY,
                    GameID INT,
                    PlayerID INT,
                    JoinedAt DATETIME DEFAULT GETDATE(),
                    UNIQUE(GameID, PlayerID)
                )
            END
        `);

        // הוספת עמודות חדשות - מגדר שחקן והגדרות חברתיות למפגשים!
        await sql.query(`
            IF COL_LENGTH('Players', 'Age') IS NULL ALTER TABLE Players ADD Age INT DEFAULT 18;
            IF COL_LENGTH('Players', 'Gender') IS NULL ALTER TABLE Players ADD Gender NVARCHAR(10) DEFAULT N'לא מוגדר';
            
            IF COL_LENGTH('Games', 'MinAge') IS NULL ALTER TABLE Games ADD MinAge INT DEFAULT 10;
            IF COL_LENGTH('Games', 'MaxAge') IS NULL ALTER TABLE Games ADD MaxAge INT DEFAULT 99;
            
            -- עמודות חדשות למפגשים חברתיים
            IF COL_LENGTH('Games', 'IsSocial') IS NULL ALTER TABLE Games ADD IsSocial BIT DEFAULT 0;
            IF COL_LENGTH('Games', 'City') IS NULL ALTER TABLE Games ADD City NVARCHAR(100);
            IF COL_LENGTH('Games', 'PrefGender') IS NULL ALTER TABLE Games ADD PrefGender NVARCHAR(50) DEFAULT N'לא משנה';
            IF COL_LENGTH('Games', 'EventType') IS NULL ALTER TABLE Games ADD EventType NVARCHAR(100);
        `);

        console.log("✅ השרת מחובר בהצלחה למסד הנתונים בענן, התשתית למפגשים חברתיים הוקמה!");
    } catch (err) {
        console.error("DB Init Error:", err);
    }
}
initDB();

// הרשמה
app.post('/api/register', async (req, res) => {
    const { fullName, phone, password, age, gender } = req.body;
    try {
        await sql.connect(sqlConfig);
        const checkUser = await sql.query(`SELECT PlayerID FROM Players WHERE Phone = '${phone}'`);
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ code: 'already_exists', error: "המספר כבר רשום במערכת. מעביר אותך להתחברות..." });
        }
        const safeName = fullName.replace(/'/g, "''");
        const playerAge = age || 18; 
        const safeGender = gender || 'לא מוגדר';
        
        await sql.query(`INSERT INTO Players (FullName, Phone, Password, Age, Gender) VALUES (N'${safeName}', '${phone}', '${password}', ${playerAge}, N'${safeGender}')`);
        res.status(201).json({ success: true, message: "נרשמת בהצלחה!" });
    } catch (err) { res.status(500).json({ error: "תקלה בהרשמה." }); }
});

// התחברות
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        await sql.connect(sqlConfig);
        const checkUser = await sql.query(`SELECT PlayerID, FullName, Password, Age, Gender FROM Players WHERE Phone = '${phone}'`);
        if (checkUser.recordset.length === 0) {
            return res.status(404).json({ code: 'not_found', error: "המספר לא קיים במערכת." });
        }
        const user = checkUser.recordset[0];
        if (user.Password !== password) {
            return res.status(401).json({ code: 'wrong_password', error: "סיסמה שגויה." });
        }
        res.json({ success: true, userId: user.PlayerID, userName: user.FullName, userAge: user.Age, userGender: user.Gender });
    } catch (err) { res.status(500).json({ error: "תקלה בהתחברות." }); }
});

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

app.get('/api/courts', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const result = await sql.query(`SELECT CourtID, CourtName, CourtNameEn, Latitude, Longitude, SportType FROM Courts`);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: "תקלה" }); }
});

// יצירת משחק חדש או מפגש חברתי
app.post('/api/games', async (req, res) => {
    const { courtId, creatorPlayerId, missingPlayers, startTime, minAge, maxAge, isSocial, city, prefGender, eventType } = req.body;
    try {
        await sql.connect(sqlConfig);
        
        let query;
        if (isSocial) {
            // יצירת מפגש חברתי (ללא CourtID)
            query = `
                INSERT INTO Games (CreatorPlayerID, StartTime, MissingPlayers, GameStatus, MinAge, MaxAge, IsSocial, City, PrefGender, EventType) 
                VALUES (${creatorPlayerId}, '${startTime}', ${missingPlayers}, 'Open', ${minAge}, ${maxAge}, 1, N'${city.replace(/'/g, "''")}', N'${prefGender}', N'${eventType}')
            `;
        } else {
            // יצירת אירוע ספורט במגרש
            query = `
                INSERT INTO Games (CourtID, CreatorPlayerID, StartTime, MissingPlayers, GameStatus, MinAge, MaxAge, IsSocial) 
                VALUES (${courtId}, ${creatorPlayerId}, '${startTime}', ${missingPlayers}, 'Open', ${minAge}, ${maxAge}, 0)
            `;
        }
        
        await sql.query(query);
        res.status(201).json({ success: true, message: "האירוע נפתח בהצלחה!" });
    } catch (err) { 
        res.status(500).json({ error: "תקלה בפתיחת האירוע." }); 
    }
});

// משיכת משחקים רגילה (כולל חברתיים)
app.get('/api/games', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        // שימוש ב-LEFT JOIN כדי למשוך גם מפגשים חברתיים שאין להם מגרש מקושר ב-Courts
        const result = await sql.query(`
            SELECT Games.GameID, Games.CreatorPlayerID, Players.FullName AS CreatorName, 
                   ISNULL(Courts.CourtName, '') AS CourtName, ISNULL(Courts.CourtNameEn, '') AS CourtNameEn, 
                   CONVERT(varchar, Games.StartTime, 120) AS StartTimeStr, Games.MissingPlayers, Games.GameStatus, 
                   Games.MinAge, Games.MaxAge,
                   Games.IsSocial, ISNULL(Games.City, '') AS City, ISNULL(Games.PrefGender, '') AS PrefGender, ISNULL(Games.EventType, '') AS EventType,
                   ISNULL((SELECT CAST(PlayerID AS VARCHAR) + ',' FROM GameParticipants WHERE GameID = Games.GameID FOR XML PATH('')), '') AS JoinedPlayersStr
            FROM Games 
            JOIN Players ON Games.CreatorPlayerID = Players.PlayerID 
            LEFT JOIN Courts ON Games.CourtID = Courts.CourtID
            WHERE Games.GameStatus = 'Open' AND Games.StartTime >= DATEADD(hour, -2, GETDATE());
        `);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: "תקלה במשיכת האירועים" }); }
});

// משיכת היסטוריה אישית (כולל חברתיים)
app.get('/api/games/history/:userId', async (req, res) => {
    try {
        await sql.connect(sqlConfig);
        const userId = parseInt(req.params.userId);
        const result = await sql.query(`
            SELECT Games.GameID, Games.CreatorPlayerID, Players.FullName AS CreatorName, 
                   ISNULL(Courts.CourtName, '') AS CourtName, ISNULL(Courts.CourtNameEn, '') AS CourtNameEn, 
                   CONVERT(varchar, Games.StartTime, 120) AS StartTimeStr, Games.MissingPlayers, Games.GameStatus, 
                   Games.MinAge, Games.MaxAge,
                   Games.IsSocial, ISNULL(Games.City, '') AS City, ISNULL(Games.PrefGender, '') AS PrefGender, ISNULL(Games.EventType, '') AS EventType,
                   ISNULL((SELECT CAST(PlayerID AS VARCHAR) + ',' FROM GameParticipants WHERE GameID = Games.GameID FOR XML PATH('')), '') AS JoinedPlayersStr
            FROM Games 
            JOIN Players ON Games.CreatorPlayerID = Players.PlayerID 
            LEFT JOIN Courts ON Games.CourtID = Courts.CourtID
            WHERE Games.CreatorPlayerID = ${userId} OR Games.GameID IN (SELECT GameID FROM GameParticipants WHERE PlayerID = ${userId})
            ORDER BY Games.StartTime DESC
        `);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: "תקלה במשיכת היסטוריה" }); }
});

app.put('/api/games/:id/join', async (req, res) => {
    try {
        const gameId = req.params.id;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "שגיאת זיהוי משתמש" });

        await sql.connect(sqlConfig);
        
        const checkJoined = await sql.query(`SELECT * FROM GameParticipants WHERE GameID = ${gameId} AND PlayerID = ${userId}`);
        if (checkJoined.recordset.length > 0) return res.status(400).json({ error: "כבר נרשמת לאירוע הזה!" });

        const check = await sql.query(`SELECT MissingPlayers, CreatorPlayerID FROM Games WHERE GameID = ${gameId}`);
        if (check.recordset.length === 0) return res.status(404).json({ error: "לא נמצא" });
        if (check.recordset[0].CreatorPlayerID === parseInt(userId)) return res.status(400).json({ error: "אתה היוצר, אתה כבר בפנים!" });

        const userCheck = await sql.query(`SELECT FullName FROM Players WHERE PlayerID = ${userId}`);
        const joiningUserName = userCheck.recordset.length > 0 ? userCheck.recordset[0].FullName : "משתמש חדש";

        let missing = check.recordset[0].MissingPlayers;
        if (missing <= 0) return res.status(400).json({ error: "מלא!" });
        missing -= 1;
        
        await sql.query(`INSERT INTO GameParticipants (GameID, PlayerID) VALUES (${gameId}, ${userId})`);
        await sql.query(`UPDATE Games SET MissingPlayers = ${missing}, GameStatus = '${missing === 0 ? 'Full' : 'Open'}' WHERE GameID = ${gameId}`);
        await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${gameId}, N'מערכת', N'🔔 ${joiningUserName} הצטרף/ה!')`);

        res.json({ success: true, missingPlayers: missing });
    } catch (err) { res.status(500).json({ error: "תקלה בהצטרפות" }); }
});

app.put('/api/games/:id/leave', async (req, res) => {
    try {
        const gameId = req.params.id;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "שגיאת זיהוי משתמש" });

        await sql.connect(sqlConfig);
        const userCheck = await sql.query(`SELECT FullName FROM Players WHERE PlayerID = ${userId}`);
        const leavingUserName = userCheck.recordset.length > 0 ? userCheck.recordset[0].FullName : "משתמש";

        await sql.query(`DELETE FROM GameParticipants WHERE GameID = ${gameId} AND PlayerID = ${userId}`);
        
        const check = await sql.query(`SELECT MissingPlayers FROM Games WHERE GameID = ${gameId}`);
        let missing = check.recordset[0].MissingPlayers + 1;
        await sql.query(`UPDATE Games SET MissingPlayers = ${missing}, GameStatus = 'Open' WHERE GameID = ${gameId}`);
        
        await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${gameId}, N'מערכת', N'❌ ${leavingUserName} ביטל/ה הגעה')`);

        res.json({ success: true, missingPlayers: missing });
    } catch (err) { res.status(500).json({ error: "תקלה בעזיבה" }); }
});

app.put('/api/games/:id/status', async (req, res) => {
    try {
        const gameId = req.params.id;
        const { userId, status } = req.body; 
        
        await sql.connect(sqlConfig);
        const check = await sql.query(`SELECT CreatorPlayerID FROM Games WHERE GameID = ${gameId}`);
        if (check.recordset.length === 0) return res.status(404).json({ error: "האירוע לא נמצא." });
        if (check.recordset[0].CreatorPlayerID !== parseInt(userId)) return res.status(403).json({ error: "אין לך הרשאה!" });
        
        await sql.query(`UPDATE Games SET GameStatus = '${status}' WHERE GameID = ${gameId}`);
        if (status === 'Cancelled') {
            await sql.query(`INSERT INTO GameMessages (GameID, SenderName, MessageText) VALUES (${gameId}, N'מערכת', N'❌ האירוע בוטל על ידי היוצר')`);
        }
        res.json({ success: true, newStatus: status });
    } catch (err) { res.status(500).json({ error: "תקלה בשרת" }); }
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