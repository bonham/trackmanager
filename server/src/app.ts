import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import * as dotenv from 'dotenv';
import getPgPool from './lib/getPgPool';
import getSession from './lib/getSession';
import authrouter from './routes/auth/auth';
import tracksRouter from './routes/tracks';

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  console.error('Missing configuration: Please copy .env.sample to .env and modify config');
  process.exit(1);
}
const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const session = getSession(getPgPool());
app.use(session);

app.use('/api/v1/auth', authrouter);
app.use('/api/tracks', tracksRouter);

export default app;
