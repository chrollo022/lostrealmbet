import React from 'react';
import { Gem, Lock, Crown, Swords, Shield, Star, Castle, Bomb, Coins, Rocket, Box } from 'lucide-react';

interface ItemIconProps {
  type: string;
  className?: string;
  color?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ type, className = 'w-6 h-6', color }) => {
  const style = color ? { color } : undefined;

  switch (type.toLowerCase()) {
    case 'gem':
    case 'diamond':
      return <Gem className={className} style={style} />;
    case 'lock':
    case 'dls':
    case 'bgls':
      return <Lock className={className} style={style} />;
    case 'crown':
      return <Crown className={className} style={style} />;
    case 'sword':
    case 'swords':
      return <Swords className={className} style={style} />;
    case 'shield':
      return <Shield className={className} style={style} />;
    case 'star':
      return <Star className={className} style={style} />;
    case 'castle':
    case 'tower':
      return <Castle className={className} style={style} />;
    case 'bomb':
    case 'mine':
      return <Bomb className={className} style={style} />;
    case 'coin':
    case 'coinflip':
      return <Coins className={className} style={style} />;
    case 'rocket':
    case 'crash':
      return <Rocket className={className} style={style} />;
    case 'box':
    case 'case':
      return <Box className={className} style={style} />;
    default:
      return <Gem className={className} style={style} />;
  }
};
