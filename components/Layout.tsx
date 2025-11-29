import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, Wine, Settings, LogOut, RefreshCw, CloudUpload } from 'lucide-react';
import SearchBar from './SearchBar';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { syncFromCloud, syncToCloud, setCloudSyncEnabled, initGapiClient } from '../services/cloudService';

const Layout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  // Sync Logic (Pull)
  const syncLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSyncing(true);
      try {
        await initGapiClient(); 
        if (window.gapi && window.gapi.client) {
            window.gapi.client.setToken({ access_token: tokenResponse.access_token });
            setCloudSyncEnabled(true);
            const success = await syncFromCloud(tokenResponse.access_token);
            if (success) {
                alert("Sync Complete! Page will reload.");
                window.location.reload(); 
            } else {
                alert("No cloud data found to sync.");
            }
        }
      } catch (e) {
        console.error("Sync failed", e);
        alert("Sync failed. Check console.");
      } finally {
        setIsSyncing(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/drive.file',
    overrideScope: true, 
  });

  // Force Save Logic (Push)
  const saveLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSaving(true);
      try {
        await initGapiClient(); 
        if (window.gapi && window.gapi.client) {
            window.gapi.client.setToken({ access_token: tokenResponse.access_token });
            setCloudSyncEnabled(true);
            const success = await syncToCloud();
            if (success) {
                alert("Successfully saved to Google Drive!");
            } else {
                alert("Failed to save to cloud.");
            }
        }
      } catch (e) {
        console.error("Save failed", e);
        alert("Save failed. Check console.");
      } finally {
        setIsSaving(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/drive.file',
    overrideScope: true, 
  });

  const handleSync = () => syncLogin();
  const handleForceSave = () => saveLogin();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/add-bottle', label: 'Add Bottle', icon: <PlusCircle size={20} /> },
    { path: '/history', label: 'History', icon: <History size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex flex-col bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Wine className="text-rose-500" />
            <span className="font-bold text-lg">CellarVision</span>
          </div>
          {user && (
            <div className="flex gap-4">
                <button onClick={handleSync} className={`text-zinc-500 hover:text-emerald-500 ${isSyncing ? 'animate-spin' : ''}`}>
                    <RefreshCw size={20} />
                </button>
                <button onClick={logout} className="text-zinc-500 hover:text-white">
                    <LogOut size={20} />
                </button>
            </div>
          )}
        </div>
        <div className="px-4 pb-3">
          <SearchBar />
        </div>
      </div>

      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <Wine className="text-rose-500 h-8 w-8" />
          <span className="font-bold text-xl tracking-tight">CellarVision</span>
        </div>

        <div className="px-4 mb-2">
           <SearchBar />
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path) 
                  ? 'bg-rose-900/20 text-rose-400 border border-rose-900/50' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          {user ? (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {user.picture ? (
                            <img src={user.picture} alt="User" className="w-6 h-6 rounded-full" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs">{user.name.charAt(0)}</div>
                        )}
                        <span className="text-sm font-medium text-zinc-400 truncate w-24">{user.name}</span>
                    </div>
                    <button onClick={logout} className="text-zinc-500 hover:text-rose-500 transition-colors" title="Logout">
                        <LogOut size={16} />
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={handleSync}
                        className="flex flex-col items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2 rounded text-[10px] font-medium transition-colors border border-zinc-700"
                        title="Download from Cloud"
                    >
                        <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                        Sync Down
                    </button>
                    <button 
                        onClick={handleForceSave}
                        className="flex flex-col items-center justify-center gap-1 bg-rose-900/30 hover:bg-rose-900/50 text-rose-200 py-2 rounded text-[10px] font-medium transition-colors border border-rose-900/50"
                        title="Upload to Cloud"
                    >
                        <CloudUpload size={14} className={isSaving ? 'animate-bounce' : ''} />
                        Force Save
                    </button>
                </div>
            </div>
          ) : (
             <p className="text-xs text-center text-zinc-500 mb-2">Guest Mode</p>
          )}
          <p className="text-xs text-zinc-700 text-center mt-3">MVP Version 1.1</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex justify-around p-3 z-50 safe-area-bottom">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
               isActive(item.path) ? 'text-rose-500' : 'text-zinc-500'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Layout;