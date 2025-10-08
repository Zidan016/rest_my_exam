const server = require('../serverDB');
const crypto = require('crypto')

const addItemCore = async (examsId) =>{
    const db = server.pool;
    const getParticipant = `SELECT * FROM participants WHERE exam_id = ?`
    const getSection = `SELECT * FROM participant_sections WHERE participant_id = ?`
    const getSectionItems = `SELECT * FROM participant_section_items WHERE section_id IN (?)`;
    const inserItemAnswers = `INSERT INTO participant_section_item_answers (id, participant_section_item_id, content, correct_answer, \`order\`, created_at, updated_at, is_encrypted, encryption_id) VALUES ?`;
    const insertAttachable = `INSERT INTO attachable (id, attachment_id, attachable_type, attachable_uuid, attachable_id, \`order\`) VALUES ?`
    try {
        const [participant] = await db.query(getParticipant, [examsId]);
        const section = [].concat(...(await Promise.all(participant.map(async(prt)=>{
            const [data] = await db.query(getSection, [prt.id]);
            return data;
        }))));
        const sectionId = section.map(sct=> sct.id);
        if (!sectionId.length) {
            console.warn("⚠️ Tidak ada section_id ditemukan untuk exam_id:", examsId);
            return false;
        }
        const [sectionItems] = await db.query(getSectionItems, [sectionId]);
        const itemAns = await itemsAnswer(sectionItems)
        const att = await attachments(sectionItems);
        console.log(att)
        if (itemAns != null) {
            await db.query(inserItemAnswers, [itemAns]);
            if (att != null && att.length > 0) {
                await db.query(insertAttachable, [att]);
            }
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        return false;
    }
}

const itemsAnswer = async (section)=>{
    const db = server.pool;
    const getAnswer = `SELECT * FROM item_answers WHERE item_id IN (?) ORDER BY \`order\` ASC`;
    const getItems = `SELECT * FROM items WHERE id IN (?)`;
    try {
        const itemsId = section.map(sct=> sct.item_id);
        const [items] = await db.query(getItems, [itemsId]);
        const [answers] = await db.query(getAnswer, [itemsId]);
        const newAnswers = items.map(itm => {
            const relatedAnswers = answers.filter(answ => answ.item_id == itm.id);
            const shuffledAnswer = itm.answer_order_random === 1 ? shuffle(relatedAnswers) : relatedAnswers;
            return { item_id: itm.id, answers: shuffledAnswer };
        });        
        
        const joined = section.flatMap(sct => {
            const related = newAnswers.find(a => a.item_id === sct.item_id);
            if (!related) return [];
            return related.answers.map((answ, i) => [
                crypto.randomUUID(),
                sct.id,
                answ.content,
                answ.correct_answer,
                i,
                new Date(),
                new Date(),
                0,
                null
            ]);
        });
        
        return joined;
    } catch (error) {
        console.log(error);
        return null;
    }
}

const attachments = async(sectionItems)=>{
    const db = server.pool;
    const getAttachable = `SELECT * FROM attachable WHERE attachable_uuid IN (?)`;
    try {
        const itemsIds = sectionItems.map(sct=> sct.item_id)
        const [attachable] = await db.query(getAttachable, [itemsIds]);

        const joined = sectionItems.flatMap(sectionItem => {
            const relatedAttachables = attachable.filter(att => att.attachable_uuid == sectionItem.item_id);
            return relatedAttachables.map(att => [
            crypto.randomUUID(),
            att.attachment_id,
            'App\\\\Entities\\\\CBT\\\\Participant\\\\Section\\\\Item',
            sectionItem.id,
            null,
            att.order || 0
            ]);
        });

        return joined;
    } catch (error) {
        console.log(error);
        return null;
    }
}


function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

module.exports = addItemCore;
  