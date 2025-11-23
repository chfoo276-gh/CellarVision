
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, ArrowRight, Save } from 'lucide-react';
import { analyzeWineLabel, ScannedWineData } from '../services/geminiService';
import { getCellars, saveBottle, getSettings, getDistinctVarietals } from '../services/storageService';
import { StorageUnit, WineType, BottleStatus } from '../types';
import CellarGrid from '../components/CellarGrid';

enum Step {
  SCAN = 1,
  CONFIRM = 2,
  PLACE = 3
}

const AddBottle: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(Step.SCAN);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [existingVarietals, setExistingVarietals] = useState<string[]>([]);
  
  // Data State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ScannedWineData> & { purchasePrice?: number }>({
    producer: '',
    varietal: '',
    vintage: new Date().getFullYear(),
    type: WineType.RED,
    region: '',
    country: '',
    purchasePrice: 0
  });

  // Location State
  const [cellars, setCellars] = useState<StorageUnit[]>([]);
  const [selectedCellarId, setSelectedCellarId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{row: number, col: number} | null>(null);

  useEffect(() => {
    setCellars(getCellars());
    setCurrencySymbol(getSettings().currencySymbol);
    setExistingVarietals(getDistinctVarietals());
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        try {
          // Call Gemini
          const data = await analyzeWineLabel(base64);
          setFormData(prev => ({ ...prev, ...data }));
          setStep(Step.CONFIRM);
        } catch (error) {
          alert("Failed to analyze image. Please fill details manually.");
          setStep(Step.CONFIRM);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(Step.PLACE);
  };

  const handleSlotClick = (row: number, col: number, bottle?: any) => {
    if (bottle) {
      alert("This slot is already occupied.");
      return;
    }
    setSelectedSlot({ row, col });
  };

  const saveToInventory = (isUnplaced: boolean = false) => {
    if (!isUnplaced && (!selectedCellarId || !selectedSlot)) return;

    saveBottle({
      producer: formData.producer!,
      varietal: formData.varietal!,
      vintage: formData.vintage!,
      type: formData.type!,
      region: formData.region,
      country: formData.country,
      photoUrl: imagePreview || undefined,
      status: BottleStatus.ACTIVE,
      storageId: isUnplaced ? undefined : selectedCellarId,
      coordinates: isUnplaced ? undefined : selectedSlot!,
      dateAdded: Date.now(),
      purchasePrice: formData.purchasePrice,
      currentPrice: formData.purchasePrice // Default to purchase price
    });

    if (isUnplaced) {
      navigate('/');
    } else {
      navigate(`/cellars/${selectedCellarId}`);
    }
  };

  // --- Render Steps ---

  const renderScanStep = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Add New Bottle</h1>
        <p className="text-zinc-400">Scan a label to automatically fill details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <button
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-12 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl hover:border-rose-500 hover:bg-zinc-800 transition-all group"
        >
          {isLoading ? (
            <Loader2 className="animate-spin text-rose-500 mb-4" size={48} />
          ) : (
            <Camera className="text-zinc-500 group-hover:text-rose-500 mb-4 transition-colors" size={48} />
          )}
          <span className="font-medium text-lg text-zinc-300">Take Photo / Upload</span>
          <span className="text-sm text-zinc-500 mt-2">{isLoading ? 'Analyzing with AI...' : 'Supported: JPG, PNG'}</span>
        </button>
        
        <button
           onClick={() => setStep(Step.CONFIRM)}
           className="flex flex-col items-center justify-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all"
        >
           <span className="font-medium text-lg text-zinc-300">Skip to Manual Entry</span>
           <ArrowRight className="text-zinc-500 mt-4" />
        </button>
      </div>
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );

  const renderConfirmStep = () => (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Review Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          {imagePreview ? (
            <img src={imagePreview} alt="Label" className="w-full rounded-lg shadow-lg border border-zinc-700" />
          ) : (
            <div className="w-full aspect-[3/4] bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600">No Image</div>
          )}
          <button 
             onClick={() => { setImagePreview(null); setStep(Step.SCAN); }}
             className="w-full mt-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded"
          >
            Retake Photo
          </button>
        </div>
        
        <form onSubmit={handleConfirmDetails} className="md:col-span-2 space-y-4">
          
          {/* Field 1: Type */}
          <div>
             <label className="text-sm text-zinc-400">Type</label>
             <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as WineType})} className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-white">
               {Object.values(WineType).map(t => <option key={t} value={t}>{t}</option>)}
             </select>
          </div>

          {/* Field 2: Producer */}
          <div>
            <label className="text-sm text-zinc-400">Producer / Winery</label>
            <input type="text" required value={formData.producer} onChange={e => setFormData({...formData, producer: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-white" />
          </div>

          {/* Field 3: Varietal and Vintage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400">Varietal</label>
              <input 
                 type="text" 
                 required 
                 list="varietals"
                 value={formData.varietal} 
                 onChange={e => setFormData({...formData, varietal: e.target.value})} 
                 className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-white" 
              />
              <datalist id="varietals">
                 {existingVarietals.map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div>
              <label className="text-sm text-zinc-400">Vintage</label>
              <input 
                type="text" 
                required 
                value={formData.vintage} 
                onChange={e => setFormData({...formData, vintage: e.target.value})} 
                className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-white" 
                placeholder="Year or NV"
              />
            </div>
          </div>

          {/* Field 4: Region and Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400">Region</label>
              <input type="text" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-white" />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Country</label>
              <input type="text" value={formData.country || ''} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-white" />
            </div>
          </div>

          {/* Field 5: Price */}
          <div>
              <label className="text-sm text-zinc-400">Purchase Price ({currencySymbol})</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={formData.purchasePrice || ''} 
                onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})} 
                className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-white" 
                placeholder="0.00"
              />
          </div>
          
          <div className="flex gap-4 mt-6">
             <button type="button" onClick={() => saveToInventory(true)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-lg border border-zinc-700">
               Save Unplaced
             </button>
             <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
               Next: Place Bottle <ArrowRight size={18} />
             </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderPlaceStep = () => {
     if (cellars.length === 0) {
       return (
         <div className="text-center py-12">
            <h2 className="text-xl font-bold mb-4">No Storage Locations Found</h2>
            <p className="text-zinc-400 mb-6">You need to create a cellar before placing bottles.</p>
            <button onClick={() => navigate('/cellars/new')} className="bg-rose-600 text-white px-6 py-2 rounded-lg">Create Cellar</button>
            <div className="mt-4">
              <button onClick={() => saveToInventory(true)} className="text-zinc-500 hover:text-white underline">Save as Unplaced for now</button>
            </div>
         </div>
       )
     }

     const currentCellar = cellars.find(c => c.id === selectedCellarId);
     
     return (
       <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
         <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Select Location</h2>
            <div className="text-right">
               <p className="font-bold">{formData.producer}</p>
               <p className="text-sm text-zinc-400">{formData.vintage} {formData.varietal}</p>
            </div>
         </div>

         <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
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
                   {c.name} ({c.rows * c.columns} slots)
                 </button>
               ))}
            </div>
         </div>

         {currentCellar && (
           <div className="space-y-4">
             <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                <p className="text-sm text-zinc-400">Tap a <span className="text-emerald-500 font-bold">highlighted</span> circle to select.</p>
                {selectedSlot && (
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold bg-emerald-600 px-3 py-1 rounded">
                      Row {selectedSlot.row + 1}, Col {selectedSlot.col + 1}
                    </span>
                  </div>
                )}
             </div>

             <div className="flex justify-center">
                {/* We need to pass occupied slots logic here. For simplicity, we fetch all active bottles in this component but ideal approach is fetching by ID inside Grid or passing processed list */}
                <CellarGrid 
                  cellar={currentCellar}
                  bottles={getInitialBottlesForGrid(currentCellar.id)} 
                  onSlotClick={handleSlotClick}
                  highlightEmpty={true}
                />
             </div>
             
             {selectedSlot && (
               <div className="fixed bottom-6 left-0 right-0 px-4 md:px-0 flex justify-center z-40">
                  <button 
                    onClick={() => saveToInventory(false)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-4 px-12 rounded-full shadow-2xl shadow-emerald-900/50 flex items-center gap-2 transform hover:scale-105 transition-all"
                  >
                    <Save /> Save to Cellar
                  </button>
               </div>
             )}
           </div>
         )}
       </div>
     );
  };

  const getInitialBottlesForGrid = (id: string) => {
      const all = localStorage.getItem('cv_bottles');
      const parsed = all ? JSON.parse(all) : [];
      return parsed.filter((b: any) => b.storageId === id && b.status === BottleStatus.ACTIVE);
  };

  return (
    <div className="pb-20">
      {step === Step.SCAN && renderScanStep()}
      {step === Step.CONFIRM && renderConfirmStep()}
      {step === Step.PLACE && renderPlaceStep()}
    </div>
  );
};

export default AddBottle;
