import { constants } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import * as z from 'zod';

async function main() {
  try {
    await copyFile(
      'env.dist',
      '.env',
      constants.COPYFILE_EXCL,
    );
    console.log('env.dist was copied to .env');
  } catch (e) {
    const result = z.object({
      code: z.string(),
    }).safeParse(e);

    if (result.success && result.data.code === 'EEXIST') {
      console.error('.env already exists');
      return;
    }
    console.error('The file could not be copied', e);
  }
}
main().catch(e => console.error(e));
