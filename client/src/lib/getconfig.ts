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
    values: ["LATEST_YEAR", "ALL"],
    default: "LATEST_YEAR"
  }
}

interface KeyValuePair {
  key: string,
  value: string
}


async function getConfig(sid: string, conftype: string, confkey: string): Promise<string> {

  if (!conftypes.includes(conftype)) {
    throw Error(`Conftype not allowed: ${conftype}`, { cause: conftypes })
  }

  const defaultValue = getDefault(confkey)
  const thisConfigSpec = configSchema[confkey]

  const url = `/api/config/get/sid/${sid}/${conftype}/${confkey}`
  const r = await fetch(url)
  if (!r.ok) {
    throw Error("Retrieving config not successful", { cause: { url, status: r.status } })
  }
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

async function getSchemaConfig(sid: string): Promise<Record<string, string>> {

  const conftype = 'SCHEMA'

  if (!conftypes.includes(conftype)) {
    throw Error(`Conftype not allowed: ${conftype}`, { cause: conftypes })
  }

  const url = `/api/config/get/sid/${sid}/${conftype}`
  const resp = await fetch(url)
  if (!resp.ok) {
    throw Error("Retrieving config not successful", { cause: { url, status: resp.status } })
  }
  const rJson = await resp.json() as unknown

  if (!isKeyValuePairList(rJson)) {
    throw Error("Got wrong type from r.json()", { cause: rJson })
  }

  // Validate keys and values against configschema
  rJson.forEach((k) => {
    validateConfigSchemaKeyValue(k)
  })

  // transform from array to object
  const dbKeyValues = rJson.reduce((acc: Record<string, string>, kv) => (
    { ...acc, [kv.key]: kv.value }
  ), {})

  // merge defaults with data from DB
  const retVal: Record<string, string> = {}
  Object.keys(configSchema).forEach((defaultKey) => {
    if (defaultKey in dbKeyValues) {
      retVal[defaultKey] = dbKeyValues[defaultKey]
    } else {
      retVal[defaultKey] = getDefault(defaultKey)
    }
  })

  return retVal
}

function getDefault(key: string): string {
  validateConfigSchemaKey(key)
  const thisConfigSpec = configSchema[key]
  const defaultValue = thisConfigSpec.default
  return defaultValue
}

function validateConfigSchemaKey(key: string): void {
  if (!(key in configSchema)) {
    throw Error(`Not an allowed config key: ${key}`)
  }
}

function validateConfigSchemaKeyValue({ key, value }: KeyValuePair): void {
  validateConfigSchemaKey(key)
  const allowedValues = configSchema[key].values
  if (allowedValues.includes(value)) {
    return
  } else {
    throw Error(`Not allowed value ${value} for config key ${key}`)
  }
}

function isKeyValuePairList(inputValue: unknown): inputValue is KeyValuePair[] {
  if (!Array.isArray(inputValue)) {
    return false
  }
  return inputValue.every((el: unknown) => {
    if (!!el && typeof el === 'object' && 'key' in el && 'value' in el && typeof el.key === 'string' && typeof el.value === 'string') {
      return true
    } else {
      return false
    }
  })

}

export { getConfig, getSchemaConfig }