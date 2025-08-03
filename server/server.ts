import './config/config.js'; //dotenv
import express from 'express';

import mainConfig from './config/main-config.js';
import routeConfig from './config/route-config.js';
import customConfig from './config/custom-config.js';

const app = express();
mainConfig(app);
customConfig(app); // custom middleware
routeConfig(app);

export default app;
