import { Router } from 'express';

const router = Router();

export function makeLogoutRoute() {
  router.get('/logout', async (req, res) => {
    const { session } = req;
    session.destroy((err) => {
      if (err) {
        console.error('Error while trying to destroy session', err);
        res.sendStatus(500);
      } else {
        res.send('OK');
      }
    });
  });
  return router;
}
