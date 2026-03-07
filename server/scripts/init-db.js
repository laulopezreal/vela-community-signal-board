import { createDb, DB_PATH } from '../db.js';

createDb().close();
console.log(`Database initialized at ${DB_PATH}`);
