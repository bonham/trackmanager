import { render } from '@testing-library/vue'
// import userEvent from '@testing-library/user-event'
import router from '../../src/router'
import { vi, describe, test, beforeEach, expect } from 'vitest'
import { mockFetch } from './mockResponse.js'
import { Request } from 'cross-fetch'
import { createTestingPinia } from '@pinia/testing'

import TrackOverviewPage from '@/views/TrackOverviewPage.vue'
// import TrackDetailPage from '@/views/TrackDetailPage.vue'

describe('TrackOverview and TrackDetail', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })
  test('Render overview page', async () => {
    const rresult = render(
      TrackOverviewPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [createTestingPinia(), router]
        },
      }
    )

    await rresult.findByText('2021')
    await rresult.findByText('Saupferchweg')
    // debug()
  })

  test('Navigate to detail page', async () => {
    vi.stubGlobal('Request', Request)
    vi.stubGlobal('fetch', mockFetch)
    // const user = userEvent.setup()

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { findAllByRole, findByText } = render(
      TrackOverviewPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [router]
        }
      }
    )

    await findByText('Saupferchweg')

    // find all hyperlinks
    const allLinks = await findAllByRole('link')
    expect(allLinks.length).toBeGreaterThan(0)

    // find hyperlink with aria label
    const found = allLinks.find(el => el.getAttribute('aria-label') === 'link-to-track-404')
    expect(found).toBeDefined()

    // await user.click(link)
    // debug()

    // click on detail
    // await fireEvent.click(link)
    // expect(await findByText('Track 404 Details')).toBeInTheDocument()
    // check if map is rendered
    // await findByTitle('Zoom in')
  })
})
