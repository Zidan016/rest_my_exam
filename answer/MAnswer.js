const server = require('../serverDB')
const crypto = require('crypto')

const byItem = async (item_id)=>{
    const db = server.pool;
    const sql = `SELECT * FROM item_answers WHERE item_id = ?`
    try {
        const [result] = await db.execute(sql, [item_id]);
        console.log(result);
        return result;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const add = async (item_id, content, is_correct, order)=>{
    const db = server.pool;
    const checkSql = `SELECT id FROM items WHERE id = ?`;
    const sql = `INSERT INTO answer (id, item_id, content, is_correct, \`order\`) VALUES (?,?,?,?,?)`
    const id = crypto.randomUUID();
    try {
        const [rows] = await db.execute(checkSql, [item_id]);
        if (rows.length === 0) {
            throw new Error('Invalid item_id');
        }
        await db.execute(sql, [id, item_id, content, parseInt(is_correct), order]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const update = async (id, item_id, content, is_correct, order)=>{
    const db= server.pool;
    const checkSql = `SELECT id FROM items WHERE id = ?`;
    const sql = `UPDATE answer SET item_id = ?, content = ?, is_correct = ?, \`order\` = ? WHERE id = ?`
    try {
        const [rows] = await db.execute(checkSql, [item_id]);
        if (rows.length === 0) {
            throw new Error('Invalid item_id');
        }
        await db.execute(sql, [item_id, content, is_correct, order, id]);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}


module.exports = {add, update, byItem};