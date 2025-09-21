import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exclusionsWorkbenchApi, CategoryData } from '../../api/exclusionsWorkbench';
import { useToast } from '../../hooks/useToast';

interface CategoryGuidanceEditorProps {
  category: string;
  onClose: () => void;
}

const CategoryGuidanceEditor: React.FC<CategoryGuidanceEditorProps> = ({
  category,
  onClose,
}) => {
  const [description, setDescription] = useState('');
  const [aiGuidance, setAiGuidance] = useState('');
  const [keywords, setKeywords] = useState('');
  const [examples, setExamples] = useState('');
  const [policyLink, setPolicyLink] = useState('https://ethicic.com/content/process/screening-policy');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Load existing guidance
  const { data: guidanceData, isLoading } = useQuery({
    queryKey: ['category-guidance', category],
    queryFn: () => exclusionsWorkbenchApi.getCategoryGuidance(category),
    retry: false, // Don't retry if endpoint doesn't exist yet
  });

  // Update form when data loads
  useEffect(() => {
    if (guidanceData) {
      setDescription(guidanceData.description || '');
      setAiGuidance(guidanceData.ai_guidance || '');
      setKeywords(guidanceData.keywords?.join(', ') || '');
      setExamples(guidanceData.examples || '');
      setPolicyLink(guidanceData.policy_link || 'https://ethicic.com/content/process/screening-policy');
    }
  }, [guidanceData]);

  // Save guidance mutation
  const saveGuidanceMutation = useMutation({
    mutationFn: async (guidance: Partial<CategoryData>) => {
      await exclusionsWorkbenchApi.updateCategoryGuidance(category, guidance);
    },
    onSuccess: () => {
      showToast('Category guidance updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['category-guidance', category] });
      queryClient.invalidateQueries({ queryKey: ['exclusions-categories'] });
      onClose();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update category guidance', 'error');
    },
  });

  const handleSave = () => {
    const keywordArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    saveGuidanceMutation.mutate({
      description,
      ai_guidance: aiGuidance,
      keywords: keywordArray,
      examples,
      policy_link: policyLink,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              🤖 AI Guidance Editor: {category}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading guidance...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Policy Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📋 Screening Policy Reference
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={policyLink}
                    onChange={(e) => setPolicyLink(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://ethicic.com/content/process/screening-policy"
                  />
                  <a
                    href={policyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-sm"
                  >
                    View Policy
                  </a>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Category Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of what this category covers..."
                />
              </div>

              {/* AI Guidance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🤖 AI Guidance (Primary Instructions)
                </label>
                <textarea
                  value={aiGuidance}
                  onChange={(e) => setAiGuidance(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed instructions for AI agents on what to look for in this category..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This guidance will be used by AI agents to automatically categorize companies.
                </p>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="keyword1, keyword2, keyword3..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Keywords used for text matching and search.
                </p>
              </div>

              {/* Examples */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💼 Company Examples
                </label>
                <textarea
                  value={examples}
                  onChange={(e) => setExamples(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Example companies that fall into this category..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Concrete examples help clarify the scope of this category.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saveGuidanceMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saveGuidanceMutation.isPending ? 'Saving...' : 'Save Guidance'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryGuidanceEditor;