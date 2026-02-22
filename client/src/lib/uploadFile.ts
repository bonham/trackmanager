
import * as z from 'zod'

// Takes care to upload a file to backend

type QueueStatus = 'Queued' | 'Processing' | 'Failed' | 'Completed'

class UploadError extends Error {
  cause: string

  constructor(message: string, cause: string) {
    super(message)
    this.cause = cause
  }

}

interface QueuedFile {
  key: number,
  fname: string,
  fileBlob: File,
  error: UploadError | null,
  details: string | null,
  status: QueueStatus,
  sid: string,
  visible: boolean
}

const UploadResponseSchema = z.object({
  message: z.coerce.string(),
  fileName: z.coerce.string().optional()
})
type UploadResponse = z.infer<typeof UploadResponseSchema>

async function uploadFile(fileIdObject: QueuedFile, uploadUrl: string, formParameter: string): Promise<UploadResponse> {
  // construct body
  const formData = new FormData()
  formData.set(formParameter, fileIdObject.fileBlob)

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const errDetail = await response.text()
    let errcause: string
    try {
      const j = JSON.parse(errDetail) as unknown
      try {
        const uploadResponse = UploadResponseSchema.parse(j)
        errcause = uploadResponse.message
      } catch {
        errcause = errDetail
      }
    } catch {
      errcause = errDetail
    }
    throw new UploadError('HTTP error, status = ' + response.status, errcause)
  }

  try {
    const tmpjsonResponse = await response.json() as unknown;
    const jsonResponse = UploadResponseSchema.parse(tmpjsonResponse)
    return jsonResponse;
  } catch (e) {
    let errstring: string
    try {
      errstring = z.instanceof(Error).parse(e).message
    } catch {
      errstring = z.string().parse(e)
    }
    throw new UploadError(`Invalid response structure', 'Response does not match UploadResponse type: Error`, errstring);
  }

}

export { uploadFile, UploadError }
export type { QueuedFile, QueueStatus }

// For testing

// const UP_BASE_URL = 'https://httpbin.org/status/500'
// const UP_BASE_URL = 'https://httpbin.org/delay/3'
