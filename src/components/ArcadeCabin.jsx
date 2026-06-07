// ArcadeCabin.jsx - Wrapper frame for all playable games and interactive simulators
import React, { useState, useEffect } from 'react';
import SoundManager from './SoundManager';
import { generateLeaderboard } from '../games/gameDatabase';
import { Play, RotateCcw, X, Shield, ArrowUp, Zap, HelpCircle, Trophy } from 'lucide-react';

import MetroSurfer from '../games/MetroSurfer';
import NeonRider from '../games/NeonRider';
import Chess from '../games/Chess';
import Carrom from '../games/Carrom';
import TypeStorm from '../games/TypeStorm';
import RoadRoller from '../games/RoadRoller';
import Connect4 from '../games/Connect4';
import ArcadeRetro from '../games/ArcadeRetro';
import SimulatorMiniGame from './SimulatorMiniGame';

const GAME_COMPONENTS = {
  'metro-surfer': MetroSurfer,
  'temple-escape': MetroSurfer,
  'neon-rider': NeonRider,
  'turbo-moto': NeonRider,
  'truck-challenge': NeonRider,
  'chess-royale': Chess,
  'carrom-clash': Carrom,
  'type-storm': TypeStorm,
  'word-invaders': TypeStorm,
  'road-roller': RoadRoller,
  'connect-4': Connect4,
  'tic-tac-toe': Connect4,
  'snake-neon': ArcadeRetro,
  'breakout-glow': ArcadeRetro,
  'cyber-pong': ArcadeRetro,
  'space-defender': ArcadeRetro,
  'flappy-neon': ArcadeRetro,
};


export default function ArcadeCabin({ game, onClose, onGameComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [upgrades, setUpgrades] = useState({ speed: 1, power: 1, luck: 1 });
  const [simActive, setSimActive] = useState(false);
  const [simScore, setSimScore] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Load simulated leaderboard
  useEffect(() => {
    setLeaderboard(generateLeaderboard(game.id));
    setIsPlaying(false);
    setSimActive(false);
    setSimScore(null);
  }, [game]);

  // Handle upgrade clicks
  const handleUpgrade = (stat) => {
    SoundManager.playClick();
    setUpgrades(prev => ({
      ...prev,
      [stat]: Math.min(5, prev[stat] + 1)
    }));
  };

  // Launch Simulated Run
  const handleSimulateRun = () => {
    SoundManager.playClick();
    setSimActive(true);
    setSimScore(null);
  };

  const handleSimGameComplete = (finalScore) => {
    setSimActive(false);
    setSimScore(finalScore);

    // Reward player
    onGameComplete(game.coinReward, game.xpReward);

    // Insert player into local leaderboard temporarily
    setLeaderboard(prev => {
      const updated = [...prev, { rank: 99, name: "YOU", score: finalScore }];
      return updated.sort((a, b) => b.score - a.score).map((s, idx) => ({ ...s, rank: idx + 1 }));
    });
  };

  // Callback when a real custom game completes
  const handleCustomGameComplete = (score) => {
    SoundManager.playLevelUp();
    onGameComplete(game.coinReward * 2, game.xpReward * 2); // Double rewards for real playing!
    setLeaderboard(prev => {
      const updated = [...prev, { rank: 99, name: "YOU", score: score }];
      return updated.sort((a, b) => b.score - a.score).map((s, idx) => ({ ...s, rank: idx + 1 }));
    });
    setIsPlaying(false);
  };

  // Dynamic import of custom games
  // In React we will import active component or render arcade canvas placeholder
  const renderGameContent = () => {
    if (game.playable) {
      if (!isPlaying) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-8 text-center">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${game.color} flex items-center justify-center mb-6 animate-pulse`}>
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-2 text-glow-cyan">{game.title}</h2>
            <p className="text-gray-400 text-sm max-w-md mb-6">{game.description}</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-sm mb-6 text-left">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <HelpCircle className="w-4 h-4" /> Game Controls
              </h4>
              <ul className="text-xs text-gray-300 space-y-1">
                {game.controls?.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
            <button
              onClick={() => {
                SoundManager.playClick();
                setIsPlaying(true);
              }}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-extrabold text-lg uppercase tracking-wider hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] hover:scale-105 active:scale-95 transition-all"
            >
              INSERT COIN & PLAY
            </button>
          </div>
        );
      }

      // Import specific Custom Game Component
      const CustomGameComponent = GAME_COMPONENTS[game.id];
      if (CustomGameComponent) {
        return <CustomGameComponent onComplete={handleCustomGameComplete} onQuit={() => setIsPlaying(false)} />;
      }

      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95">
          <p className="text-yellow-400 font-bold mb-4 retro-font">LOADING GAME CORE...</p>
          <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin"></div>
        </div>
      );
    } else {
      // Simulator game
      if (simActive) {
        return <SimulatorMiniGame game={game} upgrades={upgrades} onComplete={handleSimGameComplete} onQuit={() => setSimActive(false)} />;
      }

      // Simulator dashboard screen
      return (
        <div className="absolute inset-0 flex flex-col md:flex-row bg-slate-950 p-6 gap-6 overflow-y-auto">
          {/* Simulator Controls & Upgrades */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-micro font-bold text-amber-400 uppercase tracking-widest">{game.category} Simulator</span>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider text-glow-pink mb-2">{game.title}</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">{game.description}</p>
              
              {/* Upgrades panel */}
              <div className="space-y-3 bg-white/5 border border-white/5 rounded-xl p-4">
                <h4 className="text-micro font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" /> Upgrade Tuning
                </h4>
                <div className="space-y-2.5">
                  {['speed', 'power', 'luck'].map((stat) => (
                    <div key={stat} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{stat}</span>
                      <div className="flex items-center gap-2">
                        {/* 5 indicator dots */}
                        <div className="flex gap-1 mr-2">
                          {[1, 2, 3, 4, 5].map(dot => (
                            <div 
                              key={dot} 
                              className={`w-2.5 h-2.5 rounded-full ${
                                upgrades[stat] >= dot 
                                  ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-cyan-sm' 
                                  : 'bg-white/10'
                              }`}
                            ></div>
                          ))}
                        </div>
                        <button
                          disabled={upgrades[stat] >= 5}
                          onClick={() => handleUpgrade(stat)}
                          className="px-2 py-0.5 rounded text-micro font-extrabold bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-cyan-400/20 disabled:opacity-30 disabled:pointer-events-none transition-all uppercase"
                        >
                          + Tune
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch simulation */}
            <div className="space-y-3 pt-2">
              {simScore ? (
                <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 p-4 rounded-xl text-center">
                  <p className="text-micro font-bold text-pink-400 uppercase tracking-widest mb-1">MISSION COMPLETED</p>
                  <p className="text-3xl font-extrabold text-white tracking-wider mb-2">{simScore.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 font-bold">Rewarded: <span className="text-yellow-400">🪙+{game.coinReward}</span> | <span className="text-amber-500">⭐+{game.xpReward}xp</span></p>
                </div>
              ) : null}

              <button
                onClick={handleSimulateRun}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-extrabold tracking-widest text-sm uppercase hover-shadow-pink transition-all hover:scale-105 active:scale-95"
              >
                {simScore ? "LAUNCH MISSION AGAIN" : "START PLAYABLE MISSION"}
              </button>
            </div>
          </div>

          {/* Simulator Leaderboard Sidebar */}
          <div className="w-full md-w-180 bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" /> LOBBY TOP 5
              </h4>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((player) => (
                  <div 
                    key={player.rank} 
                    className={`flex justify-between items-center text-xs p-1.5 rounded ${
                      player.name === 'YOU' ? 'bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 font-extrabold' : 'text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-micro font-extrabold text-gray-500">#{player.rank}</span>
                      <span className="truncate">{player.name}</span>
                    </div>
                    <span>{player.score}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-nano text-gray-500 mt-4 border-t border-white/5 pt-2 uppercase tracking-wider font-semibold text-center">
              Compete live with players online!
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full arcade-modal-container flex flex-col arcade-container">
        
        {/* Header Ribbon bar */}
        <div className="bg-[#12082b] px-5 py-3 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="retro-font text-xs text-cyan-400 tracking-widest uppercase">
              {game.title} - CAB-00{game.playable ? "8" : "3"}
            </span>
          </div>
          <button 
            onClick={() => {
              SoundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-cyan-400 hover:text-white transition-all hover:scale-110 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-1 arcade-screen relative">
          {renderGameContent()}
        </div>

        {/* Retro Cabinet Controls panel */}
        <div className="arcade-controls">
          <div className="flex items-center gap-3">
            {/* Simulated Joystick */}
            <div className="w-14 h-14 rounded-full bg-black border-2 border-white/20 flex items-center justify-center shadow-inner">
              <div className="w-6 h-6 rounded-full bg-red-600 shadow-red-joystick border border-red-500 hover:scale-110 active:scale-90 transition-transform"></div>
            </div>
            <div>
              <p className="text-micro font-bold text-gray-500 uppercase tracking-widest">CONTROL JOYSTICK</p>
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">CYBER STICK V1</p>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-center">
            <div className="flex gap-4">
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-500 animate-pulse"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-pink-500 animate-pulse"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 animate-pulse"></div>
            </div>
            <span className="text-nano font-bold text-gray-500 uppercase tracking-widest mt-1.5">Arcade status ready</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mini push buttons */}
            <div className="flex gap-2.5">
              <button 
                onClick={() => SoundManager.playClick()}
                className="w-8 h-8 rounded-full bg-yellow-400 hover:bg-yellow-300 border-b-4 border-yellow-600 active:border-b-0 hover:scale-105 active:scale-95 transition-all flex items-center justify-center font-black text-black text-xs"
              >
                A
              </button>
              <button 
                onClick={() => SoundManager.playClick()}
                className="w-8 h-8 rounded-full bg-pink-500 hover:bg-pink-400 border-b-4 border-pink-700 active:border-b-0 hover:scale-105 active:scale-95 transition-all flex items-center justify-center font-black text-white text-xs"
              >
                B
              </button>
            </div>
            <div>
              <p className="text-micro font-bold text-gray-500 uppercase tracking-widest text-right">ACTION BUTTONS</p>
              <p className="text-xs font-bold text-pink-400 uppercase tracking-wider text-right">8K RESPONSE</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
