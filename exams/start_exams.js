const server = require('../serverDB');
const crypto = require('crypto')

const checkSection = async(sectionId)=>{
    const db= server.pool;
    const getSection = `SELECT * FROM participant_sections WHERE id = ?`;
    const getParticipant = `SELECT * FROM participants WHERE id = ?`;
    const exams = `SELECT * FROM exams WHERE id = ?`;
    const getPackage = `SELECT * FROM packages WHERE id = ?`;
    try {
        const [section] = await db.query(getSection, [sectionId]);
        // console.log(sectionId);
        const [participant] = await db.query(getParticipant, [section[0].participant_id]);
        const [exam] = await db.query(exams, [participant[0].exam_id]);
        const [package] = await db.query(getPackage, [exam[0].package_id]);
        const getItem = await items(package, section);
        return getItem;
    } catch (error) {
        console.error(error);
        return false;
    }
}

const items = async(package, section)=>{
    const db= server.pool;
    const getParent = `SELECT * FROM packages WHERE parent_id = ? AND config = ?`;
    try {
        const [parent] = await db.query(getParent, [package[0].id, section[0].config]);
        // console.log(package)
        const sectionItems = await setItems(parent, section, package);
        // console.log(sectionItems);
        return sectionItems;
    } catch (error) {
        console.error(error);
        return false;
    }
}

const setItems = async(parent, section, package)=>{
    const db = server.pool;
    const getPackageItems = `SELECT * FROM package_item WHERE package_id = ?`;
    const getParentPackage = `SELECT * FROM packages WHERE parent_id =?`;
    const items = `SELECT * FROM items WHERE id = ?`;
    const getParent = `SELECT * FROM items WHERE parent_id = ?`;

    if(parent.length > 1){
        const [parentPackage] = await db.query(getParentPackage, [parent[0].id]);
        const packageItems = await Promise.all(parentPackage.map(async (pkg) => {
            const [item] = await db.query(getPackageItems, [pkg.id]);
            if (pkg.random_item === 1) {
                const shuffledItems = shuffle(item);
                const selectedItems = shuffledItems.slice(0, pkg.item_count);
                return item.filter(it => it.type === 'intro').concat(shuffledItems.filter(it => it.type !== 'intro'))
                    .map(it => ({ ...it, config: pkg.config, item_duration: pkg.item_duration }));
            }
            return item.map(it => ({ ...it, config: pkg.config }));
        }));
        

        const item = await Promise.all(packageItems.flat().map(async (itm) => {
            const [itemData] = await db.query(items, [itm.item_id]);
            const itemDataWithConfig = itemData.map(data => ({ ...data, config: itm.config }));
        
            const parent = await Promise.all(itemDataWithConfig.map(async (prt) => {
                const [parentData] = await db.query(getParent, [prt.id]);
                return parentData.map(p => ({ ...p, config: itm.config }));
            }));
        
            return { main: itemDataWithConfig, parent : parent.flat() };
        }));

        let labelCounter = 1;

        const flatListeningItems = item.flatMap(({ main, parent }) => {
            let labeledItems = [];

            if (main[0]?.code?.startsWith("INTRODUCTION")) {
                labeledItems = main.map(itm => ({
                    ...itm,
                    label: itm.code,
                    tags: '["intro"]',
                    remaining_time: section[0].item_duration === 1 ? 12 : 0
                }));
            } else if (parent.length > 0) {
                const labeledMain = main.map(itm => ({
                    ...itm,
                    label: "#",
                    tags: '["passage"]',
                    remaining_time: section[0].item_duration === 1 ? 12 : 0
                }));

                const labeledParent = parent.map(itm => ({
                    ...itm,
                    label: labelCounter++,
                    tags: null,
                    remaining_time: section[0].item_duration === 1 ? 12 : 0
                }));

                labeledItems = [...labeledMain, ...labeledParent];
            } else {
                labeledItems = main.map(itm => ({
                    ...itm,
                    label: labelCounter++,
                    tags: null,
                    remaining_time: section[0].item_duration === 1 ? 12 : 0
                }));
            }

            return labeledItems;
        });

        const joined = flatListeningItems.map((item, index) => [
            crypto.randomUUID(),
            section[0].id,
            item.id,
            item.config,
            item.type,
            item.label,
            item.content,
            item.sub_content,
            item.remaining_time,
            index + 1,
            item.tags,
            item.config,
            new Date(),
            new Date(),
        ]);

        // console.log(JSON.stringify(joined.flat(), null, 2));
        // console.log(JSON.stringify(joined.length))

        return joined;
    }
    else {
        const checkPackage = parent.length === 0 ? package : parent;
        const [firstPackage] = checkPackage;
        // console.log(JSON.stringify(firstPackage, null, 2))
        const [packageItems] = await db.query(getPackageItems, [firstPackage.id]);

        let newPackageItems;
        if (firstPackage.random_item === 1) {
            const shuffledItems = shuffle(packageItems);
            newPackageItems = packageItems
                .filter(it => it.type === 'intro')
                .concat(shuffledItems.filter(it => it.type !== 'intro'))
                .map(it => ({ ...it, config: firstPackage.config, random_item: firstPackage.random_item }));
        } else {
            newPackageItems = packageItems.map(it => ({ ...it, config: firstPackage.config, random_item: firstPackage.random_item }));
        }

        const item = await Promise.all(newPackageItems.map(async(itm)=>{
            const [itemData] = await db.query(items, [itm.item_id]);
            const itemDataWithConfig = itemData.map(data => ({ ...data, config: itm.config, random_item: itm.random_item }));
        
            const parent = await Promise.all(itemDataWithConfig.map(async (prt) => {
                const [parentData] = await db.query(getParent, [prt.id]);
                if(prt.random_item === 1){
                    const shuffled = shuffle(parentData);
                    return shuffled.map(p => ({ ...p, config: itm.config }));
                }
                return parentData.map(p => ({ ...p, config: itm.config }));
            }));
        
            return { main: itemDataWithConfig, parent : parent.flat() };
        }))
        // console.log(JSON.stringify(item.flat(), null, 2))
        
        let labelCounter = 1;
        let orderCounter = 1;

        const formattedItems = item.map((itm) => {
            const result = [];
            const main = itm.main[0];
            const isIntro = main.code.startsWith("INTRODUCTION");

            if (isIntro) {
            result.push({
                id: crypto.randomUUID(),
                section_id: section[0].id,
                config: main.config,
                item_id: main.id,
                content: main.content,
                sub_content: null,
                label: main.code,
                type: main.type,
                config: main.config,
                order: orderCounter++,
                created_at: new Date(),
                updated_at: new Date()
            });
            } else if (itm.parent.length > 0) {
            itm.parent.forEach((prt) => {
                result.push({
                id: crypto.randomUUID(),
                section_id: section[0].id,
                item_id: prt.id,
                content: main.content,
                sub_content: prt.content,
                label: labelCounter++,
                type: prt.type,
                config: prt.config,
                order: orderCounter++,
                created_at: new Date(),
                updated_at: new Date()
                });
            });
            }

            return result;
        }).flat();

        const formatAdd = formattedItems.map(itm =>
            [
                itm.id,
                itm.section_id,
                itm.item_id,
                itm.config,
                itm.type,
                itm.label, 
                itm.content,
                itm.sub_content,
                0,
                itm.order,
                null,
                itm.created_at,
                itm.updated_at
            ]
        );
        // console.log(JSON.stringify(formatAdd, null, 2))

        return formatAdd;
    }
}

const bulkItems = async (examsId)=>{
    const db = server.pool;
    const getParticpants = `SELECT * FROM participants WHERE exam_id = ?`;
    const getSection = `SELECT * FROM participant_sections WHERE participant_id = ?`;
    const update = `UPDATE exams SET scheduled_at = NOW() WHERE id = ?`;
    const insertSection = `INSERT INTO participant_section_items (id, section_id, item_id, config, type, label, content, sub_content, remaining_time, \`order\`, tags, created_at, updated_at) VALUES ?`;
    try {
        const [participants] = await db.query(getParticpants, [examsId]);
        // console.log(participants);
        const section = await Promise.all(participants.map(async (prt)=>{
            const [data] = await db.query(getSection, [prt.id]);
            return data
        }));

        const items = await Promise.all(section.flat().map(async (sct) => {
            const data = await checkSection(sct.id);
            return data;
        }));
        
        const insert = items.flat();
        // console.log(JSON.stringify(insert, null, 2));
        await db.query(insertSection, [insert])
        await db.query(update, [examsId]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}


// bulkItems('fdd2f9ac-65cb-4841-8400-bdef5b0d2027');

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

module.exports = bulkItems;
  