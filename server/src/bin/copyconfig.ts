const { copyFile } = require('fs/promises');
const { constants } = require('fs');

async function main() {
  try {
    await copyFile(
      'env.dist',
      '.env',
      constants.COPYFILE_EXCL,
    );
    console.log('env.dist was copied to .env');
  } catch (e) {
    if ((e as any).code === 'EEXIST') {
      console.log('.env already exists');
      return;
    }
    console.log('The file could not be copied', e);
  }
}
main();
