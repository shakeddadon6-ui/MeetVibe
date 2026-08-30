const sql = require('mssql');

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

async function forceCreateTables() {
    try {
        await sql.connect(sqlConfig);
        console.log("⏳ מתחבר למסד הנתונים בענן...");

        // יצירת טבלת השחקנים (Players) אם אינה קיימת
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Players' and xtype='U')
            BEGIN
                CREATE TABLE Players (
                    PlayerID INT IDENTITY(1,1) PRIMARY KEY,
                    FullName NVARCHAR(100),
                    Phone NVARCHAR(20) UNIQUE,
                    Password NVARCHAR(100),
                    Age INT,
                    Gender NVARCHAR(20)
                )
            END
        `);
        console.log("✅ טבלת 'Players' (שחקנים) נבדקה/נוצרה בהצלחה!");

        // יצירת טבלת המפגשים (Games) עם כל העמודות החברתיות החדשות
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Games' and xtype='U')
            BEGIN
                CREATE TABLE Games (
                    GameID INT IDENTITY(1,1) PRIMARY KEY,
                    CreatorPlayerID INT,
                    StartTime DATETIME,
                    MissingPlayers INT,
                    GameStatus NVARCHAR(20) DEFAULT 'Open',
                    MinAge INT,
                    MaxAge INT,
                    IsSocial INT DEFAULT 1,
                    City NVARCHAR(100),
                    PrefGender NVARCHAR(50),
                    EventType NVARCHAR(100)
                )
            END
        `);
        console.log("✅ טבלת 'Games' (מפגשים) נבדקה/נוצרה בהצלחה!");

        // יצירת טבלת משתתפים במפגש (GameParticipants)
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GameParticipants' and xtype='U')
            BEGIN
                CREATE TABLE GameParticipants (
                    ParticipantID INT IDENTITY(1,1) PRIMARY KEY,
                    GameID INT,
                    PlayerID INT
                )
            END
        `);
        console.log("✅ טבלת 'GameParticipants' (משתתפים) נבדקה/נוצרה בהצלחה!");

        // יצירת טבלת הצ'אט (GameMessages)
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GameMessages' and xtype='U')
            BEGIN
                CREATE TABLE GameMessages (
                    MessageID INT IDENTITY(1,1) PRIMARY KEY,
                    GameID INT,
                    SenderName NVARCHAR(100),
                    MessageText NVARCHAR(500),
                    SentAt DATETIME DEFAULT GETDATE()
                )
            END
        `);
        console.log("✅ טבלת 'GameMessages' (הודעות צ'אט) נבדקה/נוצרה בהצלחה!");

        console.log("🎉 כל הטבלאות במסד הנתונים מעודכנות ומוכנות לעבודה למערכת המפגשים!");
        process.exit(0);

    } catch (err) {
        console.error("❌ שגיאה מול מסד הנתונים:", err);
        process.exit(1);
    }
}

forceCreateTables();