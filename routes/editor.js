const express = require('express');
const router = express.Router();
const protectSensitiveFiles = require('../middleware/protectSensitiveFiles');

// Example: Protect file read and write endpoints
router.post('/read', protectSensitiveFiles, (req, res) => {
    // ...existing code...
});

router.post('/write', protectSensitiveFiles, (req, res) => {
    // ...existing code...
});

module.exports = router;