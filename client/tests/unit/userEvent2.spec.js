import { render } from '@testing-library/vue'
import HelloBoot from '@/components/HelloBoot.vue'
import userEvent from '@testing-library/user-event'

describe('userevent', () => {
  test('one', async () => {
    const user = userEvent.setup()
    const r = render(HelloBoot)
    const h1 = await r.findByText('Welcome')
    user.click(h1)
  })
})
