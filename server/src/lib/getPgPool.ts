import pg from 'pg';

export default function getPgPool() {
  const pgpool = new pg.Pool({
    host: process.env.PASSKEYPOC_PGHOST,
    port: Number(process.env.PASSKEYPOC_PGPORT),
    user: process.env.PASSKEYPOC_PGUSER,
    password: process.env.PASSKEYPOC_PGPASSWORD,
    database: process.env.PASSKEYPOC_PGDATABASE,
  });
  return pgpool;
}
