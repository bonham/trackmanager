


async function getConfig(sid: string, conftype: string, confkey: string): Promise<string> {

  const url = `/api/config/get/sid/${sid}/${conftype}/${confkey}`
  const r = await fetch(url)
  const rJson = await r.json() as unknown

  if (!!rJson && typeof (rJson) === 'object' && 'value' in rJson && typeof (rJson.value) === 'string') {
    return rJson.value
  } else {
    throw Error("Got wrong type from r.json()", { cause: rJson })
  }
}

export { getConfig }