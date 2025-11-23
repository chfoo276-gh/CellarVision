
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBottleById, consumeBottle, getCellarById, updateBottle, getSettings, duplicateBottle, deleteBottle, getCellars, getBottlesByCellar, moveBottle } from '../services/storageService';
import { Bottle, BottleStatus, StorageUnit } from '../types';
import { ArrowLeft, Hash, Calendar, CheckCircle2, Wine, DollarSign, Pencil, Save, X, Globe, AlertCircle, Copy, Camera, Trash2 } from 'lucide-react';
import { WINE_TEXT_COLOR_MAP } from '../constants';
import CellarGrid from '../components/CellarGrid';

const BottleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bottle, setBottle] = useState<Bottle | null>(null);
  const [cellarName, setCellarName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Consume Modal State
  const [isConsuming, setIsConsuming] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  // Duplicate Modal State
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(1);

  // Delete Modal State
  const [isDeleting, setIsDeleting] = useState(false);

  // Place Bottle State
  const [isPlacing, setIsPlacing] = useState(false);
  const [cellars, setCellars] = useState<StorageUnit[]>([]);
  const [selectedCellarId, setSelectedCellarId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{row: number, col: number} | null>(null);
  const [cellarBottles, setCellarBottles] = useState<Bottle[]>([]);

  // Price Edit State
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPriceValue, setEditPriceValue] = useState('');

  // Date Edit State
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editDateValue, setEditDateValue] = useState('');

  // Details Edit State (Producer, Vintage, Varietal, etc.)
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editDetails, setEditDetails] = useState<{
      producer: string;
      vintage: number | string;
      varietal: string;
      region: string;
      country: string;
  }>({
      producer: '',
      vintage: 0,
      varietal: '',
      region: '',
      country: ''
  });

  useEffect(() => {
    setCurrencySymbol(getSettings().currencySymbol);
    setCellars(getCellars());
    
    if (id) {
      const b = getBottleById(id);
      if (b) {
        setBottle(b);
        setEditPriceValue(b.currentPrice?.toString() || b.purchasePrice?.toString() || '0');
        
        // Initialize details edit state
        setEditDetails({
            producer: b.producer,
            vintage: b.vintage,
            varietal: b.varietal,
            region: b.region || '',
            country: b.country || ''
        });
        
        // Initialize date value for editing using local time components
        const dateObj = new Date(b.dateAdded);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        setEditDateValue(`${year}-${month}-${day}`);

        if (b.storageId) {
            const c = getCellarById(b.storageId);
            setCellarName(c ? c.name : 'Unknown Location');
        } else {
            setCellarName('Unplaced');
        }
      } else {
        navigate('/');
      }
    }
  }, [id, navigate]);

  // Effect to load bottles for the grid when selecting a cellar during placement
  useEffect(() => {
    if (selectedCellarId) {
        setCellarBottles(getBottlesByCellar(selectedCellarId));
    }
  }, [selectedCellarId]);

  const handleConsume = () => {
    if (bottle) {
      consumeBottle(bottle.id, rating, notes, "Casual");
      navigate('/history');
    }
  };

  const handleSavePrice = () => {
    if (bottle) {
      const newPrice = parseFloat(editPriceValue);
      if (!isNaN(newPrice)) {
        updateBottle(bottle.id, { currentPrice: newPrice });
        setBottle({ ...bottle, currentPrice: newPrice });
      }
      setIsEditingPrice(false);
    }
  };

  const handleSaveDate = () => {
    if (bottle && editDateValue) {
      // Parse YYYY-MM-DD string and create local date at midnight
      const [y, m, d] = editDateValue.split('-').map(Number);
      const newDate = new Date(y, m - 1, d);
      const timestamp = newDate.getTime();
      
      updateBottle(bottle.id, { dateAdded: timestamp });
      setBottle({ ...bottle, dateAdded: timestamp });
      setIsEditingDate(false);
    }
  };

  const handleSaveDetails = () => {
      if (bottle) {
          updateBottle(bottle.id, {
              producer: editDetails.producer,
              vintage: editDetails.vintage,
              varietal: editDetails.varietal,
              region: editDetails.region,
              country: editDetails.country
          });
          setBottle({
              ...bottle,
              producer: editDetails.producer,
              vintage: editDetails.vintage,
              varietal: editDetails.varietal,
              region: editDetails.region,
              country: editDetails.country
          });
          setIsEditingDetails(false);
      }
  };

  const handleDuplicate = () => {
    if (bottle && duplicateCount > 0) {
      duplicateBottle(bottle.id, duplicateCount);
      setIsDuplicating(false);
      navigate('/'); // Go back to dashboard to see unplaced items
    }
  };

  const handleConfirmDelete = () => {
    if (bottle) {
      deleteBottle(bottle.id);
      navigate('/', { replace: true });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && bottle) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        updateBottle(bottle.id, { photoUrl: base64 });
        setBottle({ ...bottle, photoUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Placement Logic
  const handleStartPlacing = () => {
    if (cellars.length > 0) {
        setSelectedCellarId(cellars[0].id);
    }
    setIsPlacing(true);
  };

  const handleSlotClick = (row: number, col: number, existingBottle?: Bottle) => {
    if (existingBottle) return; // Can't place in occupied slot
    setSelectedSlot({ row, col });
  };

  const handleConfirmPlacement = () => {
    if (bottle && selectedCellarId && selectedSlot) {
        moveBottle(bottle.id, selectedCellarId, selectedSlot);
        
        // Refresh bottle data
        const updated = getBottleById(bottle.id);
        if (updated) setBottle(updated);
        
        // Update display name
        const c = getCellarById(selectedCellarId);
        setCellarName(c ? c.name : '');

        setIsPlacing(false);
        setSelectedSlot(null);
    }
  };

  if (!bottle) return null;

  const isConsumed = bottle.status === BottleStatus.CONSUMED;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm text-zinc-500 uppercase tracking-wider">{bottle.type} Wine</span>
        </div>
        
        {/* Actions Menu */}
        <button 
           onClick={() => setIsDuplicating(true)}
           className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
        >
           <Copy size={16} />
           <span className="hidden md:inline">Duplicate</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
            <div className="relative aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-xl group">
            {bottle.photoUrl ? (
                <img src={bottle.photoUrl} alt="Bottle Label" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                <Wine size={64} className="mb-4 opacity-50" />
                <span className="text-sm">No Image Provided</span>
                </div>
            )}
            {isConsumed && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2">
                    <CheckCircle2 /> Consumed
                    </div>
                </div>
            )}
            </div>
            
            {!isConsumed && (
                <>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center gap-2 transition-all font-medium"
                    >
                        <Camera size={18} />
                        {bottle.photoUrl ? 'Change Photo' : 'Add Photo'}
                    </button>
                </>
            )}
        </div>

        {/* Details Section */}
        <div className="space-y-6">
           <div className="relative group/edit">
             {!isConsumed && !isEditingDetails && (
                 <button 
                    onClick={() => setIsEditingDetails(true)}
                    className="absolute top-0 right-0 p-2 text-zinc-600 hover:text-white transition-colors opacity-0 group-hover/edit:opacity-100"
                    title="Edit Details"
                 >
                     <Pencil size={18} />
                 </button>
             )}

             {isEditingDetails ? (
                 <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                     <div>
                         <label className="text-xs text-zinc-500 uppercase font-bold">Producer</label>
                         <input 
                            type="text"
                            value={editDetails.producer}
                            onChange={(e) => setEditDetails({...editDetails, producer: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white font-serif font-bold text-xl"
                         />
                     </div>
                     <div className="flex gap-2">
                         <div className="w-24">
                             <label className="text-xs text-zinc-500 uppercase font-bold">Vintage</label>
                             <input 
                                type="text"
                                value={editDetails.vintage}
                                onChange={(e) => setEditDetails({...editDetails, vintage: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white font-medium"
                             />
                         </div>
                         <div className="flex-1">
                             <label className="text-xs text-zinc-500 uppercase font-bold">Varietal</label>
                             <input 
                                type="text"
                                value={editDetails.varietal}
                                onChange={(e) => setEditDetails({...editDetails, varietal: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white font-medium"
                             />
                         </div>
                     </div>
                     <div className="flex gap-2">
                         <div className="flex-1">
                             <label className="text-xs text-zinc-500 uppercase font-bold">Region</label>
                             <input 
                                type="text"
                                value={editDetails.region}
                                onChange={(e) => setEditDetails({...editDetails, region: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-sm"
                             />
                         </div>
                         <div className="flex-1">
                             <label className="text-xs text-zinc-500 uppercase font-bold">Country</label>
                             <input 
                                type="text"
                                value={editDetails.country}
                                onChange={(e) => setEditDetails({...editDetails, country: e.target.value})}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white text-sm"
                             />
                         </div>
                     </div>
                     <div className="flex gap-2 pt-2">
                         <button onClick={() => setIsEditingDetails(false)} className="flex-1 py-2 text-zinc-400 hover:text-white bg-zinc-800 rounded">Cancel</button>
                         <button onClick={handleSaveDetails} className="flex-1 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded font-bold">Save Details</button>
                     </div>
                 </div>
             ) : (
                 <>
                    <h1 className="text-4xl font-serif font-bold text-white mb-2 pr-8 leading-tight">{bottle.producer}</h1>
                    <p className={`text-xl font-medium ${WINE_TEXT_COLOR_MAP[bottle.type]}`}>
                    {bottle.vintage} {bottle.varietal}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-zinc-400">
                        {bottle.region && <span>{bottle.region}</span>}
                        {bottle.country && (
                            <>
                                <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                                <span className="flex items-center gap-1"><Globe size={14} /> {bottle.country}</span>
                            </>
                        )}
                    </div>
                 </>
             )}
           </div>

           <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 space-y-3">
             <div className="flex items-center gap-3 text-zinc-300">
                <Hash className={bottle.storageId ? "text-zinc-500" : "text-yellow-500"} size={20} />
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 uppercase">Location</p>
                  <div className="flex items-center justify-between">
                      <p className="font-medium flex items-center gap-2">
                          {cellarName}
                          {!bottle.storageId && !isConsumed && (
                              <span className="text-xs text-yellow-500 flex items-center gap-1 bg-yellow-900/20 px-2 py-0.5 rounded"><AlertCircle size={10} /> Unplaced</span>
                          )}
                      </p>
                      {!bottle.storageId && !isConsumed && (
                        <button 
                           onClick={handleStartPlacing}
                           className="text-xs font-bold bg-rose-600 text-white px-3 py-1.5 rounded hover:bg-rose-700 transition-colors"
                        >
                           Place in Cellar
                        </button>
                      )}
                  </div>
                  {bottle.coordinates && !isConsumed && <p className="text-sm text-zinc-400">Row {bottle.coordinates.row + 1}, Slot {bottle.coordinates.col + 1}</p>}
                </div>
             </div>
             
             <div className="flex items-center gap-3 text-zinc-300">
                <Calendar className="text-zinc-500" size={20} />
                <div className="w-full">
                  <p className="text-xs text-zinc-500 uppercase">Purchased on</p>
                  <div className="flex justify-between items-center w-full">
                    {isEditingDate ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="date" 
                            className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-white text-sm color-scheme-dark"
                            value={editDateValue}
                            onChange={(e) => setEditDateValue(e.target.value)}
                            autoFocus
                          />
                          <button onClick={handleSaveDate} className="text-emerald-500 hover:text-emerald-400"><Save size={16} /></button>
                          <button onClick={() => setIsEditingDate(false)} className="text-rose-500 hover:text-rose-400"><X size={16} /></button>
                        </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{new Date(bottle.dateAdded).toLocaleDateString()}</p>
                        {!isConsumed && (
                           <button onClick={() => setIsEditingDate(true)} className="text-zinc-600 hover:text-white transition-colors">
                             <Pencil size={14} />
                           </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
             </div>
             
             <div className="flex items-center gap-3 text-zinc-300">
                <DollarSign className="text-zinc-500" size={20} />
                <div className="w-full">
                  <p className="text-xs text-zinc-500 uppercase">Value</p>
                  <div className="flex justify-between items-center w-full">
                    <div>
                      {isEditingPrice ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="number" 
                            className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 w-24 text-white text-sm"
                            value={editPriceValue}
                            onChange={(e) => setEditPriceValue(e.target.value)}
                            autoFocus
                          />
                          <button onClick={handleSavePrice} className="text-emerald-500 hover:text-emerald-400"><Save size={16} /></button>
                          <button onClick={() => setIsEditingPrice(false)} className="text-rose-500 hover:text-rose-400"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                           <p className="font-medium text-emerald-400">
                              Current: {currencySymbol}{(bottle.currentPrice || bottle.purchasePrice || 0).toFixed(2)}
                           </p>
                           {!isConsumed && (
                             <button onClick={() => setIsEditingPrice(true)} className="text-zinc-600 hover:text-white transition-colors">
                               <Pencil size={14} />
                             </button>
                           )}
                        </div>
                      )}
                      {(bottle.purchasePrice || 0) > 0 && (
                        <p className="text-xs text-zinc-500">Purchased: {currencySymbol}{bottle.purchasePrice?.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
             </div>
           </div>

           {!isConsumed ? (
             !isConsuming ? (
               <div className="space-y-3">
                 <button 
                   onClick={() => setIsConsuming(true)}
                   className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-4 rounded-xl transition-colors shadow-lg"
                 >
                   Mark as Consumed
                 </button>
                 <button
                    type="button"
                    onClick={() => setIsDeleting(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 text-zinc-500 hover:text-rose-500 hover:bg-rose-950/10 rounded-xl transition-colors font-medium text-sm"
                  >
                    <Trash2 size={16} /> Delete Bottle
                  </button>
               </div>
             ) : (
               <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="font-bold text-lg">How was it?</h3>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-zinc-700'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea 
                    placeholder="Tasting notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-white focus:border-rose-500 outline-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setIsConsuming(false)} className="flex-1 py-2 text-zinc-400 hover:text-white">Cancel</button>
                    <button onClick={handleConsume} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded">Confirm</button>
                  </div>
               </div>
             )
           ) : (
             <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
               <p className="text-sm text-zinc-500 uppercase mb-2">Tasting Notes</p>
               <div className="flex text-yellow-500 mb-2">
                 {'★'.repeat(bottle.rating || 0)}
                 <span className="text-zinc-700">{'★'.repeat(5 - (bottle.rating || 0))}</span>
               </div>
               <p className="text-zinc-300 italic">"{bottle.notes || 'No notes added.'}"</p>
               <p className="text-xs text-zinc-600 mt-2 text-right">Drank on {new Date(bottle.dateConsumed!).toLocaleDateString()}</p>
               <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
                   <button
                     type="button"
                     onClick={() => setIsDeleting(true)}
                     className="flex items-center gap-2 text-zinc-600 hover:text-rose-500 text-xs transition-colors"
                   >
                     <Trash2 size={14} /> Delete Record
                   </button>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Duplicate Modal */}
      {isDuplicating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
              <h3 className="text-xl font-bold mb-2">Duplicate Bottle</h3>
              <p className="text-zinc-400 text-sm mb-6">
                Create copies of this bottle in your inventory. New bottles will be marked as "Unplaced".
              </p>
              
              <div className="mb-6">
                 <label className="block text-sm font-medium text-zinc-300 mb-2">Number of Copies</label>
                 <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={duplicateCount} 
                    onChange={(e) => setDuplicateCount(parseInt(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-rose-500"
                 />
              </div>
              
              <div className="flex gap-3">
                 <button 
                   onClick={() => setIsDuplicating(false)} 
                   className="flex-1 py-3 text-zinc-400 hover:text-white bg-zinc-800 rounded-lg"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleDuplicate} 
                   className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                 >
                   Duplicate
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
           <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 border-rose-900/50">
              <div className="flex flex-col items-center text-center mb-6">
                 <div className="w-12 h-12 bg-rose-900/30 rounded-full flex items-center justify-center mb-4 text-rose-500">
                    <Trash2 size={24} />
                 </div>
                 <h3 className="text-xl font-bold mb-2 text-white">Delete Bottle?</h3>
                 <p className="text-zinc-400 text-sm">
                   Are you sure you want to permanently delete <strong>{bottle.producer}</strong>? This action cannot be undone.
                 </p>
              </div>
              
              <div className="flex gap-3">
                 <button 
                   onClick={() => setIsDeleting(false)} 
                   className="flex-1 py-3 text-zinc-400 hover:text-white bg-zinc-800 rounded-lg font-medium transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleConfirmDelete} 
                   className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                 >
                   Delete
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Place Bottle Modal */}
      {isPlacing && (
        <div className="fixed inset-0 z-[60] bg-zinc-950 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in slide-in-from-bottom-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Place Bottle</h2>
                      <p className="text-zinc-400 text-sm">{bottle.producer} - {bottle.vintage}</p>
                    </div>
                    <button onClick={() => setIsPlacing(false)} className="p-3 bg-zinc-900 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white">
                       <X size={24} />
                    </button>
                </div>

                {cellars.length === 0 ? (
                   <div className="text-center py-12 text-zinc-500">
                     <p>No cellars found. Please create a storage location first.</p>
                     <button onClick={() => navigate('/cellars/new')} className="mt-4 text-rose-500 underline">Create Cellar</button>
                   </div>
                ) : (
                  <>
                    {/* Cellar Selector */}
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-6">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Choose Storage Unit</label>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {cellars.map(c => (
                            <button
                              key={c.id}
                              onClick={() => { setSelectedCellarId(c.id); setSelectedSlot(null); }}
                              className={`px-4 py-3 rounded-lg border whitespace-nowrap transition-all ${
                                  selectedCellarId === c.id 
                                  ? 'bg-rose-600 border-rose-500 text-white' 
                                  : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                    </div>

                    {/* Grid */}
                    {selectedCellarId && (
                        <div className="mb-24"> {/* Margin for fixed bottom button */}
                            <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 mb-4">
                                <p className="text-sm text-zinc-400">Tap a highlighted circle to place.</p>
                                {selectedSlot && (
                                    <span className="text-white font-bold bg-emerald-600 px-3 py-1 rounded">
                                      Row {selectedSlot.row + 1}, Col {selectedSlot.col + 1}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex justify-center">
                                <CellarGrid 
                                    cellar={cellars.find(c => c.id === selectedCellarId)!}
                                    bottles={cellarBottles}
                                    onSlotClick={handleSlotClick}
                                    highlightEmpty={true}
                                />
                            </div>
                        </div>
                    )}

                    {/* Confirm Button */}
                    <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center pointer-events-none">
                        <button 
                            disabled={!selectedSlot}
                            onClick={handleConfirmPlacement}
                            className="pointer-events-auto bg-emerald-600 disabled:opacity-50 disabled:scale-95 hover:bg-emerald-700 text-white text-lg font-bold py-4 px-12 rounded-full shadow-2xl shadow-emerald-900/50 flex items-center gap-2 transition-all"
                        >
                            <Save /> Confirm Location
                        </button>
                    </div>
                  </>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default BottleDetail;
