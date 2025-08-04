const server = require('../serverDB');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const getAll = async()=>{
    const db = server.pool;
    const sql = `SELECT * FROM attachments ORDER BY updated_at DESC`;
    try {
        const [rows] = await db.execute(sql);
        return rows;
    } catch (error) {
        console.error(error);
        throw new Error("Database query failed");
    }
}    
  
const add = async (data) => {
  const db = server.pool;
  const sql = `
    INSERT INTO attachments (
      id, user_id, title, mime, path, type, description, options, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

  const values = [
    crypto.randomUUID(),
    data.user_id ?? null,
    data.title ?? null,
    data.mime_type ?? null,
    data.path ?? null,
    'attachment',
    data.description ?? null,
    data.options ?? null
  ];

  try {
    await db.execute(sql, values);
    return true;
  } catch (err) {
    console.error('DB ERROR:', err);
    return false;
  }
};

const update = async (data, parsedData) => {
    const db = server.pool;
    const getAttachments = `SELECT * FROM attachments WHERE id = ?`;
    const updateAttach = `
      UPDATE attachments 
      SET user_id = ?, title = ?, mime = ?, path = ?, updated_at = NOW() 
      WHERE id = ?`;

    let newData;
    try {
      newData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (err) {
      console.error('JSON parsing error:', err);
      return false;
    }

    const values = [
      newData.data.user_id ?? null,
      newData.data.title ?? null,
      newData.data.mime ?? null,
      parsedData.path ?? null,
      newData.data.id, // ✅ Ambil ID dari dalam `data`
    ];

    try {
      const [[attachment]] = await db.query(getAttachments, [newData.data.id]);

      if (!attachment) {
        console.error('Attachment not found with ID:', newData.data.id);
        return false;
      }

      const filePath = path.join(__dirname, '../file/', attachment.path);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('Gagal menghapus file lama:', err);
          } else {
            console.log('File lama berhasil dihapus:', filePath);
          }
        });
      }

      await db.execute(updateAttach, values);
      return true;
    } catch (err) {
      console.error('DB ERROR:', err);
      return false;
    }
};




const getById = async (id) => {
  const db = server.pool;
  const sql = `SELECT * FROM attachable WHERE attachable_uuid = ?`;
  const getAttachment = `SELECT * FROM attachments WHERE id = ?`;
  try {
    const [rows] = await db.execute(sql, [id]);
    const attachment = await Promise.all(rows.map(async (row) => {
      const [attachmentRows] = await db.execute(getAttachment, [row.attachment_id]);
      return attachmentRows[0];
    }));

    return attachment.flat();
  } catch (error) {
    console.error(error);
    return false;
  }
}
  
const addAttachable = async (data) => {
  const db= server.pool;
  const deleteAttachable = 'DELETE FROM attachable WHERE attachable_uuid = ?';
  const insertAttachable = `INSERT INTO attachable (id, attachment_id, attachable_type, attachable_uuid, attachable_id, \`order\`) VALUES ?`;
  try {
    const map = data.map((item) => 
      [
        crypto.randomUUID(),
        item.attachment_id,
        'App\\\Entities\\\Question\\\Package\\\Item',
        item.attachable_uuid,
        item.attachable_id,
        item.order
      ]
    );
    await db.query(deleteAttachable, [data[0].attachable_uuid])
    await db.query(insertAttachable, [map]);
    return true;
  } catch (error) {
    console.log(error)
    return false
  }
}

const del = async(id)=>{
  const db = server.pool;
  const getDelete = `DELETE FROM attachments WHERE id = ?`;
  try {
    await db.query(getDelete, [id]);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports= {getAll, add, getById, addAttachable, del, update}