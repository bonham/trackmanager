import { render, fireEvent } from '@testing-library/vue'
import { store } from '../../src/store.js'
import TrackOverviewPage from '@/views/TrackOverviewPage.vue'
import TrackDetailPage from '@/views/TrackDetailPage.vue'
import { vi, describe, test, beforeEach } from 'vitest'
import { mockFetch } from './mockResponse.js'
import { createStore } from 'vuex'

// const routes = [
//   { path: '/toverview/sid/:sid', component: TrackOverviewPage, props: true },
//   { path: '/track/:id/sid/:sid', component: TrackDetailPage, props: true }

// ]

describe.skip('TrackOverview and TrackDetail', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })
  test('Render overview page', async () => {
    const storeInstance = createStore(store)
    const { findByText } = render(
      TrackOverviewPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [storeInstance]
        }
      }
    )
    await findByText('Track Overview')
    await findByText('2021')
    await findByText('Saupferchweg')
  })

  test('Navigate to detail page', async () => {
    const storeInstance = createStore(store)
    const { findAllByRole, findByText, findByTitle } = render(
      TrackDetailPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [storeInstance]
        }
      }
    )
    await findByText('Saupferchweg')

    // find all hyperlinks
    const allLinks = await findAllByRole('link')

    // find <a href ...> tag with a chevron arrow as child
    const found = allLinks.find(element => {
      const c = element.firstElementChild
      if (c === null) { return false }
      const a = c.getAttribute('aria-label')
      if (a === 'chevron right') {
        return true
      }
      return false
    })

    // click on detail
    await fireEvent.click(found)
    await findByText('Track 404 Details')
    // check if map is rendered
    await findByTitle('Zoom in')
  })
})
