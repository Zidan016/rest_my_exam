const DBServer = require('../serverDB');
const core = require('./core');
const crypto = require('crypto')

const add = async (add) => {
    const addParticipant = await core.addOrUpdate(add);
    return addParticipant;
};

const del = async (id) => {
    const db = DBServer.pool;
    const sql = `DELETE FROM participants WHERE id = ?`;
    try {
        await db.execute(sql, [id]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const getByExam = async (exam_id) => {
    const db = DBServer.pool;
    const getUsers = `SELECT id, name, username FROM users WHERE id = ?`;
    const getParticipans = `SELECT * FROM participants WHERE exam_id = ?`;
    try {
        const [participans] = await db.execute(getParticipans, [exam_id]);
        const users = await Promise.all(participans.map(async (participant) => {
            const [data] = await db.execute(getUsers, [participant.user_id]);
            return {
                users : data[0],
                participant : participant
            };
        }));
        return users.length === 0 ? [] : users;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const updateStatus = async (data) => {
    const db = DBServer.pool;
    const sql = 'UPDATE participants SET status = ? WHERE id = ?';
    try {
        await db.execute(sql, [data.status, data.id]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

module.exports = { add, getByExam, del, updateStatus };
