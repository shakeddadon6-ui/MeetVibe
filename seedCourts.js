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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seedCourts() {
    try {
        console.log("🚀 מתחיל שאיבה חכמה מכל הארץ (צפון, מרכז, דרום)...");
        await sql.connect(sqlConfig);
        
        // חילקנו את ישראל ל-3 אזורים כדי למשוך את כל המדינה בלי להקריס את השרת
        const regions = [
            { name: "צפון הארץ (חיפה עד חרמון)", bbox: "32.2,34.8,33.3,35.9" },
            { name: "מרכז וירושלים", bbox: "31.6,34.6,32.2,35.5" },
            { name: "דרום הארץ (אילת עד אשקלון)", bbox: "29.4,34.2,31.6,35.4" }
        ];

        let totalSaved = 0;

        for (const region of regions) {
            console.log(`\n⏳ סורק מגרשים אמיתיים באזור: ${region.name}...`);
            
            const query = `
                [out:json][timeout:90];
                (
                  node["leisure"="pitch"]["sport"~"basketball|soccer"](${region.bbox});
                  way["leisure"="pitch"]["sport"~"basketball|soccer"](${region.bbox});
                );
                out center;
            `;
            
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'User-Agent': 'SportMatch-StudentProject/1.0'
                },
                body: `data=${encodeURIComponent(query)}`
            });
            
            if (!response.ok) {
                console.error(`❌ השרת דחה את הבקשה לאזור ${region.name}. נסה שוב מאוחר יותר.`);
                continue;
            }
            
            const data = await response.json();
            const elements = data.elements;
            
            if (!elements || elements.length === 0) {
                console.log(`⚠️ לא נמצאו מגרשים נוספים באזור ${region.name}.`);
                continue;
            }

            console.log(`✅ נמצאו ${elements.length} מגרשים ב${region.name}. מכניס למסד הנתונים...`);

            let savedInRegion = 0;
            for (const el of elements) {
                const lat = el.lat || el.center.lat;
                const lon = el.lon || el.center.lon;
                
                const isSoccer = el.tags.sport && el.tags.sport.includes('soccer');
                const sportType = isSoccer ? 'Football' : 'Basketball';
                
                let courtName = el.tags.name || el.tags['name:he'] || (isSoccer ? 'מגרש כדורגל ציבורי' : 'מגרש כדורסל ציבורי');
                courtName = courtName.replace(/'/g, "''");
                
                // הזרקה לדאטה-בייס - מדלג על מה שכבר קיים!
                await sql.query(`
                    IF NOT EXISTS (SELECT 1 FROM Courts WHERE Latitude = ${lat} AND Longitude = ${lon})
                    BEGIN
                        INSERT INTO Courts (CourtName, Latitude, Longitude, SportType)
                        VALUES (N'${courtName}', ${lat}, ${lon}, '${sportType}')
                    END
                `);
                savedInRegion++;
                totalSaved++;
            }
            console.log(`💾 נשמרו/עודכנו ${savedInRegion} מגרשים מ${region.name}.`);
            
            if (region.name !== "דרום הארץ (אילת עד אשקלון)") {
                console.log("ממתין 5 שניות לפני סריקת האזור הבא כדי לא להיחסם...");
                await sleep(5000);
            }
        }
        
        console.log(`\n🎉 מטורף! התהליך הסתיים בהצלחה. כל מגרשי ישראל שמורים אצלך במסד הנתונים.`);
        process.exit(0);

    } catch (err) {
        console.error("❌ שגיאה קריטית בתהליך:", err.message);
        process.exit(1);
    }
}

seedCourts();