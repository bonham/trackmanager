import './mockJsdom'
import { expect } from 'chai'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import FilteredMap from '@/components/FilteredMap.vue'

const localVue = createLocalVue()

localVue.use(Vuex)

describe('FilteredMap', () => {
  it('Trivial mount', () => {
    return import('../../src/store.js').then((module) => {
      const store = module.default
      const wrapper = shallowMount(FilteredMap, { store, localVue })
      expect(wrapper.vm.loadedTracks()).to.deep.equal([])
    })
  })
})
