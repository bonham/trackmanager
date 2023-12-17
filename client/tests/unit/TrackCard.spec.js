import { render } from '@testing-library/vue'
import { Track } from '@/lib/Track'
import TrackCard from '@/components/TrackCard.vue'
import { DateTime } from 'luxon'

import { describe, test, expect } from 'vitest'

describe('TrackCard', () => {
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
    const { findByText } = render(
      TrackCard,
      {
        props: { track: mytrack }
      }
    )

    expect(await findByText('Good track')).toBeInTheDocument()
    expect(await findByText('15. Mai / 0.01 km / 135 m / 1:00 h / 3601 s / 0 km/h avg.')).toBeInTheDocument()
  })
})
