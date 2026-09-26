import { Router } from 'express';
import * as StatsController from './stats.controller.js';

const statsRouter = Router();

statsRouter.get('/', StatsController.getCommunityStatsController);

export default statsRouter;
