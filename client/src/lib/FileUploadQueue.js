import queue from 'async/queue'
import { uploadFile } from '@/lib/uploadFile'

const FORMPARAM = 'newtrack'
const WORKERS = 4
const UP_BASE_URL = '/api/tracks/addtrack'

class FileUploadQueue {
  constructor () {
    this.workerQueue = queue(
      performUpload,
      WORKERS
    )
  }

  push (obj, callback) {
    this.workerQueue.push(obj, callback)
  }
}

function performUpload (options, callback) {
  const { fileIdObject, setItemProcessingStatus } = options
  const thisKey = fileIdObject.key
  console.log(`Queue function called for id ${thisKey}`)
  setItemProcessingStatus(thisKey, 'Processing')

  // do the work in async way
  const url = `${UP_BASE_URL}/sid/${fileIdObject.sid}`
  uploadFile(fileIdObject, url, FORMPARAM)
    .then(json => {
      console.log(`Finished uploading key ${fileIdObject.key}, Message: ${json.message}`)
      callback(null, thisKey)
    })
    .catch(err => {
      fileIdObject.error = err
      callback(err, thisKey)
    })
}

export { FileUploadQueue }
