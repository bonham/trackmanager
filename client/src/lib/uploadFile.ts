
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

interface UploadResponse {
  // Define the expected structure of the response here
  // For example:
  success: boolean;
  message: string;
  // Add other fields as needed
}

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
    let errcause = ''
    try {
      const j = JSON.parse(errDetail) as unknown
      if (j !== null && typeof j === 'object' && 'message' in j && typeof j.message === 'string') {
        errcause = j.message.toString()
      } else {
        errcause = errDetail
      }
    } catch {
      errcause = errDetail
    }
    throw new UploadError('HTTP error, status = ' + response.status, errcause)
  }
  const jsonResponse = await response.json() as unknown;

  if (isUploadResponse(jsonResponse)) {
    return jsonResponse;
  } else {
    throw new UploadError('Invalid response structure', 'Response does not match UploadResponse type');
  }

}

function isUploadResponse(response: unknown): response is UploadResponse {
  if (response !== null && typeof response === 'object' && 'success' in response && 'message' in response) {
    return typeof response.success === 'boolean' && typeof response.message === 'string';
  } else {
    return false;
  }
}

export { uploadFile, UploadError }
export type { QueuedFile, QueueStatus }

// For testing

// const UP_BASE_URL = 'https://httpbin.org/status/500'
// const UP_BASE_URL = 'https://httpbin.org/delay/3'
