import http from 'node:http';

import app from './app.js';

const port = parseInt(process.env.PORT ?? '3000', 10);

const server = http.createServer(app);

server.listen(port);

server.on('listening', () => {
  const addr = server.address();
  if (addr == null) throw new Error('Address is null');

  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`Listening on ${bind}`);
});
