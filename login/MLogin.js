const db = require('../serverDB');
const hash = require('bcryptjs');
const crypto = require('crypto')


const login = async (username, password) => {
    const query = `SELECT * FROM users WHERE username = ?`;
    const role = `SELECT * FROM assigned_roles WHERE entity_id = ?`;
    const newDB = db.pool;
    try {
        const [user] = await newDB.execute(query, [username]);
    
        if (user.length === 0) {
            return null;
        } else {
            const rows = user[0];
            const [getRole] = await newDB.execute(role, [rows.id]);
            const roleIds = getRole.map(role => role.role_id);
            const hashPassword = rows.password;
            const isMatch = await hash.compare(password, hashPassword);
            if (isMatch) {
            return {
                id: rows.id,
                username: rows.username,
                role_id: roleIds,
            };
            } else {
            console.log('Incorrect password');
            return 404;
            }
        }
        } catch (e) {
        console.log(e);
        return false;
    }
};

module.exports = {login};