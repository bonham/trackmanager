import { defineStore } from 'pinia'
import { getSchemaConfig } from '@/lib/getconfig'
import { ref } from 'vue'

const useConfigStore = defineStore('configstore', () => {

  const loaded = ref<boolean>(false)
  const schemaConfig = ref<Record<string, string>>({})

  async function loadConfig(sid: string): Promise<void> {
    if (loaded.value) {
      return
    } else {
      const config = await getSchemaConfig(sid)
      schemaConfig.value = config
      loaded.value = true
    }
  }

  function get(key: string): string {
    if (!loaded.value) {
      throw Error("Config store has not been initialized. Call 'loadConfig' first")
    }
    if (!(key in schemaConfig.value)) {
      throw new Error(`Property ${key} does not exist in store`);
    }
    const r = schemaConfig.value[key]
    if (r === undefined) {
      throw Error(`Property ${key} is undefined in store`);
    } else {
      return r
    }
  }

  return {
    loadConfig,
    get,
    schemaConfig
  }

})

export { useConfigStore }

