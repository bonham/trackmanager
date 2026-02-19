import { describe, expect, test } from 'vitest'
import router from '@/router'

describe('router', () => {
  test('TrackDetailPage coerces id param to number', () => {
    const record = router.getRoutes().find((r) => r.name === 'TrackDetailPage')
    expect(record).toBeDefined()

    const props = record?.props
    const propsCandidate = typeof props === 'function' ? props : props?.default
    expect(typeof propsCandidate).toBe('function')

    type PropsFn = (route: { params: { id: string, sid: string } }) => { id: number, sid: string }
    const propsFn = propsCandidate as unknown as PropsFn
    const result = propsFn({ params: { id: '618', sid: 'mysid' } })

    expect(result.sid).toBe('mysid')
    expect(result.id).toBe(618)
    expect(typeof result.id).toBe('number')
  })
})
