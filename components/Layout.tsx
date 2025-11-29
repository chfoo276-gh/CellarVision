import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, Wine, Settings, LogOut } from 'lucide-react';
import SearchBar from './SearchBar';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => location.pathname === path;

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
            <button onClick={logout} className="text-zinc-500 hover:text-white">
              <LogOut size={20} />
            </button>
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
            <div className="flex items-center justify-between px-2 mb-3">
               <div className="flex items-center gap-2 overflow-hidden">
                  {user.picture ? (
                    <img src={user.picture} alt="User" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs">{user.name.charAt(0)}</div>
                  )}
                  <span className="text-sm font-medium text-zinc-400 truncate">{user.name}</span>
               </div>
               <button onClick={logout} className="text-zinc-500 hover:text-rose-500 transition-colors" title="Logout">
                  <LogOut size={16} />
               </button>
            </div>
          ) : (
             <p className="text-xs text-center text-zinc-500 mb-2">Guest Mode</p>
          )}
          <p className="text-xs text-zinc-700 text-center">MVP Version 1.1</p>
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