const server = require('../serverDB');
const pLimit = require('p-limit')
const crypto = require('crypto')

const publish = async(data, examId)=>{
    const db = server.pool;
    const insert = `INSERT INTO participant_section_items (id, section_id, item_id, config, type, label, content, sub_content, remaining_time, \`order\`, tags, created_at, updated_at) VALUES ?`;
    const updateExam = `UPDATE exams set scheduled_at = NOW() WHERE id = ?`;
    try {
        const format = data.map(dta=>[
            dta.id, dta.section_id, dta.item_id, dta.config, dta.type, dta.label, dta.content, dta.sub_content || null, dta.remaining_time, dta.order, dta.tags || null, dta.created_at, dta.updated_at
        ]);
        await db.query(insert, [format]);
        await db.query(updateExam, [examId]);
        console.log(format);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const getItems = async (examId) => {
    const db = server.pool;
    const getExams = `SELECT * FROM exams WHERE id = ?`;
    const getParticipants = `SELECT * FROM participants WHERE exam_id = ?`;
    const getSections = `SELECT * FROM participant_sections WHERE participant_id IN (?)`;
    const getPackages = `SELECT * FROM packages WHERE parent_id = ? ORDER BY created_at ASC`;

    const limit = pLimit(5);

    try {
        const [[exam]] = await db.query(getExams, [examId]);
        const [participants] = await db.query(getParticipants, [exam.id]);
        const participantIds = participants.map(p => p.id);
        const [sections] = await db.query(getSections, [participantIds]);
        const [packages] = await db.query(getPackages, [exam.package_id]);

        const getItemsPromises = sections.map(async (sct) => {
            const matched = packages.find(pkg => pkg.config === sct.config);
            if (!matched) return [];

            const [thirdPackage] = await db.query(getPackages, [matched.id]);

            let items = [];
            let order = 0;
            let label = 1;

            if (thirdPackage.length > 0) {
                for (const paket of thirdPackage) {
                    const { items: res, nextOrder, nextLabel } = await setItems(paket, sct, order, label);
                    items.push(...res);
                    order = nextOrder;
                    label = nextLabel;
                }
            } else {
                const { items: res, nextOrder, nextLabel } = await setItems(matched, sct, order, label);
                items.push(...res);
                order = nextOrder;
                label = nextLabel;
            }

            return items;
        });

        const items = (await Promise.all(getItemsPromises)).flat();

        // console.log(items);
        const insert = publish(items, examId)
        return insert;
    } catch (error) {
        console.error(error);
        return false;
    }
};

const setItems = async (pkg, section, order, label) => {
    const db = server.pool;
    const getPackageItems = `SELECT * FROM package_item WHERE package_id = ?`;
    const getItems = `SELECT * FROM items WHERE id IN (?) ORDER BY \`order\``;
    const getParent = `SELECT * FROM items WHERE parent_id IN (?) ORDER BY \`order\`, created_at ASC`;

    try {
        let newItems = [];

        const [packageItem] = await db.query(getPackageItems, [pkg.id]);
        const itemsIds = packageItem.map(pkg => pkg.item_id);

        if (itemsIds.length === 0) {
            return { items: [], nextOrder: order, nextLabel: label };
        }

        const [items] = await db.query(getItems, [itemsIds]);

        const itemTypes = items.map(itm => {
            const typesQuestion = packageItem.find(pkg => pkg.item_id === itm.id);
            return {
                types: typesQuestion.type,
                ...itm
            };
        });

        const shuffled = shuffle(itemTypes);
        const filterShuffled = itemTypes.filter(it => it.types === 'intro').concat(shuffled.filter(it => it.types !== 'intro'));
        newItems = pkg.random_item === 1 ? filterShuffled : itemTypes;

        const newItemsIds = newItems.map(itm => itm.id);
        const [parent] = await db.query(getParent, [newItemsIds]);
        const newParent = pkg.random_item === 1 ? shuffle(parent) : parent;

        const joined = newItems.map(itm => {
            const setParent = newParent.filter(prt => prt.parent_id === itm.id);
            return {
                main: itm,
                parent: setParent
            };
        });

        const formated = joined.flatMap((itm) => {
            const result = [];

            if (itm.main.types === 'intro') {
                result.push({
                    id: crypto.randomUUID(),
                    section_id: section.id,
                    config: pkg.config,
                    item_id: itm.main.id,
                    content: itm.main.content,
                    sub_content: null,
                    label: 'INTRODUCTION',
                    type: 'multi_choice_single',
                    remaining_time: pkg.item_duration === 1 ? 12 : 0,
                    tags: '["intro"]',
                    order: order++,
                    created_at: new Date(),
                    updated_at: new Date()
                });
            } else if (itm.parent.length > 0) {
                itm.parent.forEach((prt) => {
                    result.push({
                        id: crypto.randomUUID(),
                        section_id: section.id,
                        config: pkg.config,
                        item_id: prt.id,
                        content: itm.main.content,
                        sub_content: prt.content,
                        label: label++,
                        type: 'multi_choice_single',
                        order: order++,
                        tags: null,
                        remaining_time: pkg.item_duration === 1 ? 12 : 0,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                });
            } else {
                result.push({
                    id: crypto.randomUUID(),
                    section_id: section.id,
                    config: pkg.config,
                    item_id: itm.main.id,
                    content: itm.main.content,
                    sub_content: null,
                    label: label++,
                    type: 'multi_choice_single',
                    order: order++,
                    tags: null,
                    remaining_time: pkg.item_duration === 1 ? 12 : 0,
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }

            return result;
        });

        return {
            items: formated,
            nextOrder: order,
            nextLabel: label
        };

    } catch (error) {
        console.log(error);
        return {
            items: [],
            nextOrder: order,
            nextLabel: label
        };
    }
};


// getItems('750baf50-e178-4803-8543-34d8f5b67d38');


function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

module.exports = getItems;