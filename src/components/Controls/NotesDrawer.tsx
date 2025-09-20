import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { notesApi } from '../../api/notes';
import { formatDateTime } from '../../lib/format';

interface NotesDrawerProps {
  symbol: string;
  onClose: () => void;
}

const NotesDrawer: React.FC<NotesDrawerProps> = ({ symbol, onClose }) => {
  const { data, isLoading, fetchNextPage, hasNextPage } = useQuery({
    queryKey: ['notes', symbol, 'all'],
    queryFn: ({ pageParam = 0 }) => notesApi.getAll(symbol, 50, pageParam),
    enabled: !!symbol,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const notes = data?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto w-[600px] h-full bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Notes for {symbol}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notes yet</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notes.map((note) => (
                <div key={note.id} className="p-4">
                  <div className="text-xs text-gray-500 mb-2">
                    {formatDateTime(note.created_at)}
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{note.body_md}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="p-4 text-center">
              <button
                onClick={() => fetchNextPage()}
                className="btn-secondary text-sm"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesDrawer;