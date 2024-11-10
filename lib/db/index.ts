import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.NODE_ENV === 'production' ? 'db' : 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'sla_library',
  ssl: process.env.DATABASE_SSL === 'true',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('Database connected successfully');
});

export default pool; 