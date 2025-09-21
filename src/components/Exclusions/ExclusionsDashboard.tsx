import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { exclusionsWorkbenchApi } from '../../api/exclusionsWorkbench';

interface Stats {
  companies: number;
  exclusions: number;
  sources: number;
  categories: number;
}

interface LogEntry {
  timestamp: string;
  source: string;
  message: string;
}

const ExclusionsDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['exclusions-stats'],
    queryFn: exclusionsWorkbenchApi.getStats
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['exclusions-recent-logs'],
    queryFn: exclusionsWorkbenchApi.getRecentLogs
  });

  if (statsLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">📊</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Companies</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.companies?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">🚫</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Exclusions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.exclusions?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">📁</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Sources</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.sources || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="text-2xl">🏷️</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Categories</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.categories || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">📋 Recent Ingestion Activity</h3>
        </div>
        <div className="p-6">
          {logsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log: LogEntry, index: number) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 min-w-[80px]">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--:--:--'}
                  </div>
                  <div className="text-sm font-medium text-gray-700 min-w-[120px]">
                    {log.source}
                  </div>
                  <div className="text-sm text-gray-600 flex-1">
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>No recent ingestion activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">🚀 Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-2xl mb-2">🏷️</div>
              <h4 className="font-medium text-gray-900">Manage Categories</h4>
              <p className="text-sm text-gray-500 mt-1">
                Review and organize exclusion categories
              </p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-2xl mb-2">📈</div>
              <h4 className="font-medium text-gray-900">Sharadar Coverage</h4>
              <p className="text-sm text-gray-500 mt-1">
                Analyze coverage against Sharadar universe
              </p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-2xl mb-2">🔍</div>
              <h4 className="font-medium text-gray-900">Data Quality</h4>
              <p className="text-sm text-gray-500 mt-1">
                Check for duplicates and data issues
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExclusionsDashboard;