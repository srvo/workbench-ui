import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { notesApi } from '../../api/notes';
import { formatRelativeTime } from '../../lib/format';

interface LatestNoteProps {
  symbol: string;
}

const LatestNote: React.FC<LatestNoteProps> = ({ symbol }) => {
  const { data: note, isLoading, error } = useQuery({
    queryKey: ['notes', symbol, 'latest'],
    queryFn: () => notesApi.getLatest(symbol),
    enabled: !!symbol,
  });

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading note...</div>;
  }

  if (error) {
    console.error('Error loading note:', error);
    return <div className="text-sm text-red-500">Error loading note</div>;
  }

  if (!note || !note.body_md) {
    return <div className="text-sm text-gray-500">No notes yet</div>;
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">
        {formatRelativeTime(note.created_at)}
      </div>
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>{note.body_md}</ReactMarkdown>
      </div>
    </div>
  );
};

export default LatestNote;