import './mockJsdom'
import { expect } from 'chai'
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
    const mockMatchMedia = () => { return { matches: false } }
    global.window.matchMedia = mockMatchMedia
  })
  it('Initial layout', () => {
    return mountAndRunTest((wrapper) => {
      expect(wrapper.vm.currentOrientation).to.deep.equal('landscape')
      wrapper.vm.setLayout('landscape')
      expect(wrapper.vm.currentOrientation).to.deep.equal('landscape')
    })
  })
  it('Layout after toggle', () => {
    return mountAndRunTest((wrapper) => {
      wrapper.vm.setLayout('portrait')
      expect(wrapper.vm.currentOrientation).to.deep.equal('portrait')
    })
  })
})
