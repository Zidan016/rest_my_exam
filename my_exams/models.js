const server = require('../serverDB');
const crypto = require('crypto')


const getExams = async(id, status)=>{
    const db = server.pool;
    const getParticipant = `SELECT * FROM participants WHERE user_id = ?`;
    const getExamsUp = `SELECT * FROM exams WHERE id = ? AND started_at IS NULL AND ended_at IS NULL order BY scheduled_At DESC`; 
    const getExamsNow = `SELECT * FROM exams WHERE id = ? AND started_at IS NOT NULL AND ended_at IS NULL order BY started_at DESC`;
    const getExamsEnd = `SELECT * FROM exams WHERE id = ? AND started_at IS NOT NULL AND ended_at IS NOT NULL order BY ended_at DESC`;
    try {
        
        const [participant] = await db.query(getParticipant, [id]);
        // console.log(participant);
        let exams;
        if(status === 'up'){
            const up = await Promise.all(participant.map(async(prt)=>{
                const [data] = await db.query(getExamsUp, [prt.exam_id]);
                return data;
            }));
            exams = up.flat();
        } else if(status === 'now'){
            const now = await Promise.all(participant.map(async(prt)=>{
                const [data] = await db.query(getExamsNow, [prt.exam_id]);
                return data;
            }));
            exams = now.flat();
        } else {
            const end = await Promise.all(participant.map(async(prt)=>{
                const [data] = await db.query(getExamsEnd, [prt.exam_id]);
                return data;
            }));
            exams = end.flat();
        }
        console.log(exams);
        return exams.length > 0 ? exams : [];
    } catch (error) {
        console.log(error);
        return false;
    }
}

const getSection = async(examId, userId)=>{
    const db = server.pool;
    const getParticipan = `SELECT * FROM participants WHERE exam_id = ? AND user_id = ?`;
    const getSection = `SELECT * FROM participant_sections WHERE participant_id = ?`;
    try {
        const [participan] = await db.query(getParticipan, [examId, userId]);
        const [section] = await db.query(getSection, [participan[0].id]);
        console.log(participan)
        return section
    } catch (error) {
        console.log(error);
        return false;
    }
}

const getItemAnswer = async(sectionId)=>{
    const db = server.pool;
    const getItem = `SELECT * FROM participant_section_items WHERE section_id = ? ORDER BY \`order\` ASC`;
    const getAnswer = `SELECT * FROM participant_section_item_answers WHERE participant_section_item_id = ? order BY \`order\` ASC`;
    const getAttachable = `SELECT * FROM attachable WHERE attachable_uuid = ?`;
    const getAttempts = `SELECT * FROM participant_section_item_attempts WHERE participant_section_item_id = ?`;
    const getAttachment = `SELECT * FROM attachments WHERE id = ?`;
    try {
        const [items] = await db.query(getItem, [sectionId]);
        // console.log(JSON.stringify(items, null, 2));
        const withAnswerAndAttachment = await Promise.all(items.map(async(itm)=>{
            const [data] = await db.query(getAnswer, [itm.id]);
            const [attempts] = await db.query(getAttempts, [itm.id]);
            const [attachable] = await db.query(getAttachable, [itm.id]);
            const attachment = await Promise.all(attachable.map(async(att)=>{
                const [attch] = await db.query(getAttachment, [att.attachment_id]);
                return attch[0];
            }));

            return {
                items : itm,
                answer : data,
                attempts : attempts,
                attachment : attachment
            }
        }));
        const mapAnswer = withAnswerAndAttachment.flat().map((itm) => ({
            items: itm.items,
            answer: itm.answer,
            attempts: itm.attempts,
            attachment: itm.attachment
        }));
        console.log(JSON.stringify(mapAnswer, null, 2));
        return mapAnswer;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const doExams = async(item_id, attempt, prtSection)=>{
    const db = server.pool;
    const getAttempt = `SELECT * FROM participant_section_item_attempts WHERE participant_section_item_id = ?`;
    const updateAttempt = `UPDATE participant_section_item_attempts SET attempt_number = ?, answer = ?, score = ?, is_correct = ?, updated_at = NOW() WHERE id = ?`;
    const addAttempt = `INSERT INTO participant_section_item_attempts (id, participant_section_item_id, attempt_number, answer, score, is_correct, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const updateSection = `UPDATE participant_sections SET last_attempted_at = NOW(), remaining_time = ?, score = ?, updated_at = NOW() WHERE id = ?`;
    try {
        const [attempts] = await db.query(getAttempt, [item_id]);
        if (attempts.length > 0) {
            const updatedFormat = [
            1, 
            attempt.answer, 
            attempt.score, 
            attempt.is_correct, 
            attempts[0].id
            ];
            await db.query(updateAttempt, updatedFormat);

        } else {
            const addFormat = [crypto.randomUUID(), item_id, 0, attempt.answer, attempt.score, attempt.is_correct, new Date(), new Date()];
            await db.query(addAttempt, addFormat);
        }
        await db.query(updateSection, [prtSection.remaining_time, prtSection.score, prtSection.id]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const setLogs = async(prtLogs, is_end, is_start)=>{
    const db = server.pool;
    const addLogs = `INSERT INTO participant_logs (participant_id, content, tags, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`;
    const updateParticipant = `UPDATE participants SET status = ? WHERE id =?`
    try {
        if(is_end === 1 || is_end == true){
            await db.query(updateParticipant, ["finished", prtLogs.participant_id]);
        }else if(is_start === 1 || is_start == true){
            await db.query(updateParticipant, ["active", prtLogs.participant_id]);
        }else if(is_start === 2 || is_end === 2){
            await db.query(updateParticipant, ["ready", prtLogs.participant_id]);
        }
        const map = [
            prtLogs.participant_id,
            prtLogs.content,
            prtLogs.tags ? JSON.stringify(prtLogs.tags) : null,
        ];
        await db.query(addLogs, map);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const endSection = async(section)=>{
    const db = server.pool;
    const editSection = `UPDATE participant_sections SET ended_at = NOW(), score = ? WHERE id = ?`;
    const getPackage = `SELECT * FROM packages WHERE id = ?`;
    const getExams = `SELECT * FROM exams WHERE id = ?`;
    const getParticipant = `SELECT * FROM participants WHERE id = ?`;
    const getItems = `SELECT * FROM participant_section_items WHERE tags IS NULL AND section_id = ?`;
    const getAttempts = `SELECT * FROM participant_section_item_attempts WHERE is_correct = 1 AND participant_section_item_id IN (?)`;
    const updateParticipants = `UPDATE participants SET status = ? WHERE id = ?`
    try {
        console.log(section)
        const [[participant]] = await db.execute(getParticipant, [section.participant_id]);
        const [[exams]] = await db.execute(getExams, [participant.exam_id]);
        const [[package]] = await db.execute(getPackage, [exams.package_id]);
        const [items] = await db.execute(getItems, [section.id]);
        const itemsId = items.map(it=> it.id);
        const [attempt] = await db.query(getAttempts, [itemsId]);
        const raw = attempt.length;
        const totalSoal = items.length;
        let score;
        if(package.is_toefl == 1){
            score = examScoreToefl(raw, totalSoal)
        }else{
            score = examSocreBasic(raw, totalSoal)
        }
        // console.log(`TOTAL SOAL : ${totalSoal}`);
        // console.log(`TOTAL BENAR : ${raw}`);
        // console.log(`TOTAL SCORE : ${score}`);
        await db.execute(editSection, [score, section.id]);
        await db.execute(updateParticipants, ["finished", section.participant_id]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const fixScore = async(section)=>{
    const db = server.pool;
    const getPackage = `SELECT * FROM packages WHERE id = ?`;
    const getExams = `SELECT * FROM exams WHERE id = ?`;
    const getParticipant = `SELECT * FROM participants WHERE id = ?`;
    const getItems = `SELECT * FROM participant_section_items WHERE tags IS NULL AND section_id = ?`;
    const getAttempts = `SELECT * FROM participant_section_item_attempts WHERE is_correct = 1 AND participant_section_item_id IN (?)`;
    const updateParticipants = `UPDATE participants SET status = ? WHERE id = ?`
    try {
        console.log(section)
        const [[participant]] = await db.execute(getParticipant, [section.participant_id]);
        const [[exams]] = await db.execute(getExams, [participant.exam_id]);
        const [[package]] = await db.execute(getPackage, [exams.package_id]);
        const [items] = await db.execute(getItems, [section.id]);
        const itemsId = items.map(it=> it.id);
        const [attempt] = await db.query(getAttempts, [itemsId]);
        const raw = attempt.length;
        const totalSoal = items.length;
        let score;
        if(package.is_toefl == 1){
            score = examScoreToefl(raw, totalSoal)
        }else{
            score = examSocreBasic(raw, totalSoal)
        }
        // console.log(`TOTAL SOAL : ${totalSoal}`);
        // console.log(`TOTAL BENAR : ${raw}`);
        // console.log(`TOTAL SCORE : ${score}`);
        await db.execute(updateParticipants, ["finished", section.participant_id]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const examScoreToefl = (raw, totalSoal)=>{
    const min = 31;
    const max = 68;
    const range = max - min;
    const scaled = (raw/totalSoal) * range + min
    return Math.round(scaled);
}

const examSocreBasic = (raw, totalSoal)=>{
    return Math.round((100 / totalSoal) * raw);
}

const listeningSection = async(prtId)=>{
    const db = server.pool;
    const getSection = `SELECT * FROM participant_sections WHERE participant_id = ?`;
    try {
        const [respone] = await db.execute(getSection, [prtId]);
        return respone;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = {getExams, getSection, getItemAnswer, doExams, setLogs, endSection, listeningSection, fixScore}