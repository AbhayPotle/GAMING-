// SimulatorMiniGame.jsx - 15-second reflex dodge challenge for simulator games
import React, { useState, useEffect, useRef } from 'react';
import SoundManager from './SoundManager';
import { Shield, Sparkles, AlertTriangle } from 'lucide-react';

export default function SimulatorMiniGame({ game, upgrades, onComplete, onQuit }) {
  const canvasRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  const stateRef = useRef({
    playerX: 200,
    targetX: 200,
    obstacles: [],
    tokens: [],
    stars: [],
    speedMult: 1 + upgrades.speed * 0.25,
    luckMult: 1 + upgrades.luck * 0.3,
    powerMult: 1 + upgrades.power * 0.2,
    lastSpawnTime: 0,
    scoreVal: 0,
    elapsedFrames: 0
  });

  // Countdown timer before game start
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        SoundManager.playClick();
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      SoundManager.playPowerup();
      setGameStarted(true);
    }
  }, [countdown]);

  // Main 15s Timer
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleGameEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameEnded]);

  const handleGameEnd = () => {
    setGameEnded(true);
    SoundManager.playLevelUp();
    
    // Scale score based on power multiplier
    const finalScore = Math.floor(stateRef.current.scoreVal * stateRef.current.powerMult);
    setScore(finalScore);

    // Call onComplete after 2s delay to show final score
    setTimeout(() => {
      onComplete(finalScore);
    }, 2000);
  };

  // Keyboard controls
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const handleKeyDown = (e) => {
      const state = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.targetX = Math.max(30, state.targetX - 40);
        SoundManager.playClick();
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.targetX = Math.min(370, state.targetX + 40);
        SoundManager.playClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameEnded]);

  // Mouse / Touch controls
  const handleMouseMove = (e) => {
    if (!gameStarted || gameEnded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    stateRef.current.targetX = Math.max(20, Math.min(rect.width - 20, x));
  };

  // Canvas render loop
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    
    // Set initial player position
    stateRef.current.playerX = width / 2;
    stateRef.current.targetX = width / 2;

    // Generate background stars
    const starsList = [];
    for (let i = 0; i < 40; i++) {
      starsList.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 1 + Math.random() * 3,
        size: Math.random() * 1.5
      });
    }
    stateRef.current.stars = starsList;

    const spawnEntity = () => {
      const state = stateRef.current;
      const x = 30 + Math.random() * (width - 60);
      const isToken = Math.random() < 0.45 + (state.luckMult * 0.05); // luck multiplier increases tokens

      if (isToken) {
        state.tokens.push({
          x,
          y: -20,
          w: 16,
          h: 16,
          speed: 2 + Math.random() * 1.5
        });
      } else {
        state.obstacles.push({
          x,
          y: -20,
          w: 20,
          h: 20,
          speed: 2.5 + Math.random() * 2 * state.speedMult // speed multiplier increases obstacle speed
        });
      }
    };

    const updatePhysics = () => {
      const state = stateRef.current;
      state.elapsedFrames++;

      // Interpolate Player movement
      const diffX = state.targetX - state.playerX;
      if (Math.abs(diffX) > 1) {
        state.playerX += diffX * 0.22;
      }

      // Scroll stars
      state.stars.forEach(s => {
        s.y += s.speed;
        if (s.y > height) {
          s.y = 0;
          s.x = Math.random() * width;
        }
      });

      // Spawn elements
      if (state.elapsedFrames % 35 === 0) {
        spawnEntity();
      }

      // Move and check tokens
      state.tokens.forEach((t, idx) => {
        t.y += t.speed;

        // Collision Check
        const px = state.playerX;
        const py = height - 50;
        if (Math.abs(t.x - px) < 20 && Math.abs(t.y - py) < 20) {
          SoundManager.playClick();
          state.scoreVal += 100;
          setScore(state.scoreVal);
          state.tokens.splice(idx, 1);
        }

        // Out of bounds
        if (t.y > height + 20) state.tokens.splice(idx, 1);
      });

      // Move and check obstacles
      state.obstacles.forEach((obs, idx) => {
        obs.y += obs.speed;

        // Collision Check
        const px = state.playerX;
        const py = height - 50;
        if (Math.abs(obs.x - px) < 22 && Math.abs(obs.y - py) < 22) {
          SoundManager.playHit();
          state.scoreVal = Math.max(0, state.scoreVal - 200);
          setScore(state.scoreVal);
          state.obstacles.splice(idx, 1);
        }

        // Out of bounds
        if (obs.y > height + 20) state.obstacles.splice(idx, 1);
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const state = stateRef.current;

      // Draw starry sky
      ctx.fillStyle = '#060212';
      ctx.fillRect(0, 0, width, height);

      // Stars
      ctx.fillStyle = '#fff';
      state.stars.forEach(s => {
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Track boundaries (neon tubes)
      ctx.strokeStyle = 'rgba(157, 78, 221, 0.2)';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Draw tokens (Green diamonds)
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#39ff14';
      ctx.fillStyle = '#39ff14';
      state.tokens.forEach(t => {
        ctx.beginPath();
        ctx.moveTo(t.x, t.y - t.h/2);
        ctx.lineTo(t.x + t.w/2, t.y);
        ctx.lineTo(t.x, t.y + t.h/2);
        ctx.lineTo(t.x - t.w/2, t.y);
        ctx.closePath();
        ctx.fill();
      });

      // Draw obstacles (Pink spikes)
      ctx.shadowColor = '#ff007f';
      ctx.fillStyle = '#ff007f';
      state.obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y - obs.h/2);
        ctx.lineTo(obs.x + obs.w/2, obs.y + obs.h/2);
        ctx.lineTo(obs.x - obs.w/2, obs.y + obs.h/2);
        ctx.closePath();
        ctx.fill();
      });

      // Draw Player Drone (Cyan arrow)
      const px = state.playerX;
      const py = height - 50;
      ctx.shadowColor = '#00f0ff';
      ctx.fillStyle = '#00f0ff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.moveTo(px, py - 16);
      ctx.lineTo(px + 14, py + 12);
      ctx.lineTo(px, py + 4);
      ctx.lineTo(px - 14, py + 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
    };

    const loop = () => {
      updatePhysics();
      draw();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animId);
  }, [gameStarted, gameEnded]);

  return (
    <div 
      className="absolute inset-0 flex flex-col bg-black overflow-hidden font-display select-none cursor-crosshair"
      onMouseMove={handleMouseMove}
    >
      {/* Game HUD */}
      <div className="bg-slate-950 px-4 py-2 border-b border-white/10 flex justify-between items-center text-xs font-bold text-gray-400">
        <span className="text-pink-500 uppercase">{game.title} TRAINING</span>
        <div className="flex gap-4">
          <span className="text-yellow-400 font-extrabold">SCORE: {score}</span>
          <span className="text-cyan-400 font-extrabold">TIME: {timeLeft}s</span>
        </div>
      </div>

      {/* Screen Canvas */}
      <div className="flex-1 relative bg-black">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Countdown overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-center">
            <p className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest mb-1">Starting Mission...</p>
            <h3 className="text-6xl font-black text-white tracking-widest">{countdown}</h3>
          </div>
        )}

        {/* Time Up overlay */}
        {gameEnded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-center z-20">
            <Sparkles className="w-12 h-12 text-yellow-400 mb-4 animate-spin" />
            <h3 className="text-3xl font-black text-yellow-400 tracking-wider mb-2 uppercase">MISSION COMPLETED</h3>
            <p className="text-gray-400 text-xs mb-4">Upgrade specs multiplied your performance score!</p>
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
              <p className="text-xs text-gray-400 uppercase">Final Run Score</p>
              <p className="text-3xl font-extrabold text-white tracking-wider">{score.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions Footer bar */}
      <div className="bg-slate-950 p-2 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-widest px-4">
        <span>Slide mouse left/right or use A/D keys to steer</span>
        <span>Collect Green circles | Avoid Pink Spikes</span>
      </div>
    </div>
  );
}
