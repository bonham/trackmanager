import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import EditableText from '@/components/EditableText.vue'

describe('EditableText', () => {
  test('Simple', async () => {
    const mockUpdateFunc = jest.fn()
    render(
      EditableText, {
        props: {
          updateFunction: mockUpdateFunc,
          initialtext: 'hello text'
        }
      })
    const editableField = await screen.findByText('hello text')
    await userEvent.click(editableField)
    await userEvent.keyboard('{selectall}newvalue{Enter}')
    expect(mockUpdateFunc.mock.calls.length).toBe(1)
    expect(mockUpdateFunc.mock.calls[0][0]).toEqual('newvalue')
  })
  test('Emtpy', async () => {
    const mockUpdateFunc = jest.fn()
    render(
      EditableText, {
        props: {
          updateFunction: mockUpdateFunc
        }
      })
    const editableField = await screen.findByText('No Name')
    await userEvent.click(editableField)
    await userEvent.keyboard('newvalue{Enter}')
    expect(mockUpdateFunc.mock.calls.length).toBe(1)
    expect(mockUpdateFunc.mock.calls[0][0]).toEqual('newvalue')
  })
})
