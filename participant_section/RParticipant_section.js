const express = require('express');
const router = express.Router();
const model = require('./MParticipant_section');
const crypto = require('crypto')
const jwt = require('../jwt')


router.post('/add-or-update', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res) => {
    const {exam_id} = req.body;
    const result = await model.addOrUpdate(exam_id);
    if (result) {
        res.status(200).json({ message: 'Success' });
    } else {
        res.status(500).json({ message: 'Error' });
    }
});

router.post('/get-all', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res) => {
    const result = await model.getAll();
    if (result !== null) {
        res.status(200).json(result);
    } else {
        res.status(500).json({ message: 'Error' });
    }
});

router.post('/get-by-id/', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res) => {
    const {id} = req.body;
    const result = await model.getById(id);
    if (result !== null) {
        res.status(200).json(result);
    } else {
        res.status(500).json({ message: 'Error' });
    }
});

router.post('/get-by-participant-id', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    const {participant_id} = req.body;
    const result = await model.getByParticipantId(participant_id);
    if (result !== null) {b
        res.status(200).json(result);
    } else {
        res.status(500).json({ message: 'Error' });
    }
});

router.post('/updated-score', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    const {score, id} = req.body;
    const result = await model.updateScore(score, id);
    if(result != false){
        res.status(200).json({ message: 'Success' });
    }else{
        res.status(500).json({ message: 'Error' });
    }
})

module.exports = router;