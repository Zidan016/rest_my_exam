const express = require('express');
const router = express.Router();
const MParticipan = require('./MParticipan');
const jwt = require('../jwt')

router.post('/get',  jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res) => {
    const { examId } = req.body;
    try {
        const response = await MParticipan.getByExam(examId);
        if (response) {
            res.status(200).json(response);
        } else {
            res.status(400).json({ message: 'Invalid Server' });
        }
    } catch (error) {
        res.status(500).json({ message: `${error.message}` });
    }
});

router.post('/add',  jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res) => {
    const { add } = req.body;
    try {
        console.log(req.body);
        const response = await MParticipan.add(add);
        if (response) {
            res.status(200).json({ message: 'Success add' });
        } else {
            res.status(400).json({ message: 'Invalid Server' });
        }
    } catch (error) {
        res.status(500).json({ message: `${error.message}` });
    }
});

router.post('/update',  jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res) => {
    const { data } = req.body;
    try {
        const response = await MParticipan.updateStatus(data);
        if (response) {
            res.status(200).json({ message: 'Success Update' });
        } else {
            res.status(400).json({ message: 'Invalid Server' });
        }
    } catch (error) {
        res.status(500).json({ message: `${error.message}` });
    }
});

router.post('/del',  jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res) => {
    const { id } = req.body;
    try {
        const response = await MParticipan.del(id);
        if (response) {
            res.status(200).json({ message: 'Success Delete' });
        } else {
            res.status(400).json({ message: 'Invalid Server' });
        }
    } catch (error) {
        res.status(500).json({ message: `${error.message}` });
    }
});

module.exports = router;