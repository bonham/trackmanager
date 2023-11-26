
import { Pool } from 'pg';
import { Track } from './Track.js';

interface DBOpts {
  dbUser: string,
  dbSchema: string,
  dbName: string,
  dbHost: string,
}

class Track2DbWriter {
  dbOptions: DBOpts;

  pool: Pool;

  fileBufferHash: string;

  constructor(dbOptions: DBOpts, fileBufferHash: string) {
    this.dbOptions = dbOptions;
    this.fileBufferHash = fileBufferHash;

    this.pool = new Pool({
      database: dbOptions.dbName,
      host: dbOptions.dbHost,
      user: dbOptions.dbUser,
    });
  }

  async write(t: Track) {
    const schema = this.dbOptions.dbSchema;
    const meta = t.getMetaData();
    const {
      name, source, totalAscent, totalDistance,
      startTime, durationSeconds,
    } = meta;

    const resTrackId = await this.pool.query(`select nextval(${schema}.tracks_id)`);
    const newId = resTrackId.rows[0].nextval;

    const insert = `
    INSERT INTO ${schema}.tracks(
      id,
      name, src, hash, "time", length, timelength, ascent)
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8);
    `;
    const values = [
      newId, name, source, this.fileBufferHash,
      startTime, totalDistance, durationSeconds, totalAscent,
    ];

    const res = await this.pool.query(insert, values);
    if (res.rowCount !== 1) throw new Error('Insert rowcount is not equal to 1');

    return newId;
  }
}

export { Track2DbWriter };

