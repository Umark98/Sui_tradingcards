import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  host: process.env.PGSQL_HOST || 'localhost',
  port: Number(process.env.PGSQL_PORT) || 5432,
  database: process.env.PGSQL_DATABASE || 'tradingdb', // Use tradingdb where original schema exists
  user: process.env.PGSQL_USER || 'postgres',
  password: process.env.PGSQL_PASSWORD || '',
  options: '-c search_path=public'
});

export default pool;