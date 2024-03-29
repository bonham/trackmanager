
// Takes care to upload a file to backend

async function uploadFile(fileIdObject: QueuedFile, uploadUrl: string, formParameter: string) {
  // construct body
  const formData = new FormData()
  formData.set(formParameter, fileIdObject.fileBlob)

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const errDetail = await response.text()
    let errcause = ''
    try {
      const j = JSON.parse(errDetail)
      errcause = j.message
    } catch {
      errcause = errDetail
    }
    throw new UploadError('HTTP error, status = ' + response.status, errcause)
  }

  return response.json()
}

export type QueueStatus = 'Queued' | 'Processing' | 'Failed' | 'Completed'

export interface QueuedFile {
  key: number,
  fname: string,
  fileBlob: File,
  error: UploadError | null,
  details: string | null,
  status: QueueStatus,
  sid: string,
  visible: boolean
}

export class UploadError extends Error {
  cause: string

  constructor(message: string, cause: string) {
    super(message)
    this.cause = cause
  }

}

export { uploadFile }

// For testing

// const UP_BASE_URL = 'https://httpbin.org/status/500'
// const UP_BASE_URL = 'https://httpbin.org/delay/3'
