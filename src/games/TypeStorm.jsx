// TypeStorm.jsx - Typing Meteor Shooter Game
import React, { useState, useEffect, useRef } from 'react';
import SoundManager from '../components/SoundManager';
import { Shield, Target, Play, RotateCcw, AlertTriangle } from 'lucide-react';

const WORD_BANK = [
  "neon", "cyber", "laser", "pulse", "grid", "speed", "pixel", "retro", 
  "synth", "coder", "robot", "sonic", "space", "power", "matrix", "shield", 
  "glitch", "arcade", "engine", "quantum", "gravity", "nebula", "hazard", 
  "rocket", "comet", "galaxy", "super", "booster", "victory", "champion"
];

export default function TypeStorm({ onComplete, onQuit }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [typedInput, setTypedInput] = useState("");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [isShaking, setIsShaking] = useState(false);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  
  // Game states in refs for canvas render loop
  const gameStateRef = useRef({
    meteors: [],
    particles: [],
    lastSpawnTime: 0,
    startTime: 0,
    activeTarget: null,
    laserBeam: null
  });

  const spawnParticles = (x, y, color) => {
    for (let i = 0; i < 15; i++) {
      gameStateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: Math.random() * 3 + 1.5,
        color,
        alpha: 1,
        life: 0.03 + Math.random() * 0.02
      });
    }
  };

  const handleStartGame = () => {
    SoundManager.playClick();
    setIsPlaying(true);
    setScore(0);
    setWpm(0);
    setTypedCount(0);
    setGameOver(false);
    setLives(3);
    setCurrentLevel(1);
    setTypedInput("");
    setIsShaking(false);

    
    gameStateRef.current = {
      meteors: [],
      particles: [],
      lastSpawnTime: 0,
      startTime: Date.now(),
      activeTarget: null,
      laserBeam: null
    };
  };

  // Canvas loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    // Adjust canvas resolution for 8K sharp renders
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const spawnMeteor = () => {
      const word = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
      const size = 30 + word.length * 5;
      gameStateRef.current.meteors.push({
        id: Date.now() + Math.random(),
        word,
        typed: "",
        x: 50 + Math.random() * (width - 150),
        y: -40,
        speed: 0.6 + currentLevel * 0.15 + Math.random() * 0.3,
        size
      });
    };

    const updateGame = () => {
      const state = gameStateRef.current;
      const now = Date.now();

      // Spawn meteors
      const spawnInterval = Math.max(1200, 3000 - currentLevel * 250);
      if (now - state.lastSpawnTime > spawnInterval) {
        spawnMeteor();
        state.lastSpawnTime = now;
      }

      // Update laser beam fade
      if (state.laserBeam) {
        state.laserBeam.alpha -= 0.1;
        if (state.laserBeam.alpha <= 0) {
          state.laserBeam = null;
        }
      }

      // Update meteors
      state.meteors.forEach((m, index) => {
        m.y += m.speed;

        // Check ground collision
        if (m.y > height - 60) {
          SoundManager.playHit();
          triggerShake();
          setLives(prev => {

            if (prev <= 1) {
              setGameOver(true);
              SoundManager.playGameOver();
              onComplete(score);
              return 0;
            }
            return prev - 1;
          });
          state.meteors.splice(index, 1);
          if (state.activeTarget === m.id) {
            state.activeTarget = null;
            setTypedInput("");
          }
        }
      });

      // Update particles
      state.particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.life;
        if (p.alpha <= 0) {
          state.particles.splice(index, 1);
        }
      });

      // Update level based on score
      const nextLevel = Math.floor(score / 500) + 1;
      if (nextLevel > currentLevel) {
        setCurrentLevel(nextLevel);
        SoundManager.playPowerup();
      }
    };

    const drawGame = () => {
      ctx.clearRect(0, 0, width, height);
      const state = gameStateRef.current;

      // Draw starry sky
      ctx.fillStyle = '#060212';
      ctx.fillRect(0, 0, width, height);

      // Cybergrid floor
      ctx.strokeStyle = 'rgba(157, 78, 221, 0.15)';
      ctx.lineWidth = 1;
      const lines = 10;
      for (let i = 0; i <= lines; i++) {
        const x = (width / lines) * i;
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x, height - 60);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, height - 60);
      ctx.lineTo(width, height - 60);
      ctx.stroke();

      // Draw laser base
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(width / 2, height - 20, 30, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw Laser barrel aiming at active target or straight up
      let aimX = width / 2;
      let aimY = 0;
      if (state.activeTarget) {
        const target = state.meteors.find(m => m.id === state.activeTarget);
        if (target) {
          aimX = target.x;
          aimY = target.y;
        }
      }
      const angle = Math.atan2(aimY - (height - 20), aimX - (width / 2));
      ctx.save();
      ctx.translate(width / 2, height - 20);
      ctx.rotate(angle);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(0, -6, 40, 12);
      ctx.restore();

      // Draw Laser beam
      if (state.laserBeam) {
        ctx.strokeStyle = `rgba(0, 240, 255, ${state.laserBeam.alpha})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(width / 2, height - 20);
        ctx.lineTo(state.laserBeam.tx, state.laserBeam.ty);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${state.laserBeam.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, height - 20);
        ctx.lineTo(state.laserBeam.tx, state.laserBeam.ty);
        ctx.stroke();
      }

      // Draw particles
      state.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw meteors
      state.meteors.forEach(m => {
        // Neon meteor glow
        const isTargeted = state.activeTarget === m.id;
        
        ctx.shadowBlur = isTargeted ? 25 : 12;
        ctx.shadowColor = isTargeted ? '#00f0ff' : '#ff007f';

        // Draw meteor circle
        ctx.fillStyle = isTargeted ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 0, 127, 0.2)';
        ctx.strokeStyle = isTargeted ? '#00f0ff' : '#ff007f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw details
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Rajdhani';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw word with highlights
        const textY = m.y + m.size / 2 + 15;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(m.x - m.size - 5, textY - 10, m.size * 2 + 10, 20);
        ctx.strokeStyle = isTargeted ? '#00f0ff' : 'rgba(255, 0, 127, 0.4)';
        ctx.strokeRect(m.x - m.size - 5, textY - 10, m.size * 2 + 10, 20);

        // Render typed part in green, remaining in white
        ctx.fillStyle = '#39ff14';
        const typedWidth = ctx.measureText(m.typed).width;
        const totalWidth = ctx.measureText(m.word).width;
        ctx.textAlign = 'left';
        
        const startX = m.x - totalWidth / 2;
        ctx.fillText(m.typed, startX, textY);
        
        ctx.fillStyle = '#fff';
        ctx.fillText(m.word.substring(m.typed.length), startX + typedWidth, textY);
      });
    };

    const loop = () => {
      updateGame();
      drawGame();
      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, gameOver, currentLevel, score]);

  // Handle typing input
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const handleKeyDown = (e) => {
      const char = e.key.toLowerCase();
      if (char.length !== 1 || !/[a-z]/.test(char)) return;

      const state = gameStateRef.current;

      // If no active target, search for a meteor starting with this char
      if (state.activeTarget === null) {
        const match = state.meteors.find(m => m.word.startsWith(char));
        if (match) {
          state.activeTarget = match.id;
          match.typed = char;
          setTypedInput(char);
          setTypedCount(prev => prev + 1);
          SoundManager.playClick();
        }
      } else {
        const target = state.meteors.find(m => m.id === state.activeTarget);
        if (target) {
          const nextIndex = target.typed.length;
          if (target.word[nextIndex] === char) {
            // Correct key pressed
            target.typed += char;
            setTypedInput(target.typed);
            setTypedCount(prev => prev + 1);
            SoundManager.playClick();

            // Word completed!
            if (target.typed === target.word) {
              SoundManager.playLaser();
              
              // Trigger laser effect
              state.laserBeam = {
                tx: target.x,
                ty: target.y,
                alpha: 1.0
              };

              // Explosion particles
              spawnParticles(target.x, target.y, '#00f0ff');
              
              // Remove meteor
              state.meteors = state.meteors.filter(m => m.id !== target.id);
              state.activeTarget = null;
              setTypedInput("");

              // Update Score
              setScore(prev => prev + target.word.length * 10);
            }
          } else {
            // Wrong letter - reset target typing
            target.typed = "";
            state.activeTarget = null;
            setTypedInput("");
            SoundManager.playHit();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  // Calculate WPM
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - gameStateRef.current.startTime) / 60000;
      if (elapsedMinutes > 0) {
        // Average word size is 5 chars
        const currentWpm = Math.round((typedCount / 5) / elapsedMinutes);
        setWpm(currentWpm);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, typedCount]);

  return (
    <div className={`absolute inset-0 flex flex-col bg-black overflow-hidden font-display select-none ${isShaking ? 'screen-shake' : ''}`}>

      {/* Game Header Stats */}
      <div className="bg-slate-950 px-4 py-2 border-b border-white/10 flex justify-between items-center text-xs font-bold text-gray-400">
        <div className="flex gap-4">
          <span>LIVES: {Array(lives).fill('❤️').join('')}</span>
          <span className="text-pink-500">LEVEL: {currentLevel}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-cyan-400">WPM: {wpm}</span>
          <span className="text-yellow-400">SCORE: {score}</span>
        </div>
      </div>

      {/* Screen area */}
      <div className="flex-1 relative bg-black">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Start Game screen */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 tracking-wider mb-2 uppercase">TYPE STORM</h3>
            <p className="text-gray-400 text-xs max-w-sm mb-6">Type letters of the descending meteors to lock target, and complete words to destroy them with lasers!</p>
            <button
              onClick={handleStartGame}
              className="px-6 py-2 rounded-lg bg-indigo-500 text-white font-extrabold text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Game Over screen */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-20">
            <AlertTriangle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
            <h3 className="text-3xl font-black text-rose-500 tracking-wider mb-2 uppercase">CITY DESTROYED</h3>
            <p className="text-gray-400 text-sm mb-4">The meteor swarm breached defenses!</p>
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6">
              <p className="text-xs text-gray-400">FINAL SCORE: <span className="text-yellow-400 font-extrabold text-lg">{score}</span></p>
              <p className="text-xs text-gray-400">AVERAGE WPM: <span className="text-cyan-400 font-extrabold">{wpm}</span></p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={onQuit}
                className="px-5 py-2 rounded-lg border border-white/10 text-gray-300 text-xs font-bold uppercase transition-all"
              >
                Quit Cabin
              </button>
              <button
                onClick={handleStartGame}
                className="px-5 py-2 rounded-lg bg-pink-500 text-white text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Target Status Footer bar */}
      <div className="bg-slate-950 p-2.5 border-t border-white/10 flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <span className="text-gray-500 font-bold uppercase tracking-wider">LOCKED METEOR:</span>
          {typedInput ? (
            <span className="text-cyan-400 font-black tracking-widest text-sm uppercase">{typedInput}</span>
          ) : (
            <span className="text-gray-600 font-bold uppercase">NO TARGET LOCK</span>
          )}
        </div>
        <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          Type matching letters to shoot
        </div>
      </div>
    </div>
  );
}
