import { render } from '@testing-library/vue'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { waitFor } from '@testing-library/vue'

// Mock chartjs modules before importing the component
vi.mock('chart.js', () => {
  class MockChart {
    data: { datasets: unknown[] } = { datasets: [] }
    update = vi.fn()
    destroy = vi.fn()
    static register = vi.fn()
  }
  return {
    Chart: MockChart,
    LineController: {},
    LineElement: {},
    PointElement: {},
    Colors: {},
    TimeScale: {},
    LinearScale: {},
    Legend: {},
    Tooltip: {},
  }
})

vi.mock('chartjs-adapter-luxon', () => ({}))
vi.mock('chartjs-plugin-zoom', () => ({ default: {} }))

// Mock trackServices
vi.mock('@/lib/trackServices', () => ({
  getAllTracks: vi.fn(),
}))

import { getAllTracks } from '@/lib/trackServices'
import { Track } from '@/lib/Track'
import ProgressChart from '@/views/ProgressChart.vue'

const mockTrackData = [
  {
    id: 1,
    name: 'Spring Ride',
    length: 30000,
    length_calc: 30500,
    src: '20230415_SpringRide.gpx',
    time: '2023-04-15T10:00:00.000Z',
    timelength: 5400,
    timelength_calc: 5500,
    ascent: 400,
    ascent_calc: 410,
  },
  {
    id: 2,
    name: 'Summer Run',
    length: 15000,
    length_calc: 15200,
    src: '20230620_SummerRun.gpx',
    time: '2023-06-20T08:30:00.000Z',
    timelength: 4200,
    timelength_calc: 4300,
    ascent: 200,
    ascent_calc: 205,
  },
  {
    id: 3,
    name: null,
    length: 20000,
    length_calc: null,
    src: '20220810_FallTrek.gpx',
    time: '2022-08-10T09:00:00.000Z',
    timelength: null,
    timelength_calc: null,
    ascent: null,
    ascent_calc: null,
  },
]

function renderProgressChart(sid = 'testSid') {
  return render(ProgressChart, {
    props: { sid },
    global: {
      plugins: [createTestingPinia()],
    },
  })
}

describe('ProgressChart', () => {
  beforeEach(() => {
    vi.mocked(getAllTracks).mockResolvedValue(
      mockTrackData.map((d) => new Track(d))
    )
  })

  test('shows loading spinner while tracks are loading', () => {
    // Delay resolution so spinner is visible during render
    vi.mocked(getAllTracks).mockReturnValue(new Promise(() => undefined))
    const { getByText } = renderProgressChart()
    expect(getByText('Loading')).toBeInTheDocument()
  })

  test('hides loading spinner after tracks are loaded', async () => {
    const { queryByText } = renderProgressChart()
    await waitFor(() => {
      expect(queryByText('Loading')).not.toBeInTheDocument()
    })
  })

  test('calls getAllTracks with the provided sid', async () => {
    renderProgressChart('mySid123')
    await waitFor(() => {
      expect(vi.mocked(getAllTracks)).toHaveBeenCalledWith('mySid123')
    })
  })

  test('renders canvas element', () => {
    const { container } = renderProgressChart()
    const canvas = container.querySelector('canvas#acquisitions')
    expect(canvas).toBeInTheDocument()
  })

  test('accepts empty sid prop (defaults to empty string)', async () => {
    const { queryByText } = render(ProgressChart, {
      global: { plugins: [createTestingPinia()] },
    })
    await waitFor(() => {
      expect(queryByText('Loading')).not.toBeInTheDocument()
    })
    expect(vi.mocked(getAllTracks)).toHaveBeenCalledWith('')
  })
})
