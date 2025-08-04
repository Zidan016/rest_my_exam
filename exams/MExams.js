const server =  require('../serverDB');
const crypto = require('crypto')
const bulkItemAns = require('../participant_section_item_answer/core');
const publish = require('./publish');

const add = async (body)=>{
    const db = server.pool;
    const id = crypto.randomUUID();
    const sql = `INSERT INTO exams (id, package_id, name, scheduled_at, started_at, ended_at, is_anytime, duration, is_multi_attempt, updated_at, created_at) VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())`;
    try {
        await db.execute(sql, [id, body.package_id, body.name, body.scheduled_at, body.started_at, body.ended_at, body.is_anytime, body.duration, body.is_multi_attempt]);
        return true;
    } catch (error) {
        console.log(error)
        return false;
    }
}

const byParticipan = async(user_id)=>{
    const db = server.pool;
    const getParticipan = `SELECT * FROM participan WHERE user_id = ?`;
    const getExams = `SELECT * From exams WHERE id = ?`
    try {
        const [participan] = await db.execute(getParticipan, [user_id]);
        const exams = await Promise.all(participan.map(async (prt)=>{
            const [withExams] = await db.execute(getExams, [prt.id]);
            return withExams;
        }))
        return exams;
    } catch (error) {
        console.log(error)
        return false;
    }
}

const getParticipant = async (examId) => {
    const db = server.pool;
    const getParticipantQuery = `SELECT * FROM participants WHERE exam_id = ?`;
    const getUsersQuery = `SELECT * FROM users WHERE id IN (?)`;

    try {
        const [participant] = await db.execute(getParticipantQuery, [examId]);

        if (participant.length === 0) {
            return { participants: [], users: [] };
        }

        const usersId = participant.map(prt => prt.user_id);
        const [users] = await db.query(getUsersQuery, [usersId]);

        return {
            participants: participant,
            users: users
        };
    } catch (error) {
        console.log(error);
        return false;
    }
};

const examGet = async(check)=>{
    const db = server.pool;
    const getDraft = `SELECT * FROM exams WHERE started_at IS NULL AND ended_at IS NULL AND scheduled_at IS NULL ORDER BY updated_at ASC`;
    const getUp = `SELECT * FROM exams WHERE scheduled_at IS NOT NULL AND started_at IS NULL AND ended_at IS NULL order BY created_at ASC`;
    const getNow = `SELECT * FROM exams WHERE started_at IS NOT NULL AND ended_at IS NULL order BY updated_at ASC`;
    const getEnd = `SELECT * FROM exams WHERE started_at IS NOT NULL AND ended_at IS NOT NULL order BY updated_at ASC`;
    const sqlPackage = `SELECT * FROM packages WHERE id = ?`;
    let exams;
    try {
        if(check == 'up'){
            const [up] = await db.query(getUp);
            exams = up;
        }else if(check == 'now'){
            const [now] = await db.query(getNow);
            exams = now;
        }else if(check == 'draft'){
            const [draft] = await db.query(getDraft);
            exams = draft;
        }else{
            const [end] = await db.query(getEnd);
            exams = end;
        }

        const withPackage = await Promise.all(
            exams.map(async (exam) => {
                const [data] = await db.execute(sqlPackage, [exam.package_id]);
                return { exams : exam, package: data[0] };
            })
        );

        return withPackage.flat();
    } catch (error) {
        console.log(error)
        return false;
    }

}

const edit = async(exams) =>{
    const db = server.pool;
    const sql = `UPDATE exams SET package_id = ?, name = ?, started_at = ?, scheduled_at = ?, ended_at = ?, is_anytime = ?, is_multi_attempt = ?, duration = ?, updated_at = NOW() WHERE id = ?`;
    try {
        await db.execute(sql, [exams.package_id, exams.name, exams.started_at, exams.scheduled_at, exams.ended_at, exams.is_anytime, exams.is_multi_attempt, exams.duration, exams.id]);
        return true;
    } catch (error) {
        console.log(error)
        return false;
    }
}

const byId = async(id)=>{
    const db = server.pool;
    const sql = `SELECT FROM exams WHERE id = ?`;
    try {
        const respone = await db.execute(sql, [id]);
        return respone;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const del = async(id)=>{
    const db = server.pool;
    const sql = `DELETE FROM exams WHERE id = ?`;
    try {
        await db.execute(sql, [id]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const getAll = async () => {
    const db = server.pool;
    const sql = `SELECT * FROM exams ORDER BY created_at ASC;`;
    const sqlPackage = `SELECT * FROM packages WHERE id = ?`;
    try {
        const [response] = await db.execute(sql);
        const withPackage = await Promise.all(
            response.map(async (exam) => {
                const [data] = await db.execute(sqlPackage, [exam.package_id]);
                return { exams : exam, package: data[0] };
            })
        );
        return withPackage;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const startExam = async(examsId)=>{
    const db = server.pool;
    const sql = `UPDATE exams SET started_at = NOW() WHERE id = ?`;
    try {
        await db.query(sql , [examsId]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const publishExam = async(examsId)=>{
    const respone = await publish(examsId);
    if(respone != false){
        const inserItemAnswers = await bulkItemAns(examsId);
        return inserItemAnswers;
    }else{
        return false;
    }
}
module.exports = {add, byParticipan, byId, del, edit, getAll, examGet, startExam, publishExam, getParticipant};
