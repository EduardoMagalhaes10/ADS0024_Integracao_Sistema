const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DATABASE_FILE = process.env.DATABASE_FILE || './data/agrigest.db';

// Garante que a pasta do arquivo de banco exista
const dir = path.dirname(DATABASE_FILE);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new DatabaseSync(DATABASE_FILE);
db.exec('PRAGMA foreign_keys = ON;');

// Aplica o schema (idempotente: usa CREATE TABLE IF NOT EXISTS)
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

module.exports = db;
