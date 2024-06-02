import { UploadError, uploadFile } from "./uploadFile"
import type { QueuedFile, QueueStatus } from "./uploadFile"
import { queue } from 'async'
import type { QueueObject, AsyncResultCallback } from 'async'

const FORMPARAM = 'newtrack'
const WORKERS = 10
const UP_BASE_URL = '/api/tracks/addtrack'



export type ICompletedCallback = (err: UploadError | null, key: number) => void
export type IsetItemProcessingStatus = (key: number, status: QueueStatus) => void
export type IQueuedItem = { fileIdObject: QueuedFile, setItemProcessingStatus: IsetItemProcessingStatus }


class FileUploadQueue {
  workerQueue: QueueObject<IQueuedItem>

  constructor() {
    this.workerQueue = queue(
      performUpload,
      WORKERS
    )
  }

  push(obj: IQueuedItem, callback: AsyncResultCallback<number, UploadError>) {
    this.workerQueue.push(obj, callback)
  }
}

function performUpload(options: IQueuedItem, callback: AsyncResultCallback<number, UploadError>) {
  const { fileIdObject, setItemProcessingStatus } = options
  const thisKey = fileIdObject.key
  // console.log(`Queue function called for id ${thisKey}`)
  setItemProcessingStatus(thisKey, 'Processing')

  // do the work in async way
  const url = `${UP_BASE_URL}/sid/${fileIdObject.sid}`
  uploadFile(fileIdObject, url, FORMPARAM)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .then(json => {
      // console.log(`Finished uploading key ${fileIdObject.key}, Message: ${json.message}`)
      callback(null, thisKey)
    })
    .catch((err: UploadError) => {
      fileIdObject.error = err
      callback(err, thisKey)
    })
}

function makeFileIdObject(key: number, file: File, sid: string): QueuedFile {
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
