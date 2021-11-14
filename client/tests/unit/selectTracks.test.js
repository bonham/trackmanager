import './mockJsdom'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import SelectTracksPage from '@/views/SelectTracksPage.vue'

const localVue = createLocalVue()

localVue.use(Vuex)

function mountAndRunTest (testFunction) {
  return import('../../src/store.js').then((module) => {
    const store = module.default
    const elem = document.createElement('div')
    if (document.body) {
      document.body.appendChild(elem)
    }

    const wrapper = shallowMount(SelectTracksPage, { store, localVue, attachTo: elem })
    testFunction(wrapper)
    wrapper.destroy()
  })
}

describe('SelectTracksPage', () => {
  beforeEach(() => {
    // mock window.matchMedia
    const mockMatchMedia = jest.fn(() => { return { matches: false } })
    global.window.matchMedia = mockMatchMedia
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  test('Initial layout', () => {
    mountAndRunTest((wrapper) => {
      expect(wrapper.vm.currentLayout).toEqual('landscape')
    })
  })
  test('Layout after toggle', () => {
    mountAndRunTest((wrapper) => {
      wrapper.vm.toggleLayout()
      expect(wrapper.vm.currentLayout).toEqual('portrait')
    })
  })
})
