import { render } from '@testing-library/vue'
import TrackManagerNavBarVue from '@/components/TrackManagerNavBar.vue'
import { test, expect, describe, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'

let CustomStub


describe('NavBar', () => {
  beforeEach(() => {
    CustomStub = {
      template: '<p>Nothing</p>',
    }
  })
  test('NavBarSimple', async () => {

    const { getByLabelText } = render(TrackManagerNavBarVue, {
      props: {
        sid: "mysid"
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          RouterLink: CustomStub
        }
      }
    })

    expect(getByLabelText('Toggle navigation')).toBeInTheDocument();
  })

})
