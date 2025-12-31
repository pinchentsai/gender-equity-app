
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Use a clean entry point to resolve cascading syntax and parsing errors in the monolithic index.tsx
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
