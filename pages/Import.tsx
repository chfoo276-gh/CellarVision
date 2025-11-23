
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { bulkSaveBottles, getCellars } from '../services/storageService';
import { Bottle, BottleStatus, WineType } from '../types';

const Import: React.FC = () => {
  const navigate = useNavigate();
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Simple CSV parser
  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Naive parsing: assumes comma separation
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((h, i) => {
        row[h] = values[i];
      });
      return row;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        setCsvText(text);
        try {
          const parsed = parseCSV(text);
          setPreview(parsed);
          setError(null);
        } catch (err) {
          setError("Failed to parse CSV.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (preview.length === 0) return;

    const bottlesToSave: Omit<Bottle, 'id'>[] = preview.map(row => {
      // Helper to map type string to Enum safely
      let type = WineType.RED;
      const t = row.type?.toLowerCase();
      if (t?.includes('white')) type = WineType.WHITE;
      else if (t?.includes('rose') || t?.includes('rosé')) type = WineType.ROSE;
      else if (t?.includes('sparkling')) type = WineType.SPARKLING;
      
      // Parse date or default to now
      let dateAdded = Date.now();
      if (row['purchased on']) {
         const parsedDate = Date.parse(row['purchased on']);
         if (!isNaN(parsedDate)) dateAdded = parsedDate;
      }

      return {
        producer: row.producer || 'Unknown Producer',
        varietal: row.varietal || 'Unknown Varietal',
        // Handle string vintage input
        vintage: row.vintage || new Date().getFullYear(),
        type: type,
        region: row.region,
        country: row.country,
        status: BottleStatus.ACTIVE,
        purchasePrice: parseFloat(row.price) || 0,
        currentPrice: parseFloat(row.price) || 0,
        dateAdded: dateAdded,
      };
    });

    bulkSaveBottles(bottlesToSave);
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Import Inventory</h1>
        <p className="text-zinc-400">Upload a CSV file to bulk import your collection.</p>
      </div>

      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-6">
         <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-sm text-zinc-400">
            <p className="font-bold mb-2 text-white">Expected Format (CSV headers):</p>
            <code className="block bg-zinc-900 p-2 rounded text-rose-400 overflow-x-auto">
              Type, Producer, Varietal, Vintage, Region, Country, Price, Purchased On
            </code>
            <p className="mt-2">Example: <i>Red, Chateau Margaux, Cabernet Sauvignon, 2015, Bordeaux, France, 500, 2023-10-01</i></p>
         </div>

         <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-zinc-800/50 transition-colors">
            <Upload size={48} className="text-zinc-600 mb-4" />
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload}
              className="block w-full text-sm text-zinc-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-rose-600 file:text-white
                hover:file:bg-rose-700
                cursor-pointer mx-auto max-w-xs
              "
            />
         </div>

         {error && (
           <div className="bg-red-900/20 text-red-400 p-3 rounded-lg flex items-center gap-2">
             <AlertCircle size={18} /> {error}
           </div>
         )}

         {preview.length > 0 && (
           <div className="space-y-4">
             <h3 className="font-bold text-lg">Preview ({preview.length} bottles)</h3>
             <div className="max-h-64 overflow-y-auto bg-zinc-950 rounded-lg border border-zinc-800">
               <table className="w-full text-left text-sm">
                 <thead className="bg-zinc-900 text-zinc-400 sticky top-0">
                   <tr>
                     <th className="p-3">Type</th>
                     <th className="p-3">Producer</th>
                     <th className="p-3">Varietal</th>
                     <th className="p-3">Vintage</th>
                     <th className="p-3">Region</th>
                     <th className="p-3">Country</th>
                     <th className="p-3">Price</th>
                     <th className="p-3">Purchased On</th>
                   </tr>
                 </thead>
                 <tbody>
                   {preview.map((row, i) => (
                     <tr key={i} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                       <td className="p-3">{row.type}</td>
                       <td className="p-3">{row.producer}</td>
                       <td className="p-3">{row.varietal}</td>
                       <td className="p-3">{row.vintage}</td>
                       <td className="p-3">{row.region}</td>
                       <td className="p-3">{row.country}</td>
                       <td className="p-3">{row.price}</td>
                       <td className="p-3">{row['purchased on']}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             
             <button 
               onClick={handleImport}
               className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
             >
               <CheckCircle2 size={20} /> Import {preview.length} Bottles
             </button>
           </div>
         )}
      </div>
    </div>
  );
};

export default Import;
