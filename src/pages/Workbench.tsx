import React, { useState, useEffect, useCallback } from 'react';
import WorkbenchLayout from '../components/Layout/WorkbenchLayout';
import UniversePanel from '../components/Universe/UniversePanel';
import SecurityCharts from '../components/Charts/SecurityCharts';
import ControlsPanel from '../components/Controls/ControlsPanel';
import { useToast } from '../hooks/useToast';

const Workbench: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [queue] = useState<string[]>([]);
  const { showToast } = useToast();

  // Handle Save & Next
  const handleSaveAndNext = useCallback(() => {
    // The tick score is already auto-saved via the TickScore component
    // Move to next in queue
    const currentIndex = queue.findIndex(s => s === selectedSymbol);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      setSelectedSymbol(queue[currentIndex + 1]);
      showToast('Moving to next security', 'success');
    } else {
      showToast('No more securities in queue', 'info');
    }
  }, [selectedSymbol, queue, showToast]);

  // Handle Skip
  const handleSkip = useCallback(() => {
    const currentIndex = queue.findIndex(s => s === selectedSymbol);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      setSelectedSymbol(queue[currentIndex + 1]);
    } else {
      showToast('No more securities in queue', 'info');
    }
  }, [selectedSymbol, queue, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea
      if (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSaveAndNext();
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveAndNext, handleSkip]);

  return (
    <WorkbenchLayout
      leftPanel={
        <UniversePanel
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
        />
      }
      centerPanel={
        <SecurityCharts symbol={selectedSymbol} />
      }
      rightPanel={
        <ControlsPanel
          symbol={selectedSymbol}
          onSaveAndNext={handleSaveAndNext}
          onSkip={handleSkip}
        />
      }
    />
  );
};

export default Workbench;