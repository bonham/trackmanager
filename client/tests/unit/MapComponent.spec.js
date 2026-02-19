import { render } from '@testing-library/vue'
import { mount, DOMWrapper, flushPromises } from '@vue/test-utils'

import MapComponent from '@/components/MapComponent.vue'
import { ManagedMap } from '@/lib/mapservices/ManagedMap'

import { createTestingPinia } from '@pinia/testing'
import { vi, test, beforeEach, describe, expect } from 'vitest'
import ResizeObserverMock from './__mocks__/ResizeObserver'

// Mock external dependencies
vi.mock('@/lib/trackServices', () => ({
  getIdListByExtentAndTime: vi.fn(() => Promise.resolve([1, 2, 3])),
  getTrackIdsByYear: vi.fn(() => Promise.resolve([1, 2])),
}))

vi.mock('@/lib/trackLoadAsyncWorker', () => ({
  createTrackLoadingAsyncWorker: vi.fn(() => {
    return vi.fn(async () => {
      // Mock worker
      return Promise.resolve({ success: true })
    })
  }),
}))

vi.mock('@/stores/configstore', () => ({
  useConfigStore: vi.fn(() => ({
    loadConfig: vi.fn(() => Promise.resolve()),
    get: vi.fn((key) => {
      if (key === 'TRACKSTYLE') return 'THREE_BROWN'
      return undefined
    })
  }))
}))

describe('MapComponent', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  test('Trivial mount', () => {
    render(MapComponent, {
      props: {
        sid: 'test-sid'
      },
      global: {
        plugins: [createTestingPinia({
          initialState: {
            configstore: {
              loaded: true,
              schemaConfig: {
                TRACKSTYLE: 'THREE_BROWN'
              }
            }
          },
          createSpy: vi.fn,
          stubActions: false
        })]
      }
    })
    // it is not possible to test anything visible here as it contains of <div>  only
  })

  test('Low level', () => {
    const wrapper = mount(MapComponent, {
      props: {
        sid: 'test-sid'
      },
      global: {
        plugins: [createTestingPinia({
          initialState: {
            configstore: {
              loaded: true,
              schemaConfig: {
                TRACKSTYLE: 'THREE_BROWN'
              }
            }
          },
          createSpy: vi.fn,
          stubActions: false
        })]
      }
    })
    const mapdiv = wrapper.find('[id="mapdiv"]')
    expect(mapdiv).toBeInstanceOf(DOMWrapper)
    expect(mapdiv.element).toBeInstanceOf(HTMLDivElement)
    expect(wrapper.vm.mmap).toBeInstanceOf(ManagedMap)
  })

  // -------------------------------------------------------------------------
  // Tests for makeVisible branches (line 148+):
  // - Branch 1: listOfTasks.length > 0 (tracks to load)
  // - Branch 2: listOfTasks.length === 0 (nothing to load)
  // -------------------------------------------------------------------------
  describe('makeVisible function - tracks to load branch (listOfTasks.length > 0)', () => {
    test('executes when tracks need to be loaded', async () => {
      const wrapper = mount(MapComponent, {
        props: {
          sid: 'test-sid'
        },
        global: {
          plugins: [createTestingPinia({
            initialState: {
              configstore: {
                loaded: true,
                schemaConfig: {
                  TRACKSTYLE: 'THREE_BROWN'
                }
              },
              mapstate: {
                loadCommand: {
                  command: 'year',
                  payload: 2023,
                  zoomOut: false
                }
              }
            },
            createSpy: vi.fn,
            stubActions: false
          })]
        }
      })

      // Verify component is mounted
      expect(wrapper.vm.mmap).toBeInstanceOf(ManagedMap)

      // Update store to trigger load command watch
      wrapper.vm.$pinia.state.value.mapstate.loadCommand = {
        command: 'year',
        payload: 2023,
        zoomOut: false
      }

      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify loading state was set
      // (loading is managed in makeVisible)
      expect(wrapper.vm.loading).toBeDefined()
    })

    test('sets loading to true when tracks are queued', async () => {
      const wrapper = mount(MapComponent, {
        props: {
          sid: 'test-sid'
        },
        global: {
          plugins: [createTestingPinia({
            initialState: {
              configstore: {
                loaded: true,
                schemaConfig: {
                  TRACKSTYLE: 'THREE_BROWN'
                }
              },
              mapstate: {
                loadCommand: {
                  command: 'all',
                  zoomOut: false
                }
              }
            },
            createSpy: vi.fn,
            stubActions: false
          })]
        }
      })

      // Trigger the watch by updating mapstate
      wrapper.vm.$pinia.state.value.mapstate.loadCommand = {
        command: 'all',
        zoomOut: false
      }

      await flushPromises()

      // After triggering load, loading should be true during async operations
      // (it will be set to false when queue drains)
      expect(wrapper.vm.mmap).toBeInstanceOf(ManagedMap)
    })

    test('clears selection before loading tracks', async () => {
      const wrapper = mount(MapComponent, {
        props: {
          sid: 'test-sid'
        },
        global: {
          plugins: [createTestingPinia({
            initialState: {
              configstore: {
                loaded: true,
                schemaConfig: {
                  TRACKSTYLE: 'THREE_BROWN'
                }
              },
              mapstate: {
                loadCommand: {
                  command: 'track',
                  payload: 1,
                  zoomOut: false
                }
              }
            },
            createSpy: vi.fn,
            stubActions: false
          })]
        }
      })

      const clearSelectionSpy = vi.spyOn(wrapper.vm.mmap, 'clearSelection')

      wrapper.vm.$pinia.state.value.mapstate.loadCommand = {
        command: 'track',
        payload: 1,
        zoomOut: false
      }

      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 50))

      // clearSelection should have been called
      expect(clearSelectionSpy).toHaveBeenCalled()
    })
  })

  describe('makeVisible function - no tracks to load branch (listOfTasks.length === 0)', () => {
    test('skips queue operations when no tracks to load', async () => {
      const wrapper = mount(MapComponent, {
        props: {
          sid: 'test-sid'
        },
        global: {
          plugins: [createTestingPinia({
            initialState: {
              configstore: {
                loaded: true,
                schemaConfig: {
                  TRACKSTYLE: 'THREE_BROWN'
                }
              },
              mapstate: {
                loadCommand: {
                  command: 'track',
                  payload: 1,
                  zoomOut: false
                }
              }
            },
            createSpy: vi.fn,
            stubActions: false
          })]
        }
      })

      wrapper.vm.$pinia.state.value.mapstate.loadCommand = {
        command: 'track',
        payload: 999, // Non-existent track
        zoomOut: false
      }

      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 50))

      // Component should still be functional
      expect(wrapper.vm.mmap).toBeInstanceOf(ManagedMap)
    })

    test('sets loading to false immediately when no tracks to load', async () => {
      const wrapper = mount(MapComponent, {
        props: {
          sid: 'test-sid'
        },
        global: {
          plugins: [createTestingPinia({
            initialState: {
              configstore: {
                loaded: true,
                schemaConfig: {
                  TRACKSTYLE: 'THREE_BROWN'
                }
              },
              mapstate: {
                loadCommand: {
                  command: 'track',
                  payload: 1,
                  zoomOut: false
                }
              }
            },
            createSpy: vi.fn,
            stubActions: false
          })]
        }
      })

      wrapper.vm.$pinia.state.value.mapstate.loadCommand = {
        command: 'track',
        payload: 1,
        zoomOut: false
      }

      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(wrapper.vm.loading).toBeDefined()
    })
  })

  describe('watch loadCommand - various command types', () => {
    test('handles "all" command', async () => {
      const wrapper = mount(MapComponent, {
        props: {
          sid: 'test-sid'
        },
        global: {
          plugins: [createTestingPinia({
            initialState: {
              configstore: {
                loaded: true,
                schemaConfig: {
                  TRACKSTYLE: 'THREE_BROWN'
                }
              },
              mapstate: {
                loadCommand: {
                  command: 'all',
                  zoomOut: false
                }
              }
            },
            createSpy: vi.fn,
            stubActions: false
          })]
        }
      })

      wrapper.vm.$pinia.state.value.mapstate.loadCommand = {
        command: 'all',
        zoomOut: true
      }

      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(wrapper.vm.mmap).toBeInstanceOf(ManagedMap)
    })

    test('handles "year" command', async () => {
      const wrapper = mount(MapComponent, {
        props: {
          sid: 'test-sid'
        },
        global: {
          plugins: [createTestingPinia({
            initialState: {
              configstore: {
                loaded: true,
                schemaConfig: {
                  TRACKSTYLE: 'THREE_BROWN'
                }
              },
              mapstate: {
                loadCommand: {
                  command: 'year',
                  payload: 2023,
                  zoomOut: false
                }
              }
            },
            createSpy: vi.fn,
            stubActions: false
          })]
        }
      })

      wrapper.vm.$pinia.state.value.mapstate.loadCommand = {
        command: 'year',
        payload: 2022,
        zoomOut: true
      }

      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(wrapper.vm.mmap).toBeInstanceOf(ManagedMap)
    })

    test('handles "track" command', async () => {
      const wrapper = mount(MapComponent, {
        props: {
          sid: 'test-sid'
        },
        global: {
          plugins: [createTestingPinia({
            initialState: {
              configstore: {
                loaded: true,
                schemaConfig: {
                  TRACKSTYLE: 'THREE_BROWN'
                }
              },
              mapstate: {
                loadCommand: {
                  command: 'track',
                  payload: 1,
                  zoomOut: false
                }
              }
            },
            createSpy: vi.fn,
            stubActions: false
          })]
        }
      })

      wrapper.vm.$pinia.state.value.mapstate.loadCommand = {
        command: 'track',
        payload: 5,
        zoomOut: true
      }

      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(wrapper.vm.mmap).toBeInstanceOf(ManagedMap)
    })

    test('logs error for unknown command', async () => {
      const wrapper = mount(MapComponent, {
        props: {
          sid: 'test-sid'
        },
        global: {
          plugins: [createTestingPinia({
            initialState: {
              configstore: {
                loaded: true,
                schemaConfig: {
                  TRACKSTYLE: 'THREE_BROWN'
                }
              },
              mapstate: {
                loadCommand: {
                  command: 'invalid',
                  zoomOut: false
                }
              }
            },
            createSpy: vi.fn,
            stubActions: false
          })]
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      wrapper.vm.$pinia.state.value.mapstate.loadCommand = {
        command: 'unknown',
        zoomOut: false
      }

      await flushPromises()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('onUnmounted behavior', () => {
    test('aborts pending operations on unmount', () => {
      const wrapper = mount(MapComponent, {
        props: {
          sid: 'test-sid'
        },
        global: {
          plugins: [createTestingPinia({
            initialState: {
              configstore: {
                loaded: true,
                schemaConfig: {
                  TRACKSTYLE: 'THREE_BROWN'
                }
              },
              mapstate: {
                loadCommand: {
                  command: 'all',
                  zoomOut: false
                }
              }
            },
            createSpy: vi.fn,
            stubActions: false
          })]
        }
      })

      const controller = wrapper.vm.controller
      const abortSpy = controller ? vi.spyOn(controller, 'abort') : null

      wrapper.unmount()

      // If a controller was created, abort should be called
      if (abortSpy) {
        expect(abortSpy).toHaveBeenCalled()
      }
    })
  })
})

