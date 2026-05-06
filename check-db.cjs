const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(process.cwd(), 'dev.db'));

console.log('=== Tables ===');
var tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => console.log('  - ' + t.name));

console.log('\n=== Prisma migrations ===');
var migrations = db.prepare("SELECT * FROM _prisma_migrations").all();
migrations.forEach(m => console.log(JSON.stringify(m)));

db.close();
