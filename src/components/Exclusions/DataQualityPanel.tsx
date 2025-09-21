import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { exclusionsWorkbenchApi } from '../../api/exclusionsWorkbench';

const DataQualityPanel: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data-quality'],
    queryFn: exclusionsWorkbenchApi.getDataQuality
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Analyzing data quality...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 text-lg mb-2">❌ Error loading data quality analysis</div>
        <p className="text-gray-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Duplicates Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">⚠️ Potential Duplicates</h3>
        </div>
        {data?.duplicates && data.duplicates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sources
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.duplicates.map((duplicate, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {duplicate.company.length > 30 ? `${duplicate.company.substring(0, 30)}...` : duplicate.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {duplicate.reason.length > 25 ? `${duplicate.reason.substring(0, 25)}...` : duplicate.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {duplicate.count}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 max-w-xs">
                      {duplicate.sources.length > 40 ? `${duplicate.sources.substring(0, 40)}...` : duplicate.sources}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="text-green-500 text-lg mb-2">✅ No duplicates found</div>
            <p className="text-gray-600">Data appears to be clean with no duplicate entries</p>
          </div>
        )}
      </div>

      {/* Data Completeness */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">📊 Data Completeness</h3>
        </div>
        <div className="p-6">
          {data?.completeness && data.completeness.length > 0 ? (
            <div className="space-y-4">
              {data.completeness.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{metric.metric}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {metric.with_value.toLocaleString()} of {metric.total.toLocaleString()} records
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 min-w-[50px]">
                      {metric.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-lg mb-2">📊 No completeness data available</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataQualityPanel;