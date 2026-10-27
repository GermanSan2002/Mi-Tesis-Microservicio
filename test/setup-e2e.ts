import * as dotenv from 'dotenv';
import * as path from 'path';

// Forzar la carga del archivo .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

console.log('[E2E] REDIS_HOST:', process.env.REDIS_HOST);
console.log('[E2E] REDIS_PORT:', process.env.REDIS_PORT);