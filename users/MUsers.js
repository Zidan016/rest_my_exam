const server = require('../serverDB');
const hash = require('bcryptjs');
const crypto = require('crypto')

const add = async (users, role) => {
    const newPass = await hash.hash(users.password, 10);
    const sql = `INSERT INTO users (name, alt_id, username, email, email_verified_at, password, two_factor_secret, two_factor_recovery_codes, remember_token, created_at, updated_at, deleted_at) VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW(),?)`;
    const roleSql = `INSERT INTO assigned_roles (role_id, entity_id, entity_type, restricted_to_id, restricted_to_type, scope) VALUES ?`;
    const db = server.pool;
    try {
        const [result] = await db.query(sql, [users.name, users.alt_id, users.username, users.email, users.email_verified_at, newPass, users.two_factor_secret, users.two_factor_recovery_codes, users.remember_token, users.deleted_at]);
        const userId = result.insertId;
        const mapRole = Array.isArray(role) ? role.map((rl) => [
            rl.id,
            userId,
            'App\\\\Entities\\\\Account\\\\User',
            null,
            null,
            null
        ]) : [];
        await db.query(roleSql, [mapRole]);
        console.log('Berhasil Input', result);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const getById = async (id)=>{
    const sql = `SELECT * FROM users WHERE id = ?`;
    const db = server.pool;
    try {
        const [result] = await db.execute(sql, [id]);
        return result;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const getByRole = async (role_id) => {
    const sql = `SELECT * FROM assigned_roles WHERE role_id = ?`;
    const getUser = `SELECT * FROM users WHERE id IN (?) AND deleted_at IS NULL`;
    const getRole = `SELECT * FROM assigned_roles WHERE entity_id IN (?)`;
    const db = server.pool;
    
    try {
        const [result] = await db.execute(sql, [role_id]); 
        const usersId = result.map(it => it.entity_id);
        if (usersId.length === 0) {
            return [];
        }
        const [users] = await db.query(getUser, [usersId]);
        const rolesId = users.map(it => it.id);
        if (rolesId.length === 0) {
            return users.map(user => ({ users: user, role: [] }));
        }
        const [roles] = await db.query(getRole, [rolesId]);
        const mapped = users.map((it) => {
            const role = roles.filter(rl => rl.entity_id === it.id);
            return {
                users: it,
                role: role
            };
        });
        return mapped; 
    } catch (error) {
        console.error(error);
        return [];
    }
};


const edit = async (user, role) => {
    const sql = `UPDATE users SET name = ?, alt_id = ?, username = ?, email = ?, email_verified_at = ?, password = ?, two_factor_secret = ?, two_factor_recovery_codes = ?, remember_token = ?, deleted_at = ?, updated_at = NOW() WHERE id = ?`;
    const oldPassSql = `SELECT password FROM users WHERE id = ?`;
    const deleteRole = `DELETE FROM assigned_roles WHERE entity_id = ?`
    const roleSql = `INSERT INTO assigned_roles (role_id, entity_id, entity_type, restricted_to_id, restricted_to_type, scope) VALUES ?`;
    const db = server.pool;
    try {
        let newPass;
        if (user.password === '' || user.password === null) {
            const [oldPassResult] = await db.execute(oldPassSql, [user.id]);
            newPass = oldPassResult[0].password;
        } else {
            newPass = await hash.hash(user.password, 10);
        }
        await db.execute(sql, [user.name, user.alt_id, user.username, user.email, user.email_verified_at, newPass, user.two_factor_secret, user.two_factor_recovery_codes, user.remember_token, user.deleted_at, user.id]);
        await db.execute(deleteRole, [user.id]);
        const mapRole = Array.isArray(role) ? role.map((rl) => [
            rl.id,
            user.id,
            'App\\\\Entities\\\\Account\\\\User',
            null,
            null,
            null
        ]) : [];
        await db.query(roleSql, [mapRole])
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const nonAktif = async(id)=>{
    const db = server.pool;
    const updatedUsers = `UPDATE users SET deleted_at = NOW() WHERE id = ?`;
    try {
        await db.execute(updatedUsers, [id])
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = {add, getById, edit, getByRole, nonAktif};