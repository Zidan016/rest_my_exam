const express = require('express');
const router = express.Router();
const answer = require('./MAnswer')
const crypto = require('crypto')

router.post('/add', async(req, res)=>{
    const {item_id, content, is_correct, order} = req.body;
    try {
        const response = await answer.add(item_id, content, is_correct, order);
        if(response != false){
            return res.status(200).json({message : 'Success Add Data'});
        }else{
            return res.status(400).json({message : 'Fail Add Data'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : 'Invalid Server'});
    }
});

router.post('/update', async(req, res)=>{
    const {id, item_id, content, is_correct, order} = req.body;
    try {
        const respone = await answer.update(id, item_id, content, is_correct, order);
        if(respone != false){
            return res.status(200).json({message : 'Succes Update Data'});
        }else{
            return res.status(400).json({message : 'Fail Update Data'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : 'Invalid Server'});
    }
});

router.post('/byItem', async (req, res)=>{
    const {item_id} = req.body;
    try {
        const respone = await answer.byItem(item_id);
        if(respone != false){
            return res.status(200).json(respone);
        }else{
            return res.status(400).json({message : 'Fail Fetch Data'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message : 'Invalid Server'});
    }
});

module.exports = router;