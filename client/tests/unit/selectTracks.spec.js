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
    const ResizeObserverMock = jest.fn(() => { return { observe: () => {}, unobserve: () => {} } })
    global.window.ResizeObserver = ResizeObserverMock
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  test('Initial layout', () => {
    return mountAndRunTest((wrapper) => {
      expect(wrapper.vm.currentOrientation).toEqual('landscape')
      wrapper.vm.setLayout('landscape')
      expect(wrapper.vm.currentOrientation).toEqual('landscape')
    })
  })
  test('Layout after toggle', () => {
    return mountAndRunTest((wrapper) => {
      wrapper.vm.setLayout('portrait')
      expect(wrapper.vm.currentOrientation).toEqual('portrait')
    })
  })
})
