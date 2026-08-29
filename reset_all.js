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

async function resetDatabase() {
    try {
        await sql.connect(sqlConfig);
        console.log("⏳ מתחבר למסד הנתונים כדי לבצע איפס מלא...");

        // 1. מחיקת נתונים מהטבלאות התלויות קודם (הודעות, משתתפים, משחקים, שחקנים)
        await sql.query(`DELETE FROM GameMessages`);
        await sql.query(`DELETE FROM GameParticipants`);
        await sql.query(`DELETE FROM Games`);
        await sql.query(`DELETE FROM Players`);

        // 2. איפוס ה-Identity (שמזהה ה-ID יתחיל מחדש מ-1)
        await sql.query(`DBCC CHECKIDENT ('GameMessages', RESEED, 0)`);
        await sql.query(`DBCC CHECKIDENT ('GameParticipants', RESEED, 0)`);
        await sql.query(`DBCC CHECKIDENT ('Games', RESEED, 0)`);
        await sql.query(`DBCC CHECKIDENT ('Players', RESEED, 0)`);

        console.log("✅ כל הנתונים נמחקו בהצלחה וה-IDעות אופסו מחדש ל-1!");
        process.exit(0);
    } catch (err) {
        console.error("❌ שגיאה באיפוס המסד:", err);
        process.exit(1);
    }
}

resetDatabase();