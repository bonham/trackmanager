const queue = require('async/queue')
import { uploadFile } from '@/lib/uploadFile'

const FORMPARAM = 'newtrack'
const WORKERS = 4
const UP_BASE_URL = '/api/tracks/addtrack'

export interface QueuedFile {
  key: number,
        fname: string,
        fileBlob: File,
        error: Error | null,
        details: string | null,
        status: QueueStatus,
        sid: string,
        visible: boolean
}

export type QueueStatus = 'Queued' | 'Processing' | 'Failed' |'Done'

export type ICompletedCallback = (err: Error|null, key: number) => void
export type IsetItemProcessingStatus = (key: number, status: QueueStatus) => void
export type IQueuedItem = { fileIdObject: QueuedFile, setItemProcessingStatus: IsetItemProcessingStatus }

class FileUploadQueue {
  workerQueue: any

  constructor () {
    this.workerQueue = queue(
      performUpload,
      WORKERS
    )
  }

  push (obj: IQueuedItem, callback: ICompletedCallback) {
    this.workerQueue.push(obj, callback)
  }
}

function performUpload (options: IQueuedItem, callback: ICompletedCallback) {
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

function makeFileIdObject (key: number, file: File, sid: string) : QueuedFile {
  const thisKey = key
  const fName = file.name
  return {
    key: thisKey,
    fname: fName,
    fileBlob: file,
    error: null,
    details: null,
    status: 'Queued',
    sid: sid,
    visible: true
  }
}


export { FileUploadQueue, makeFileIdObject }
