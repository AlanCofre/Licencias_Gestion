import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import SkipLink from './components/SkipLink';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <SkipLink />
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;