import { render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'

import FilteredMap from '@/components/FilteredMap.vue'
import { ManagedMap } from '@/lib/mapServices.js'

import { createStore } from 'vuex'
import { store } from '../../src/store'
import { describe, test, expect } from 'vitest'

describe('Basic store test with FilteredMap', () => {
  test('Trivial mount', async () => {
    const storeInstance = createStore(store)
    render(FilteredMap, {
      global: {
        plugins: [storeInstance]
      }
    })
    // it is not possible to test anything visible here as it contains of <div>  only
  })

  test('Low level', () => {
    const storeInstance = createStore(store)
    const wrapper = mount(FilteredMap, {
      global: {
        plugins: [storeInstance]
      }
    })
    expect(wrapper.vm.shouldBeVisibleIds).toEqual([])
    expect(wrapper.vm.mmap).toBeInstanceOf(ManagedMap)
  })
})
