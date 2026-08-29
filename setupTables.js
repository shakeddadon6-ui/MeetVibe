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

        // --- תוספת לתרגום המגרשים ---
        console.log("⏳ מעדכן את טבלת המגרשים (Courts) לתמיכה באנגלית...");
        
        // 1. הוספת העמודה של האנגלית אם היא לא קיימת
        await sql.query(`
            IF COL_LENGTH('Courts', 'CourtNameEn') IS NULL
            BEGIN
                ALTER TABLE Courts ADD CourtNameEn NVARCHAR(100);
            END
        `);

        // 2. מילון תרגומים למגרשים (לפי המפה שלך)
        const courtsTranslations = [
            { he: 'רוטשילד', en: 'Rothschild Court' },
            { he: 'כצנלסון', en: 'Katznelson Court' },
            { he: 'קרית גנים', en: 'Kiryat Ganim Court' },
            { he: 'נווה הלל', en: 'Neve Hillel Court' },
            { he: 'רמז', en: 'Remez Court' },
            { he: 'אברמוביץ', en: 'Abramovich Court' },
            { he: 'ההסתדרות', en: 'HaHistadrut Court' },
            { he: 'גן ניר דוד', en: 'Nir David Park' }
        ];

        // עדכון השמות במסד הנתונים
        for (const court of courtsTranslations) {
            await sql.query(`
                UPDATE Courts 
                SET CourtNameEn = N'${court.en}' 
                WHERE CourtName LIKE N'%${court.he}%'
            `);
        }
        
        // 3. לכל מגרש שלא תורגם, נשים בינתיים את השם בעברית כברירת מחדל
        await sql.query(`
            UPDATE Courts 
            SET CourtNameEn = CourtName 
            WHERE CourtNameEn IS NULL
        `);

        console.log("✅ טבלת 'Courts' עודכנה בהצלחה עם שמות באנגלית!");
        // ------------------------------

        console.log("🎉 הכל מוכן! עכשיו אתה יכול לפתוח משחקים באפליקציה.");
        process.exit(0);

    } catch (err) {
        console.error("❌ שגיאה מול מסד הנתונים:", err);
        process.exit(1);
    }
}

forceCreateTables();
