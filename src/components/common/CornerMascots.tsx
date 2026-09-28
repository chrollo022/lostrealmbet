import React from 'react';

export const CornerMascots: React.FC = () => {
  return (
    <div
      className="fixed bottom-4 left-4 z-20 pointer-events-none select-none animate-mascot-float"
      title="Void-Ps Mascot"
    >
      <div className="relative flex items-center justify-center filter drop-shadow-[0_12px_28px_rgba(0,116,228,0.5)]">
        {/* Subtle Thruster Flame Glow Behind Vehicle */}
        <div className="absolute -left-2 bottom-2 w-7 h-7 bg-gradient-to-r from-red-600 via-orange-500 to-transparent rounded-full blur-md animate-pulse" />
        <img
          src="/assets/set.png"
          alt="Void-Ps Set Mascot"
          className="w-24 sm:w-28 h-auto object-contain"
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
      </div>
    </div>
  );
};
