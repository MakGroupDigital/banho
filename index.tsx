
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Enregistrer le Service Worker pour les notifications push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker enregistré:', registration.scope);
    } catch (error) {
      console.log('Erreur enregistrement Service Worker:', error);
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
