import { test, describe, vi } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import EditableText from '@/components/EditableText.vue'

// unfortunately these are not valid tests as the testing library and user-event lib are not firing onChange event ;-( ( see stdout of tests )

describe('EditableText', () => {
  test('Success', async () => {
    const user = userEvent.setup()
    const mockUpdateFunc = vi.fn().mockReturnValue(true)
    render(
      EditableText, {
      props: {
        updateFunction: mockUpdateFunc,
        textProp: 'hello text'
      }
    })
    const editableField = await screen.findByText('hello text')
    await user.click(editableField)
    await user.keyboard('{Control>}a{/Control}newvalue{Enter}')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const editableFieldAfter = await screen.findByText('newvalue')

  })
  test('No change', async () => {
    const user = userEvent.setup()
    const mockUpdateFunc = vi.fn().mockReturnValue(false)
    render(
      EditableText, {
      props: {
        updateFunction: mockUpdateFunc,
        textProp: 'hello text'
      }
    })
    const editableField = await screen.findByText('hello text')
    await user.click(editableField)
    await user.keyboard('{Enter}')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const editableFieldAfter = await screen.findByText('hello text')
  })
})
