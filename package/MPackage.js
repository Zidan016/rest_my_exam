const server = require('../serverDB')
const format = require('./FormatPackage')
const crypto = require('crypto')


const byId = async (id) => {
    const db = server.pool;
    const sql = `SELECT * FROM packages WHERE id = ?`;
    try {
        const [[dataPackage]] = await db.execute(sql, [id]);
        return dataPackage;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const search = async()=>{
    const db = server.pool;
    const sql = `SELECT id, title FROM packages WHERE parent_id IS NULL`;
    try {
        const [data] = await db.execute(sql);
        return data;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const searchParticipan = async () => {
    const db = server.pool;
    const sqlRole = `SELECT * FROM assigned_roles WHERE role_id = 5 ORDER BY id ASC`;
    const sql = `SELECT id, username, name FROM users WHERE id = ? ORDER BY id ASC`;
    try {
        const [getRole] = await db.execute(sqlRole);
        const withUsers = await Promise.all(
            getRole.map(async (item) => {
                const [data] = await db.execute(sql, [item.entity_id]);
                return data[0];
            })
        );

        return withUsers;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const getMain = async () => {
    const db = server.pool;
    const sql = `SELECT * FROM packages WHERE parent_id IS NULL order BY created_at DESC`;
    try {
        const [dataPackage] = await db.execute(sql);
        return dataPackage;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const add = async(package)=>{
    const db = server.pool;
    const id = crypto.randomUUID();
    const sql = `INSERT INTO packages (id, parent_id, title, code, config, depth, description, level, duration, max_score, random_item, item_duration, note, created_at, updated_at, is_encrypted, distribution_options, is_toefl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW(),?,?,?)`
    try {
        await db.execute(sql, [id, package.parent_id, package.title, package.code, package.config, package.depth, package.description, package.level, package.duration, package.max_score, package.random_item, package.item_duration, package.note, package.is_encrypted, package.distribution_options, package.is_toefl]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const firstIntro = async(id)=>{
    const db = server.pool;
    const insertItem = `INSERT INTO items (id, parent_id, type, code, content, answer_order_random, duration, item_count, \`order\`, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertPackageItem = `INSERT INTO package_item (package_id, item_id, score, \`order\`, type) VALUES (?, ?, 0, 0, "intro")`;
    try {
        const formatItem = await format.formatItemIntro();
        await db.query(insertItem, [formatItem.id, null, formatItem.type, formatItem.code, formatItem.content, formatItem.answer_order_random, formatItem.duration, formatItem.item_count, formatItem.order, formatItem.created_at, formatItem.updated_at]);
        await db.execute(insertPackageItem, [id, formatItem.id]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const addToefl = async (parent_id, title, code, config, depth, description, level, duration, max_score, random_item, item_duration, note, is_encrypted, distribution_options, is_toefl) => {
    const db = server.pool;
    const id = crypto.randomUUID();
    const sql = `INSERT INTO packages 
        (id, parent_id, title, code, config, depth, description, level, duration, max_score, random_item, item_duration, note, created_at, updated_at, is_encrypted, distribution_options, is_toefl) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
        await db.execute(sql, [
            id, parent_id, title, code, config, depth, description, level, duration, max_score, random_item, item_duration, note, new Date(), new Date(), is_encrypted, distribution_options, is_toefl
        ]);

        const getFormat = await format.format(id);
        if (getFormat.length > 0 ) {
            const sqlBulk = `INSERT INTO packages 
                (id, parent_id, title, code, config, depth, description, level, duration, max_score, random_item, item_duration, note, created_at, updated_at, is_encrypted, distribution_options, is_toefl) 
                VALUES ?`;

            const bulk = getFormat.map(item => [
                item.id, item.parent_id, item.title, item.code, item.config, item.depth, item.description, item.level, item.duration, item.max_score, item.random_item, item.item_duration, item.note, item.created_at, item.updated_at, item.is_encrypted, item.distribution_options, item.is_toefl
            ]);

            await db.query(sqlBulk, [bulk]); 
        }

        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};


const byParent = async (parent_id) => {
    const db = server.pool;
    const sql = `SELECT * FROM packages WHERE parent_id = ? order BY created_at DESC`;
    try {
        const [data] = await db.execute(sql, [parent_id]);
        return data;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const update = async (parent_id, title, code, config, depth, description, level, duration, max_score, random_item, item_duration, note, is_encrypted, distribution_options, is_toefl, id) => {
    const db = server.pool;
    const sql = `UPDATE packages SET parent_id = ?, title = ?, code = ?, config = ?, depth = ?, description = ?, level = ?, duration = ?, max_score = ?, random_item = ?, item_duration = ?, note = ?, updated_at = NOW(), is_encrypted = ?, distribution_options = ?, is_toefl = ? WHERE id = ?`;
    const updateDuration = `UPDATE packages SET item_duration = ? WHERE parent_id = ?`
    try {
        await db.execute(sql, [parent_id, title, code, config, depth, description, level, duration, max_score, random_item, item_duration, note, is_encrypted, distribution_options,is_toefl, id]);
        await db.execute(updateDuration, [item_duration, id])
        console.log('Succes edit')
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const del = async (id)=>{
    const db = server.pool;
    const sql = `DELETE FROM packages WHERE id = ?`
    try {
        await db.execute(sql, [id])
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = {byId, add, byParent, update, del, getMain, addToefl, search, searchParticipan, firstIntro}
