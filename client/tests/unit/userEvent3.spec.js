import { render } from '@testing-library/vue'
import EditableText from '@/components/EditableText.vue'
import userEvent from '@testing-library/user-event'

describe('userevent', () => {
  test('one', async () => {
    const mockUpdateFunc = jest.fn()
    const user = userEvent.setup()
    const r = render(EditableText, {
      props: {
      }
    })
    const editableField = await r.findByText('No Name')
    const returnval = user.click(editableField)
    console.log('XX', returnval)
    user.keyboard('{selectall}newvalue{Enter}')
    expect(mockUpdateFunc.mock.calls.length).toBe(1)
    expect(mockUpdateFunc.mock.calls[0][0]).toEqual('newvalue')
  })
})
