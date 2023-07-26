import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import authrouter from './routes/auth/auth';
import tracksRouter from './routes/tracks';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/v1/auth', authrouter);
app.use('/api/tracks', tracksRouter);

export default app;
