import { fetcher } from '../lib/fetch';
import type { TickScore } from './types';

export const tickApi = {
  // Get tick score for symbol
  get: (symbol: string) =>
    fetcher.get<TickScore>(`/api/securities/${symbol}/tick`),

  // Update tick score (uses bearer token automatically)
  update: (symbol: string, score: number) =>
    fetcher.put<TickScore>(`/api/securities/${symbol}/tick`, { score }),
};