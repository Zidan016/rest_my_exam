const jwt = require('jsonwebtoken');
const secretkey = 'TRIALEXAMV1';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, secretkey, (err, decoded) => {
        if (err) {
            return res.status(404).json({ message: 'Failed to authenticate token' });
        }
        req.id = decoded.id;
        req.role = decoded.role;
        req.username = decoded.username;
        console.log(req.role)
        next();
    });
};

const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRoles = Array.isArray(req.role) ? req.role : [req.role];
        const hasPermission = userRoles.some(role => allowedRoles.includes(Number(role))); // Pastikan tipe sama
        console.log('Allowed:', allowedRoles);
        console.log('User roles:', req.role, 'Type:', typeof req.role);

        if (!hasPermission) {
            return res.status(403).json({ message: 'Access denied. Unauthorized role.', role: req.role });
        }
        next();
    };

};


module.exports = {verifyToken, authorizeRole};
