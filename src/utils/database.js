const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json'); // ملف JSON داخل نفس المجلد utils

function loadDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function getUser(db, id) {
  if (!db.users[id]) {
    db.users[id] = {
      wallet: 0,
      bank: 0,
      violations: []
    };
  }
  return db.users[id];
}

module.exports = { loadDB, saveDB, getUser };
