import './mockJsdom'
import fetchMock from 'jest-fetch-mock'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import SelectTracksPage from '@/views/SelectTracksPage.vue'

fetchMock.enableMocks()

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

    fetch.resetMocks()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })
  test('Initial layout', () => {
    fetch.mockResponseOnce(JSON.stringify(
      [
        {
          id: 404,
          name: 'Königsstuhl Saupfercheckweg',
          length: 46238.20565667874,
          src: '20210919_Königsstuhl_Saupfercheckweg.gpx',
          time: '2021-09-19T14:35:14.000Z',
          timelength: 8470,
          ascent: 866.7277609999995
        }
      ]
    ))
    return mountAndRunTest((wrapper) => {
      expect(wrapper.vm.currentOrientation).toEqual('landscape')
      wrapper.vm.setLayout('landscape')
      expect(wrapper.vm.currentOrientation).toEqual('landscape')
    })
  })
  test('Layout after toggle', () => {
    fetch.mockResponseOnce(JSON.stringify(
      [
        {
          id: 404,
          name: 'Königsstuhl Saupfercheckweg',
          length: 46238.20565667874,
          src: '20210919_Königsstuhl_Saupfercheckweg.gpx',
          time: '2021-09-19T14:35:14.000Z',
          timelength: 8470,
          ascent: 866.7277609999995
        }
      ]
    ))

    return mountAndRunTest((wrapper) => {
      wrapper.vm.setLayout('portrait')
      expect(wrapper.vm.currentOrientation).toEqual('portrait')
    })
  })
})
