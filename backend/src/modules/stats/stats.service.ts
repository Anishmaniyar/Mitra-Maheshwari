import * as StatsRepository from './stats.repository.js';

export const getCommunityStats = async () =>
  StatsRepository.getCommunityStats();
