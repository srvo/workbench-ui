import { fetcher } from '../lib/fetch';

export interface Exclusion {
  id: number;
  symbol: string;
  category_name: string;
  category_color: string;
  category_priority: number;
  reason: string;
  excluded_at: string;
  excluded_by: string;
  reviewed_at?: string;
  reviewed_by?: string;
  is_active: number;
  source: string;
  metadata: Record<string, any>;
}

export interface ExclusionCategory {
  id: number;
  name: string;
  color: string;
  priority: number;
  description?: string;
}

export interface CreateExclusionRequest {
  symbol: string;
  reason: string;
  category_id?: number;
  source?: string;
}

export interface UpdateExclusionRequest {
  reason?: string;
  category_id?: number;
  is_active?: boolean;
}

export const exclusionsApi = {
  // List exclusions with optional filtering
  getExclusions: (filters?: {
    symbol?: string;
    category?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Exclusion[]> => {
    const params = new URLSearchParams();
    if (filters?.symbol) params.append('symbol', filters.symbol);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const query = params.toString();
    return fetcher.get(`/api/exclusions${query ? `?${query}` : ''}`);
  },

  // Create a new exclusion
  createExclusion: (data: CreateExclusionRequest): Promise<Exclusion> => {
    return fetcher.post('/api/exclusions', data);
  },

  // Delete an exclusion
  deleteExclusion: (id: number): Promise<void> => {
    return fetcher.delete(`/api/exclusions/${id}`);
  },

  // Review an exclusion (approve/reject)
  reviewExclusion: (id: number, decision: 'approve' | 'reject', notes?: string): Promise<Exclusion> => {
    return fetcher.post(`/api/exclusions/${id}/review`, { decision, notes });
  },

  // Get exclusion categories
  getCategories: (): Promise<ExclusionCategory[]> => {
    return fetcher.get('/api/exclusions/categories');
  },

  // Create a new category
  createCategory: (data: {
    name: string;
    color: string;
    priority: number;
    description?: string;
  }): Promise<ExclusionCategory> => {
    return fetcher.post('/api/exclusions/categories', data);
  },

  // Get exclusion history
  getExclusionHistory: (id: number): Promise<any[]> => {
    return fetcher.get(`/api/exclusions/history/${id}`);
  },

  // Export exclusions
  exportExclusions: (format: 'csv' | 'json' = 'csv', filters?: any): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined) {
          params.append(key, filters[key].toString());
        }
      });
    }

    return fetch(`${fetcher.get === fetcher.get ? '/api' : ''}/exclusions/export?${params.toString()}`)
      .then(response => response.blob());
  },

  // Bulk create exclusions
  bulkCreateExclusions: (exclusions: CreateExclusionRequest[]): Promise<{
    created: number;
    errors: any[];
  }> => {
    return fetcher.post('/api/exclusions/bulk', { exclusions });
  }
};