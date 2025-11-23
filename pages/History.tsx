import React, { useEffect, useState } from 'react';
import { getConsumedBottles } from '../services/storageService';
import { Bottle } from '../types';
import { Link } from 'react-router-dom';
import { WINE_TEXT_COLOR_MAP } from '../constants';

const History: React.FC = () => {
  const [history, setHistory] = useState<Bottle[]>([]);

  useEffect(() => {
    setHistory(getConsumedBottles());
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Consumption History</h1>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>No bottles consumed yet.</p>
          </div>
        ) : (
          history.map((bottle) => (
            <Link 
              key={bottle.id} 
              to={`/bottle/${bottle.id}`}
              className="block bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-4 transition-all"
            >
              <div className="flex items-center gap-4">
                 <div className="w-12 h-16 bg-zinc-950 rounded border border-zinc-800 overflow-hidden flex-shrink-0">
                    {bottle.photoUrl && <img src={bottle.photoUrl} className="w-full h-full object-cover opacity-50 grayscale" alt="" />}
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-lg text-zinc-300">{bottle.producer}</h3>
                    <p className={`text-sm ${WINE_TEXT_COLOR_MAP[bottle.type]}`}>{bottle.vintage} {bottle.varietal}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Consumed: {new Date(bottle.dateConsumed!).toLocaleDateString()}
                    </p>
                 </div>
                 <div className="text-yellow-500 text-lg">
                    {'★'.repeat(bottle.rating || 0)}
                 </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default History;