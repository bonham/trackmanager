import './mockJsdom'
import { render, fireEvent } from '@testing-library/vue'
import App from '@/App'
import store from '@/store'
import '@testing-library/jest-dom'
import TrackOverviewPage from '@/views/TrackOverviewPage'
import TrackDetailPage from '@/views/TrackDetailPage'
import fetchMock from 'jest-fetch-mock'
import { responseMockFunction } from './mockResponse'

/// / vue
import Vue from 'vue'

// import { BootstrapVue } from 'bootstrap-vue'
import { LayoutPlugin, NavbarPlugin, ButtonPlugin, LinkPlugin } from 'bootstrap-vue'
Vue.use(LayoutPlugin)
Vue.use(NavbarPlugin)
Vue.use(ButtonPlugin)
Vue.use(LinkPlugin)
/// / vue end

fetchMock.enableMocks()

const fakeSid = 'abcd1234'
const routes = [
  { path: '/toverview/sid/:sid', component: TrackOverviewPage, props: true },
  { path: '/track/:id/sid/:sid', component: TrackDetailPage, props: true }

]

describe('TrackOverview 2', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })
  test('Render overview page', async () => {
    fetch.mockResponse(responseMockFunction)
    const vue = new Vue()
    const { findByText } = render(App, { routes, store, vue }, (vue, store, router) => {
      router.push(`/toverview/sid/${fakeSid}`)
    })
    await findByText('Track Overview')
    await findByText('2021')
    await findByText('Saupferchweg')
    // debug()
  })

  test('Navigate to detail page', async () => {
    fetch.mockResponse(responseMockFunction)
    const vue = new Vue()
    const { findAllByRole, findByText, findByTitle } = render(App, { routes, store, vue }, (vue, store, router) => {
      router.push(`/toverview/sid/${fakeSid}`)
    })
    await findByText('Saupferchweg')

    // find all hyperlinks
    const allLinks = await findAllByRole('link')
    // const selectLink = allLinks[0]

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
    await findByTitle('Zoom in')
  })
})
