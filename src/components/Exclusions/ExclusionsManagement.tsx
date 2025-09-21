import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exclusionsApi, Exclusion, ExclusionCategory, CreateExclusionRequest } from '../../api/exclusions';
import { useToast } from '../../hooks/useToast';
import clsx from 'clsx';

const ExclusionsManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [newExclusion, setNewExclusion] = useState<CreateExclusionRequest>({
    symbol: '',
    reason: '',
    category_id: undefined,
    source: 'manual'
  });
  const [bulkText, setBulkText] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const pageSize = 50;

  // Fetch exclusions with current filters
  const { data: exclusions = [], isLoading: exclusionsLoading } = useQuery({
    queryKey: ['exclusions', filterSymbol, filterCategory, filterActive, currentPage],
    queryFn: () => exclusionsApi.getExclusions({
      symbol: filterSymbol || undefined,
      category: filterCategory || undefined,
      is_active: filterActive,
      limit: pageSize,
      offset: currentPage * pageSize
    }),
    staleTime: 30 * 1000,
  });

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['exclusion-categories'],
    queryFn: () => exclusionsApi.getCategories(),
    staleTime: 60 * 1000,
  });

  // Create exclusion mutation
  const createMutation = useMutation({
    mutationFn: exclusionsApi.createExclusion,
    onSuccess: () => {
      showToast('Exclusion created successfully', 'success');
      setShowCreateForm(false);
      setNewExclusion({ symbol: '', reason: '', category_id: undefined, source: 'manual' });
      queryClient.invalidateQueries({ queryKey: ['exclusions'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create exclusion', 'error');
    },
  });

  // Delete exclusion mutation
  const deleteMutation = useMutation({
    mutationFn: exclusionsApi.deleteExclusion,
    onSuccess: () => {
      showToast('Exclusion deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['exclusions'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete exclusion', 'error');
    },
  });

  // Review exclusion mutation
  const reviewMutation = useMutation({
    mutationFn: ({ id, decision, notes }: { id: number; decision: 'approve' | 'reject'; notes?: string }) =>
      exclusionsApi.reviewExclusion(id, decision, notes),
    onSuccess: () => {
      showToast('Exclusion reviewed successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['exclusions'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to review exclusion', 'error');
    },
  });

  // Bulk create mutation
  const bulkCreateMutation = useMutation({
    mutationFn: exclusionsApi.bulkCreateExclusions,
    onSuccess: (result) => {
      showToast(`Created ${result.created} exclusions${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`, 'success');
      setShowBulkForm(false);
      setBulkText('');
      queryClient.invalidateQueries({ queryKey: ['exclusions'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create bulk exclusions', 'error');
    },
  });

  const handleCreate = () => {
    if (!newExclusion.symbol.trim() || !newExclusion.reason.trim()) {
      showToast('Please fill in symbol and reason', 'error');
      return;
    }
    createMutation.mutate(newExclusion);
  };

  const handleBulkCreate = () => {
    if (!bulkText.trim()) {
      showToast('Please enter bulk exclusions data', 'error');
      return;
    }

    try {
      const lines = bulkText.trim().split('\n');
      const exclusions: CreateExclusionRequest[] = [];

      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          exclusions.push({
            symbol: parts[0],
            reason: parts[1],
            category_id: parts[2] ? parseInt(parts[2]) : undefined,
            source: 'bulk_import'
          });
        }
      }

      if (exclusions.length === 0) {
        showToast('No valid exclusions found in bulk data', 'error');
        return;
      }

      bulkCreateMutation.mutate(exclusions);
    } catch (error) {
      showToast('Error parsing bulk data', 'error');
    }
  };

  const getCategoryById = (id: number) => categories.find(c => c.id === id);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Exclusions Management</h2>
            <p className="text-sm text-gray-600 mt-1">Create, edit, and manage investment exclusions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkForm(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Bulk Import
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Add Exclusion
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Symbol</label>
            <input
              type="text"
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              placeholder="Filter by symbol..."
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'}
              onChange={(e) => setFilterActive(
                e.target.value === 'all' ? undefined : e.target.value === 'active'
              )}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterSymbol('');
                setFilterCategory('');
                setFilterActive(true);
                setCurrentPage(0);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Exclusions List */}
      <div className="flex-1 overflow-auto">
        {exclusionsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading exclusions...</div>
          </div>
        ) : exclusions.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">No exclusions found</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {exclusions.map((exclusion) => {
              const category = getCategoryById(exclusion.category_priority);
              return (
                <div key={exclusion.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-lg">{exclusion.symbol}</span>
                        {category && (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: category.color + '20',
                              color: category.color
                            }}
                          >
                            {category.name}
                          </span>
                        )}
                        <span
                          className={clsx(
                            'px-2 py-1 text-xs font-medium rounded-full',
                            exclusion.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {exclusion.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{exclusion.reason}</p>
                      <div className="text-xs text-gray-500 mt-1">
                        Excluded by {exclusion.excluded_by} on {new Date(exclusion.excluded_at).toLocaleDateString()}
                        {exclusion.reviewed_at && (
                          <span> • Reviewed by {exclusion.reviewed_by} on {new Date(exclusion.reviewed_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!exclusion.reviewed_at && (
                        <>
                          <button
                            onClick={() => reviewMutation.mutate({ id: exclusion.id, decision: 'approve' })}
                            disabled={reviewMutation.isPending}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => reviewMutation.mutate({ id: exclusion.id, decision: 'reject' })}
                            disabled={reviewMutation.isPending}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the exclusion for ${exclusion.symbol}?`)) {
                            deleteMutation.mutate(exclusion.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, (currentPage + 1) * pageSize)} of many
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={exclusions.length < pageSize}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Create Exclusion Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Exclusion</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <input
                  type="text"
                  value={newExclusion.symbol}
                  onChange={(e) => setNewExclusion({ ...newExclusion, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., AAPL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newExclusion.category_id || ''}
                  onChange={(e) => setNewExclusion({ ...newExclusion, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select category (optional)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={newExclusion.reason}
                  onChange={(e) => setNewExclusion({ ...newExclusion, reason: e.target.value })}
                  placeholder="Reason for exclusion..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Exclusion'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Import Exclusions</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSV Data</label>
                <p className="text-xs text-gray-500 mb-2">
                  Format: symbol,reason,category_id (one per line)
                </p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="AAPL,Company practices,1&#10;MSFT,Ethical concerns,2"
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBulkCreate}
                disabled={bulkCreateMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {bulkCreateMutation.isPending ? 'Importing...' : 'Import Exclusions'}
              </button>
              <button
                onClick={() => setShowBulkForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExclusionsManagement;