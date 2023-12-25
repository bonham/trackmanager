


async function getConfig(sid: string, conftype: string, confkey: string, defaultValue: string): Promise<string> {

  const url = `/api/config/get/sid/${sid}/${conftype}/${confkey}`
  const r = await fetch(url)
  const rJson = await r.json() as unknown

  if (!!rJson && typeof (rJson) === 'object' && 'value' in rJson) {


    const v = rJson.value
    if (v === null) {
      return defaultValue
    } else if (typeof v === 'string')
      return v
  }
  throw Error("Got wrong type from r.json()", { cause: rJson })
}

export { getConfig }