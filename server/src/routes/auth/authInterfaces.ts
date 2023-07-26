import type { Session } from 'express-session';

export interface MySession extends Session {
  user?: string,
  challenge?: string
}
