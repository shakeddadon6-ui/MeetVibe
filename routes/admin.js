const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Middleware לאימות טוקן (מועתק מ-server.js או מיוצא החוצה)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "גישה נדחתה. חסר טוקן אימות." });

    const jwt = require('jsonwebtoken');
    jwt.verify(token, 'MeetVibe_Super_Secret_Key_2026_Secure!@#', (err, user) => {
        if (err) return res.status(403).json({ error: "טוקן לא חוקי או שפג תוקפו." });
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    authenticateToken(req, res, () => {
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: "גישה נדחתה. נדרשות הרשאות מנהל מערכת." });
        }
        next();
    });
}

// דיווח על משתמש
router.post('/reports', authenticateToken, async (req, res) => {
    const reporterId = req.user.userId;
    const { reportedUserId, reason } = req.body;
    try {
        await sql.query(`INSERT INTO UserReports (ReporterID, ReportedUserID, Reason) VALUES (${reporterId}, ${reportedUserId}, N'${reason.replace(/'/g, "''")}')`);
        res.status(201).json({ success: true, message: "הדיווח התקבל בהצלחה." });
    } catch (err) { res.status(500).json({ error: "תקלה בשליחת הדיווח." }); }
});

// שליפת דיווחים למנהל
router.get('/admin/reports', requireAdmin, async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT r.ReportID, r.Reason, CONVERT(varchar, r.ReportDate, 120) AS ReportDateStr,
                   u1.FullName AS ReporterName, u2.FullName AS ReportedName, u2.PlayerID AS ReportedUserID
            FROM UserReports r
            JOIN Players u1 ON r.ReporterID = u1.PlayerID
            JOIN Players u2 ON r.ReportedUserID = u2.PlayerID
            WHERE r.IsResolved = 0
            ORDER BY r.ReportDate DESC
        `);
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: "תקלה בשליפת דיווחים" }); }
});

module.exports = router;