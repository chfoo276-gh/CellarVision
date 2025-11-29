import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Safely retrieve environment variable
const getClientId = () => {
  let id = "";
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      // @ts-ignore
      id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    }
  } catch (e) {
    // ignore error accessing import.meta
  }

  if (!id) {
    try {
      // Fallback to process.env if polyfilled
      // @ts-ignore
      if (typeof process !== 'undefined' && process.env && process.env.VITE_GOOGLE_CLIENT_ID) {
        // @ts-ignore
        id = process.env.VITE_GOOGLE_CLIENT_ID;
      }
    } catch (e) {
      // ignore error accessing process
    }
  }

  // GoogleOAuthProvider crashes if clientId is empty or undefined.
  // Return a placeholder to allow the app to boot and show the "Config Required" screen in Login.tsx
  return id || "NO_CLIENT_ID_CONFIGURED";
};

const CLIENT_ID = getClientId();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);