import { render, waitFor } from '@testing-library/vue'
import { Track, TrackCollection } from '@/lib/Track'
import TrackSection from '@/components/TrackSection.vue'
import { DateTime } from 'luxon'
import { describe, test, expect } from 'vitest'

const initData1 = {
  id: 1,
  name: 'Good track',
  length: 13.4,
  src: 'mysrc1',
  ascent: 134.5,
  time: DateTime.local(2017, 5, 15, 9, 10, 23),
  timelength: 3601
}

describe('TrackSection', () => {

  test('Expanded', async () => {

    const mytrack = new Track(
      initData1
    )
    const tc = new TrackCollection([mytrack])

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { findByText, getByTestId } = render(
      TrackSection,
      {
        props: {
          label: 'Long list',
          coll: tc,
          initiallyCollapsed: false
        }
      }
    )

    // check if the track section is rendered
    const trackSection = await findByText('Long list (1)')
    expect(trackSection).toBeInTheDocument()

    // check if the track card is rendered
    const track1 = await findByText('Good track')
    expect(track1).toBeInTheDocument()
    expect(await findByText('15. Mai / 0.0 km / 135 m')).toBeInTheDocument()

    // check if the collapse div is present
    const collapseDiv = getByTestId('testbcollapse')


    // click the track section to collapse the track card
    trackSection.click() //collapse

    // due to transition we need to wait for the collapse to finish
    await waitFor(() => {
      expect(collapseDiv).not.toBeVisible()
    })

  })

  // // bbug in testing library if you ask me:

  //   test('Collapsed and click', async () => {

  //     const mytrack = new Track(
  //       initData1
  //     )
  //     const tc = new TrackCollection([mytrack])

  //     // eslint-disable-next-line @typescript-eslint/unbound-method
  //     const { findByText, queryByText } = render(
  //       TrackSection,
  //       {
  //         props: {
  //           label: 'Long list',
  //           coll: tc,
  //           initiallyCollapsed: true
  //         }
  //       }
  //     )

  //     const trackSection = await findByText('Long list (1)')
  //     expect(trackSection).toBeInTheDocument()

  //     const trackName = queryByText('Good track')
  //     expect(trackName).not.toBeInTheDocument()

  //     trackSection.click() // expand

  //     const trackNameAfterClick = await findByText('Good track')
  //     expect(trackNameAfterClick).toBeInTheDocument()

  //   })
})
