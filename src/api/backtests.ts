/**
 * Backtest API Client
 *
 * Connects to PortQL API (rawls:8001) for backtest job management
 */

const PORTQL_API_URL = import.meta.env.VITE_PORTQL_API_URL || 'https://portql.ec1c.com';

export interface BacktestJob {
  runId: string;
  jobKey: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETE' | 'FAILED' | 'FINISHED';
  queuePosition: number | null;
  progress: string | null;
  result: BacktestResult | null;
  error: string | null;
  request?: {
    strategy: string;
    start_date: string;
    end_date: string;
    exclusion_scenario: string;
    rebalance_frequency: string;
  };
}

export interface BacktestResult {
  metrics: {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    [key: string]: number;
  };
  trades?: number;
  duration?: string;
}

export interface BacktestRequest {
  strategy: string;
  start_date: string;
  end_date: string;
  initial_cash?: number;
  exclusion_scenario?: string;
  rebalance_frequency?: string;
  run_id?: string;
}

/**
 * Get status of a backtest job
 */
export async function getJobStatus(runId: string): Promise<BacktestJob> {
  const response = await fetch(`${PORTQL_API_URL}/status/${runId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Enqueue a new backtest job
 */
export async function enqueueBacktest(request: BacktestRequest): Promise<BacktestJob> {
  const response = await fetch(`${PORTQL_API_URL}/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to enqueue backtest: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Cancel a running job
 */
export async function cancelJob(runId: string): Promise<void> {
  const response = await fetch(`${PORTQL_API_URL}/cancel/${runId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel job: ${response.statusText}`);
  }
}

/**
 * Get recent job events (from worker logs)
 * This would need a new endpoint on PortQL API
 */
export async function getRecentEvents(limit: number = 20): Promise<JobEvent[]> {
  // TODO: Implement endpoint on PortQL API
  // For now, return mock data
  return [];
}

export interface JobEvent {
  timestamp: string;
  runId: string;
  event: 'QUEUED' | 'STARTED' | 'COMPLETED' | 'FAILED';
  strategy: string;
  message?: string;
}
