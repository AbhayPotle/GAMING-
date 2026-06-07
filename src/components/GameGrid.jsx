// GameGrid.jsx - Grid container with filter and search options
import React, { useState, useMemo } from 'react';
import SoundManager from './SoundManager';
import GameCard from './GameCard';
import { CATEGORIES } from '../games/gameDatabase';
import { Search, Filter, ArrowUpDown, PlayCircle } from 'lucide-react';

export default function GameGrid({ games, onSelectGame }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Popular");
  const [playableOnly, setPlayableOnly] = useState(false);

  const handleCategorySelect = (cat) => {
    SoundManager.playClick();
    setSelectedCategory(cat);
  };

  const handleTogglePlayable = () => {
    SoundManager.playClick();
    setPlayableOnly(!playableOnly);
  };

  // Process and filter games list
  const filteredGames = useMemo(() => {
    return games
      .filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
        const matchesPlayable = !playableOnly || game.playable;
        return matchesSearch && matchesCategory && matchesPlayable;
      })
      .sort((a, b) => {
        if (sortBy === "Alphabetical") {
          return a.title.localeCompare(b.title);
        } else if (sortBy === "Coins") {
          return b.coinReward - a.coinReward;
        } else if (sortBy === "XP") {
          return b.xpReward - a.xpReward;
        } else {
          // Sort by popularity (custom order, playable first)
          if (a.playable !== b.playable) {
            return a.playable ? -1 : 1;
          }
          return a.id.localeCompare(b.id);
        }
      });
  }, [games, searchTerm, selectedCategory, sortBy, playableOnly]);

  return (
    <div className="flex-1 space-y-6">
      {/* Search and Filter Controls */}
      <div className="glass-panel p-5 border border-white/10 grid-controls-panel">
        {/* Search Bar */}
        <div className="search-input-wrapper">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search games (e.g. Chess, Carrom, Subway Surfers)..."
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-cyan-400 focus-shadow-cyan transition-all"
          />
        </div>

        {/* Action Controls */}
        <div className="grid-actions-wrapper">
          {/* Playable Toggle */}
          <button
            onClick={handleTogglePlayable}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
              playableOnly 
                ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-cyan-sm' 
                : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-300'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span className="hide-on-mobile">Playable Only</span>
            <span className="show-on-mobile">Playable</span>
          </button>

          {/* Sort Selector */}
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-full sort-select-wrapper hover:border-white/20 transition-all">
            <ArrowUpDown className="w-4 h-4 text-gray-500 mr-2" />
            <select
              value={sortBy}
              onChange={(e) => { SoundManager.playClick(); setSortBy(e.target.value); }}
              className="bg-transparent border-none text-sm font-bold text-gray-300 focus:outline-none w-full cursor-pointer"
            >
              <option value="Popular" className="bg-[#0b061e] text-white">Popularity</option>
              <option value="Alphabetical" className="bg-[#0b061e] text-white">Alphabetical</option>
              <option value="Coins" className="bg-[#0b061e] text-white">Max Coins</option>
              <option value="XP" className="bg-[#0b061e] text-white">Max XP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategorySelect(cat)}
            className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-widest border transition-all shrink-0 ${
              selectedCategory === cat 
                ? 'bg-gradient-to-tr from-pink-500 to-rose-600 border-transparent text-white shadow-lg shadow-pink-500/20 scale-105' 
                : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Matching counts bar */}
      <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest px-2">
        <span>Found {filteredGames.length} games</span>
        {playableOnly && <span>Filtered by Playable</span>}
      </div>

      {/* Games Grid */}
      {filteredGames.length > 0 ? (
        <div className="games-grid-layout">
          {filteredGames.map((game) => (
            <GameCard 
              key={game.id} 
              game={game} 
              onClick={onSelectGame} 
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center border border-white/5">
          <p className="text-gray-400 font-bold mb-2 uppercase tracking-wider">No Games Found</p>
          <p className="text-xs text-gray-500">Try adjusting your search criteria or categories filter.</p>
        </div>
      )}
    </div>
  );
}
