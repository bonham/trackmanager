const BASE_URL = ""

async function sendJSONToServer(path: string, payload: string) {
  const body = payload
  const headers = new Headers()
  headers.append("Content-Type", "application/json")

  const url = `${BASE_URL}${path}`
  const opts: RequestInit = {
    method: 'POST',
    headers,
    body,
    credentials: "include"
  }

  // can throw error
  const resp = await fetch(url, opts);
  return resp
}

async function getWithCORS(path: string) {

  const url = `${BASE_URL}${path}`
  const opts: RequestInit = {
    method: 'GET',
    credentials: "include"
  }

  // can throw error
  const resp = await fetch(url, opts);
  return resp
}

function getErrorMessage(error: any) {
  if (error instanceof Error) {
    return `Name: ${error.name}, Message: ${error.message}`
  } else return `Error object type ${typeof error}, Value: ${String(error)}`
}

export { sendJSONToServer, getWithCORS, getErrorMessage }

