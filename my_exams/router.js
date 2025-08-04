const model = require('./models');
const proctor = require('../proctors/models');
const express = require('express');
const router = express.Router();

module.exports = (io)=>{
    router.post('/get-items-answer', async(req, res)=>{
        const {section_id} = req.body;
        const respone = await model.getItemAnswer(section_id);
        if(respone != false){
            res.status(200).json(respone);
        }else{
            res.status(400).json({message : 'Internal server error'});
        }
    });
    
    router.post('/get-section', async(req, res)=>{
        const {exam_id, user_id} = req.body;
        const respone = await model.getSection(exam_id, user_id);
        if(respone != false){
            res.status(200).json(respone);
        }else{
            res.status(400).json({message : 'Internal server error'});
        }
    });

    router.post('/listening-section', async(req, res)=>{
        const {participant_id} = req.body;
        const respone = await model.listeningSection(participant_id);
        if(respone != false){
            res.status(200).json(respone);
            io.emit(`section-${participant_id}`, respone);
        }else{
            res.status(400).json({message : 'Internal server error'});
        }
    })
    
    router.post('/get-exam', async(req, res)=>{
        const {user_id, status} = req.body;
        const respone = await model.getExams(user_id, status);
        if(respone != false){
            res.status(200).json(respone);
        }else{
            res.status(400).json({message : 'Internal server error'});
        }
    });
    
    router.post('/do-exams', async(req, res)=>{
        const {item_id, attempt, prtSection } = req.body;
        const respone = await model.doExams(item_id, attempt, prtSection);
        if(respone != false){
            res.status(200).json({message : 'Succes'});
        }else{
            res.status(400).json({message : 'Internal server error'});
        }
    });
    
    router.post('/logs', async(req, res)=>{
        const {logs, examId, is_start, is_end} = req.body;
        const respone = await model.setLogs(logs, is_start, is_end);
        if(respone != false){
            res.status(200).json({message : 'Succes'});
            const getLog = await proctor.getLogs(logs.participant_id);
            const getExamParticipantLogs = await proctor.getExamParticipantLogs(examId);
            const dahsboard = await proctor.getDashboard()
            io.emit(`participant-exam-${examId}`, getExamParticipantLogs);
            io.emit(`logs-${logs.participant_id}`, getLog);
            io.emit('dashboard', dahsboard);
        }else{
            res.status(400).json({message : 'Internal server error'});
        }
    });
    
    router.post('/end-section', async (req, res)=>{
        const {section} = req.body;
        const respone = await model.endSection(section);
        if(respone != false){
            res.status(200).json({message : 'Succes'});
        }else{
            res.status(400).json({message : 'Internal server error'});
        }
    });

    router.post('/fix-score', async (req, res)=>{
        const {section} = req.body;
        const respone = await model.fixScore(section);
        if(respone != false){
            res.status(200).json({message : 'Succes'});
        }else{
            res.status(400).json({message : 'Internal server error'});
        }
    });
    
    return router;
}
