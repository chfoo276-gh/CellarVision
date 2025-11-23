import { WineType } from './types';

export const WINE_COLOR_MAP: Record<WineType, string> = {
  [WineType.RED]: 'bg-red-800 border-red-900',
  [WineType.WHITE]: 'bg-yellow-200 border-yellow-300',
  [WineType.ROSE]: 'bg-pink-300 border-pink-400',
  [WineType.SPARKLING]: 'bg-blue-200 border-blue-300',
  [WineType.OTHER]: 'bg-zinc-500 border-zinc-600',
};

export const WINE_TEXT_COLOR_MAP: Record<WineType, string> = {
  [WineType.RED]: 'text-red-400',
  [WineType.WHITE]: 'text-yellow-200',
  [WineType.ROSE]: 'text-pink-300',
  [WineType.SPARKLING]: 'text-blue-300',
  [WineType.OTHER]: 'text-zinc-400',
};

export const MOCK_INITIAL_DATA = false; // Set to true to seed data if empty