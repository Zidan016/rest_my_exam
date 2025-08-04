const { getExams } = require('../my_exams/models');
const server = require('../serverDB');
const crypto = require('crypto')

const getExamParticipantLogs = async (examId) => {
    const db = server.pool;
    const getParticipant = `SELECT * FROM participants WHERE exam_id = ?`;
    const getLogs = `SELECT * FROM participant_logs WHERE participant_id = ? ORDER BY created_at DESC LIMIT 1`;
    const getUser = `SELECT * FROM users WHERE id = ?`;
    try {
        const [participants] = await db.query(getParticipant, [examId]);
        const logsAndUsers = (await Promise.all(participants.map(async (prt) => {
            const [logs] = await db.query(getLogs, [prt.id]);
            const [user] = await db.query(getUser, [prt.user_id]);
            return {
                prt: prt,
                logs: logs[0], 
                user: user[0]
            };
        }))).flat();
        // console.log(logsAndUsers);
        return logsAndUsers;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const getDashboard = async () =>{
    const db = server.pool;
    const getExams = `SELECT * FROM exams WHERE started_at IS NOT NULL AND ended_at IS NULL`;
    const getParticipant = `SELECT * FROM participants`;
    try {
        const [exams] = await db.query(getExams);
        const [participants] = await db.query(getParticipant);
        return {
            exams : exams,
            participants : participants
        }
    } catch (error) {
        console.log(error);
        return false;
    }
}

const getExamsId = async (prtId)=>{
    const db = server.pool;
    const getExams = `SELECT * FROM participants WHERE id = ?`;
    try {
        const [[prt]] = await db.query(getExams, [prtId]);
        return prt;
    } catch (error) {
        console.log(error);
        return false;
    }
}

// getExamParticipantLogs('9b8d88a4-d48e-441c-8fd3-219dacafb4b0')

const getLogs = async(id)=>{
    const db = server.pool;
    const getLogs = `SELECT * FROM participant_logs WHERE participant_id = ?`;
    // const getParticipant = `SELECT * FROM participants WHERE id = ?`;
    try {
        const [logs] = await db.query(getLogs, [id]);
        // const [participants] = await db.query(getParticipant, [id]);
        // return {
        //     log : logs,
        //     participant : participants
        // };
        return logs;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const disOrQual = async(prtId, status)=>{
    const db = server.pool;
    const updateStatus = `INSERT INTO participant_logs (participant_id, content, tags, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`;
    const updateSection = `UPDATE participant_sections SET ended_at = ? WHERE participant_id = ?`;
    const updatedParticipant = `UPDATE participants SET status = ? WHERE id = ?`;
    try {
        if(status === 'dis'){
            await db.execute(updateStatus, [prtId, 'disqualified', '["disqualified"]']);
            await db.execute(updateSection, [new Date(), prtId]);
            await db.execute(updatedParticipant, ['finished', prtId]);
        }else{
            await db.execute(updateStatus, [prtId, 'qualified', '["qualified"]']);
            await db.execute(updateSection, [null, prtId]);
            await db.execute(updatedParticipant, ['finished', prtId]);
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const getLogsById = async(id)=>{
    const db = server.pool;
    const getLogs = `SELECT * FROM participant_logs WHERE participant_id = ?`;
    try {
        const [logs] = await db.query(getLogs, [id]);
        return logs;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const endExams = async(examId)=>{
    const db = server.pool;
    const updateExams = `UPDATE exams SET ended_at = NOW() WHERE id = ?`;
    const getParticipant = `SELECT * FROM participants WHERE exam_id = ?`;
    const updateSections = `UPDATE participant_sections SET ended_at = NOW() WHERE participant_id = ?`;
    const deleteLogs =`DELETE FROM participant_logs WHERE participant_id IN(?)`;
    try {
        const [participants] = await db.query(getParticipant, [examId]);

        await Promise.all(participants.map(async(prt)=>{
            await db.execute(updateSections, [prt.id]);
        }));
        const participantsIds = participants.map(it=> it.id);
        await db.execute(updateExams, [examId]);
        await db.query(deleteLogs, [participantsIds]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}
const getExamsById = async(id)=>{
    const db = server.pool;
    const getExams = `SELECT * FROM exams WHERE id = ?`;
    try {
        const [exams] = await db.query(getExams, [id]);
        return exams[0];
    } catch (error) {
        console.log(error);
        return false;
    }
}

const getSection = async(sectionId)=>{
    const db = server.pool;
    const getSection = `SELECT * FROM participant_sections WHERE participant_id = ?`;
    try {
        const [section] = await db.query(getSection, [sectionId]);
        return section;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const updateLogs = async(logs)=>{
    const db = server.pool;
    const updateLogs = `INSERT INTO participant_logs (id, participant_id, content, tags, created_at, updated_at) VALUES ?`;
    try {
        await db.query(updateLogs, [new Date(), logs.id, logs.content, logs.tags, new Date(), new Date()]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = {
    getExamParticipantLogs,
    getLogs,
    disOrQual,
    getLogsById,
    endExams,
    getSection,
    updateLogs,
    getExamsById,
    getDashboard,
    getExamsId
}
