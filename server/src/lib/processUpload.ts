import { readFileSync, rmSync } from 'node:fs';
import { basename } from 'node:path';
import { FitFile } from './fit/FitFile.js';
import { processFitFile } from './processFitFile.js';
import { processGpxFile } from './processGpxFile.js';

const DATABASE = process.env.TM_DATABASE;

/// // Create new track from file upload
async function processUpload(
  filePath: string,
  schema: string,
) {
  if (DATABASE === undefined) throw Error('Database is undefined');

  const fileName = basename(filePath);

  // Decide if fit or gpx file
  const fileBuffer = readFileSync(filePath);
  if (FitFile.isFit(fileBuffer)) {
    await processFitFile(fileBuffer, fileName, DATABASE, schema)
  } else {
    await processGpxFile(fileBuffer, fileName, DATABASE, schema)
  }
  try {
    rmSync(filePath)
  } catch (e) {
    console.warn(`could not remove ${filePath}`)
  }
}
export { processUpload };

