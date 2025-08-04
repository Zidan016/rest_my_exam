const express = require('express')
const router = express.Router();
const jwt = require('../jwt')
const items = require('./MItems')

router.post('/byPackage', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]),async(req, res)=>{
    const {id} = req.body;
    if(!id){
        return res.status(400).json({message : 'Invalid Input'})
    }
    try {
        const respone = await items.byPackage(id);
        return res.status(200).json(respone)
    } catch (e) {
        console.log(e)
        return res.status(500).json({message : 'Invalid Server'})
    }
});

router.post('/by-parent', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    const {id} = req.body;
    const respone = await items.byParent(id);
    if(respone!= null){
        return res.status(200).json(respone)
    }else{
        return res.status(400).json({message : 'Fail Execute'})
    }
});

router.post('/updated-order', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    const{model_target, model_moved, package_id} = req.body;
    const respone = await items.updateOrder(model_target, model_moved, package_id);
    if(respone != false){
        return res.status(200).json({message : "Succes updated"})
    }else{
        return res.status(400).json({message : "Fail updated"})
    }
});

router.post('/add', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res)=>{
    const {item, answer, package_id, status, attachment} = req.body
    try {
        const respone = await items.addItemAnswers(item, answer, package_id, status, attachment)
        if(respone != false){
            return res.status(200).json({message : 'Succes Add Data'})
        }else{
            return res.status(400).json({message : 'Fail Add Data'})
        }
    } catch (e) {
        console.log(e)
        return res.status(500).json({message : 'Invalid Server'})
    }
});

router.post('/add-package-item', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res)=>{
    const {item, package} = req.body;
    const respone  = await items.addPackageItem(package, item);
    return respone == true 
        ? res.status(200).json({message : 'Succes Add Data'}) 
        : res.status(400).json({message : 'Fail Add Data'})
})

router.post('/add-parent', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]),async(req, res)=>{
    const {item, answer, package_id}= req.body
    const respone = await items.addItemAnswersParent(item, answer, package_id);
    if(respone != null){
        return res.status(200).json({message : 'Succes Add Data'})
    }else{
        return res.status(400).json({message : 'Fail Add Data'})
    }
})

router.post('/edit', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res)=>{
    const {item_id, item, answers, package_id, attachment} = req.body
    try {
        const respone  = await items.updateItemAnswers(item_id, item, answers, package_id, attachment)
        if(respone != false){
            return res.status(200).json({message : 'Succes Edit Data'})
        }else{
            return res.status(400).json({message : 'Fail Edit Data'})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message : 'Invalid Server'})
    }
})

router.post('/delete', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]),async (req, res)=>{
    const {id} = req.body
    try {
        const respone = await items.del(id);
        if(respone != false){
            return res.status(200).json({message : 'Succes Delete Data'})
        }else{
            return res.status(400).json({message : 'Fail Delete Data'})
        }
    } catch (error) {
        console.log(e)
        return res.status(500).json({message : 'Invalid Server'})
    }
})

module.exports = router;