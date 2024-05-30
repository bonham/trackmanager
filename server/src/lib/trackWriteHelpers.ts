import { createHash } from 'node:crypto';
import { Track } from './Track.js';
import { Track2DbWriter } from './Track2DbWriter.js';

function hashBuffer(buffer: Buffer) {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

export async function writeTrack(o: {
  fileBuffer: Buffer,
  database: string,
  schema: string,
  track: Track
}) {
  const fileHash = hashBuffer(o.fileBuffer);

  const dbw = new Track2DbWriter();
  await dbw.init({
    dbName: o.database,
    dbSchema: o.schema,
    dbHost: 'localhost',
    dbUser: 'postgres',
  })

  const id: number = await dbw.write(o.track, fileHash);
  dbw.end()
  if (id >= 0) {
    console.log(`Track created with id ${id}`);
  } else if (id < -1) {
    console.error("Error occurred. No track created")
  }

}