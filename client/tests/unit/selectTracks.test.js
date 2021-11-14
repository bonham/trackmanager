import './mockJsdom'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import SelectTracksPage from '@/views/SelectTracksPage.vue'

const localVue = createLocalVue()

localVue.use(Vuex)

describe('SelectTracksPage', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  test('Trivial mount', () => {
    return import('../../src/store.js').then((module) => {
      const store = module.default
      const elem = document.createElement('div')
      if (document.body) {
        document.body.appendChild(elem)
      }

      // mock window.matchMedia
      const mockMatchMedia = jest.fn(() => { return { matches: false } })
      global.window.matchMedia = mockMatchMedia

      const wrapper = shallowMount(SelectTracksPage, { store, localVue, attachTo: elem })
      expect(wrapper.vm.currentLayout).toEqual('landscape')
    })
  })
})
