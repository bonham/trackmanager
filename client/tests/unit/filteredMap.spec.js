import '@testing-library/jest-dom'
import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'

import FilteredMap from '@/components/FilteredMap.vue'

import { createStore } from 'vuex'
import { store } from '../../src/store.js'

describe('Basic store test with FilteredMap', () => {
  test.skip('Trivial mount', async () => {
    const storeInstance = createStore(store)
    const { getByTitle } = render(FilteredMap, {
      global: {
        plugins: [storeInstance]
      }
    })
    const button = getByTitle('Zoom in')
    expect(button).toBeTruthy()
  })

  test('Low level', () => {
    const storeInstance = createStore(store)
    const wrapper = mount(FilteredMap, {
      global: {
        plugins: [storeInstance]
      }
    })
    expect(wrapper.vm.shouldBeVisibleIds).toEqual([])
  })
})
