const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://workbenchapi.ethicic.com';

export interface ExclusionsStats {
  companies: number;
  exclusions: number;
  sources: number;
  categories: number;
}

export interface LogEntry {
  timestamp: string;
  source: string;
  message: string;
}

export interface CategoryData {
  category: string;
  companies: number;
  exclusions: number;
  sources: number;
  description?: string;
  ai_guidance?: string;
  keywords?: string[];
  examples?: string;
  policy_link?: string;
}

export interface CategoryOverlap {
  company: string;
  category_count: number;
  categories: string;
}

export interface CategoriesResponse {
  categories: CategoryData[];
  overlaps: CategoryOverlap[];
}

export interface SourceMapping {
  source: string;
  category: string;
  mapped_type: string;
  mapped_reason: string;
  confidence: number;
  usage: number;
}

export interface Duplicate {
  company: string;
  reason: string;
  count: number;
  sources: string;
}

export interface Completeness {
  metric: string;
  with_value: number;
  total: number;
  percentage: number;
}

export interface DataQualityResponse {
  duplicates: Duplicate[];
  completeness: Completeness[];
}

export interface SharadarSummary {
  total_exclusions: number;
  total_sharadar: number;
  matched_exclusions: number;
  match_rate: number;
  unmatched_exclusions: number;
}

export interface CategoryCoverage {
  category: string;
  matched: number;
  total: number;
  rate: number;
  with_market_cap: number;
}

export interface TopMatch {
  ticker: string;
  company: string;
  sector: string;
  category: string;
  market_cap: string;
}

export interface UnmatchedCompany {
  company: string;
  category: string;
}

export interface SharadarCoverageResponse {
  summary: SharadarSummary;
  category_coverage: CategoryCoverage[];
  top_matches: TopMatch[];
  unmatched_sample: UnmatchedCompany[];
  unmatched_total: number;
}

export interface IngestionLog {
  start_time: string;
  end_time: string;
  source: string;
  processed: number;
  added: number;
  updated: number;
  skipped: number;
  errors: number;
  status: string;
  error_details?: string;
}

export interface IngestionLogsResponse {
  logs: IngestionLog[];
  error_logs: IngestionLog[];
}

async function fetchFromAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}/api/exclusions/workbench${endpoint}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export const exclusionsWorkbenchApi = {
  getStats: (): Promise<ExclusionsStats> =>
    fetchFromAPI('/stats'),

  getRecentLogs: (): Promise<LogEntry[]> =>
    fetchFromAPI('/recent-logs'),

  getCategories: (): Promise<CategoriesResponse> =>
    fetchFromAPI('/categories'),

  getSourceMappings: (): Promise<SourceMapping[]> =>
    fetchFromAPI('/source-mappings'),

  getDataQuality: (): Promise<DataQualityResponse> =>
    fetchFromAPI('/data-quality'),

  getSharadarCoverage: (): Promise<SharadarCoverageResponse> =>
    fetchFromAPI('/sharadar-coverage'),

  getIngestionLogs: (limit?: number): Promise<IngestionLogsResponse> => {
    const endpoint = limit !== undefined ? `/ingestion-logs?limit=${limit}` : '/ingestion-logs';
    return fetchFromAPI(endpoint);
  },

  getCategoryGuidance: (category: string): Promise<CategoryData> =>
    fetchFromAPI(`/categories/${encodeURIComponent(category)}/guidance`),

  updateCategoryGuidance: async (category: string, guidance: Partial<CategoryData>): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/exclusions/workbench/categories/${encodeURIComponent(category)}/guidance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(guidance),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },
};