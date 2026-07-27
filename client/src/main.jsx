import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { clearLegacyAuth } from './lib/authStorage';
import './index.css';

clearLegacyAuth();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
