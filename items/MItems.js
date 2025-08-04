const server = require('../serverDB');
const crypto = require('crypto')

const byPackage = async (package_id) => {
    const db = server.pool;

    const getJoinItem = `
        SELECT i.*
        FROM package_item pi
        JOIN items i ON pi.item_id = i.id
        WHERE pi.package_id = ?
        ORDER BY i.order ASC;
    `;

    const getJoinAnswer = `SELECT * FROM item_answers WHERE item_id IN (?) ORDER BY \`order\` ASC`;
    const getAttachable = `SELECT * FROM attachable WHERE attachable_uuid IN (?) ORDER BY \`order\` ASC`;
    const getAttachments = `SELECT * FROM attachments WHERE id IN (?)`;

    try {
        const [items] = await db.execute(getJoinItem, [package_id]);
        if (!items || items.length === 0) {
            return [];
        }

        const itemIds = items.map(itm => itm.id);
        const [itemAnswer] = await db.query(getJoinAnswer, [itemIds]);

        const [attachable] = await db.query(getAttachable, [itemIds]);
        const attachmentIds = attachable.map(att => att.attachment_id);

        let attachments = [];
        if (attachmentIds.length > 0) {
            const [result] = await db.query(getAttachments, [attachmentIds]);
            attachments = result;
        }

        const attachmentMap = new Map(attachments.map(att => [att.id, att]));

        const joined = items.map(itm => {
            const answer = itemAnswer.filter(answ => answ.item_id === itm.id);
            const itemAttachments = attachable
                .filter(att => att.attachable_uuid === itm.id)
                .map(att => attachmentMap.get(att.attachment_id))
                .filter(Boolean);
            return {
                item_model: itm,
                answers: answer,
                attachments: itemAttachments,
            };
        });

        console.log(JSON.stringify(joined, null, 2));
        return joined;
    } catch (error) {
        console.error("🔥 Error in byPackage:", error);
        return false;
    }
};

const updateOrder = async (modelTarget, modelMoved, package_id)=>{
    const db = server.pool;
    const updateOrder = `UPDATE items SET \`order\` = ?, updated_at = NOW() WHERE id = ?`;
    try {
        await db.query(updateOrder, [modelMoved.order, modelTarget.id]);
        await db.query(updateOrder, [modelMoved.order+1,modelMoved.id]);
        const updateAll = await updateOrderSequentially(package_id);
        return updateAll;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const updateOrderSequentially = async (packageId) => {
  const db = server.pool;

  const sqlGetPackage = `SELECT * FROM packages WHERE id = ?`;
  const sqlGetPackageItems = `SELECT * FROM package_item WHERE package_id = ?`;
  const sqlUpdateItem = `UPDATE items SET code = ?, \`order\` = ?, duration = ? WHERE id = ?`;

  try {
    const [[pkg]] = await db.execute(sqlGetPackage, [packageId]);
    const [packageItems] = await db.execute(sqlGetPackageItems, [packageId]);
    const itemIds = packageItems.map(it => it.item_id);

    if (itemIds.length === 0) return true;

    const [mainItems] = await db.query(
      `SELECT * FROM items WHERE id IN (${itemIds.map(() => '?').join(',')}) AND parent_id IS NULL ORDER BY \`order\` ASC, created_at ASC`,
      itemIds
    );

    const mainItemIds = mainItems.map(it => it.id);

    const [childItems] = mainItemIds.length > 0
      ? await db.query(
          `SELECT * FROM items WHERE parent_id IN (${mainItemIds.map(() => '?').join(',')}) ORDER BY \`order\` ASC, created_at ASC`,
          mainItemIds
        )
      : [[]];

    const cleanTitle = pkg.title.replace(/\s+/g, '').toLowerCase();
    const duration = pkg.item_duration == 1 ? 12 : 0;

    let order = 0;
    let labelParent = 0;
    const updates = [];

    for (const main of mainItems) {
      const codeMain = `${cleanTitle}-${labelParent}`;
      updates.push({
        id: main.id,
        order: order++,
        code: codeMain,
        duration
      });

      const children = childItems.filter(it => it.parent_id === main.id);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        updates.push({
          id: child.id,
          order: order++,
          code: `${codeMain}-${i}`,
          duration
        });
      }

      labelParent++;
    }

    await Promise.all(
      updates.map(it => db.execute(sqlUpdateItem, [it.code, it.order, it.duration, it.id]))
    );

    return true;
  } catch (error) {
    console.error("Error in updateOrderSequentially:", error);
    return false;
  }
};


const add = async (items) => {
    const db = server.pool;
    const item = `INSERT INTO items (id, parent_id, type, code, content, answer_order_random, duration, item_count, order, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?,?,NOW(),NOW())`
    try {
         await db.execute(item, [crypto.randomUUID(), items.parent_id, items.type, items.code, items.content, items.answer_order_random, items.duration, items/item_count, items.order])
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const addPackageItem = async(package, items)=>{
    const db = server.pool;
    const insertPackageItem = `INSERT INTO package_item (package_id, item_id, socre, \`order\`, type) VALUES (?, ?, ?, ?, ?)`;
    try {
        await db.execute(insertPackageItem, [package.id, items.id, 0, 0, null]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const addItemAnswers = async (items, answers, packageId, status, attachment) => {
    const item_id = crypto.randomUUID();
    const db = server.pool;
    const sqlItem = `INSERT INTO items (id, parent_id, type, code, content, answer_order_random, duration, item_count, \`order\`, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    const sqlPackageItem = `INSERT INTO package_item (package_id, item_id, score, \`order\`, type) VALUES (?, ?, ?, ?, ?)`;
    const sqlAnswer = `INSERT INTO item_answers (id, item_id, \`order\`, correct_answer, content, created_at, updated_at) VALUES ?`;
    const sqlAttachable = `INSERT INTO attachable (id, attachment_id, attachable_type, attachable_uuid, attachable_id, \`order\`) VALUES ?`;
    try {
        await db.execute(sqlItem, [item_id, items.parent_id, items.type, items.code, items.content, items.answer_order_random, items.duration, items.item_count, items.order]);
        if(status == 'main'){
            await db.execute(sqlPackageItem, [packageId, item_id, 0, 0, 'question']);
        }

        if (answers && answers.length > 0) {
            const formatAnswer = answers.map(get => [
                crypto.randomUUID(), 
                item_id, 
                get.order, 
                get.correct_answer, 
                get.content, 
                new Date(), 
                new Date()
            ]);
            await db.query(sqlAnswer, [formatAnswer]);
        }

        const attachmentList = Array.isArray(attachment) ? attachment : [attachment];

        const cleanAttachmentList = attachmentList.filter(a => a && typeof a === 'object' && a.id);

        if (cleanAttachmentList.length > 0) {
            await db.execute(deleteAttachable, [item_id]);
            const formatAnswer = cleanAttachmentList.map((get, index) => [
                crypto.randomUUID(),
                get.id,
                'App\\\Entities\\\Question\\\Package\\\Item',
                item_id,
                null,
                index
            ]);
            await db.query(sqlAttachable, [formatAnswer]);
        }

        await updateOrderSequentially(packageId);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const addItemAnswersParent = async (items, answers, packageId) => {
    const item_id = crypto.randomUUID();
    const db = server.pool;

    const sqlItem = `INSERT INTO items (id, parent_id, type, code, content, answer_order_random, duration, item_count, \`order\`, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    const sqlAnswer = `INSERT INTO item_answers (id, item_id, \`order\`, correct_answer, content, created_at, updated_at) VALUES ?`;

    try {
        await db.execute(sqlItem, [item_id, items.parent_id, items.type, items.code, items.content, items.answer_order_random, items.duration, items.item_count, items.order]);

        if (answers && answers.length > 0) {
            const formatAnswer = answers.map(get => [
                crypto.randomUUID(), 
                item_id, 
                get.order, 
                get.correct_answer, 
                get.content, 
                new Date(), 
                new Date()
            ]);
            await db.query(sqlAnswer, [formatAnswer]);
        }
        await updateOrderSequentially(packageId);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const byParent = async (itemId) => {
    const db = server.pool;
    const getItem = `SELECT * FROM items WHERE parent_id = ? ORDER BY \`order\` ASC`;
    const getAnswer = `SELECT * FROM item_answers WHERE item_id IN (?) ORDER BY \`order\` ASC`;
    try {
        const [data] = await db.execute(getItem, [itemId]);
        const itemIds = data.map(itm=> itm.id);
        const [getAnswers] = await db.query(getAnswer, [itemIds]);
        const joined = data.map(itm =>{
            const answer = getAnswers.filter(answ=> answ.item_id == itm.id);
            return{
                item_model: itm,
                answers: answer
            }
        })
        return joined;
    } catch (error) {
        console.error("Error in byParent:", error);
        return null;
    }
};

const updateItemAnswers = async (item_id, items, answers, packageId, attachment) => {
    const db = server.pool;

    const sqlUpdateItem = `UPDATE items SET parent_id = ?, type = ?, code = ?, content = ?, answer_order_random = ?, duration = ?, item_count = ?, \`order\` = ?, updated_at = NOW() WHERE id = ?`;

    const sqlDeleteAnswers = `DELETE FROM item_answers WHERE item_id = ?`;

    const sqlInsertAnswer = `INSERT INTO item_answers (id, item_id, \`order\`, correct_answer, content, created_at, updated_at) VALUES ?`;

    const deleteAttachable = `DELETE FROM attachable WHERE attachable_uuid = ?`;
    const sqlAttachable = `INSERT INTO attachable (id, attachment_id, attachable_type, attachable_uuid, attachable_id, \`order\`) VALUES ?`;

    try {
        await db.execute(sqlUpdateItem, [
            items.parent_id, items.type, items.code, items.content, items.answer_order_random, 
            items.duration, items.item_count, items.order, item_id
        ]);

        if (answers && answers.length > 0) {
            const formatAnswer = answers.map(get => [
                crypto.randomUUID(), item_id, get.order, get.correct_answer, get.content, new Date(), new Date()
            ]);
            await db.execute(sqlDeleteAnswers, [item_id]);
            await db.query(sqlInsertAnswer, [formatAnswer]);
        }

        const attachmentList = Array.isArray(attachment) ? attachment : [attachment];
        const cleanAttachmentList = attachmentList.filter(a => a && typeof a === 'object' && a.id);
        console.log(cleanAttachmentList)
        if (cleanAttachmentList.length > 0) {
            await db.execute(deleteAttachable, [item_id]);
            const formatAnswer = cleanAttachmentList.map((get, index) => [
                crypto.randomUUID(),
                get.id,
                'App\\\Entities\\\Question\\\Package\\\Item',
                item_id,
                null,
                index
            ]);
            console.log(formatAnswer);
            await db.query(sqlAttachable, [formatAnswer]);
        }

        await updateOrderSequentially(packageId);
        return true;
    } catch (error) {
        console.log("Error in updateItemAnswers:", error);
        return false;
    }
};

const edit = async (id, parent_id, type, code, content, answer_order_random, duration, item_count, order) => {
    const db = server.pool;
    const sql = `UPDATE items SET parent_id = ?, type = ?, code = ?, content = ?, answer_order_random = ?, duration = ?, item_count = ?, \`order\` = ?, updated_at = NOW() WHERE id = ?`;
    try {
        await db.execute(sql, [parent_id, type, code, content, answer_order_random, duration, item_count, order, id]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const del = async (id)=>{
    const db = server.pool;
    const sql = `DELETE FROM items WHERE id = ?`
    try {
        await db.execute(sql, [id])
        return true;
    } catch (e) {
        console.log(error);
        return false;
    }
}

module.exports ={byPackage, add, edit, del, addItemAnswers, updateItemAnswers, byParent, addItemAnswersParent, addPackageItem, updateOrder};