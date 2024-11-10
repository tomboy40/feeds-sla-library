import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const migrationPool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'sla_library',
  ssl: false,
  connectionTimeoutMillis: 5000,
});

async function migrate() {
  console.log('Connecting to database...');
  const client = await migrationPool.connect();
  
  try {
    console.log('Starting database migration...');
    const schemaSQL = readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await migrationPool.end();
  }
}

migrate().catch((error) => {
  console.error('Migration script failed:', error);
  if (error.code === 'ETIMEDOUT') {
    console.error(`
Connection timed out. Please check:
1. Docker container is running: docker ps
2. Port 5432 is exposed: docker-compose ps
3. Database is ready: docker-compose logs db
4. Can connect locally: psql -h 127.0.0.1 -U postgres -d sla_library
    `);
  }
  process.exit(1);
});
