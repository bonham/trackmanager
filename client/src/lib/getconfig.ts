
const conftypes = ["SCHEMA"]


interface ConfigSpec {
  values: string[]
  default: string
}
interface ConfigSchema {
  TRACKSTYLE: ConfigSpec;
  [key: string]: ConfigSpec
}


const configSchema: ConfigSchema = {
  TRACKSTYLE: {
    values: ["FIVE_COLORFUL", "THREE_BROWN"],
    default: "THREE_BROWN"
  },
  TRACKMAP_INITIALVIEW: {
    values: ["THIS_YEAR", "ALL"],
    default: "THIS_YEAR"
  }
}

async function getConfig(sid: string, conftype: string, confkey: string): Promise<string> {

  if (!conftypes.includes(conftype)) {
    throw Error(`Conftype not allowed: ${conftype}`, { cause: conftypes })
  }

  let defaultValue: string
  let thisConfigSpec: ConfigSpec

  if (confkey in configSchema) {
    thisConfigSpec = configSchema[confkey]
    defaultValue = thisConfigSpec.default
  } else {
    throw Error(`Not an allowed config key: ${confkey}`)
  }

  const url = `/api/config/get/sid/${sid}/${conftype}/${confkey}`
  const r = await fetch(url)
  const rJson = await r.json() as unknown

  if (!!rJson && typeof (rJson) === 'object' && 'value' in rJson) {


    const v = rJson.value
    if (v === null) {
      return defaultValue
    } else if (typeof v === 'string')
      if (thisConfigSpec.values.includes(v)) {
        return v
      } else {
        throw Error(`Not allowed value ${v}`, { cause: thisConfigSpec })
      }
  }
  throw Error("Got wrong type from r.json()", { cause: rJson })
}

export { getConfig }