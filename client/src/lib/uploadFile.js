// Takes care to upload a file to backen
async function uploadFile (fileIdObject, uploadUrl, formParameter) {
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
    throw new Error('HTTP error, status = ' + response.status, { cause: errcause })
  }

  return response.json()
}

export { uploadFile }

// For testing

// const UP_BASE_URL = 'https://httpbin.org/status/500'
// const UP_BASE_URL = 'https://httpbin.org/delay/3'
