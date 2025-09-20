import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../../api/notes';
import { useToast } from '../../hooks/useToast';

interface MarkdownEditorProps {
  symbol: string;
  onSave: () => void;
  onCancel: () => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  symbol,
  onSave,
  onCancel,
}) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const saveMutation = useMutation({
    mutationFn: () => notesApi.create(symbol, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', symbol] });
      setContent('');
      onSave();
    },
    onError: (error) => {
      console.error('Failed to save note:', error);
      showToast('Failed to save note', 'error');
    },
  });

  const handleSave = () => {
    if (content.trim()) {
      saveMutation.mutate();
    }
  };

  // Handle Cmd/Ctrl+Enter to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (textareaRef.current === document.activeElement && content.trim()) {
          e.preventDefault();
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  return (
    <div className="space-y-3">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a note... (Markdown supported)"
        className="input-field w-full h-32 resize-none font-mono text-sm"
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Press Cmd/Ctrl+Enter to save
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="btn-secondary text-sm"
            disabled={saveMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary text-sm"
            disabled={!content.trim() || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;