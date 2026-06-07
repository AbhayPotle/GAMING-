// ChatLobby.jsx - Simulated multiplayer chat & active players panel
import React, { useState, useEffect, useRef } from 'react';
import SoundManager from './SoundManager';
import { Users, Send, Smile, ShieldCheck } from 'lucide-react';

const RANDOM_NAMES = [
  "PixelNinja", "CyberKid", "NeonSpeedy", "RoboGamer", "GamerCody", 
  "LootMaster", "RetroMax", "ByteZoe", "DinoRunner", "SpaceAce", 
  "TypeQueen", "ChessStar", "StrikerKing", "RollerSmasher", "TurboRex",
  "SuperPanda", "WaterGamer", "FireBlade", "ElectricFox", "GravityGirl"
];

const RANDOM_MESSAGES = [
  "OMG who wants to duel in Chess Royale? 👑",
  "Just broke 8,000 score in Metro Surfer! 🔥",
  "Connect 4 bot is actually smart, who beat it?",
  "This Road Roller game is so satisfying to crush boxes! 🚜💥",
  "GG! Just leveled up to Level 5!",
  "Anyone playing Neon Rider right now?",
  "Typing speed: 85 WPM! Beat that! ⌨️⚡",
  "The space shooter music is awesome!",
  "Hi everyone!",
  "Add me as a friend!",
  "Nice high score!",
  "I unlocked the alien avatar, look! 👾",
  "Who is down for some Carrom Clash?",
  "Wow, the 8K graphics look so clean!",
  "Just got 50 coins in Flappy Neon! 🎈",
  "Nice! That was a close match!",
  "Let's play!",
  "Check out the leaderboard!"
];

const QUICK_MESSAGES = [
  "GG! 🎮",
  "Wow! 🚀",
  "Let's Play! 👑",
  "New Highscore! 🔥",
  "Add Me! 👾",
  "Awesome! ⚡"
];

export default function ChatLobby({ profile }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: "CyberKid", avatar: "🤖", text: "Welcome to KiddyArcade Ultra! Let's play some games! 🚀", self: false },
    { id: 2, sender: "PixelNinja", avatar: "🦊", text: "Anyone down for online Chess? ♟️", self: false }
  ]);
  const [inputText, setInputText] = useState("");
  const [activePlayers, setActivePlayers] = useState(1284);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fluctuating active players count
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlayers(prev => {
        const delta = Math.floor(Math.random() * 11) - 5; // -5 to +5
        return Math.max(1000, prev + delta);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulated messaging feed
  useEffect(() => {
    const interval = setInterval(() => {
      const randomSender = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      const randomMsg = RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];
      const randomAvatar = ["🤖", "👾", "🦊", "🐱", "🦖", "🦄", "🚀", "👑"][Math.floor(Math.random() * 8)];
      
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now(), 
          sender: randomSender, 
          avatar: randomAvatar, 
          text: randomMsg, 
          self: false 
        }
      ].slice(-50)); // Keep only last 50 messages
    }, 9000 + Math.random() * 8000); // Send message every 9-17 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    SoundManager.playClick();
    
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: profile.gamerTag,
        avatar: profile.avatarUrl,
        text: text,
        self: true
      }
    ]);

    if (!textToSend) {
      setInputText("");
    }
  };

  return (
    <div className="glass-panel w-full lg:w-[320px] flex flex-col h-[500px] lg:h-[calc(100vh-140px)] border border-white/10 shrink-0 sticky-sidebar">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-sm tracking-widest text-glow-cyan uppercase">Lobby Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></div>
          <span className="text-[11px] font-bold text-green-400 tracking-wider">
            {activePlayers} ONLINE
          </span>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.self ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs">{msg.avatar}</span>
              <span className={`text-[10px] font-extrabold tracking-wider ${msg.self ? 'text-purple-400' : 'text-cyan-400'}`}>
                {msg.sender}
              </span>
            </div>
            <div className={`chat-bubble ${msg.self ? 'chat-bubble-self' : 'chat-bubble-other'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Message Drawer */}
      <div className="px-4 py-2 border-t border-white/10 bg-black/20">
        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest">Quick Chat</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_MESSAGES.map((qm) => (
            <button
              key={qm}
              onClick={() => handleSendMessage(qm)}
              className="text-xs bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-gray-300 hover:text-cyan-400 px-2 py-1 rounded transition-all font-bold"
            >
              {qm}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        className="p-3 border-t border-white/10 bg-white/5 flex gap-2"
      >
        <input
          type="text"
          maxLength={100}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a kid-friendly chat..."
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 transition-all font-semibold"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Safety Badge */}
      <div className="p-2 bg-black/40 border-t border-white/5 flex items-center justify-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
        Kid Safe Mod active
      </div>
    </div>
  );
}
