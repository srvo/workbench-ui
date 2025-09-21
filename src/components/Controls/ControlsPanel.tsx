import React, { useState } from 'react';
import TickScore from './TickScore';
import LatestNote from './LatestNote';
import MarkdownEditor from './MarkdownEditor';
import NotesDrawer from './NotesDrawer';
import StrategyAssignment from './StrategyAssignment';
import ExclusionControls from './ExclusionControls';
import PortfolioControls from './PortfolioControls';
import { useToast } from '../../hooks/useToast';

interface ControlsPanelProps {
  symbol: string | null;
  onSaveAndNext: () => void;
  onSkip: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  symbol,
  onSaveAndNext,
  onSkip,
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [noteRefreshKey, setNoteRefreshKey] = useState(0);
  const { showToast } = useToast();

  const handleNoteSaved = () => {
    setShowEditor(false);
    setNoteRefreshKey(prev => prev + 1);
    showToast('Note saved successfully', 'success');
  };

  if (!symbol) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a security to view controls
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tick Score Section */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Tick Score</h2>
        <TickScore symbol={symbol} />
      </div>

      {/* Strategy Assignment Section */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Strategy Assignment</h2>
        <StrategyAssignment symbol={symbol} />
      </div>

      {/* Exclusion Controls Section */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Exclusion Controls</h2>
        <ExclusionControls symbol={symbol} />
      </div>

      {/* Portfolio Management Section */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Portfolio Management</h2>
        <PortfolioControls symbol={symbol} />
      </div>

      {/* Latest Note Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">Latest Note</h2>
          <button
            onClick={() => setShowNotesDrawer(true)}
            className="text-xs text-brand-purple hover:underline"
          >
            View all notes
          </button>
        </div>
        <LatestNote symbol={symbol} key={noteRefreshKey} />
      </div>

      {/* Markdown Editor Section */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-700">Add Note</h2>
          {!showEditor && (
            <button
              onClick={() => setShowEditor(true)}
              className="text-xs text-brand-purple hover:underline"
            >
              Write note
            </button>
          )}
        </div>

        {showEditor ? (
          <MarkdownEditor
            symbol={symbol}
            onSave={handleNoteSaved}
            onCancel={() => setShowEditor(false)}
          />
        ) : (
          <div className="text-sm text-gray-500">
            Click "Write note" or press Ctrl+N to add a note
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex gap-3">
          <button
            onClick={onSaveAndNext}
            className="btn-primary flex-1"
          >
            Save & Next
          </button>
          <button
            onClick={onSkip}
            className="btn-secondary flex-1"
          >
            Skip
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Keyboard: S = Save & Next, X = Skip
        </div>
      </div>

      {/* Notes Drawer */}
      {showNotesDrawer && (
        <NotesDrawer
          symbol={symbol}
          onClose={() => setShowNotesDrawer(false)}
        />
      )}
    </div>
  );
};

export default ControlsPanel;