import { describe, test, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConfigStore } from '@/stores/configstore'

vi.mock('@/lib/getconfig', () => ({
  getSchemaConfig: vi.fn(),
}))

import { getSchemaConfig } from '@/lib/getconfig'

describe('configstore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getSchemaConfig).mockReset()
  })

  describe('loadConfig', () => {
    test('loads config and sets loaded to true', async () => {
      const mockConfig = { TRACKSTYLE: 'THREE_BROWN', TRACKMAP_INITIALVIEW: 'LATEST_YEAR' }
      vi.mocked(getSchemaConfig).mockResolvedValue(mockConfig)

      const store = useConfigStore()
      expect(store.schemaConfig).toEqual({})

      await store.loadConfig('mysid')

      expect(vi.mocked(getSchemaConfig)).toHaveBeenCalledOnce()
      expect(vi.mocked(getSchemaConfig)).toHaveBeenCalledWith('mysid')
      expect(store.schemaConfig).toEqual(mockConfig)
    })

    test('does not reload if already loaded', async () => {
      vi.mocked(getSchemaConfig).mockResolvedValue({ TRACKSTYLE: 'THREE_BROWN' })

      const store = useConfigStore()
      await store.loadConfig('mysid')
      await store.loadConfig('mysid')

      expect(vi.mocked(getSchemaConfig)).toHaveBeenCalledOnce()
    })

    test('propagates rejection from getSchemaConfig', async () => {
      vi.mocked(getSchemaConfig).mockRejectedValue(new Error('network error'))

      const store = useConfigStore()
      await expect(store.loadConfig('mysid')).rejects.toThrow('network error')
    })
  })

  describe('get', () => {
    test('returns value for existing key after load', async () => {
      vi.mocked(getSchemaConfig).mockResolvedValue({ TRACKSTYLE: 'FIVE_COLORFUL' })

      const store = useConfigStore()
      await store.loadConfig('sid1')

      expect(store.get('TRACKSTYLE')).toBe('FIVE_COLORFUL')
    })

    test('throws if store not loaded', () => {
      const store = useConfigStore()
      expect(() => store.get('TRACKSTYLE')).toThrow(
        "Config store has not been initialized. Call 'loadConfig' first"
      )
    })

    test('throws if key does not exist in schema config', async () => {
      vi.mocked(getSchemaConfig).mockResolvedValue({ TRACKSTYLE: 'THREE_BROWN' })

      const store = useConfigStore()
      await store.loadConfig('sid1')

      expect(() => store.get('NONEXISTENT_KEY')).toThrow(
        'Property NONEXISTENT_KEY does not exist in store'
      )
    })
  })
})
