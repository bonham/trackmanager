import { render } from '@testing-library/vue'
// import userEvent from '@testing-library/user-event'
import router from '../../src/router'
import { vi, describe, test, beforeEach, expect } from 'vitest'
import { mockFetch } from './mockResponse.js'
import { Request } from 'cross-fetch'

import TrackOverviewPage from '@/views/TrackOverviewPage.vue'
// import TrackDetailPage from '@/views/TrackDetailPage.vue'

describe('TrackOverview and TrackDetail', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })
  test('Render overview page', async () => {
    const { findByText } = render(
      TrackOverviewPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [router]
        }
      }
    )
    expect(await findByText('Track Overview')).toBeInTheDocument()
    await findByText('2021')
    await findByText('Saupferchweg')
    // debug()
  })

  test('Navigate to detail page', async () => {
    vi.stubGlobal('Request', Request)
    vi.stubGlobal('fetch', mockFetch)
    // const user = userEvent.setup()

    const { findAllByRole, findByText } = render(
      TrackOverviewPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [router]
        }
      }
    )
    expect(await findByText('Track Overview')).toBeInTheDocument()

    await findByText('Saupferchweg')

    // find all hyperlinks
    const allLinks = await findAllByRole('link')
    expect(allLinks.length).toBeGreaterThan(0)

    // find hyperlink with aria label
    const found = allLinks.find(el => el.getAttribute('aria-label') === 'link-to-track-404')
    expect(found).toBeDefined()

    const link = found
    expect(link.pathname).toMatch(/\/track\/404\/sid\/abcd1234$/)

    // await user.click(link)
    // debug()

    // click on detail
    // await fireEvent.click(link)
    // expect(await findByText('Track 404 Details')).toBeInTheDocument()
    // check if map is rendered
    // await findByTitle('Zoom in')
  })
})
