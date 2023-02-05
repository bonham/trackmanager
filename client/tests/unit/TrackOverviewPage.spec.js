import { render, fireEvent } from '@testing-library/vue'
import App from '@/App.vue'
import store from '@/store'
import '@testing-library/jest-dom'
import TrackOverviewPage from '@/views/TrackOverviewPage.vue'
import TrackDetailPage from '@/views/TrackDetailPage.vue'
import fetchMock from 'jest-fetch-mock'
import { responseMockFunction } from './mockResponse'

fetchMock.enableMocks()

const fakeSid = 'abcd1234'
const routes = [
  { path: '/toverview/sid/:sid', component: TrackOverviewPage, props: true },
  { path: '/track/:id/sid/:sid', component: TrackDetailPage, props: true }

]

describe('TrackOverview and TrackDetail', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })
  test('Render overview page', async () => {
    fetch.mockResponse(responseMockFunction)
    const { findByText } = render(App, { routes, store }, (vue, store, router) => {
      router.push(`/toverview/sid/${fakeSid}`)
    })
    await findByText('Track Overview')
    await findByText('2021')
    await findByText('Saupferchweg')
  })

  test('Navigate to detail page', async () => {
    fetch.mockResponse(responseMockFunction)
    const { findAllByRole, findByText, findByTitle } = render(App, { routes, store }, (vue, store, router) => {
      router.push(`/toverview/sid/${fakeSid}`)
    })
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
