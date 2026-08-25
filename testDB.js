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

async function test() {
    try {
        await sql.connect(sqlConfig);
        const result = await sql.query(`SELECT COUNT(*) AS Total FROM Courts`);
        console.log(`📊 מספר המגרשים שנמצאים בפועל בטבלת Courts בענן:`, result.recordset[0].Total);
        process.exit(0);
    } catch (err) {
        console.error("❌ שגיאת חיבור:", err);
        process.exit(1);
    }
}

test();