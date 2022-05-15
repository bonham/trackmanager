import { render } from '@testing-library/vue'
import HelloWorld from '@/components/HelloWorld.vue'
import userEvent from '@testing-library/user-event'

describe('userevent', () => {
  test('works', async () => {
    const user = userEvent.setup()
    const r = render(HelloWorld)
    const h1 = await r.findByText('Welcome')
    user.click(h1)
  })
  test('fails', async () => {
    const user = userEvent.setup()
    const r = render(HelloWorld)
    const h1 = await r.findByText('Welcome')
    await user.click(h1)
  })
})
