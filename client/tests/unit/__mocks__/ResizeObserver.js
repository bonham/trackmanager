import { vi } from 'vitest'

const ResizeObserverMock = vi.fn(() => {
  return {
    default: vi.fn(() => {
      return {}
    }),
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }
})

// class ResizeObserverMock {
//   observe () {}

//   unobserve () {
//     // do nothing
//   }

//   disconnect () {
//     // do nothing
//   }
// }

// window.ResizeObserver = ResizeObserver
export default ResizeObserverMock
