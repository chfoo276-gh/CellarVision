
import React from 'react';
import { Bottle, StorageUnit, WineType } from '../types';
import { WINE_COLOR_MAP } from '../constants';

interface CellarGridProps {
  cellar: StorageUnit;
  bottles: Bottle[];
  onSlotClick: (row: number, col: number, bottle?: Bottle) => void;
  highlightEmpty?: boolean;
  onDropBottle?: (row: number, col: number, bottleId: string) => void;
}

const CellarGrid: React.FC<CellarGridProps> = ({ cellar, bottles, onSlotClick, highlightEmpty = false, onDropBottle }) => {
  const getBottleAt = (row: number, col: number) => {
    return bottles.find(b => b.coordinates && b.coordinates.row === row && b.coordinates.col === col);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    const bottleId = e.dataTransfer.getData('text/plain');
    if (bottleId && onDropBottle) {
      onDropBottle(row, col, bottleId);
    }
  };

  const handleDragStart = (e: React.DragEvent, bottle: Bottle) => {
    e.dataTransfer.setData('text/plain', bottle.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const gridRows = [];
  for (let r = 0; r < cellar.rows; r++) {
    const cols = [];
    for (let c = 0; c < cellar.columns; c++) {
      const bottle = getBottleAt(r, c);
      const isOccupied = !!bottle;
      
      let cellClass = "w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer border-2 relative group overflow-hidden ";
      
      if (isOccupied) {
        cellClass += WINE_COLOR_MAP[bottle.type] + " shadow-lg hover:brightness-110 hover:scale-105 cursor-grab active:cursor-grabbing";
      } else {
        cellClass += highlightEmpty 
          ? "bg-zinc-800 border-zinc-600 hover:border-emerald-500 hover:bg-emerald-900/20"
          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700";
      }

      cols.push(
        <div 
          key={`${r}-${c}`} 
          className={cellClass}
          onClick={() => onSlotClick(r, c, bottle)}
          onDragOver={!isOccupied ? handleDragOver : undefined}
          onDrop={!isOccupied ? (e) => handleDrop(e, r, c) : undefined}
          draggable={isOccupied}
          onDragStart={isOccupied ? (e) => handleDragStart(e, bottle) : undefined}
        >
          {isOccupied ? (
            bottle.photoUrl ? (
              <img 
                src={bottle.photoUrl} 
                alt="bottle" 
                className="w-full h-full object-cover opacity-90 pointer-events-none"
              />
            ) : (
              <span className="text-[10px] md:text-xs font-bold text-zinc-950 opacity-60 pointer-events-none">
                {bottle.vintage}
              </span>
            )
          ) : (
             <span className="text-zinc-700 text-[9px] md:text-[10px] pointer-events-none">{r+1}-{c+1}</span>
          )}
          
          {/* Tooltip for desktop */}
          {isOccupied && (
            <div className="absolute bottom-full mb-2 hidden group-hover:block w-32 bg-black/90 text-white text-xs rounded p-2 z-10 pointer-events-none left-1/2 transform -translate-x-1/2">
              <p className="font-bold truncate">{bottle.producer}</p>
              <p className="truncate">{bottle.varietal}</p>
            </div>
          )}
        </div>
      );
    }
    gridRows.push(
      <div key={r} className="flex gap-2 md:gap-3 justify-center">
        {cols}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 md:gap-3 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 overflow-x-auto">
       {/* Top shelf is Row 0 visually */}
      {gridRows}
    </div>
  );
};

export default CellarGrid;
