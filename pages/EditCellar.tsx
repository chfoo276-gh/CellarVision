import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { getCellarById, updateCellar } from '../services/storageService';

const EditCellar: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState(0);
  const [columns, setColumns] = useState(0);

  useEffect(() => {
    if (id) {
      const cellar = getCellarById(id);
      if (cellar) {
        setName(cellar.name);
        setDescription(cellar.description || '');
        setRows(cellar.rows);
        setColumns(cellar.columns);
        setLoading(false);
      } else {
        navigate('/');
      }
    }
  }, [id, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name || rows < 1 || columns < 1) return;

    updateCellar(id, {
      name,
      description,
      rows,
      columns,
    });

    navigate(`/cellars/${id}`);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Edit Cellar</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 md:p-8 rounded-xl border border-zinc-800 space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Cellar Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="p-4 bg-yellow-900/10 border border-yellow-900/30 rounded-lg">
          <p className="text-xs text-yellow-500">
            <strong>Warning:</strong> Reducing dimensions may hide bottles that are located in rows or columns that no longer exist on the grid.
          </p>
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
            <label className="block text-sm font-medium text-zinc-300 mb-2">Columns</label>
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
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCellar;