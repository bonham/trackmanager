import { render, fireEvent } from '@testing-library/vue'
import { describe, test, expect } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import LogoutForm from '@/components/auth/LogoutForm.vue'
import { useUserLoginStore } from '@/stores/userlogin'

describe('LogoutForm', () => {
  test('renders the logout button', () => {
    const { getByRole } = render(LogoutForm, {
      global: { plugins: [createTestingPinia()] },
    })
    expect(getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  test('does not show status text by default', () => {
    const { queryByText } = render(LogoutForm, {
      global: { plugins: [createTestingPinia()] },
    })
    expect(queryByText(/Status:/)).not.toBeInTheDocument()
  })

  test('calls store logout when button is clicked', async () => {
    const pinia = createTestingPinia()
    const { getByRole } = render(LogoutForm, {
      global: { plugins: [pinia] },
    })
    const store = useUserLoginStore(pinia)

    await fireEvent.click(getByRole('button', { name: /logout/i }))

    expect(store.logout).toHaveBeenCalledOnce()
  })

  test('logout is not called before clicking', () => {
    const pinia = createTestingPinia()
    render(LogoutForm, { global: { plugins: [pinia] } })
    const store = useUserLoginStore(pinia)

    expect(store.logout).not.toHaveBeenCalled()
  })
})
