import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { saveCellar } from '../services/storageService';

const CreateCellar: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState(5);
  const [columns, setColumns] = useState(6);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || rows < 1 || columns < 1) return;

    saveCellar({
      name,
      description,
      rows,
      columns,
    });

    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="text-3xl font-bold">Create New Cellar</h1>

      <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 md:p-8 rounded-xl border border-zinc-800 space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Cellar Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Kitchen Fridge"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dual zone, top shelf..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Rows</label>
            <input
              type="number"
              min="1"
              max="20"
              required
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Columns (Bottles per row)</label>
            <input
              type="number"
              min="1"
              max="20"
              required
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={20} />
            Create Cellar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCellar;