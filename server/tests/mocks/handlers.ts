// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/testme', () => {
    return HttpResponse.json({
      ok: true
    })
  }),
]