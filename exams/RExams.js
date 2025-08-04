const express = require('express');
const router = express.Router();
const exmas = require('./MExams');
const jwt = require('../jwt')


router.post('/get-all', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]),async(req, res)=>{
    try {
        const respone = await exmas.getAll();
        if(respone != false){
            return res.status(200).json(respone);
        }else{
            return res.status(400).json({message : 'Invalid Server'})
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : `${error.message}`});
    }
})

router.post('/up-coming', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]),async(req, res)=>{
    try {
        const respone = await exmas.examGet('up');
        if(respone != false){
            return res.status(200).json(respone);
        }else{
            return res.status(400).json({message : 'Invalid Server'})
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : `${error.message}`});
    }
})
router.post('/now',jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    try {
        const respone = await exmas.examGet('now');
        if(respone != false){
            return res.status(200).json(respone);
        }else{
            return res.status(400).json({message : 'Invalid Server'})
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : `${error.message}`});
    }
})
router.post('/end', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    try {
        const respone = await exmas.examGet('end');
        if(respone != false){
            return res.status(200).json(respone);
        }else{
            return res.status(400).json({message : 'Invalid Server'})
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : `${error.message}`});
    }
})

router.post('/draft', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    const respone = await exmas.examGet('draft');
    if(respone != false){
        return res.status(200).json(respone);
    }else{
        return res.status(400).json({message : 'Invalid Server'})
    }
})

router.post('/byId', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]),async(req, res)=>{
    const {id} = req.body;
    try {
        const respone = await exmas.byId(id);
        if(respone != false){
            return res.status(200).json({data : respone});
        }else{
            return res.status(400).json({message : 'Fail Fetch Data'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : 'Invalid Server'});
    }
});

router.post('/get-participant', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]),async(req, res)=>{
    const {exam_id} = req.body;
    const respome = await exmas.getParticipant(exam_id);
    if(respome != false){
        return res.status(200).json(respome);
    }else{
        return res.status(400).json({message : 'Fail Fetch Data'});
    }
})

router.post('/add', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]),async(req, res)=>{
    const {exams} = req.body;
    try {
        const respone = await exmas.add(exams);
        if(respone != false){
            return res.status(200).json({message : 'Succes add Data'});
        }else{
            return res.status(400).json({message : 'Fail add Data'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : 'Invalid Server'});
    }
});

router.post('/update', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]),async(req, res)=>{
    const {exams} = req.body;
    try {
        const respone  = await exmas.edit(exams);
        if(respone != false){
            return res.status(200).json({message : 'Succes Edit Data'});
        }else{
            return res.status(400).json({message : 'Fail edit Data'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : 'Invalid Server'});
    }
});

router.post('/byParticipan', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]),async(req, res)=>{
    const {user_id} = req.body;
    try {
        const respone = await exmas.byParticipan(user_id);
        if(respome != false){
            return res.status(200).json(respone);
        }else{
            return res.status(400).json({message : 'Fail Fetch Data'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : 'Invalid Server'});
    }
});

router.post('/delete',jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    const {id} = req.body;
    try {
        const respone = await exmas.del(id);
        if(respone != false){
            return res.status(200).json({message : 'Succes Edit Data'});
        }else{
            return res.status(400).json({message : 'Fail edit Data'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : 'Invalid Server'});
    }
});

router.post('/start-exam',jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res)=>{
    const {exam_id} = req.body;
    const respone = await exmas.startExam(exam_id);
    if(respone){
        return res.status(200).json({message : 'Succes Start Exams'});
    }else{
        return res.status(400).json({message : 'Fail Start Exams'});
    }
});

router.post('/publish-exam',jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    const {exam_id} = req.body;
    const respone = await exmas.publishExam(exam_id);
    if(respone){
        return res.status(200).json({message : 'Succes Start Exams'});
    }else{
        return res.status(400).json({message : 'Fail Start Exams'});
    }
})

module.exports = router;