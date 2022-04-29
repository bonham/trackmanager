import { render } from '@testing-library/vue'
import App from '@/App'
import store from '@/store'
import '@testing-library/jest-dom'
import TrackOverviewPage from '@/views/TrackOverviewPage'
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

const routes = [
  { path: '/toverview/sid/8pz22a_fake', component: TrackOverviewPage }

]

describe('TrackOverview 2', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })
  test('pushed', async () => {
    fetch.mockResponse(responseMockFunction)
    const vue = new Vue()
    const { findByText, debug } = render(App, { routes, store, vue }, (vue, store, router) => {
      router.push('/toverview/sid/8pz22a_fake')
    })
    await findByText('Track Overview')
    await findByText('2021')
    await findByText('Saupferchweg')
    debug()
  })
})
