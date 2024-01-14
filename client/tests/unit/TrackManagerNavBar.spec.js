import { render } from '@testing-library/vue'
import TrackManagerNavBarVue from '@/components/TrackManagerNavBar.vue'
import { test, expect, describe } from 'vitest'
import { createTestingPinia } from '@pinia/testing'



describe('NavBar', () => {

  test('NavBarSimple', () => {

    const rresult = render(TrackManagerNavBarVue, {
      props: {
        sid: "mysid"
      },
      global: {
        plugins: [createTestingPinia()],
      }
    })

    expect(rresult.getByText('Login')).toBeInTheDocument();
  })

})
