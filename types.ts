
export enum WineType {
  RED = 'Red',
  WHITE = 'White',
  ROSE = 'Rose',
  SPARKLING = 'Sparkling',
  OTHER = 'Other'
}

export enum BottleStatus {
  ACTIVE = 'Active',
  CONSUMED = 'Consumed'
}

export interface Coordinates {
  row: number;
  col: number;
}

export interface StorageUnit {
  id: string;
  name: string;
  rows: number;
  columns: number;
  description?: string;
}

export interface Bottle {
  id: string;
  producer: string;
  varietal: string;
  vintage: number | string; // Updated to support "NV"
  type: WineType;
  region?: string;
  country?: string;
  photoUrl?: string;
  status: BottleStatus;
  storageId?: string;
  coordinates?: Coordinates;
  dateAdded: number;
  dateConsumed?: number;
  rating?: number;
  notes?: string;
  occasion?: string;
  purchasePrice?: number;
  currentPrice?: number;
}

export interface UserSettings {
  currency: string;
  currencySymbol: string;
  customCurrencyCode?: string;
}

export interface Stats {
  totalBottles: number;
  totalValue: number;
  redCount: number;
  whiteCount: number;
  roseCount: number;
  sparklingCount: number;
  unplacedCount: number;
}
