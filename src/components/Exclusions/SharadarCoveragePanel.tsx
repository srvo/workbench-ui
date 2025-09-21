import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { exclusionsWorkbenchApi, SharadarCoverageResponse } from '../../api/exclusionsWorkbench';

const SharadarCoveragePanel: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sharadar-coverage'],
    queryFn: exclusionsWorkbenchApi.getSharadarCoverage,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Analyzing Sharadar coverage...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 text-lg mb-2">❌ Error loading coverage analysis</div>
        <p className="text-gray-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500 text-lg">📊 No coverage data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">📊 Coverage Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.summary.total_exclusions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Exclusions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {data.summary.total_sharadar.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Sharadar Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.summary.matched_exclusions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Matched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {data.summary.match_rate}%
              </div>
              <div className="text-sm text-gray-500">Match Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.summary.unmatched_exclusions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Unmatched</div>
            </div>
          </div>
        </div>
      </div>

      {/* Coverage by Category */}
      {data.category_coverage && data.category_coverage.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">📋 Coverage by Category</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matched
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coverage Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    With Market Cap
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.category_coverage.map((category, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {category.matched}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-grow bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${Math.min(category.rate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{category.rate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {category.with_market_cap}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Matches by Market Cap */}
      {data.top_matches && data.top_matches.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">💰 Top Matched Companies by Market Cap</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Cap
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.top_matches.map((match, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {match.ticker}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {match.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {match.sector}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {match.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {match.market_cap}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unmatched Companies Sample */}
      {data.unmatched_sample && data.unmatched_sample.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">❌ Sample Unmatched Companies</h3>
            <p className="text-sm text-gray-500 mt-1">
              Companies in exclusions but not found in Sharadar
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.unmatched_sample.map((company, index) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                  <div className="font-medium text-gray-900">{company.company}</div>
                  <div className="text-sm text-gray-600">{company.category}</div>
                </div>
              ))}
            </div>
            {data.unmatched_total > 10 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                ... and {data.unmatched_total - 10} more unmatched companies
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharadarCoveragePanel;