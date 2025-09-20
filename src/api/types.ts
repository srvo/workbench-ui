// Shared DTOs for API communication

export interface Security {
  symbol: string;
  name: string;
  sector?: string;
  category?: string;
  last_tick_at?: string;
  is_excluded?: boolean;
}

export interface SecurityDetail extends Security {
  country?: string;
  industry?: string;
  market_cap?: number;
}

export interface TickScore {
  score: number | null;
  updated_at: string | null;
  is_excluded?: boolean;
}

export interface Note {
  id: string;
  symbol?: string;
  body_md: string;
  created_at: string;
  updated_at?: string;
}

export interface ChartData {
  ohlc: {
    t: number[];
    o: number[];
    h: number[];
    l: number[];
    c: number[];
  };
  sma200?: number[];
  volume?: number[];
}

export interface FundamentalsData {
  series: Record<string, {
    t: number[];
    v: number[];
  }>;
}

export interface TickHistory {
  t: number[];
  v: number[];
}

export interface Strategy {
  key: string;
  name: string;
  description?: string;
}

export interface WeightPreview {
  items: Array<{
    symbol: string;
    name: string;
    new_w: number;
    old_w: number;
    delta_w: number;
    div_yield?: number;
  }>;
  cash_row?: {
    new_w: number;
    old_w: number;
  };
}

export interface SearchParams {
  search?: string;
  limit?: number;
  shuffle?: boolean;
  review_before?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  nextOffset?: number;
}