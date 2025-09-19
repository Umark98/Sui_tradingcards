import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  host: process.env.PGSQL_HOST,
  port: Number(process.env.PGSQL_PORT),
  database: process.env.PGSQL_DATABASE,
  user: process.env.PGSQL_USER,
  password: process.env.PGSQL_PASSWORD,
options: '-c search_path=public'

});

export default pool;