const server = require('../serverDB');
const crypto = require('crypto')

const addOrUpdate = async(listParticipant)=>{
    const db = server.pool;
    const deleteParticipant = `DELETE FROM participants WHERE exam_id = ?`;
    const addParticipant = `INSERT INTO participants (id, user_id, exam_id, status) VALUES ?`;

    try {
        await db.query(deleteParticipant, [listParticipant[0].exam_id]);
        const newParticipant = listParticipant.map((prt)=>[
            crypto.randomUUID(),
            prt.user_id,
            prt.exam_id,
            'ready'
        ]);
        await db.query(addParticipant, [newParticipant]);
        const addParticipantSection = await addSection(listParticipant[0].exam_id)
        return addParticipantSection;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const addSection = async(examId)=>{
    const db = server.pool;
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
        // console.log(parent);
        return true;
    } catch (e) {
        console.error(e);
        return false
    }
}

addSection("1d0fb4d6-eda2-4460-9e74-2180c76a0efe")

module.exports = {addOrUpdate}
