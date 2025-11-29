import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wine, Loader2, AlertTriangle } from 'lucide-react';

const Login: React.FC = () => {
  const { login, user, isLoading } = useAuth();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  // Check if Client ID is configured via Environment Variables
  // We check if the ID passed to provider (which we can't easily access here without complex context) 
  // OR we just check the source env vars again.
  const hasClientId = (() => {
      try {
        // @ts-ignore
        if (import.meta.env.VITE_GOOGLE_CLIENT_ID) return true;
      } catch {}
      try {
        // @ts-ignore
        if (process.env.VITE_GOOGLE_CLIENT_ID) return true;
      } catch {}
      return false;
  })();

  if (isLoading) {
      return (
          <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
              <Loader2 className="animate-spin text-rose-500" />
          </div>
      );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl animate-fade-in text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-rose-500">
             <Wine size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CellarVision</h1>
          <p className="text-zinc-400 mt-2">Sign in with Google to sync your cellar.</p>
        </div>

        {!hasClientId ? (
          <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-xl p-4 text-left mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-500 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-yellow-500 text-sm mb-1">Configuration Required</h3>
                <p className="text-xs text-zinc-400 mb-2">
                  To sign in, you must configure a Google Cloud Project.
                </p>
                <ol className="text-xs text-zinc-500 list-decimal pl-4 space-y-1">
                  <li>Create a project in <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-400 hover:underline">Google Cloud Console</a>.</li>
                  <li>Create <strong>OAuth 2.0 Credentials</strong> (Web Application).</li>
                  <li>Add <code>http://localhost:5173</code> to <strong>Authorized JavaScript origins</strong>.</li>
                  <li>Copy Client ID to <code>.env</code> as <code>VITE_GOOGLE_CLIENT_ID</code>.</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => login()}
            className="w-full bg-white hover:bg-zinc-200 text-zinc-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
            Sign in with Google
          </button>
        )}
        
        <p className="mt-8 text-xs text-zinc-600">
           Data is saved securely to your personal Google Drive.<br/>
           <span className="opacity-50">Ensure popups are enabled.</span>
        </p>
      </div>
    </div>
  );
};

export default Login;