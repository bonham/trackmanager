import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { FitFile } from './fit/FitFile';
import { processFitFile } from './processFitFile';

const { execFileSync } = require('child_process');

const DATABASE = process.env.TM_DATABASE;
const GPX2DB_SCRIPT = process.env.GPX2DBSCRIPT;

function processGpxFile(
  simplifyDistance: number,
  filePath: string,
  dbname: string,
  schema: string,
) {
  // build arguments
  const args = [
    '-s',
    simplifyDistance,
    filePath,
    dbname,
    schema,
  ];


  // run child process - execute python executable to process the upload
  let stdout = '';
  try {
    console.log('Command: ', GPX2DB_SCRIPT, args);
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


/// // Create new track from file upload
function processFile(
  filePath: string,
  schema: string,
  simplifyDistance = 2,
) {
  if (DATABASE === undefined) throw Error('Database is undefined');

  const fileName = basename(filePath);
  // Decide if fit or gpx file
  const fileBuffer = readFileSync(filePath);
  if (FitFile.isFit(fileBuffer)) {
    processFitFile(fileBuffer, fileName, DATABASE, schema);
  } else {
    processGpxFile(simplifyDistance, filePath, DATABASE, schema);
  }
}


export { processFile };

