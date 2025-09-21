import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastProvider } from './hooks/useToast';
import { queryClient } from './lib/queryClient';
import Workbench from './pages/Workbench';
import Exclusions from './pages/Exclusions';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Workbench />} />
            <Route path="/exclusions" element={<Exclusions />} />
          </Routes>
        </Router>
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;