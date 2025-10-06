import React, { useState, useEffect } from 'react';
import WorkbenchLayout from '../components/Layout/WorkbenchLayout';
import { getJobStatus, BacktestJob } from '../api/backtests';

interface JobWithMetadata extends BacktestJob {
  strategyName?: string;
  scenario?: string;
  period?: string;
}

const Backtests: React.FC = () => {
  const [jobs, setJobs] = useState<JobWithMetadata[]>([]);
  const [recentEvents, setRecentEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent jobs (last 20)
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Get job IDs from localStorage or API
        const recentJobIds = getRecentJobIds();

        const jobPromises = recentJobIds.map(async (runId) => {
          try {
            const job = await getJobStatus(runId);
            return {
              ...job,
              strategyName: job.request?.strategy,
              scenario: job.request?.exclusion_scenario,
              period: job.request ? `${job.request.start_date} to ${job.request.end_date}` : undefined,
            };
          } catch (error) {
            console.error(`Failed to fetch job ${runId}:`, error);
            return null;
          }
        });

        const fetchedJobs = (await Promise.all(jobPromises)).filter(Boolean) as JobWithMetadata[];
        setJobs(fetchedJobs);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Group jobs by run tag (extracted from strategy name or manual tags)
  const groupedResults = jobs.reduce((acc, job) => {
    if (job.status === 'COMPLETE' || job.status === 'FINISHED') {
      const tag = extractRunTag(job.strategyName || 'unknown');
      if (!acc[tag]) {
        acc[tag] = [];
      }
      acc[tag].push(job);
    }
    return acc;
  }, {} as Record<string, JobWithMetadata[]>);

  return (
    <WorkbenchLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Backtests</h1>
          <div className="text-sm text-gray-500">
            Auto-refreshes every 10s
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Events Feed */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {jobs.slice(0, 10).map((job) => (
                  <div key={job.runId} className="text-sm border-b border-gray-100 pb-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs px-2 py-0.5 rounded ${getStatusBadgeColor(job.status)}`}>
                        {job.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {job.runId.substring(0, 8)}...
                      </span>
                    </div>
                    <div className="mt-1 text-gray-700">
                      {job.strategyName || 'Unknown strategy'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {job.scenario} | {job.period}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results Table by Run Tag */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4">Results by Study</h2>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : Object.keys(groupedResults).length === 0 ? (
                <div className="text-center py-8 text-gray-500">No completed backtests</div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedResults).map(([tag, tagJobs]) => (
                    <div key={tag}>
                      <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b">
                        {tag}
                        <span className="ml-2 text-sm text-gray-500">({tagJobs.length} runs)</span>
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Strategy</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scenario</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Return</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sharpe</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Drawdown</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tagJobs.map((job) => (
                              <tr key={job.runId} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {formatStrategyName(job.strategyName || '')}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-600">
                                  {job.scenario}
                                </td>
                                <td className="px-3 py-2 text-sm text-right font-mono">
                                  {job.result?.metrics?.total_return
                                    ? `${(job.result.metrics.total_return * 100).toFixed(2)}%`
                                    : '-'}
                                </td>
                                <td className="px-3 py-2 text-sm text-right font-mono">
                                  {job.result?.metrics?.sharpe_ratio?.toFixed(2) || '-'}
                                </td>
                                <td className="px-3 py-2 text-sm text-right font-mono text-red-600">
                                  {job.result?.metrics?.max_drawdown
                                    ? `${(job.result.metrics.max_drawdown * 100).toFixed(2)}%`
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">Active Jobs</h2>
          <div className="space-y-2">
            {jobs.filter(j => j.status === 'RUNNING' || j.status === 'QUEUED').map((job) => (
              <div key={job.runId} className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{job.strategyName}</div>
                  <div className="text-sm text-gray-600">{job.scenario} | {job.period}</div>
                </div>
                <div className="flex items-center gap-3">
                  {job.progress && (
                    <span className="text-sm text-gray-600">{job.progress}</span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    job.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
            {jobs.filter(j => j.status === 'RUNNING' || j.status === 'QUEUED').length === 0 && (
              <div className="text-center py-4 text-gray-500">No active jobs</div>
            )}
          </div>
        </div>
      </div>
    </WorkbenchLayout>
  );
};

// Helper functions
function getRecentJobIds(): string[] {
  // In production, fetch from API or localStorage
  // For now, return S&P 500 study job IDs
  return [
    '20251006093522_256e0d49c2f9e151',
    '20251006093606_40fbb45ed359b7f7',
    '20251006094327_256e0d49c2f9e151',
    '20251006094406_c3f6942ac54a04d6',
    '20251006095439_078013175808016f',
    '20251006095439_48e10e6e7c9669d0',
    '20251006095439_8b54eb57e1cdbc5e',
    '20251006095439_302d1a3b3bc1ed1b',
  ];
}

function extractRunTag(strategy: string): string {
  // Extract study name from strategy (e.g., "sp500_tracking_equal" -> "S&P 500 Tracking")
  if (strategy.startsWith('sp500_tracking')) return 'S&P 500 Tracking Study';
  if (strategy.startsWith('alpha_')) return 'Alpha Strategies';
  return 'Other';
}

function formatStrategyName(strategy: string): string {
  return strategy
    .replace('sp500_tracking_', 'S&P 500 ')
    .replace('_', ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'COMPLETE':
    case 'FINISHED':
      return 'bg-green-100 text-green-800';
    case 'RUNNING':
      return 'bg-blue-100 text-blue-800';
    case 'QUEUED':
      return 'bg-yellow-100 text-yellow-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default Backtests;
