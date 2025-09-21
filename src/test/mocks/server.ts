import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:8000';

export const handlers = [
  // Securities endpoints
  http.get(`${API_BASE}/securities`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const sector = url.searchParams.get('sector') || '';
    const sortBy = url.searchParams.get('sort_by') || 'tick_score';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';

    let securities = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        market_cap: 3000000000000,
        price: 175.50,
        tick_score: 85
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        sector: 'Technology',
        industry: 'Internet Services',
        market_cap: 2000000000000,
        price: 140.25,
        tick_score: 75
      },
      {
        symbol: 'JPM',
        name: 'JPMorgan Chase & Co.',
        sector: 'Financial Services',
        industry: 'Banks',
        market_cap: 500000000000,
        price: 155.75,
        tick_score: 65
      }
    ];

    // Apply filters
    if (search) {
      securities = securities.filter(s =>
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (sector && sector !== 'All Sectors') {
      securities = securities.filter(s => s.sector === sector);
    }

    // Apply sorting
    securities.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      const direction = sortOrder === 'desc' ? -1 : 1;

      if (typeof aVal === 'string') {
        return direction * aVal.localeCompare(bVal);
      }
      return direction * (aVal - bVal);
    });

    return HttpResponse.json({
      items: securities,
      total: securities.length,
      limit: 50,
      offset: 0
    });
  }),

  http.get(`${API_BASE}/securities/:symbol/chart`, ({ params }) => {
    return HttpResponse.json({
      ohlc: {
        t: [1694995200, 1695081600, 1695168000],
        o: [175.0, 176.5, 174.2],
        h: [178.5, 179.0, 177.8],
        l: [174.5, 175.8, 173.5],
        c: [176.2, 174.8, 176.8]
      },
      sma200: [172.5, 173.1, 173.8]
    });
  }),

  http.get(`${API_BASE}/securities/:symbol/tick-history`, ({ params }) => {
    return HttpResponse.json({
      t: [1694995200, 1695081600, 1695168000],
      v: [75, 78, 82]
    });
  }),

  http.get(`${API_BASE}/securities/:symbol/fundamentals`, ({ params }) => {
    return HttpResponse.json({
      series: {
        pb: { t: [1694995200, 1695081600], v: [25.5, 26.1] },
        pe: { t: [1694995200, 1695081600], v: [28.2, 27.9] },
        ps: { t: [1694995200, 1695081600], v: [8.1, 8.3] },
        ptbv: { t: [1694995200, 1695081600], v: [4.2, 4.1] },
        shy: { t: [1694995200, 1695081600], v: [2.1, 2.3] },
        fcf_yield: { t: [1694995200, 1695081600], v: [3.8, 4.1] },
        rev_cagr_5y: { t: [1694995200, 1695081600], v: [8.5, 9.1] },
        fcf_cagr_5y: { t: [1694995200, 1695081600], v: [12.1, 12.8] },
        rev_yoy: { t: [1694995200, 1695081600], v: [5.2, 6.1] },
        cor_yoy: { t: [1694995200, 1695081600], v: [8.9, 9.2] }
      }
    });
  }),

  // Tick score endpoints
  http.get(`${API_BASE}/tick/:symbol`, ({ params }) => {
    const symbol = params.symbol as string;
    const scores: Record<string, number> = {
      'AAPL': 85,
      'GOOGL': 75,
      'JPM': 65
    };

    return HttpResponse.json({
      score: scores[symbol] || 0,
      updated_at: '2025-09-20T10:00:00Z'
    });
  }),

  http.put(`${API_BASE}/tick/:symbol`, async ({ params, request }) => {
    const symbol = params.symbol as string;
    const body = await request.json() as { score: number };

    return HttpResponse.json({
      score: body.score,
      updated_at: new Date().toISOString()
    });
  }),

  // Notes endpoints
  http.get(`${API_BASE}/notes/:symbol`, ({ params, request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    return HttpResponse.json({
      items: [
        {
          id: '1',
          symbol: params.symbol,
          body_md: 'Sample note content for testing',
          created_at: '2025-09-20T09:00:00Z'
        }
      ],
      total: 1,
      limit,
      offset: 0,
      nextOffset: null
    });
  }),

  http.post(`${API_BASE}/notes/:symbol`, async ({ params, request }) => {
    const symbol = params.symbol as string;
    const body = await request.json() as { body_md: string };

    return HttpResponse.json({
      id: Date.now().toString(),
      symbol,
      body_md: body.body_md,
      created_at: new Date().toISOString()
    });
  }),

  // Exclusions workbench endpoints
  http.get(`${API_BASE}/api/exclusions/workbench/stats`, () => {
    return HttpResponse.json({
      companies: 2500,
      exclusions: 3200,
      sources: 12,
      categories: 8
    });
  }),

  http.get(`${API_BASE}/api/exclusions/workbench/categories`, () => {
    return HttpResponse.json({
      categories: [
        {
          category: 'Animal Rights',
          companies: 850,
          exclusions: 1200,
          sources: 3
        },
        {
          category: 'Environmental Damage',
          companies: 650,
          exclusions: 900,
          sources: 4
        }
      ],
      overlaps: []
    });
  }),

  http.get(`${API_BASE}/api/exclusions/workbench/source-mappings`, () => {
    return HttpResponse.json([
      {
        source: 'AFSC',
        total_exclusions: 1500,
        categories: { 'Human Rights Violations': 800, 'Environmental Damage': 700 }
      }
    ]);
  }),

  http.get(`${API_BASE}/api/exclusions/workbench/data-quality`, () => {
    return HttpResponse.json({
      total_companies: 2500,
      companies_with_tickers: 2100,
      companies_missing_tickers: 400,
      ticker_coverage: 84.0
    });
  }),

  http.get(`${API_BASE}/api/exclusions/workbench/sharadar-coverage`, () => {
    return HttpResponse.json({
      total_exclusions: 3200,
      sharadar_matches: 1800,
      coverage_percentage: 56.25
    });
  }),

  http.get(`${API_BASE}/api/exclusions/workbench/ingestion-logs`, () => {
    return HttpResponse.json([
      {
        id: 1,
        source: 'AFSC',
        status: 'success',
        companies_processed: 500,
        exclusions_created: 750,
        timestamp: '2025-09-20T10:00:00Z'
      }
    ]);
  }),

  http.get(`${API_BASE}/api/exclusions/workbench/categories/:category/guidance`, ({ params }) => {
    return HttpResponse.json({
      category: params.category,
      description: `Description for ${params.category}`,
      ai_guidance: `AI guidance for ${params.category}`,
      keywords: [`keyword1`, `keyword2`],
      examples: `Example companies for ${params.category}`,
      policy_link: 'https://ethicic.com/content/process/screening-policy'
    });
  }),

  http.put(`${API_BASE}/api/exclusions/workbench/categories/:category/guidance`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      category: params.category,
      ...body,
      updated_at: new Date().toISOString()
    });
  }),

  // Health check
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({ status: 'ok' });
  })
];

export const server = setupServer(...handlers);