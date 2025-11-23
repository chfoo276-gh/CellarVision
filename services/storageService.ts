
import { Bottle, BottleStatus, StorageUnit, Stats, WineType, UserSettings, Coordinates } from '../types';

const STORAGE_KEY_CELLARS = 'cv_cellars';
const STORAGE_KEY_BOTTLES = 'cv_bottles';
const STORAGE_KEY_SETTINGS = 'cv_settings';

// Helper to generate UUIDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- Settings ---

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'USD',
  currencySymbol: '$'
};

export const getSettings = (): UserSettings => {
  const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: UserSettings): UserSettings => {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  return settings;
};

// --- Cellars ---

export const getCellars = (): StorageUnit[] => {
  const data = localStorage.getItem(STORAGE_KEY_CELLARS);
  return data ? JSON.parse(data) : [];
};

export const getCellarById = (id: string): StorageUnit | undefined => {
  const cellars = getCellars();
  return cellars.find((c) => c.id === id);
};

export const saveCellar = (cellar: Omit<StorageUnit, 'id'>): StorageUnit => {
  const cellars = getCellars();
  const newCellar = { ...cellar, id: generateId() };
  cellars.push(newCellar);
  localStorage.setItem(STORAGE_KEY_CELLARS, JSON.stringify(cellars));
  return newCellar;
};

export const updateCellar = (id: string, updates: Partial<StorageUnit>): StorageUnit | null => {
  const cellars = getCellars();
  const index = cellars.findIndex((c) => c.id === id);
  if (index === -1) return null;

  cellars[index] = { ...cellars[index], ...updates };
  localStorage.setItem(STORAGE_KEY_CELLARS, JSON.stringify(cellars));
  return cellars[index];
};

// --- Bottles ---

export const getBottles = (): Bottle[] => {
  const data = localStorage.getItem(STORAGE_KEY_BOTTLES);
  return data ? JSON.parse(data) : [];
};

export const getBottleById = (id: string): Bottle | undefined => {
  const bottles = getBottles();
  return bottles.find((b) => b.id === id);
};

export const searchBottles = (query: string): Bottle[] => {
  if (!query || query.length < 2) return [];
  const bottles = getBottles();
  const lowerQuery = query.toLowerCase();
  
  return bottles.filter(b => 
    b.status === BottleStatus.ACTIVE && (
      b.producer.toLowerCase().includes(lowerQuery) || 
      b.varietal.toLowerCase().includes(lowerQuery) ||
      b.region?.toLowerCase().includes(lowerQuery) ||
      b.country?.toLowerCase().includes(lowerQuery) ||
      b.vintage.toString().includes(lowerQuery)
    )
  ).slice(0, 10); // Limit results
};

export const getBottlesByCellar = (cellarId: string): Bottle[] => {
  const bottles = getBottles();
  // Returns bottles assigned to this cellar (both placed in slots and loose/unplaced within this cellar)
  return bottles.filter((b) => b.storageId === cellarId && b.status === BottleStatus.ACTIVE);
};

export const getUnplacedBottles = (): Bottle[] => {
  const bottles = getBottles();
  // Returns bottles that have NO storage ID assigned at all
  return bottles.filter((b) => !b.storageId && b.status === BottleStatus.ACTIVE);
};

export const getConsumedBottles = (): Bottle[] => {
  const bottles = getBottles();
  return bottles
    .filter((b) => b.status === BottleStatus.CONSUMED)
    .sort((a, b) => (b.dateConsumed || 0) - (a.dateConsumed || 0));
};

export const saveBottle = (bottle: Omit<Bottle, 'id'>): Bottle => {
  const bottles = getBottles();
  const price = bottle.purchasePrice || 0;
  const current = bottle.currentPrice !== undefined ? bottle.currentPrice : price;
  
  const newBottle = { 
    ...bottle, 
    purchasePrice: price,
    currentPrice: current,
    id: generateId() 
  };
  bottles.push(newBottle);
  localStorage.setItem(STORAGE_KEY_BOTTLES, JSON.stringify(bottles));
  return newBottle;
};

export const deleteBottle = (id: string): void => {
  const bottles = getBottles();
  const newBottles = bottles.filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY_BOTTLES, JSON.stringify(newBottles));
};

export const duplicateBottle = (id: string, count: number): void => {
  const bottles = getBottles();
  const sourceBottle = bottles.find(b => b.id === id);
  
  if (!sourceBottle) return;

  for (let i = 0; i < count; i++) {
    const newBottle: Bottle = {
      ...sourceBottle,
      id: generateId(),
      dateAdded: Date.now(),
      status: BottleStatus.ACTIVE, // Always duplicate as active, even if source is consumed
      storageId: undefined, // Duplicates must start as unplaced to avoid grid conflict
      coordinates: undefined, // Duplicates must start as unplaced
      dateConsumed: undefined,
      rating: undefined,
      notes: undefined
    };
    bottles.push(newBottle);
  }
  
  localStorage.setItem(STORAGE_KEY_BOTTLES, JSON.stringify(bottles));
};

export const bulkSaveBottles = (newBottles: Omit<Bottle, 'id'>[]): void => {
  const bottles = getBottles();
  newBottles.forEach(b => {
      const price = b.purchasePrice || 0;
      bottles.push({
          ...b,
          purchasePrice: price,
          currentPrice: b.currentPrice || price,
          id: generateId()
      });
  });
  localStorage.setItem(STORAGE_KEY_BOTTLES, JSON.stringify(bottles));
};

export const updateBottle = (id: string, updates: Partial<Bottle>): Bottle | null => {
  const bottles = getBottles();
  const index = bottles.findIndex((b) => b.id === id);
  if (index === -1) return null;

  bottles[index] = { ...bottles[index], ...updates };
  localStorage.setItem(STORAGE_KEY_BOTTLES, JSON.stringify(bottles));
  return bottles[index];
};

export const moveBottle = (bottleId: string, storageId: string | undefined, coordinates?: Coordinates): Bottle | null => {
  return updateBottle(bottleId, {
    storageId,
    coordinates: coordinates // If undefined, it removes the coordinates (making it loose in the cellar)
  });
};

export const consumeBottle = (id: string, rating: number, notes: string, occasion: string): void => {
  updateBottle(id, {
    status: BottleStatus.CONSUMED,
    dateConsumed: Date.now(),
    rating,
    notes,
    occasion,
  });
};

export const getDistinctVarietals = (): string[] => {
    const bottles = getBottles();
    const varietals = new Set(bottles.map(b => b.varietal).filter(Boolean));
    return Array.from(varietals).sort();
};

export const getStats = (): Stats => {
  const bottles = getBottles().filter((b) => b.status === BottleStatus.ACTIVE);
  
  const totalValue = bottles.reduce((sum, bottle) => {
    const price = bottle.currentPrice ?? bottle.purchasePrice ?? 0;
    return sum + price;
  }, 0);

  return {
    totalBottles: bottles.length,
    totalValue: totalValue,
    redCount: bottles.filter((b) => b.type === WineType.RED).length,
    whiteCount: bottles.filter((b) => b.type === WineType.WHITE).length,
    roseCount: bottles.filter((b) => b.type === WineType.ROSE).length,
    sparklingCount: bottles.filter((b) => b.type === WineType.SPARKLING).length,
    unplacedCount: bottles.filter((b) => !b.storageId).length
  };
};

export const isSlotOccupied = (storageId: string, row: number, col: number): boolean => {
  const bottles = getBottlesByCellar(storageId);
  return bottles.some(b => b.coordinates?.row === row && b.coordinates?.col === col);
};

// Seed initial data if empty
if (!localStorage.getItem(STORAGE_KEY_CELLARS)) {
  const defaultCellar = {
    id: 'default_kitchen',
    name: 'Kitchen Fridge',
    rows: 6,
    columns: 6,
    description: 'Main dual-zone fridge'
  };
  localStorage.setItem(STORAGE_KEY_CELLARS, JSON.stringify([defaultCellar]));
}
