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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function enrichCourtNames() {
    try {
        await sql.connect(sqlConfig);
        console.log("🚀 מתחיל בתהליך העשרת שמות המגרשים מול שרת הכתובות העולמי...");

        // שולפים רק את המגרשים שקיבלו את השם הגנרי "מגרש ציבורי"
        const result = await sql.query(`
            SELECT CourtID, Latitude, Longitude, SportType 
            FROM Courts 
            WHERE CourtName LIKE N'%מגרש % ציבורי%' OR CourtName = 'מגרש ציבורי'
        `);
        
        const courts = result.recordset;
        console.log(`מצאתי ${courts.length} מגרשים שצריכים עדכון שם. מתחיל לעבוד (זה ייקח קצת זמן כי מותר לבקש כתובת רק פעם בשנייה)...`);

        let updatedCount = 0;

        for (let i = 0; i < courts.length; i++) {
            const court = courts[i];
            
            try {
                // מבקשים את הכתובת לפי קו אורך ורוחב
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${court.Latitude}&lon=${court.Longitude}&zoom=18&addressdetails=1&accept-language=he`, {
                    headers: {
                        'User-Agent': 'SportMatch-StudentProject/1.0'
                    }
                });
                
                const geoData = await response.json();
                
                if (geoData && geoData.address) {
                    // מנסים לשלוף את השם הכי מדויק שאפשר: שם פארק, שכונה, רחוב או עיר
                    let locationName = geoData.address.park || geoData.address.neighbourhood || geoData.address.suburb || geoData.address.road || geoData.address.city || geoData.address.town || "אזור כללי";
                    
                    // מנקים גרשיים כדי שלא יקרוס ב-SQL
                    locationName = locationName.replace(/'/g, "''");
                    
                    const sport = court.SportType === 'Football' ? 'כדורגל' : 'כדורסל';
                    const newCourtName = `מגרש ${sport} - ${locationName}`;

                    // מעדכנים את הדאטה-בייס!
                    await sql.query(`
                        UPDATE Courts 
                        SET CourtName = N'${newCourtName}' 
                        WHERE CourtID = ${court.CourtID}
                    `);
                    
                    updatedCount++;
                    if (updatedCount % 10 === 0) {
                        console.log(`✅ עודכנו ${updatedCount} מגרשים עד כה... (למשל: ${newCourtName})`);
                    }
                }
            } catch (err) {
                console.error(`שגיאה בעדכון מגרש ${court.CourtID}, ממשיך הלאה...`);
            }
            
            // חובה! ממתינים שנייה וחצי בין בקשה לבקשה כדי ש-Nominatim לא יחסום אותנו
            await sleep(1500);
        }

        console.log(`🎉 תהליך ההעשרה הסתיים! ${updatedCount} מגרשים קיבלו שם נורמלי ואמיתי.`);
        process.exit(0);

    } catch (err) {
        console.error("❌ שגיאה קריטית:", err);
        process.exit(1);
    }
}

enrichCourtNames();