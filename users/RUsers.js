const express = require('express');
const router = express.Router();
const user = require('../users/MUsers');
const jwt = require('../jwt')


router.post('/add', jwt.verifyToken, jwt.authorizeRole([1, 2]), async (req, res) => {
    const { users, role} = req.body;
    try {
        await user.add(users, role);
        return res.status(200).json({ message: 'User added successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'An unexpected error occurred' });
    }
});

router.post('/getById/',jwt.verifyToken, jwt.authorizeRole([1, 2]), async (req, res) => {
    const { id } = req.body;
    try {
        const result = await user.getById(id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'error'});
    }
});

router.post('/getByRole/', jwt.verifyToken, jwt.authorizeRole([1, 2]), async (req, res) => {
    const { role_id } = req.body;
    try {
        const result = await user.getByRole(role_id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/edit', jwt.verifyToken, jwt.authorizeRole([1, 2]), async (req, res) => {
    const {users, role} = req.body;
    try {
        await user.edit(users, role);
        return res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/non-aktif', jwt.verifyToken, jwt.authorizeRole([1, 2]), async(req, res)=>{
    const {id} = req.body;
    const respone = await user.nonAktif(id);
    if(respone != false){
        return res.status(200).json({ message: 'User updated successfully' });
    }else{
        return res.status(500).json({ message: 'Internal server error' });
    }
})

module.exports = router;