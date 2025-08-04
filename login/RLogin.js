const express = require('express');
const router = express.Router();
const Mlogin = require('../login/MLogin');
const jwt = require('jsonwebtoken');
const secretkey = 'TRIALEXAMV1';

router.post('/', async (req, res) => {
    const { username, password } = req.body;
    try {
        const execute = await Mlogin.login(username, password);
        if (execute === null) {
            res.status(404).json({ message: 'User not found' });
        } else if (execute === 404) {
            res.status(401).json({ message: 'Incorrect password' });
        } else {
            const token = jwt.sign({ username: execute.username, role: Array.isArray(execute.role_id) ? execute.role_id : [execute.role_id], id: execute.id }, secretkey);
            res.status(200).json({ data: execute, token: token });
        }
    } catch (e) {
        res.status(500).json({
            message: 'An error occurred',
            error: e.message
        });
    }
});

module.exports = router;