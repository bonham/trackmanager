// import { copyFile } from 'fs/promises'
// import { constants } from 'fs'
const { copyFile } = require('fs/promises')
const { constants } = require('fs')

async function main () {
  try {
    await copyFile(
      'config_dist.js',
      'config.js',
      constants.COPYFILE_EXCL)
    console.log('config_dist.js was copied to config.js')
  } catch (e) {
    if (e.code === 'EEXIST') {
      console.log('config.js already exists')
      return
    }
    console.log('The file could not be copied', e)
  }
}
main()
