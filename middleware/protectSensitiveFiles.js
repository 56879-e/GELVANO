const path = require('path');

// List of sensitive files or directories to protect
const protectedPaths = [
    'config/siteData.json',
    'config/secrets/',
    // Add more as needed
];

function isProtected(filePath) {
    const normalized = path.normalize(filePath);
    return protectedPaths.some(protectedPath =>
        normalized.startsWith(path.normalize(protectedPath))
    );
}

module.exports = function protectSensitiveFiles(req, res, next) {
    const filePath = req.body.filePath || req.query.filePath;
    if (filePath && isProtected(filePath)) {
        return res.status(403).json({ error: 'Access to this file is forbidden.' });
    }
    next();
};
