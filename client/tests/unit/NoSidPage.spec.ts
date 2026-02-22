import { render } from '@testing-library/vue'
import { describe, test, expect } from 'vitest'
import NoSidPage from '@/views/NoSidPage.vue'

describe('NoSidPage', () => {
  test('renders the "no sid" message', () => {
    const { getByText } = render(NoSidPage)
    expect(getByText(/Trackmanager wants a secret id/)).toBeInTheDocument()
  })
})
