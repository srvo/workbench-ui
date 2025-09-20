import { fetcher } from '../lib/fetch';
import type {
  Security,
  SecurityDetail,
  ChartData,
  FundamentalsData,
  TickHistory,
  SearchParams
} from './types';

export const securitiesApi = {
  // Search securities
  search: (params: SearchParams) =>
    fetcher.get<Security[]>('/api/securities/', params),

  // Get security detail
  get: (symbol: string) =>
    fetcher.get<SecurityDetail>(`/api/securities/${symbol}`),

  // Get investable tick scores
  getInvestableTicks: () =>
    fetcher.get<Security[]>('/api/securities/tick/investable'),

  // Get chart data
  getChart: (symbol: string, range = '5y', interval = '1w') =>
    fetcher.get<ChartData>(`/api/securities/${symbol}/chart`, { range, interval }),

  // Get fundamentals
  getFundamentals: (symbol: string) => {
    const metrics = [
      'pb', 'ps', 'ptbv', 'pe', 'shy',
      'fcf_yield', 'rev_cagr_5y', 'fcf_cagr_5y',
      'rev_yoy', 'cor_yoy'
    ].join(',');
    return fetcher.get<FundamentalsData>(`/api/securities/${symbol}/fundamentals`, { metrics });
  },

  // Get tick history
  getTickHistory: (symbol: string) =>
    fetcher.get<TickHistory>(`/api/securities/${symbol}/tick/history`),
};