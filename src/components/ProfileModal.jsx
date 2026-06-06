// ProfileModal.jsx - User Profile Settings Modal
import React, { useState } from 'react';
import SoundManager from './SoundManager';
import { X, ShieldAlert, Award } from 'lucide-react';

const AVAILABLE_AVATARS = ["🤖", "👾", "🦊", "🐱", "🦖", "🦄", "🚀", "👑", "🦁", "🐼", "🍩", "🍕"];

export default function ProfileModal({ profile, setProfile, onClose }) {
  const [tag, setTag] = useState(profile.gamerTag);
  const [avatar, setAvatar] = useState(profile.avatarUrl);

  const handleSave = () => {
    if (!tag.trim()) return;
    SoundManager.playClick();
    setProfile({ gamerTag: tag, avatarUrl: avatar });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2 tracking-wide">
            <Award className="w-5 h-5 text-cyan-400" />
            GAMER PROFILE SETUP
          </h2>
          <button 
            onClick={() => {
              SoundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Gamer Tag Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Gamer Tag (Name)</label>
            <input 
              type="text" 
              maxLength={15}
              value={tag} 
              onChange={(e) => setTag(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white font-bold tracking-wider focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all text-center text-lg"
              placeholder="Enter Gamer Tag..."
            />
          </div>

          {/* Avatar Grid */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block">Choose Avatar</label>
            <div className="grid grid-cols-4 gap-3">
              {AVAILABLE_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    SoundManager.playClick();
                    setAvatar(emoji);
                  }}
                  className={`aspect-square text-3xl rounded-xl flex items-center justify-center border transition-all duration-200 transform hover:scale-110 ${
                    avatar === emoji 
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-white/5 flex gap-4">
          <button 
            onClick={() => {
              SoundManager.playClick();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-bold transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!tag.trim()}
            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all uppercase tracking-wider"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
