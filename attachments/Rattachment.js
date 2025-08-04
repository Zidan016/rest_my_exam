const express = require('express');
const router = express.Router();
const attachment = require('./Mattachment')
const path = require('path');
const crypto = require('crypto');
const jwt = require('../jwt');

router.post('/all', jwt.verifyToken, jwt.authorizeRole([1, 3, 4]), async(req, res)=>{
    try {
        const respone = await attachment.getAll();
        return res.status(200).json(respone)
    } catch (e) {
        console.log(e)
        return res.status(500).json({message : 'Invalid Server'})
    }
});

router.post('/get-by-id', jwt.verifyToken, jwt.authorizeRole([1, 3, 4]), async(req, res)=>{
    const {id} = req.body;
    const respone = await attachment.getById(id);
    if(respone != false){
        return res.status(200).json(respone)
    }else{
        return res.status(500).json({message : 'Invalid Server'})
    }
});

router.post('/upload', jwt.verifyToken, jwt.authorizeRole([1, 3, 4]), async(req, res) => {
    const {data} = req.body;
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    let parsedData;
    try {
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
        return res.status(400).json({ message: 'Invalid JSON in data' });
    }

    const file = req.files.file;
    const hash = crypto.createHash('sha256').update(file.name + Date.now().toString()).digest('hex');
    const ext = path.extname(file.name);
    const hashedFileName = `${hash}${ext}`;
    const uploadPath = path.join(__dirname, '../file/build/', hashedFileName);
    file.name = hashedFileName;

    file.mv(uploadPath, async(err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'File upload failed.', error: err });
        }
        parsedData.mime = file.mimetype;
        parsedData.path = `build/${file.name}`;
        parsedData.type = file.fieldname;
        const respone = await attachment.add(parsedData);
        if (!respone) {
            return res.status(500).json({ message: 'File upload failed.' });
        }else{
            res.status(200).json({ message: 'File uploaded successfully.', fileName: file.name });
        }
    });
});

router.post('/update', jwt.verifyToken, jwt.authorizeRole([1, 3, 4]), async (req, res) => {
    const { data } = req.body;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files were uploaded.' });
    }

    let parsedData;
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
      return res.status(400).json({ message: 'Invalid JSON in data' });
    }

    const file = req.files.file;
    const hash = crypto.createHash('sha256').update(file.name + Date.now().toString()).digest('hex');
    const ext = path.extname(file.name);
    const hashedFileName = `${hash}${ext}`;
    const uploadPath = path.join(__dirname, '../file/build/', hashedFileName);
    file.name = hashedFileName;

    file.mv(uploadPath, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'File upload failed.', error: err });
      }

      parsedData.path = `build/${file.name}`;
      parsedData.type = file.fieldname;

      const response = await attachment.update(data, parsedData);
      if (!response) {
        return res.status(500).json({ message: 'File update failed.' });
      } else {
        res.status(200).json({ message: 'File updated successfully.', fileName: file.name });
      }
    });
});


router.post('/add-attachable', jwt.verifyToken, jwt.authorizeRole([1, 3, 4]), async(req, res)=>{
    const {data} = req.body;
    const respone = await attachment.addAttachable(data);
    if(respone != false){
        res.status(200).json({ message: 'successfully'});
    }else{
        res.status(500).json({ message: 'Invalid Server'});
    }
});

router.post('/delete', jwt.verifyToken, jwt.authorizeRole([1, 3, 4]), async(req,res)=>{
    const {id} = req.body;
    const respone = await attachment.del(id);
    if(respone != false){
        res.status(200).json({message : 'Success Delete'})
    }else{
        res.status(500).json({ message: 'Invalid Server'});
    }
});

module.exports = router;