import { render, fireEvent } from '@testing-library/vue'
import { describe, test, expect, vi } from 'vitest'
import LoginFailureModal from '@/components/auth/LoginFailureModal.vue'

vi.mock('bootstrap-vue-next', () => ({
  BModal: {
    name: 'BModal',
    props: {
      modelValue: { type: Boolean, default: false },
      title: { type: String, default: '' },
    },
    emits: ['update:modelValue', 'ok'],
    template: `
      <div v-if="modelValue" :data-modal-title="title">
        <slot />
        <slot name="footer" />
      </div>
    `,
  },
  BButton: {
    name: 'BButton',
    emits: ['click'],
    template: `<button @click="$emit('click')"><slot /></button>`,
  },
}))

function renderModal(props: { visible: boolean; message: string }) {
  return render(LoginFailureModal, { props })
}

describe('LoginFailureModal', () => {
  test('renders buttons when visible', () => {
    const { getByRole } = renderModal({ visible: true, message: '' })
    expect(getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'Register' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  test('does not render when not visible', () => {
    const { queryByRole } = renderModal({ visible: false, message: '' })
    expect(queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
  })

  test('displays error message', () => {
    const { getByText } = renderModal({ visible: true, message: 'Auth failed' })
    expect(getByText('Auth failed')).toBeInTheDocument()
  })

  test('does not show message div when message is empty', () => {
    const { queryByText } = renderModal({ visible: true, message: '' })
    // No text-danger div should appear with empty content
    expect(queryByText('Auth failed')).not.toBeInTheDocument()
  })

  test('Retry button emits retry event', async () => {
    const { getByRole, emitted } = renderModal({ visible: true, message: '' })
    await fireEvent.click(getByRole('button', { name: 'Retry' }))
    expect(emitted()).toHaveProperty('retry')
  })

  test('Register button emits register event', async () => {
    const { getByRole, emitted } = renderModal({ visible: true, message: '' })
    await fireEvent.click(getByRole('button', { name: 'Register' }))
    expect(emitted()).toHaveProperty('register')
  })

  test('Cancel button emits cancel event', async () => {
    const { getByRole, emitted } = renderModal({ visible: true, message: '' })
    await fireEvent.click(getByRole('button', { name: 'Cancel' }))
    expect(emitted()).toHaveProperty('cancel')
  })
})
