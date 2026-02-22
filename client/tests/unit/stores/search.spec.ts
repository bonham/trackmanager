import { describe, test, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearchStore } from '@/stores/search'

describe('useSearchStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    test('searchText starts as empty string', () => {
      const store = useSearchStore()
      expect(store.searchText).toBe('')
    })
  })

  describe('searchText mutations', () => {
    test('can be set to a search term', () => {
      const store = useSearchStore()
      store.searchText = 'mountain trail'
      expect(store.searchText).toBe('mountain trail')
    })

    test('can be cleared back to empty string', () => {
      const store = useSearchStore()
      store.searchText = 'some query'
      store.searchText = ''
      expect(store.searchText).toBe('')
    })

    test('is isolated between store instances via new pinia', () => {
      const store1 = useSearchStore()
      store1.searchText = 'query1'

      setActivePinia(createPinia())
      const store2 = useSearchStore()
      expect(store2.searchText).toBe('')
    })
  })
})
