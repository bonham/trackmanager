// import './mockJsdom'
import { describe, test, jest, beforeEach } from 'vitest'
import fetchMock from 'jest-fetch-mock'
import { render, fireEvent } from '@testing-library/vue'
import SelectTracksPage from '@/views/SelectTracksPage'
import ResizeObserver from './__mocks__/ResizeObserver'
import store from '@/store'
import { responseMockFunction } from './mockResponse'

// window. matchMedia
const mockMatchMedia = jest.fn()
mockMatchMedia.mockReturnValueOnce({ matches: true })
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia
})

fetchMock.enableMocks()

describe('SelectTracksPage - DOM testing', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
    global.ResizeObserver = ResizeObserver
  })
  afterEach(() => {
  })
  test('Load Tracks of 2021', async () => {
    fetch.mockResponse(responseMockFunction)

    const rresult = render(
      SelectTracksPage, {
        props: { sid: 'abcd1234' },
        store
      })
    const button = await rresult.findByText('2021')
    await fireEvent.click(button)
    await rresult.findByText('Saupferchweg,')
  })
})
