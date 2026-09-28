import React from 'react';
import {
  Bomb,
  Rocket,
  Castle,
  Coins,
  Package,
  Swords,
  TrendingUp,
  Disc,
  Footprints,
  Grid3X3,
  Sparkles,
  Dices,
  ArrowUpDown,
  Spade,
  Waves,
  Gamepad2,
} from 'lucide-react';

export const GAME_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  bomb: Bomb,
  rocket: Rocket,
  castle: Castle,
  coins: Coins,
  package: Package,
  swords: Swords,
  'trending-up': TrendingUp,
  disc: Disc,
  footprints: Footprints,
  'grid-3x3': Grid3X3,
  sparkles: Sparkles,
  dices: Dices,
  'arrow-up-down': ArrowUpDown,
  spade: Spade,
  waves: Waves,
};

export const getGameIcon = (iconName: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> => {
  return GAME_ICONS[iconName] || Gamepad2;
};

export interface GameDefinition {
  id: string;
  title: string;
  badge: string;
  iconName: string;
  color: string;
  image?: string;
  rtp: string;
  tagline: string;
  isPlayable: boolean;
}

export const ALL_15_GAMES: GameDefinition[] = [
  {
    id: 'mines',
    title: 'Mines',
    badge: 'POPULAR',
    iconName: 'bomb',
    color: '#00ff88',
    image: '/assets/VoidPs_Originals_mines.png',
    rtp: '99% RTP',
    tagline: 'Find diamonds before the mine blows',
    isPlayable: true,
  },
  {
    id: 'crash',
    title: 'Crash',
    badge: 'HOT',
    iconName: 'rocket',
    color: '#ec4899',
    image: '/assets/VoidPs_Originals_crash.png',
    rtp: '98% RTP',
    tagline: 'Cash out before the multiplier crashes',
    isPlayable: true,
  },
  {
    id: 'towers',
    title: 'Towers',
    badge: 'CLIMB',
    iconName: 'castle',
    color: '#38bdf8',
    image: '/assets/VoidPs_Originals_towers.png',
    rtp: '99% RTP',
    tagline: 'Climb higher for massive multipliers',
    isPlayable: true,
  },
  {
    id: 'coinflip',
    title: 'Coinflip',
    badge: 'FAST',
    iconName: 'coins',
    color: '#f59e0b',
    image: '/assets/VoidPs_Originals_coinflip.png',
    rtp: '49.5% ODDS',
    tagline: 'Choose a side and double your locks',
    isPlayable: true,
  },
  {
    id: 'cases',
    title: 'Cases',
    badge: 'LOOT',
    iconName: 'package',
    color: '#a855f7',
    image: '/assets/VoidPs_Originals_cases.png',
    rtp: '98% RTP',
    tagline: 'Unbox mystery Growtopia relic cases',
    isPlayable: true,
  },
  {
    id: 'casebattles',
    title: 'Case Battles',
    badge: '1V1 PVP',
    iconName: 'swords',
    color: '#ef4444',
    image: '/assets/VoidPs_Originals_casebattles.png',
    rtp: 'PVP POT',
    tagline: '1v1 unboxing battles, winner takes all',
    isPlayable: true,
  },
  {
    id: 'roulette',
    title: 'Roulette',
    badge: 'CLASSIC',
    iconName: 'disc',
    color: '#f43f5e',
    rtp: '97.3% RTP',
    tagline: 'European single zero with real poker chips',
    isPlayable: true,
  },
  {
    id: 'blackjack',
    title: 'Blackjack',
    badge: 'TABLE',
    iconName: 'spade',
    color: '#6366f1',
    rtp: '99.5% RTP',
    tagline: 'Classic 21 against the house dealer',
    isPlayable: true,
  },
  {
    id: 'keno',
    title: 'Keno',
    badge: 'NUMBERS',
    iconName: 'grid-3x3',
    color: '#8b5cf6',
    rtp: '98% RTP',
    tagline: 'Pick up to 10 lucky numbers to win',
    isPlayable: true,
  },
];
