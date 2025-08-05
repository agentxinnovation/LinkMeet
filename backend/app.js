const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'LinkMeet API v1.0.0',
        docs: '/docs',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            users: '/api/users',
            rooms: '/api/rooms',
            messages: '/api/messages'
        }
    });
});

module.exports = router;