import { render } from '@testing-library/vue'
import { Track, TrackCollection } from '@/lib/Track'
import TrackSection from '@/components/TrackSection.vue'
import { DateTime } from 'luxon'

describe('TrackSection', () => {
  test('Simple', async () => {
    const initData1 = {
      id: 1,
      name: 'Good track',
      length: 13.4,
      src: 'mysrc1',
      ascent: 134.5,
      time: DateTime.local(2017, 5, 15, 9, 10, 23),
      timelength: 3601
    }

    const mytrack = new Track(
      initData1
    )
    const tc = new TrackCollection([mytrack])

    const { findByText } = render(
      TrackSection,
      {
        props: {
          label: 'Long list',
          coll: tc,
          collapsed: false
        }
      }
    )

    expect(await findByText('Long list')).toBeInTheDocument()
    expect(await findByText('Good track')).toBeInTheDocument()
    expect(await findByText('15. Mai / 0.01 km / 135 m / 1:00 h')).toBeInTheDocument()
  })
})
