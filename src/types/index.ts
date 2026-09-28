export type Currency = 'DLS' | 'BGLS';

export interface UserState {
  username: string;
  growId?: string;
  isAuthenticated: boolean;
  // Stored internally in DLS (100 DLS = 1 BGL)
  // Welcome bonus is 500 DLS (= 5 BGL)
  balanceDls: number;
  activeCurrency: Currency;
  selectedFiat: 'USD' | 'EUR';
}

export interface LiveBet {
  id: string;
  game: string;
  player: string;
  avatar?: string;
  betDls: number;
  multiplier: number;
  payoutDls: number;
  won: boolean;
  timestamp: string;
}

export interface CaseItem {
  id: string;
  name: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  valueDls: number;
  symbolType: 'gem' | 'lock' | 'crown' | 'sword' | 'shield' | 'star';
  color: string;
}

export interface MysteryCase {
  id: string;
  name: string;
  priceDls: number;
  image: string;
  items: CaseItem[];
}
