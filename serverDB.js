const mysql = require('mysql2/promise.js');

const pool = mysql.createPool({
    host: '192.168.0.100',
    user: 'root',
    database: 'new_exams',
    password: 'password',
    port: 3306
});

async function seleksi() {
    try {
        const test = await pool.getConnection();
        console.log("berhasil terkoneksi db");
        test.release();
    } catch (error) {
        console.error('ada masalah : ', error);
    }
}

seleksi();

module.exports = {pool};
