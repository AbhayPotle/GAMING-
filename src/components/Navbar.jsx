// Navbar.jsx - Navigation and Profile Stats Bar
import React, { useState } from 'react';
import SoundManager from './SoundManager';
import { Volume2, VolumeX, Shield, Coins, User } from 'lucide-react';

export default function Navbar({ profile, setProfile, xp, level, coins, openProfile }) {
  const [muted, setMuted] = useState(false);

  const toggleMute = () => {
    const isMuted = SoundManager.toggleMute();
    setMuted(isMuted);
    SoundManager.playClick();
  };

  // Calculate XP percentage for level progress bar
  const xpNeeded = level * 200;
  const xpPercentage = Math.min(100, (xp / xpNeeded) * 100);

  return (
    <nav className="glass-panel w-full px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 sticky top-0 z-40 bg-opacity-90">
      {/* Title Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <span className="font-bold text-xl text-black retro-font">K</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-300 text-glow-cyan">
            KIDDYARCADE ULTRA
          </h1>
          <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">8K Revolutionized Arcade Portal</p>
        </div>
      </div>

      {/* Stats and User Controls */}
      <div className="flex flex-wrap items-center gap-4 md:gap-8 justify-center w-full md:w-auto">
        {/* XP Level Bar */}
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5 w-full sm:w-[260px] md:w-[280px]">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
            <span className="font-extrabold text-sm">{level}</span>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
              <span>LEVEL {level}</span>
              <span>{xp} / {xpNeeded} XP</span>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${xpPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Coins Status */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20 text-yellow-400">
          <Coins className="w-5 h-5 text-yellow-400 animate-pulse" />
          <span className="font-extrabold text-lg tracking-wider">{coins}</span>
        </div>

        {/* Mute Control */}
        <button 
          onClick={toggleMute}
          className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:border-cyan-400 hover:bg-cyan-400/10 text-gray-300 hover:text-cyan-400 transition-all"
          title={muted ? "Unmute sounds" : "Mute sounds"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* User Profile Badge */}
        <button 
          onClick={() => {
            SoundManager.playClick();
            openProfile();
          }}
          className="flex items-center gap-3 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-1.5 rounded-full border border-cyan-500/20 text-cyan-400 transition-all hover:scale-105"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-white border border-white/20 overflow-hidden font-bold">
            {profile.avatarUrl ? (
              <span className="text-xl">{profile.avatarUrl}</span>
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <span className="font-bold hidden sm:inline max-w-[100px] truncate">{profile.gamerTag}</span>
        </button>
      </div>
    </nav>
  );
}
