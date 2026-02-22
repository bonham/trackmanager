import { render, fireEvent, waitFor } from '@testing-library/vue'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { Request, Response } from 'cross-fetch'
import { createRouter, createMemoryHistory } from 'vue-router'

// Stub MapComponent to avoid OpenLayers dependency in unit tests
vi.mock('@/components/MapComponent.vue', () => ({
  default: {
    name: 'MapComponent',
    template: '<div data-testid="map-stub"></div>',
    props: ['sid'],
  },
}))

// Mock trackServices
vi.mock('@/lib/trackServices', () => ({
  getTrackById: vi.fn(),
  updateTrackById: vi.fn(),
}))

import { getTrackById, updateTrackById } from '@/lib/trackServices'
import { Track } from '@/lib/Track'
import TrackDetailPage from '@/views/TrackDetailPage.vue'
import { useMapStateStore } from '@/stores/mapstate'
import { useUserLoginStore } from '@/stores/userlogin'

const mockTrackData = {
  id: 404,
  name: 'Saupferchweg',
  length: 46238,
  length_calc: 47777,
  src: '20210919_Muellerweg.gpx',
  time: '2021-09-19T14:35:14.000Z',
  timelength: 8470,
  timelength_calc: 8500,
  ascent: 866,
  ascent_calc: 877,
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/track/:id/sid/:sid',
        name: 'TrackDetailPage',
        component: TrackDetailPage,
        props: (route) => ({
          sid: route.params.sid,
          id: Number(route.params.id),
        }),
      },
      { path: '/', name: 'Home', component: { template: '<div>home</div>' } },
    ],
  })
}

function renderTrackDetailPage(options: { loggedIn?: boolean } = {}) {
  const pinia = createTestingPinia({ stubActions: false })

  // Set up login state before rendering
  if (options.loggedIn) {
    const loginStore = useUserLoginStore(pinia)
    loginStore.username = 'testuser'
  }

  const router = createTestRouter()

  return {
    result: render(TrackDetailPage, {
      props: { sid: 'abcd1234', id: 404 },
      global: {
        plugins: [pinia, router],
      },
    }),
    pinia,
    router,
  }
}

describe('TrackDetailPage', () => {
  beforeEach(() => {
    vi.stubGlobal('Request', Request)
    vi.stubGlobal('Response', Response)
    vi.mocked(getTrackById).mockResolvedValue(new Track(mockTrackData))
    vi.mocked(updateTrackById).mockResolvedValue(true)
  })

  test('renders track headline after loading', async () => {
    const { result } = renderTrackDetailPage()
    expect(await result.findByText('Saupferchweg')).toBeInTheDocument()
  })

  test('renders track distance in details', async () => {
    const { result } = renderTrackDetailPage()
    // length_calc 47777 => 47.8 km
    expect(await result.findByText(/47\.8 km/)).toBeInTheDocument()
  })

  test('renders track ascent in details', async () => {
    const { result } = renderTrackDetailPage()
    // ascent_calc 877 => "877 m /"
    expect(await result.findByText(/877 m/)).toBeInTheDocument()
  })

  test('calls getTrackById with correct id and sid', async () => {
    const { result } = renderTrackDetailPage()
    await result.findByText('Saupferchweg')
    expect(vi.mocked(getTrackById)).toHaveBeenCalledWith(404, 'abcd1234')
  })

  test('sets mapStateStore.loadCommand for the track', async () => {
    const { result, pinia } = renderTrackDetailPage()
    await result.findByText('Saupferchweg')
    const mapStateStore = useMapStateStore(pinia)
    await waitFor(() => {
      expect(mapStateStore.loadCommand).toEqual({
        command: 'track',
        payload: 404,
        zoomOut: true,
      })
    })
  })

  test('close button calls router.back', async () => {
    const { result, router } = renderTrackDetailPage()
    await result.findByText('Saupferchweg')

    const backSpy = vi.spyOn(router, 'back').mockImplementation(() => undefined)
    const closeButton = result.getByRole('button', { name: /close/i })
    await fireEvent.click(closeButton)
    expect(backSpy).toHaveBeenCalledTimes(1)
  })

  test('shows plain span headline when user is not logged in', async () => {
    const { result } = renderTrackDetailPage({ loggedIn: false })
    const headline = await result.findByText('Saupferchweg')
    // Should be a plain span, not within an editable-text that has pencil button
    expect(headline.tagName).toBe('SPAN')
  })

  test('shows EditableText headline when user is logged in', async () => {
    const { result } = renderTrackDetailPage({ loggedIn: true })
    await result.findByText('Saupferchweg')
    // EditableText renders a contenteditable-like element; check pencil icon area exists
    const container = result.container
    // The pencil icon is rendered by EditableText when loggedIn
    const editableText = container.querySelector('.editable-text-pencil')
    expect(editableText).toBeInTheDocument()
  })

  test('falls back gracefully when track is not found', async () => {
    vi.mocked(getTrackById).mockResolvedValue(null)
    const { result } = renderTrackDetailPage()
    await waitFor(() => {
      expect(result.getByText('unknown')).toBeInTheDocument()
    })
  })

  test('renders the map stub', () => {
    const { result } = renderTrackDetailPage()
    expect(result.getByTestId('map-stub')).toBeInTheDocument()
  })

  test('processHeadlineUpdate - calls updateTrackById on EditableText save', async () => {
    const { result } = renderTrackDetailPage({ loggedIn: true })
    await result.findByText('Saupferchweg')

    // Click the "Click to edit" button to activate edit mode
    const editButton = result.getByRole('button', { name: /click to edit/i })
    await fireEvent.click(editButton)

    // Change the input value
    const input = result.getByRole('textbox')
    await fireEvent.change(input, { target: { value: 'New Track Name' } })

    // Blur to trigger save
    await fireEvent.blur(input)

    await waitFor(() => {
      expect(vi.mocked(updateTrackById)).toHaveBeenCalledWith(
        404,
        { name: 'New Track Name' },
        'abcd1234',
      )
    })
  })

  test('processHeadlineUpdate - handles updateTrackById returning false', async () => {
    vi.mocked(updateTrackById).mockResolvedValue(false)
    const { result } = renderTrackDetailPage({ loggedIn: true })
    await result.findByText('Saupferchweg')

    const editButton = result.getByRole('button', { name: /click to edit/i })
    await fireEvent.click(editButton)

    const input = result.getByRole('textbox')
    await fireEvent.change(input, { target: { value: 'Bad Name' } })
    await fireEvent.blur(input)

    await waitFor(() => {
      expect(vi.mocked(updateTrackById)).toHaveBeenCalled()
    })
  })

  test('getTrackById error is caught gracefully', async () => {
    vi.mocked(getTrackById).mockRejectedValue(new Error('Network error'))
    // Should not throw - the component catches errors in the promise chain
    const { result } = renderTrackDetailPage()
    // Wait for the component to settle - no crash expected
    await new Promise((r) => setTimeout(r, 100))
    expect(result.container).toBeTruthy()
  })

  test('checkLongPress changes card class after 1 second', async () => {
    vi.useFakeTimers()
    const { result } = renderTrackDetailPage()
    await result.findByText('Saupferchweg')

    const card = result.container.querySelector('.card')
    expect(card).toBeInTheDocument()

    await fireEvent.pointerDown(card!)
    vi.advanceTimersByTime(1100)
    await waitFor(() => {
      expect(card).toHaveClass('text-primary')
    })

    vi.useRealTimers()
  })

  test('release clears the long press timer', async () => {
    vi.useFakeTimers()
    const { result } = renderTrackDetailPage()
    await result.findByText('Saupferchweg')

    const card = result.container.querySelector('.card')
    expect(card).toBeInTheDocument()

    await fireEvent.pointerDown(card!)
    // Release before timeout fires
    await fireEvent.pointerUp(card!)
    vi.advanceTimersByTime(1100)

    // class should NOT have changed since we released before the timeout
    expect(card).not.toHaveClass('text-primary')

    vi.useRealTimers()
  })

  test('processHeadlineUpdate - handles updateTrackById throwing', async () => {
    vi.mocked(updateTrackById).mockRejectedValue(new Error('Server error'))
    const { result } = renderTrackDetailPage({ loggedIn: true })
    await result.findByText('Saupferchweg')

    const editButton = result.getByRole('button', { name: /click to edit/i })
    await fireEvent.click(editButton)

    const input = result.getByRole('textbox')
    await fireEvent.change(input, { target: { value: 'Throw Name' } })
    await fireEvent.blur(input)

    // Should not crash - error is caught internally
    await waitFor(() => {
      expect(vi.mocked(updateTrackById)).toHaveBeenCalled()
    })
  })
})
