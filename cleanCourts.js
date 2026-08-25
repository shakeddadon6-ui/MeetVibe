const sql = require('mssql');

const sqlConfig = {
    server: 'localhost',
    database: 'SportMatchDB',
    user: 'SportApp',
    password: 'SportPassword123!',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// 1. סינון גיאוגרפי: מזהה שטחי הרשות הפלסטינית ועזה
const isInPalestinianAuthority = (lat, lon) => {
    if (lat >= 32.15 && lat <= 32.30 && lon >= 35.15 && lon <= 35.35) return true; // שכם
    if (lat >= 32.40 && lat <= 32.55 && lon >= 35.20 && lon <= 35.40) return true; // ג'נין
    if (lat >= 31.85 && lat <= 31.95 && lon >= 35.15 && lon <= 35.25) return true; // רמאללה
    if (lat >= 31.45 && lat <= 31.60 && lon >= 35.05 && lon <= 35.15) return true; // חברון
    if (lat >= 31.20 && lat <= 31.60 && lon >= 34.20 && lon <= 34.55) return true; // עזה
    if (lat >= 32.15 && lat <= 32.35 && lon >= 34.95 && lon <= 35.05) return true; // קלקיליה/טולכרם
    if (lat >= 31.80 && lat <= 31.90 && lon >= 35.40 && lon <= 35.50) return true; // יריחו
    if (lat >= 31.65 && lat <= 31.75 && lon >= 35.15 && lon <= 35.25) return true; // בית לחם
    return false;
};

// 2. סינון שמי: מזהה שכונות ערביות ספציפיות במזרח ירושלים
const isEastJerusalemArabNeighborhood = (courtName) => {
    const name = courtName.toLowerCase();
    const keywords = [
        'silwan', 'shuafat', 'beit hanina', 'isawiya', 'jabel mukaber', 
        'sur baher', 'ras al-amud', 'wadi al-joz', 'sheikh jarrah',
        'שועפאט', 'סילוואן', 'בית חנינא', 'עיסאוויה', "ג'בל מוכבר", 
        'צור באהר', 'ראס אל עמוד', "ואדי אל ג'וז", "שייח ג'ראח", 'אבו טור'
    ];
    return keywords.some(keyword => name.includes(keyword));
};

async function cleanDatabase() {
    try {
        await sql.connect(sqlConfig);
        console.log("🚀 מפעיל ניקוי עמוק: שטחי רשות + שכונות ערביות במזרח ירושלים...");

        // שולפים את כל המגרשים לבדיקה
        const result = await sql.query(`SELECT CourtID, CourtName, Latitude, Longitude FROM Courts`);
        const courts = result.recordset;
        
        const arabicRegex = /[\u0600-\u06FF]/; // זיהוי טקסט בערבית
        let deletedCount = 0;

        for (const court of courts) {
            // בודקים את כל שלושת התנאים שלנו
            const inPA = isInPalestinianAuthority(court.Latitude, court.Longitude);
            const inEastJerusalem = isEastJerusalemArabNeighborhood(court.CourtName);
            const hasArabic = arabicRegex.test(court.CourtName);

            if (inPA || inEastJerusalem || hasArabic) {
                // מוחקים את המגרש לצמיתות
                await sql.query(`DELETE FROM Courts WHERE CourtID = ${court.CourtID}`);
                deletedCount++;
            }
        }

        console.log(`✅ הניקוי החכם הושלם! נמחקו לצמיתות עוד ${deletedCount} מגרשים (רשות פלסטינית / מזרח ירושלים).`);
        console.log(`נשארו ${courts.length - deletedCount} מגרשים ישראלים נקיים במערכת שלך.`);
        process.exit(0);

    } catch (err) {
        console.error("❌ שגיאה בניקוי מסד הנתונים:", err);
        process.exit(1);
    }
}

cleanDatabase();