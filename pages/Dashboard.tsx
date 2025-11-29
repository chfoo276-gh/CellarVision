import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Wine, Grid3X3, Coins, Upload, AlertCircle, RefreshCcw, DownloadCloud } from 'lucide-react';
import { getCellars, getStats, getSettings, getUnplacedBottles, fullRestore } from '../services/storageService';
import { StorageUnit, Stats, UserSettings, Bottle } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const [cellars, setCellars] = useState<StorageUnit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<UserSettings>({ currency: 'USD', currencySymbol: '$' });
  const [unplacedBottles, setUnplacedBottles] = useState<Bottle[]>([]);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  
  // Default to producer as requested
  const [sortBy] = useState<'producer'>('producer');

  const refreshData = () => {
    setCellars(getCellars());
    setStats(getStats());
    setSettings(getSettings());
    setUnplacedBottles(getUnplacedBottles());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const getSortedUnplacedBottles = () => {
    return [...unplacedBottles].sort((a, b) => {
      // Always sort by producer
      return a.producer.localeCompare(b.producer);
    });
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Warning: Restoring a backup will OVERWRITE all current data. Continue?")) {
        // Reset input
        if (restoreInputRef.current) restoreInputRef.current.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        fullRestore(jsonString);
        alert("Backup restored successfully!");
        refreshData();
        // Force reload to ensure all state everywhere is clean
        window.location.reload();
      } catch (err) {
        console.error("Restore failed", err);
        alert("Failed to restore backup. Invalid file format.");
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again if needed
    if (restoreInputRef.current) {
        restoreInputRef.current.value = '';
    }
  };

  const sortedUnplaced = getSortedUnplacedBottles();

  const chartData = stats ? [
    { name: 'Red', value: stats.redCount, color: '#991b1b' },
    { name: 'White', value: stats.whiteCount, color: '#fef08a' },
    { name: 'Rosé', value: stats.roseCount, color: '#f9a8d4' },
    { name: 'Sparkling', value: stats.sparklingCount, color: '#bfdbfe' },
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Collection</h1>
          <p className="text-zinc-400">Manage your wines and inventory.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={restoreInputRef} 
            accept=".json" 
            className="hidden" 
            onChange={handleRestoreBackup}
          />
          <button 
            onClick={() => restoreInputRef.current?.click()}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors border border-zinc-700 text-sm"
            title="Overwrite current library with a JSON backup file"
          >
            <RefreshCcw size={16} />
            <span className="hidden md:inline">Restore Backup</span>
          </button>
          
          <Link to="/import" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors border border-zinc-700 text-sm" title="Add bottles from a CSV spreadsheet">
            <Upload size={16} />
            <span className="hidden md:inline">Import CSV</span>
          </Link>
          <Link to="/add-bottle" className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-rose-900/20 text-sm">
            <Plus size={18} />
            <span>Add Bottle</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Merged Stats */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex flex-col justify-between h-[200px]">
          <h2 className="text-zinc-400 text-sm font-medium mb-4">Overview</h2>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <div className="flex items-center gap-2 text-rose-500 mb-1">
                  <Wine size={20} />
                  <span className="text-sm font-bold">Bottles</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats?.totalBottles || 0}</p>
             </div>
             <div>
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                  <Coins size={20} />
                  <span className="text-sm font-bold">Value</span>
                </div>
                <p className="text-3xl font-bold text-white truncate" title={`${settings.currencySymbol}${stats?.totalValue}`}>
                   {settings.currencySymbol}{(stats?.totalValue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">{settings.currency}</p>
             </div>
          </div>
        </div>
        
        {/* Distribution Chart */}
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 relative h-[200px] flex flex-col">
             <p className="text-zinc-400 text-sm font-medium absolute top-4 left-6">Wine Type</p>
             <div className="flex-1 pt-6 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" hide />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff'}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
        </div>

        {/* Unplaced Items Box */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex flex-col h-[200px]">
          <div className="flex justify-between items-center mb-4">
             <div>
                <h2 className="text-zinc-400 text-sm font-medium">Unplaced Items</h2>
             </div>
             <div className="flex items-center gap-2">
               <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-full">{unplacedBottles.length}</span>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {sortedUnplaced.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                  <Grid3X3 size={24} className="mb-2 opacity-50" />
                  <p className="text-xs">All bottles placed!</p>
               </div>
            ) : (
               sortedUnplaced.map(b => (
                 <div 
                   key={b.id} 
                   className="flex justify-between items-center p-2 bg-zinc-950 rounded border border-zinc-800 hover:border-zinc-500 transition-colors group"
                 >
                    <div className="flex items-center gap-2 truncate flex-1 mr-2">
                       <Link to={`/bottle/${b.id}`} className="truncate flex-1">
                          <p className="text-xs font-bold truncate text-white">{b.producer}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{b.vintage} {b.varietal}</p>
                       </Link>
                    </div>
                    <AlertCircle size={14} className="text-yellow-500" />
                 </div>
               ))
            )}
          </div>
        </div>
      </div>

      {/* Cellars List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-zinc-100">Storage Locations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cellars.map((cellar) => (
            <div key={cellar.id}>
              <Link 
                to={`/cellars/${cellar.id}`}
                className="block group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 p-6 rounded-xl transition-all relative h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-zinc-950 rounded-lg group-hover:bg-zinc-900">
                    <Grid3X3 className="text-zinc-400 group-hover:text-rose-500 transition-colors" size={24} />
                  </div>
                  <div className="flex gap-2">
                     <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded">
                       {cellar.rows}x{cellar.columns}
                     </span>
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-1 pr-6">{cellar.name}</h3>
                <p className="text-sm text-zinc-400 line-clamp-1">
                  {cellar.description || "No description"}
                </p>
              </Link>
            </div>
          ))}
          
          <Link 
             to="/cellars/new"
             className="bg-zinc-950/30 border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 p-6 rounded-xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer min-h-[160px]"
          >
            <Plus size={32} />
            <span className="font-medium">Add Storage</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;