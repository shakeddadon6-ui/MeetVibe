const sql = require('mssql');

const sqlConfig = {
    server: 'MeetVibe.mssql.somee.com', 
    database: 'MeetVibe',
    user: 'shakedadon_SQLLogin_1',
    password: 'vh6n15djcv',
    options: { encrypt: false, trustServerCertificate: true }
};

async function createTables() {
    try {
        await sql.connect(sqlConfig);
        console.log("⏳ מתחבר למסד הנתונים MeetVibe ויוצר טבלאות...");

        await sql.query(`
            CREATE TABLE Players (
                PlayerID INT IDENTITY(1,1) PRIMARY KEY,
                FullName NVARCHAR(100),
                Phone VARCHAR(20) UNIQUE,
                Password NVARCHAR(255),
                Age INT,
                Gender NVARCHAR(20)
            );
        `);
        console.log("✅ טבלת Players נוצרה.");

        await sql.query(`
            CREATE TABLE Games (
                GameID INT IDENTITY(1,1) PRIMARY KEY,
                CreatorPlayerID INT FOREIGN KEY REFERENCES Players(PlayerID),
                StartTime DATETIME,
                MissingPlayers INT,
                GameStatus VARCHAR(20),
                MinAge INT,
                MaxAge INT,
                IsSocial BIT,
                City NVARCHAR(100),
                PrefGender NVARCHAR(50),
                EventType NVARCHAR(100)
            );
        `);
        console.log("✅ טבלת Games נוצרה.");

        await sql.query(`
            CREATE TABLE GameParticipants (
                GameID INT FOREIGN KEY REFERENCES Games(GameID),
                PlayerID INT FOREIGN KEY REFERENCES Players(PlayerID)
            );
        `);
        console.log("✅ טבלת GameParticipants נוצרה.");

        await sql.query(`
            CREATE TABLE GameMessages (
                MessageID INT IDENTITY(1,1) PRIMARY KEY,
                GameID INT FOREIGN KEY REFERENCES Games(GameID),
                SenderName NVARCHAR(100),
                MessageText NVARCHAR(500),
                SentAt DATETIME DEFAULT GETDATE()
            );
        `);
        console.log("✅ טבלת GameMessages נוצרה.");

        console.log("🎉 כל הטבלאות נוצרו בהצלחה! מסד הנתונים מוכן.");
        process.exit(0);
    } catch (err) {
        console.error("❌ שגיאה ביצירת הטבלאות:", err);
        process.exit(1);
    }
}

createTables();