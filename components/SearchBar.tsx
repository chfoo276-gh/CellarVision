
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Wine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchBottles, getCellarById } from '../services/storageService';
import { Bottle } from '../types';
import { WINE_TEXT_COLOR_MAP } from '../constants';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Bottle[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        const hits = searchBottles(query);
        setResults(hits);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const getLocationName = (storageId: string) => {
    const cellar = getCellarById(storageId);
    return cellar ? cellar.name : 'Unknown Location';
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search wines..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-rose-500 placeholder-zinc-600 transition-colors"
        />
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
        {query && (
          <button 
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
           {results.map(bottle => (
             <Link 
               key={bottle.id} 
               to={`/bottle/${bottle.id}`}
               onClick={clearSearch}
               className="flex items-center gap-3 p-3 hover:bg-zinc-800 border-b border-zinc-800 last:border-0 transition-colors"
             >
                <div className="w-8 h-10 bg-zinc-950 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                   {bottle.photoUrl ? (
                     <img src={bottle.photoUrl} className="w-full h-full object-cover opacity-80" alt="" />
                   ) : (
                     <Wine size={16} className="text-zinc-700" />
                   )}
                </div>
                <div className="min-w-0">
                   <p className="text-sm font-bold text-zinc-200 truncate">{bottle.producer}</p>
                   <p className={`text-xs ${WINE_TEXT_COLOR_MAP[bottle.type]} truncate`}>
                      {bottle.vintage} {bottle.varietal}
                   </p>
                   {bottle.storageId ? (
                     <p className="text-[10px] text-zinc-500">{getLocationName(bottle.storageId)}</p>
                   ) : (
                     <p className="text-[10px] text-yellow-600">Unplaced</p>
                   )}
                </div>
             </Link>
           ))}
        </div>
      )}
      
      {isOpen && results.length === 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 p-4 text-center text-zinc-500 text-sm">
           No wines found.
        </div>
      )}
    </div>
  );
};

export default SearchBar;
