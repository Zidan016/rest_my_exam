const { json } = require('body-parser');
const model = require('./models');
const express = require('express');
const router = express.Router();
const crypto = require('crypto')
const jwt = require('../jwt')

module.exports = (io)=>{
    router.post('/dis-or-qual', jwt.verifyToken, jwt.authorizeRole([1, 2, 3, 4]), async (req, res) => {
        const { prtId, status} = req.body;
        const result = await model.disOrQual(prtId, status);
        if (result == true) {
            res.status(200).json({ message: 'Status updated successfully' });
            const getData = await model.getSection(prtId);
            io.emit(`section-${prtId}`, getData);
            const dahsboard = await model.getDashboard();
            io.emit('dashboard', dahsboard);
            const exams = await model.getExamsId(prtId);
            const prtExams = await model.getExamParticipantLogs(exams.exam_id);
            io.emit(`participant-exam-${exams.exam_id}`, prtExams);
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    router.post('/get-participant-exam', jwt.verifyToken, jwt.authorizeRole([1, 2, 3, 4]), async (req, res) => {
        const { examId } = req.body;
        const data = await model.getExamParticipantLogs(examId);
        if (data) {
            res.status(200).json(data);
            io.emit(`participant-exam-${examId}`, data);
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    router.post('/end-exams', jwt.verifyToken, jwt.authorizeRole([1, 2, 3, 4]), async (req, res)=>{
        const {examId} = req.body;
        const result = await model.endExams(examId);
        if(result){
            res.status(200).json({message : 'Exams ended successfully'});
            const getData = await model.getExamParticipantLogs(examId);
            io.emit(`exams-${examId}`, getData);
        }
        else{
            res.status(500).json({message : 'Internal server error'});
        }
    });

    router.post('/dahsboard', jwt.verifyToken, jwt.authorizeRole([1, 2, 3, 4]), async(req, res)=>{
        const result = await model.getDashboard();
        if(result != false){
            res.status(200).json(result);
            io.emit('dashboard', result);
        }else{
            res.status(500).json({message : 'Internal server error'});
        }
    });

    router.post('/set-logs', jwt.verifyToken, jwt.authorizeRole([1, 2, 3, 4]), async (req, res)=>{
        const {logs, examId} = req.body;
        const result = await model.updateLogs(logs);
        if(result){
            res.status(200).json({message : 'Logs set successfully'});

            const getData = await model.getExamParticipantLogs(examId);
            io.emit(`participant-exam-${examId}`, getData);

            const getLogs = await model.getLogsById(logs.participant_id);
            io.emit(`logs-data-${logs.participant_id}`, getLogs);
        }
        else{
            res.status(500).json({message : 'Internal server error'});
        }
    });

    router.post('/get-logs', jwt.verifyToken, jwt.authorizeRole([1, 2, 3, 4]), async (req, res)=>{
        const {prtId} = req.body;
        const data = await model.getLogs(prtId);
        if(data){
            res.status(200).json(data);
            io.emit(`logs-data-${prtId}`, data);
        }else{
            res.status(500).json({message : 'Internal server error'});
        }
    });

    return router;
}
