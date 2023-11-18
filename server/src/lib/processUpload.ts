import { rmdir as rmdirprom } from 'node:fs/promises';

const { execFileSync } = require('child_process');

const database = process.env.TM_DATABASE;
const gpx2dbScript = process.env.GPX2DBSCRIPT;


/// // Create new track from file upload
async function processFile(
  filePath: string,
  uploadDir: string,
  schema: string,
  simplifyDistance = 2,
): Promise<void> {
  // build arguments
  const args = [
    '-s',
    simplifyDistance,
    filePath,
    database,
    schema,
  ];


  // run child process - execute python executable to process the upload
  let stdout = '';
  try {
    console.log('Command: ', gpx2dbScript, args);
    stdout = execFileSync(gpx2dbScript, args, { encoding: 'utf-8' });
    console.log(`Stdout >>${stdout}<<`);
  } catch (err) {
    console.log(`Stdout >>${stdout}<<`);
    console.log('Child error', err);
    const message = (err instanceof Error && 'message' in err) ? err.message : '';
    console.log('Message', message);
    throw (err);
  } finally {
    // cleanup of file and directory
    rmdirprom(uploadDir, { recursive: true }).then(
      () => console.log(`Successfully purged upload directory: ${uploadDir}`),
      (err: any) => { console.log('Error, could not upload file', err); },
    );
  }
}

export { processFile };

