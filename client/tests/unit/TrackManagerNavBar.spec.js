import { createRouterMock, injectRouterMock } from 'vue-router-mock'
import { render } from '@testing-library/vue'
import TrackManagerNavBarVue from '@/components/TrackManagerNavBar.vue'
import { beforeEach, describe } from 'node:test'

describe('NavBar', () => {

  const router = createRouterMock({
    // ...
  })

  beforeEach(() => {
    injectRouterMock(router)
  })

  test('NavBarSimple', async () => {
    const { getByLabelText } = render(TrackManagerNavBarVue, {
      props: {
        sid: "mysid"
      }
    })

    expect(getByLabelText('Toggle navigation')).toBeInTheDocument();
  })

})
