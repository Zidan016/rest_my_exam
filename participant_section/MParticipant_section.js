const serverDB = require('../serverDB');
const crypto = require('crypto')

const addOrUpdate= async(examId)=>{
    const db = serverDB.pool;
    const getExams = `SELECT * FROM exams WHERE id = ?`;
    const getParent = `SELECT * FROM packages WHERE parent_id = ?`;
    const getParticipant = `SELECT * FROM participants WHERE exam_id = ?`;
    const addSection = `INSERT INTO participant_sections (id, config, participant_id, last_attempted_at, ended_at, item_duration, remaining_time, attempts, score, created_at, updated_at) VALUES ?`;
    try {
        const [[exams]] = await db.execute(getExams, [examId]);
        const [parent] = await db.execute(getParent, [exams.package_id]);
        const [participants] = await db.execute(getParticipant, [examId]);
        const mapped = participants.flatMap((prt) => {
            return parent.map((pkg) => ({
                id : crypto.randomUUID(),
                config : pkg.config,
                participant_id : prt.id,
                last_attempted_at : null,
                ended_at : null,
                item_duration : pkg.item_duration,
                remaining_time: pkg.duration,
                attempts : 0,
                score: 0,
                created_at: new Date(),
                updated_at: new Date()
            }));
        });
        const bulkFormat = mapped.map((itm)=> [itm.id, itm.config, itm.participant_id, itm.last_attempted_at, itm.ended_at, itm.item_duration, itm.remaining_time, itm.attempts, itm.score, itm.created_at, itm. updated_at]);
        await db.query(addSection, [bulkFormat]);
        return true;
    } catch (e) {
        console.error(e);
        return false
    }
}

const getAll = async()=>{
    const db = serverDB.pool;
    const sql = 'SELECT * FROM participant_section';
    try {
        const result = await db.query(sql);
        return result;
    } catch (e) {
        console.error(e);
        return null;
    }
}

const getById = async(id)=>{
    const db = serverDB.pool;
    const sql = 'SELECT * FROM participant_section WHERE id = ?';
    try {
        const result = await db.query(sql, [id]);
        return result;
    } catch (e) {
        console.error(e);
        return null;
    }
}

const getByParticipantId = async(participant_id)=>{
    const db = serverDB.pool;
    const sql = 'SELECT * FROM participant_section WHERE participant_id = ?';
    try {
        const result = await db.query(sql, [participant_id]);
        return result;
    } catch (e) {
        console.error(e);
        return null;
    }
}

const updateScore = async(score, id)=>{
    const db= serverDB.pool;
    const updatedScores =  `UPDATE participant_sections SET score = ? WHERE id = ?`;
    try {
        await db.execute(updatedScores, [score, id]);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

module.exports = {
    addOrUpdate,
    getById,
    getByParticipantId,
    getAll,
    updateScore
}