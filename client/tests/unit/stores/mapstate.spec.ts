import { describe, test, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMapStateStore } from '@/stores/mapstate'
import type { LoadTracksRequest, LoadTracksCommand } from '@/stores/mapstate'

describe('useMapStateStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    test('loadCommand starts with command "none"', () => {
      const store = useMapStateStore()
      expect(store.loadCommand.command).toBe('none')
    })

    test('processComand starts as false', () => {
      const store = useMapStateStore()
      expect(store.processComand).toBe(false)
    })
  })

  describe('loadCommand mutations', () => {
    test('can be set to load all tracks', () => {
      const store = useMapStateStore()
      const cmd: LoadTracksRequest = { command: 'all' }
      store.loadCommand = cmd
      expect(store.loadCommand.command).toBe('all')
    })

    test('can be set to load a specific year', () => {
      const store = useMapStateStore()
      const cmd: LoadTracksRequest = { command: 'year', payload: 2023 }
      store.loadCommand = cmd
      expect(store.loadCommand.command).toBe('year')
      if (store.loadCommand.command === 'year') {
        expect(store.loadCommand.payload).toBe(2023)
      }
    })

    test('can be set to load by bbox', () => {
      const store = useMapStateStore()
      const cmd: LoadTracksRequest = { command: 'bbox' }
      store.loadCommand = cmd
      expect(store.loadCommand.command).toBe('bbox')
    })

    test('can be set to load a single track', () => {
      const store = useMapStateStore()
      const cmd: LoadTracksRequest = { command: 'track', payload: 42 }
      store.loadCommand = cmd
      expect(store.loadCommand.command).toBe('track')
      if (store.loadCommand.command === 'track') {
        expect(store.loadCommand.payload).toBe(42)
      }
    })

    test('can be reset back to none', () => {
      const store = useMapStateStore()
      store.loadCommand = { command: 'all' }
      store.loadCommand = { command: 'none' }
      expect(store.loadCommand.command).toBe('none')
    })
  })

  describe('processComand mutation', () => {
    test('can be set to true', () => {
      const store = useMapStateStore()
      store.processComand = true
      expect(store.processComand).toBe(true)
    })

    test('can be toggled back to false', () => {
      const store = useMapStateStore()
      store.processComand = true
      store.processComand = false
      expect(store.processComand).toBe(false)
    })
  })

  describe('LoadTracksCommand type', () => {
    test('command values are assignable to LoadTracksCommand', () => {
      const commands: LoadTracksCommand[] = ['all', 'year', 'bbox', 'track', 'none']
      expect(commands).toHaveLength(5)
    })
  })
})
