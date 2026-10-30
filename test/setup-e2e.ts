import * as dotenv from 'dotenv';
import * as path from 'path';

// Forzar la carga del archivo .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });