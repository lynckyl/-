import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  // @ts-ignore
  if (import.meta.env?.DEV) {
    // Unregister any active service worker during development to prevent caching issues, CORS blocks, or blank preview screens
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const r of registrations) {
        r.unregister().then(() => {
          console.log('Active dev service worker unregistered successfully.');
        });
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
