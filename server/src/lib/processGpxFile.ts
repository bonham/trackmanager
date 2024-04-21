const GPX2DB_SCRIPT = process.env.GPX2DBSCRIPT;
import { execFileSync } from 'node:child_process';

function processGpxFile(
  simplifyDistance: number,
  filePath: string,
  dbname: string,
  schema: string,
) {
  // build arguments
  const args = [
    '-s',
    simplifyDistance.toString(),
    filePath,
    dbname,
    schema,
  ];


  // run child process - execute python executable to process the upload
  let stdout = '';
  try {
    console.log('Command: ', GPX2DB_SCRIPT, args);
    if (GPX2DB_SCRIPT === undefined) throw new Error("GPX2DB_SCRIPT config var not defined")
    stdout = execFileSync(GPX2DB_SCRIPT, args, { encoding: 'utf-8' });
    console.log(`Stdout >>${stdout}<<`);
  } catch (err) {
    console.log(`Stdout >>${stdout}<<`);
    console.log('Child error', err);
    const message = (err instanceof Error && 'message' in err) ? err.message : '';
    console.log('Message', message);
    throw (err);
  }
}

export { processGpxFile };

