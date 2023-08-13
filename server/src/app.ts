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

const nodeEnv = process.env.NODE_ENV;
const productionMode = nodeEnv === 'production';

app.use(helmet());
const morganLevel = productionMode ? 'combined' : 'dev';
app.use(morgan(morganLevel));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

console.log(`Startign with NODE_ENV=${process.env.NODE_ENV}`);
const TRUST_PROXY = process.env.TRUST_PROXY || 0;
console.log(`Setting trust proxy to ${TRUST_PROXY}`);
app.set('trust proxy', TRUST_PROXY); // needed because of express-session config cookie.secure = true

const session = getSession(getPgPool());
app.use(session);

app.use('/api/v1/auth', authrouter);
app.use('/api/tracks', tracksRouter);

export default app;
