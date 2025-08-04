const express = require('express')
const router = express.Router()
const package = require('./MPackage')
const jwt = require('../jwt')
const crypto = require('crypto')


router.post('/getMain',  jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    try {
        const respone = await package.getMain()
        if(respone != false){
            return res.status(200).json(respone)
        }else{
            return  res.status(400).json({message : 'Invalid data'})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message : 'Invalid Server'})
    }
});

router.post('/search-package',  jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    try {
        const respone = await package.search();
        if(respone != false){
            return res.status(200).json(respone);
        }else{
            return res.status(400).json({message : 'Invalid data'});
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message : 'Invalid Server'})
    }
});

router.post('/search-participant',  jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    try {
        const respone = await package.searchParticipan();
        if(respone != false){
            return res.status(200).json(respone);
        }else{
            return res.status(400).json({message : 'Invalid data'});
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message : 'Invalid Server'})
    }
})

router.post('/add',  jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    const {packages} = req.body
    const respone = await package.add(packages);
    if(respone != false){
        return res.status(200).json({message : 'Succes add Data'})
    }else{
        return res.status(400).json({message : 'Invalid add Data'})
    }
});

router.post('/add-first-intro',  jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    const {package_id} = req.body;
    const respone = await package.firstIntro(package_id);
    if(respone != false){
        return res.status(200).json({message : 'Succes add Data'})
    }
    else{
        return res.status(400).json({message : 'Invalid add Data'})
    }
});

router.post('/add-toefl', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    const {parent_id, title, code, config, depth, description, level, duration, max_score, random_item, item_duration, note, is_encrypted, distribution_options, is_toefl} = req.body
    try {
        const respone = await package.addToefl(parent_id, title, code, config, depth, description, level, duration, max_score, random_item, item_duration, note, is_encrypted, distribution_options, is_toefl);
        if(respone != false){
            return res.status(200).json({message : 'Succes add Data'})
        }else{
            return res.status(400).json({message : 'Invalid add Data'})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message : 'Invalid Server'})
    }
});

router.post('/byId', jwt.verifyToken, jwt.authorizeRole([1, 2, 3, 5]), async(req, res)=>{
    const {id} = req.body;
    const respone = await package.byId(id)
    if(respone != false){
        return res.status(200).json(respone)
    }else{
        return  res.status(400).json({message : 'Invalid data'})
    }
})

router.post('/byParent', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async(req, res)=>{
    const {parent_id} = req.body;
    try {
        const respone = await package.byParent(parent_id)
        if(respone != false){
            return res.status(200).json(respone)
        }else{
            return  res.status(400).json({message : 'Invalid data'})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message : 'Invalid Server'})
    }
})

router.post('/edit', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]), async (req, res)=>{
    const {parent_id, title, code, config, depth, description, level, duration, max_score, random_item, item_duration, note, is_encrypted, distribution_options, is_toefl ,id} = req.body;
    const respone = await package.update(parent_id, title, code, config, depth, description, level, duration, max_score, random_item, item_duration, note, is_encrypted, distribution_options, is_toefl, id);
    if(respone != false){
            return res.status(200).json({message: "succes edit data"})
    }else{
        return  res.status(400).json({message : 'fail edit data'})
    }
})

router.post('/delete', jwt.verifyToken, jwt.authorizeRole([1, 2, 3]),async(req, res)=>{
    const {id} = req.body
    try {
        const respone  = await package.del(id)
        if(respone != false){
            res.status(200).json({message : 'Succes Delete Data'})
        }else{
            res.status(400).json({message : 'Fail Delete Data'})
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({message : 'Invalid Server'})
    }
})

module.exports = router;