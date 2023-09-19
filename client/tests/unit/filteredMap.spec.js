import { render } from '@testing-library/vue'
import { mount, DOMWrapper } from '@vue/test-utils'

import FilteredMap from '@/components/FilteredMap.vue'
import { ManagedMap } from '@/lib/mapservices/ManagedMap'

import { createTestingPinia } from '@pinia/testing'
import { vi, test, beforeEach, describe, expect } from 'vitest'
import ResizeObserverMock from './__mocks__/ResizeObserver'

describe('Basic store test with FilteredMap', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })
  test('Trivial mount', async () => {
    render(FilteredMap, {
      global: {
        plugins: [createTestingPinia()]
      }
    })
    // it is not possible to test anything visible here as it contains of <div>  only
  })

  test('Low level', () => {
    const wrapper = mount(FilteredMap, {
      global: {
        plugins: [createTestingPinia()]
      }
    })
    const mapdiv = wrapper.find('[id="mapdiv"]')
    expect(mapdiv).toBeInstanceOf(DOMWrapper)
    expect(mapdiv.element).toBeInstanceOf(HTMLDivElement)
    expect(wrapper.vm.mmap).toBeInstanceOf(ManagedMap)
  })
})
