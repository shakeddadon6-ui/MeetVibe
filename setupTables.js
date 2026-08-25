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

        // יצירת טבלת המשחקים בכוח
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
        console.log("✅ טבלת 'Games' (משחקים) נוצרה בהצלחה!");

        // יצירת טבלת הצ'אט בכוח
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
        console.log("✅ טבלת 'GameMessages' (הודעות צ'אט) נוצרה בהצלחה!");

        console.log("🎉 הכל מוכן! עכשיו אתה יכול לפתוח משחקים באפליקציה.");
        process.exit(0);

    } catch (err) {
        console.error("❌ שגיאה מול מסד הנתונים:", err);
        process.exit(1);
    }
}

forceCreateTables();