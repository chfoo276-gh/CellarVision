
import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import { getSettings, saveSettings } from '../services/storageService';
import { UserSettings } from '../types';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>({ currency: 'USD', currencySymbol: '$' });
  const [saved, setSaved] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');
  const [customCode, setCustomCode] = useState('');

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    if (s.currency === 'Custom' || !['USD','EUR','GBP','JPY','HKD','AUD','CAD','CHF','CNY'].includes(s.currency)) {
      setIsCustom(true);
      setCustomCode(s.customCurrencyCode || s.currency);
      setCustomSymbol(s.currencySymbol);
    }
  }, []);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'Custom', symbol: '', name: 'Custom Currency...' },
  ];

  const handleSave = () => {
    let finalSettings = { ...settings };
    if (isCustom) {
      finalSettings = {
        currency: 'Custom', // Or keep 'Custom' as a UI state and store the code? Let's use 'Custom' for UI logic but store the code if we want logic elsewhere. For now, let's strictly store what user typed.
        customCurrencyCode: customCode,
        currencySymbol: customSymbol
      };
    }
    saveSettings(finalSettings);
    setSettings(finalSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    if (code === 'Custom') {
      setIsCustom(true);
      setSettings({ ...settings, currency: 'Custom' });
    } else {
      setIsCustom(false);
      const selected = currencies.find(c => c.code === code);
      if (selected) {
        setSettings({ ...settings, currency: selected.code, currencySymbol: selected.symbol });
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="md:hidden p-2 -ml-2 text-zinc-400">
           <ArrowLeft />
        </button>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="text-rose-500" />
          Settings
        </h1>
      </div>

      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-zinc-100">Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Currency</label>
              <p className="text-xs text-zinc-500 mb-2">Used for calculating total collection value.</p>
              <select
                value={isCustom ? 'Custom' : settings.currency}
                onChange={handleCurrencyChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} {c.symbol ? `(${c.symbol})` : ''} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            {isCustom && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                 <div>
                   <label className="block text-sm font-medium text-zinc-400 mb-2">Currency Code</label>
                   <input 
                      type="text" 
                      placeholder="e.g. SGD" 
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-zinc-400 mb-2">Symbol</label>
                   <input 
                      type="text" 
                      placeholder="e.g. S$" 
                      value={customSymbol}
                      onChange={(e) => setCustomSymbol(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white"
                   />
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800">
          <button
            onClick={handleSave}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={20} />
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
