import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config/index.js';
import Routes from './routes/index.js';

const app = express();

app.use(cors(config.cors));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', Routes());

export default app;
