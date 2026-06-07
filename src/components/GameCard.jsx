// GameCard.jsx - Game Card view component
import React from 'react';
import SoundManager from './SoundManager';
import * as Icons from 'lucide-react';
import GameThumbnail from './GameThumbnail';

export default function GameCard({ game, onClick }) {
  // Dynamically load the Lucide icon
  const IconComponent = Icons[game.icon] || Icons.Gamepad2;

  // Map difficulty colors
  const difficultyColors = {
    Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Medium: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    Hard: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };

  const getCardBorderColorClass = () => {
    if (game.color.includes('pink')) return 'game-card-pink';
    if (game.color.includes('green') || game.color.includes('emerald') || game.color.includes('lime')) return 'game-card-green';
    if (game.color.includes('yellow') || game.color.includes('amber')) return 'game-card-yellow';
    if (game.color.includes('purple') || game.color.includes('violet') || game.color.includes('fuchsia')) return 'game-card-purple';
    return '';
  };

  const getPlayabilityBadge = () => {
    switch (game.type) {
      case 'custom':
        return (
          <span className="px-2 py-0.5 rounded-full text-nano font-extrabold tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase">
            Playable
          </span>
        );
      case 'arcade':
        return (
          <span className="px-2 py-0.5 rounded-full text-nano font-extrabold tracking-widest bg-lime-500/20 text-lime-300 border border-lime-400/30 uppercase">
            Classic Arcade
          </span>
        );
      case 'simulator':
        default:
        return (
          <span className="px-2 py-0.5 rounded-full text-nano font-extrabold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase">
            Simulator
          </span>
        );
    }
  };

  return (
    <div 
      onClick={() => {
        SoundManager.playClick();
        onClick(game);
      }}
      className={`game-card ${getCardBorderColorClass()} group hover:cursor-pointer`}
    >
      {/* Animated thumbnail header */}
      <div className="h-24 p-4 flex justify-between items-start relative overflow-hidden bg-black/60">
        <GameThumbnail game={game} />
        
        <div className="absolute top-2 right-2 flex gap-1.5 z-10">
          {getPlayabilityBadge()}
        </div>

        {/* Floating icon */}
        <div className="w-12 h-12 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 z-10">
          <IconComponent className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between bg-black/40">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-micro font-bold text-gray-500 uppercase tracking-widest">{game.category}</span>
            <span className={`px-2 py-0.5 rounded-full text-nano font-bold border ${difficultyColors[game.difficulty] || difficultyColors.Medium}`}>
              {game.difficulty}
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-wide text-white group-hover:text-cyan-400 transition-colors mb-2">
            {game.title}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Footer Stat Details */}
        <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-2">
          <div className="flex items-center gap-1">
            <span className="text-nano font-bold text-gray-500 uppercase tracking-widest mr-1">Rewards:</span>
            <div className="flex items-center gap-0.5 text-yellow-400 text-xs font-bold">
              <span>🪙</span>
              <span>{game.coinReward}</span>
            </div>
            <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold ml-2">
              <span>⭐</span>
              <span>{game.xpReward}xp</span>
            </div>
          </div>
          
          <span className="text-micro font-extrabold text-cyan-400 group-hover:underline uppercase tracking-widest flex items-center gap-1">
            Start 
            <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </div>
      </div>
    </div>
  );
}
