import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './tests/mocks/node.js'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())