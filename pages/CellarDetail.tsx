
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCellarById, getBottlesByCellar, moveBottle, isSlotOccupied, getUnplacedBottles } from '../services/storageService';
import { StorageUnit, Bottle } from '../types';
import CellarGrid from '../components/CellarGrid';
import { ArrowLeft, Loader2, Plus, Pencil, GripVertical } from 'lucide-react';

const CellarDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cellar, setCellar] = useState<StorageUnit | null>(null);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [globalUnplaced, setGlobalUnplaced] = useState<Bottle[]>([]);

  const refreshData = () => {
    if (id) {
      const c = getCellarById(id);
      if (c) {
        setCellar(c);
        setBottles(getBottlesByCellar(id));
        setGlobalUnplaced(getUnplacedBottles());
      } else {
        navigate('/');
      }
    }
  };

  useEffect(() => {
    refreshData();
  }, [id, navigate]);

  const handleSlotClick = (row: number, col: number, bottle?: Bottle) => {
    if (bottle) {
      navigate(`/bottle/${bottle.id}`);
    }
  };

  const handleDropBottle = (row: number, col: number, bottleId: string) => {
    if (!id) return;
    
    // Check if slot is occupied (though the grid component handles drop event prevention visually)
    if (isSlotOccupied(id, row, col)) return;

    // This handles unplaced -> slot AND slot -> slot moving
    moveBottle(bottleId, id, { row, col });
    refreshData();
  };

  const handleDragStart = (e: React.DragEvent, bottleId: string) => {
    e.dataTransfer.setData("text/plain", bottleId);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropToGlobal = (e: React.DragEvent) => {
      e.preventDefault();
      const bottleId = e.dataTransfer.getData("text/plain");
      if (bottleId) {
          // Remove storageId and coordinates -> Global unplaced
          moveBottle(bottleId, undefined, undefined);
          refreshData();
      }
  };

  if (!cellar) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  const placedBottles = bottles.filter(b => b.coordinates);
  
  // Sort global unplaced by producer alphabetically by default
  const displayedGlobalUnplaced = [...globalUnplaced].sort((a, b) => a.producer.localeCompare(b.producer));

  const occupancy = Math.round((placedBottles.length / (cellar.rows * cellar.columns)) * 100);

  return (
    <div className="animate-fade-in h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{cellar.name}</h1>
                <Link to={`/cellars/${cellar.id}/edit`} className="text-zinc-500 hover:text-white transition-colors p-1" title="Edit Cellar">
                  <Pencil size={16} />
                </Link>
              </div>
              <p className="text-zinc-400 text-sm">{placedBottles.length} bottles ({occupancy}% full)</p>
            </div>
         </div>
         <Link to="/add-bottle" className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus size={16} /> Add Bottle
         </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
        {/* Main Grid Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
           <div className="flex-1 bg-zinc-900/30 p-4 rounded-xl border border-zinc-900/50 overflow-auto flex items-center justify-center">
             <CellarGrid 
                cellar={cellar} 
                bottles={placedBottles} 
                onSlotClick={handleSlotClick} 
                onDropBottle={handleDropBottle}
                highlightEmpty={true}
             />
           </div>
           
           {/* List of placed bottles below grid on mobile, hidden on tiny screens if needed */}
           <div className="mt-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex-1 lg:flex-none lg:h-48 overflow-y-auto">
             <h3 className="font-bold text-zinc-300 mb-2 text-sm sticky top-0 bg-zinc-900">Placed in Rack</h3>
             <div className="space-y-2">
               {placedBottles.map(b => (
                 <Link key={b.id} to={`/bottle/${b.id}`} className="flex items-center gap-3 p-2 bg-zinc-950 rounded border border-zinc-800 hover:border-zinc-600 transition-colors group">
                     <span className="text-xs font-mono text-zinc-500 w-8">{b.coordinates!.row+1}-{b.coordinates!.col+1}</span>
                     <p className="font-medium text-sm truncate text-zinc-200 group-hover:text-white flex-1">{b.producer}</p>
                     <p className="text-xs text-zinc-500 truncate">{b.vintage}</p>
                 </Link>
               ))}
               {placedBottles.length === 0 && <p className="text-zinc-500 text-xs">Rack is empty.</p>}
             </div>
           </div>
        </div>

        {/* Sidebar: Unplaced Only */}
        <div className="lg:w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col rounded-xl lg:rounded-none lg:bg-transparent lg:border-none overflow-hidden h-64 lg:h-auto">
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="font-bold text-zinc-300 text-sm">Unplaced Items</h3>
              </div>
              <p className="text-xs text-zinc-500 mb-4">Drag bottles here to unplace them, or to the grid to place them.</p>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                 {/* Global Unplaced */}
                 <div 
                   onDragOver={handleDragOver}
                   onDrop={handleDropToGlobal}
                   className="border-2 border-dashed border-zinc-800 rounded-lg p-2 min-h-[120px] transition-colors hover:bg-zinc-800/50 hover:border-zinc-600 h-full"
                 >
                   <p className="text-[10px] uppercase text-zinc-500 font-bold mb-2">Unassigned Bottles</p>
                   <div className="space-y-2">
                      {displayedGlobalUnplaced.length === 0 && <p className="text-xs text-zinc-600 italic text-center pt-8">Drop here to remove from cellar</p>}
                       {displayedGlobalUnplaced.map(b => (
                         <div 
                           key={b.id} 
                           draggable
                           onDragStart={(e) => handleDragStart(e, b.id)}
                           className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded cursor-grab active:cursor-grabbing hover:border-zinc-500 transition-colors"
                         >
                            <GripVertical size={14} className="text-zinc-600" />
                            <div className="min-w-0">
                               <p className="text-sm font-medium truncate text-white">{b.producer}</p>
                               <p className="text-xs text-zinc-500">{b.vintage} {b.varietal}</p>
                            </div>
                         </div>
                       ))}
                   </div>
                 </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CellarDetail;
