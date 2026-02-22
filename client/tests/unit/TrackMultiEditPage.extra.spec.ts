/**
 * Additional TypeScript tests for TrackMultiEditPage covering
 * processNameUpdate and nameFromSrc failure paths which require
 * direct service mocking rather than fetch mocking.
 */
import { render, fireEvent, waitFor } from '@testing-library/vue'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import ResizeObserverMock from './__mocks__/ResizeObserver'

vi.mock('@/lib/trackServices', () => ({
  getAllTracks: vi.fn(),
  getTrackById: vi.fn(),
  updateTrackById: vi.fn(),
  updateNameFromSource: vi.fn(),
  deleteTrack: vi.fn(),
}))

import {
  getAllTracks,
  getTrackById,
  updateTrackById,
  updateNameFromSource,
  deleteTrack,
} from '@/lib/trackServices'
import { Track } from '@/lib/Track'
import TrackMultiEditPage from '@/views/TrackMultiEditPage.vue'

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

function renderPage() {
  return render(TrackMultiEditPage, {
    props: { sid: 'abcd1234' },
    global: {
      plugins: [createTestingPinia()],
    },
  })
}

describe('TrackMultiEditPage (service-mocked)', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.mocked(getAllTracks).mockResolvedValue([new Track(mockTrackData)])
    vi.mocked(updateTrackById).mockResolvedValue(true)
    vi.mocked(updateNameFromSource).mockResolvedValue(true)
    vi.mocked(getTrackById).mockResolvedValue(new Track({ ...mockTrackData, name: '20210919_Muellerweg.gpx' }))
    vi.mocked(deleteTrack).mockResolvedValue(true)
  })

  test('renders track table with track data', async () => {
    const result = renderPage()
    expect(await result.findByText('Saupferchweg')).toBeInTheDocument()
    expect(result.getByText('Edit Tracks')).toBeInTheDocument()
  })

  test('processNameUpdate success - updates item name in table', async () => {
    const result = renderPage()
    await result.findByText('Saupferchweg')

    // Click the "Click to edit" button in the Name column
    const editButton = result.getByRole('button', { name: /click to edit/i })
    await fireEvent.click(editButton)

    const input = result.getByRole('textbox')
    await fireEvent.change(input, { target: { value: 'Renamed Track' } })
    await fireEvent.blur(input)

    await waitFor(() => {
      expect(vi.mocked(updateTrackById)).toHaveBeenCalledWith(
        404,
        { name: 'Renamed Track' },
        'abcd1234',
      )
    })
  })

  test('processNameUpdate failure - updateTrackById returns false', async () => {
    vi.mocked(updateTrackById).mockResolvedValue(false)
    const result = renderPage()
    await result.findByText('Saupferchweg')

    const editButton = result.getByRole('button', { name: /click to edit/i })
    await fireEvent.click(editButton)

    const input = result.getByRole('textbox')
    await fireEvent.change(input, { target: { value: 'Fail Name' } })
    await fireEvent.blur(input)

    await waitFor(() => {
      expect(vi.mocked(updateTrackById)).toHaveBeenCalled()
    })
  })

  test('nameFromSrc failure - updateNameFromSource returns false', async () => {
    vi.mocked(updateNameFromSource).mockResolvedValue(false)
    const result = renderPage()
    await result.findByText('Saupferchweg')

    const cleanButton = await result.findByRole('button', { name: 'updateName' })
    await fireEvent.click(cleanButton)

    await waitFor(() => {
      expect(vi.mocked(updateNameFromSource)).toHaveBeenCalledWith(404, 'abcd1234')
    })
    // Name should remain unchanged since update failed
    expect(result.queryByText('Renamed Track')).not.toBeInTheDocument()
  })

  test('nameFromSrc failure - getTrackById returns null after update', async () => {
    vi.mocked(updateNameFromSource).mockResolvedValue(true)
    vi.mocked(getTrackById).mockResolvedValue(null)

    const result = renderPage()
    await result.findByText('Saupferchweg')

    const cleanButton = await result.findByRole('button', { name: 'updateName' })
    await fireEvent.click(cleanButton)

    await waitFor(() => {
      expect(vi.mocked(getTrackById)).toHaveBeenCalled()
    })
    // name stays as is since getTrackById returned null
    expect(result.queryByText('Renamed track')).not.toBeInTheDocument()
  })

  test('delete track removes row from table', async () => {
    const result = renderPage()
    await result.findByText('Saupferchweg')

    const deleteButton = result.getByRole('button', { name: 'delete' })
    await fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(result.queryByText('Saupferchweg')).not.toBeInTheDocument()
    })
    expect(vi.mocked(deleteTrack)).toHaveBeenCalledWith(404, 'abcd1234')
  })

  test('processNameUpdate - handles updateTrackById throwing an error', async () => {
    vi.mocked(updateTrackById).mockRejectedValue(new Error('Network error'))
    const result = renderPage()
    await result.findByText('Saupferchweg')

    const editButton = result.getByRole('button', { name: /click to edit/i })
    await fireEvent.click(editButton)

    const input = result.getByRole('textbox')
    await fireEvent.change(input, { target: { value: 'Error Case' } })
    await fireEvent.blur(input)

    // Should not crash - error is caught internally in processNameUpdate
    await waitFor(() => {
      expect(vi.mocked(updateTrackById)).toHaveBeenCalled()
    })
  })
})
