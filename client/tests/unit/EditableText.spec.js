import { test, describe, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import EditableText from '@/components/EditableText.vue'

describe('EditableText', () => {
  test('Simple', async () => {
    const user = userEvent.setup()
    const mockUpdateFunc = vi.fn()
    render(
      EditableText, {
        props: {
          updateFunction: mockUpdateFunc,
          initialtext: 'hello text'
        }
      })
    const editableField = await screen.findByText('hello text')
    await user.click(editableField)
    await user.keyboard('{Control>}a{/Control}newvalue{Enter}')
    expect(mockUpdateFunc.mock.calls.length).toBe(1)
    expect(mockUpdateFunc.mock.calls[0][0]).toEqual('newvalue')
  })
  test('Emtpy', async () => {
    const user = userEvent.setup()
    const mockUpdateFunc = vi.fn()
    render(
      EditableText, {
        props: {
          updateFunction: mockUpdateFunc
        }
      })
    const editableField = await screen.findByText('No Name')
    await user.click(editableField)
    await user.keyboard('newvalue{Enter}')
    expect(mockUpdateFunc.mock.calls.length).toBe(1)
    expect(mockUpdateFunc.mock.calls[0][0]).toEqual('newvalue')
  })
})
