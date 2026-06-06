// App.jsx - Main Application Orchestrator
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GameGrid from './components/GameGrid';
import ChatLobby from './components/ChatLobby';
import ProfileModal from './components/ProfileModal';
import ArcadeCabin from './components/ArcadeCabin';
import SoundManager from './components/SoundManager';
import { gamesList } from './games/gameDatabase';
import { Award, Zap, Sparkles } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState({ gamerTag: "CyberKid", avatarUrl: "🤖" });
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState(250); // Initial welcome coins!
  const [activeGame, setActiveGame] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [levelUpEffect, setLevelUpEffect] = useState(false);
  const [lastLevel, setLastLevel] = useState(1);

  // Initialize Sound on click
  useEffect(() => {
    const handleFirstInteraction = () => {
      SoundManager.init();
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  const handleSelectGame = (game) => {
    setActiveGame(game);
  };

  const handleGameComplete = (coinsEarned, xpEarned) => {
    // Add coins
    setCoins(prev => prev + coinsEarned);
    
    // Add XP and check Level Up
    setXp(prevXp => {
      let tempXp = prevXp + xpEarned;
      let tempLevel = level;
      let xpNeeded = tempLevel * 200;

      while (tempXp >= xpNeeded) {
        tempXp -= xpNeeded;
        tempLevel += 1;
        xpNeeded = tempLevel * 200;
      }

      if (tempLevel > level) {
        setLevel(tempLevel);
        setLevelUpEffect(true);
        SoundManager.playLevelUp();
      } else {
        SoundManager.playPowerup();
      }

      return tempXp;
    });
  };

  return (
    <div className="flex flex-col min-h-screen relative text-white bg-transparent">
      
      {/* Top Navbar */}
      <Navbar 
        profile={profile}
        setProfile={setProfile}
        xp={xp}
        level={level}
        coins={coins}
        openProfile={() => setShowProfile(true)}
      />

      {/* Main Layout Area */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-6 w-full max-w-[1600px] mx-auto overflow-hidden">
        {/* Games Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-widest text-cyan-400 mb-1 uppercase text-glow-cyan">GAMES DECK</h2>
            <p className="text-xs text-gray-500 font-bold uppercase">Select from our 66 8K-optimized multiplayer & arcade games below</p>
          </div>
          <GameGrid 
            games={gamesList} 
            onSelectGame={handleSelectGame} 
          />
        </div>

        {/* Live Chat Lobby Sidebar */}
        <ChatLobby profile={profile} />
      </main>

      {/* Profile Customize Modal */}
      {showProfile && (
        <ProfileModal 
          profile={profile}
          setProfile={setProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Retro Arcade Cabinet overlay */}
      {activeGame && (
        <ArcadeCabin 
          game={activeGame}
          onClose={() => {
            SoundManager.playClick();
            setActiveGame(null);
          }}
          onGameComplete={handleGameComplete}
        />
      )}

      {/* Level Up Flash Splash overlay */}
      {levelUpEffect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-sm border-2 border-yellow-400 p-8 text-center level-up-animate relative overflow-hidden shadow-2xl shadow-yellow-500/10">
            {/* Background elements */}
            <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-yellow-400/20 blur-xl"></div>
            <div className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full bg-pink-500/20 blur-xl"></div>

            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 tracking-wider mb-2 text-glow-purple uppercase">
              LEVEL UP!
            </h2>
            <p className="text-gray-400 text-sm mb-6 uppercase tracking-wider">You reached a new gaming tier</p>
            
            <div className="bg-white/5 border border-yellow-400/25 p-4 rounded-xl mb-6">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">New Rank</span>
              <span className="text-2xl font-black text-yellow-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Award className="w-6 h-6 text-yellow-400" /> TIER LEVEL {level}
              </span>
            </div>

            <button
              onClick={() => {
                SoundManager.playClick();
                setLevelUpEffect(false);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-black text-sm uppercase tracking-widest shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              AWESOME! CONTINUE
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
