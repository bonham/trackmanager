import { test, expect, describe } from 'vitest'
import { store } from '../../src/store.js'
import { createStore } from 'vuex'

describe('Test the store', () => {
  test('First test', async () => {
    expect(store).toBeTruthy()
    const storeInstance = createStore(store)
    expect(storeInstance).toBeTruthy()
  })
})
