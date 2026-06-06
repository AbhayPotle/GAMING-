// RoadRoller.jsx - Road Roller box smashing game
import React, { useState, useEffect, useRef } from 'react';
import SoundManager from '../components/SoundManager';
import { Shield, Play, RotateCcw, AlertTriangle, Hammer } from 'lucide-react';

export default function RoadRoller({ onComplete, onQuit }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [integrity, setIntegrity] = useState(100);
  const [gameOver, setGameOver] = useState(false);

  const stateRef = useRef({
    rollerX: 200,
    targetX: 200,
    obstacles: [],
    debris: [],
    fuelAmount: 100,
    hullIntegrity: 100,
    scrollSpeed: 3,
    lastSpawnTime: 0,
    scoreVal: 0
  });

  const handleStartGame = () => {
    SoundManager.playClick();
    setIsPlaying(true);
    setScore(0);
    setFuel(100);
    setIntegrity(100);
    setGameOver(false);

    stateRef.current = {
      rollerX: 200,
      targetX: 200,
      obstacles: [],
      debris: [],
      fuelAmount: 100,
      hullIntegrity: 100,
      scrollSpeed: 3,
      lastSpawnTime: 0,
      scoreVal: 0
    };
  };

  // Keyboard Steer listener
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const handleKeyDown = (e) => {
      const state = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.targetX = Math.max(60, state.targetX - 50);
        SoundManager.playClick();
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.targetX = Math.min(340, state.targetX + 50);
        SoundManager.playClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  // Render loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

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

    if (stateRef.current.rollerX === 200) {
      stateRef.current.rollerX = width / 2;
      stateRef.current.targetX = width / 2;
    }

    const spawnObstacle = () => {
      const state = stateRef.current;
      const x = 50 + Math.random() * (width - 100);
      const rand = Math.random();

      let type = 'box'; // smashable box
      let color = '#d97706';
      let scoreReward = 50;

      if (rand < 0.25) {
        type = 'gem'; // score booster gem
        color = '#00f0ff';
        scoreReward = 150;
      } else if (rand < 0.5) {
        type = 'barrel'; // red barrel (explosive/damaging)
        color = '#ef4444';
        scoreReward = 0;
      }

      state.obstacles.push({
        id: Date.now() + Math.random(),
        x,
        y: -40,
        type,
        color,
        w: type === 'gem' ? 20 : 35,
        h: type === 'gem' ? 20 : 35,
        scoreReward
      });
    };

    const spawnSmashDebris = (x, y, color) => {
      const state = stateRef.current;
      for (let i = 0; i < 12; i++) {
        state.debris.push({
          x, y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          radius: Math.random() * 3 + 1,
          color,
          alpha: 1,
          life: 0.05
        });
      }
    };

    const updatePhysics = () => {
      const state = stateRef.current;

      // Move roller
      const diffX = state.targetX - state.rollerX;
      if (Math.abs(diffX) > 1) {
        state.rollerX += diffX * 0.15;
      }

      // Fuel decay
      state.fuelAmount = Math.max(0, state.fuelAmount - 0.08);
      setFuel(Math.round(state.fuelAmount));

      if (state.fuelAmount <= 0 || state.hullIntegrity <= 0) {
        SoundManager.playGameOver();
        setGameOver(true);
        onComplete(score);
        return;
      }

      // Spawning
      const now = Date.now();
      if (now - state.lastSpawnTime > 1100) {
        spawnObstacle();
        state.lastSpawnTime = now;
      }

      // Scroll speed
      state.scrollSpeed = 3 + (score / 1500);

      // Move obstacles
      state.obstacles.forEach((obs, index) => {
        obs.y += state.scrollSpeed;

        // Collision Check
        const rx = state.rollerX;
        const ry = height - 90;
        const rw = 52;
        const rh = 40;

        if (
          Math.abs(obs.x - rx) < (obs.w / 2 + rw / 2) &&
          Math.abs(obs.y - ry) < (obs.h / 2 + rh / 2)
        ) {
          // Smash or Trigger
          if (obs.type === 'box') {
            SoundManager.playExplosion();
            spawnSmashDebris(obs.x, obs.y, obs.color);
            setScore(prev => prev + obs.scoreReward);
          } else if (obs.type === 'gem') {
            SoundManager.playPowerup();
            spawnSmashDebris(obs.x, obs.y, '#00f0ff');
            setScore(prev => prev + obs.scoreReward);
            state.fuelAmount = Math.min(100, state.fuelAmount + 15);
          } else if (obs.type === 'barrel') {
            // Damage!
            SoundManager.playHit();
            spawnSmashDebris(obs.x, obs.y, '#ef4444');
            state.hullIntegrity = Math.max(0, state.hullIntegrity - 30);
            setIntegrity(state.hullIntegrity);
          }

          state.obstacles.splice(index, 1);
        }

        // Out of screen
        if (obs.y > height + 80) {
          state.obstacles.splice(index, 1);
        }
      });

      // Move debris
      state.debris.forEach((d, index) => {
        d.x += d.vx;
        d.y += d.vy;
        d.alpha -= d.life;
        if (d.alpha <= 0) {
          state.debris.splice(index, 1);
        }
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const state = stateRef.current;

      // Draw highway pavement
      ctx.fillStyle = '#0b061e';
      ctx.fillRect(0, 0, width, height);

      // Cyber Road grid lane markers
      ctx.strokeStyle = 'rgba(157, 78, 221, 0.15)';
      ctx.lineWidth = 1.5;
      const verticalGridLines = 6;
      for (let i = 1; i < verticalGridLines; i++) {
        const x = (width / verticalGridLines) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal moving lines
      ctx.setLineDash([10, 30]);
      ctx.lineDashOffset = -state.fuelAmount * 3; // use fuel as ticker
      ctx.beginPath();
      for (let i = 1; i < verticalGridLines; i++) {
        const x = (width / verticalGridLines) * i;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Obstacles
      state.obstacles.forEach(obs => {
        ctx.shadowBlur = 12;
        ctx.shadowColor = obs.color;
        ctx.fillStyle = obs.color;

        if (obs.type === 'box') {
          // Wooden crate box
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
          ctx.strokeRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
          
          // Draw X inside box
          ctx.beginPath();
          ctx.moveTo(obs.x - obs.w / 2, obs.y - obs.h / 2);
          ctx.lineTo(obs.x + obs.w / 2, obs.y + obs.h / 2);
          ctx.moveTo(obs.x + obs.w / 2, obs.y - obs.h / 2);
          ctx.lineTo(obs.x - obs.w / 2, obs.y + obs.h / 2);
          ctx.stroke();
        } else if (obs.type === 'gem') {
          // Cyan Gem diamond
          ctx.fillStyle = '#00f0ff';
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y - obs.h / 2);
          ctx.lineTo(obs.x + obs.w / 2, obs.y);
          ctx.lineTo(obs.x, obs.y + obs.h / 2);
          ctx.lineTo(obs.x - obs.w / 2, obs.y);
          ctx.closePath();
          ctx.fill();
        } else if (obs.type === 'barrel') {
          // Explosive red barrel
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.roundRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h, 4);
          ctx.fill();

          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(obs.x - obs.w / 2, obs.y);
          ctx.lineTo(obs.x + obs.w / 2, obs.y);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      });

      // Debris
      state.debris.forEach(d => {
        ctx.save();
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Road Roller heavy machine vehicle
      const rx = state.rollerX;
      const ry = height - 90;
      const rw = 52;
      const rh = 40;

      ctx.shadowBlur = 15;
      ctx.shadowColor = '#39ff14';

      // Heavy cylinder roller drum (at front)
      ctx.fillStyle = 'rgba(57, 255, 20, 0.35)';
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(rx - rw / 2, ry - rh / 2, rw, 15, 6);
      ctx.fill();
      ctx.stroke();

      // Vehicle Chassis
      ctx.fillStyle = '#09051c';
      ctx.strokeStyle = '#9d4edd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(rx - 16, ry - rh / 2 + 15, 32, 22, 4);
      ctx.fill();
      ctx.stroke();

      // Driver cabin window
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(rx - 8, ry, 16, 8);

      ctx.shadowBlur = 0;
    };

    const loop = () => {
      updatePhysics();
      draw();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gameOver, score]);

  return (
    <div className="absolute inset-0 flex flex-col bg-black overflow-hidden font-display select-none">
      {/* HUD Panel */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-white/10 flex justify-between items-center text-xs font-bold text-gray-400">
        <div className="flex gap-4">
          <span className="text-yellow-400">FUEL: ⚡ {fuel}%</span>
          <span className="text-rose-500">INTEGRITY: 🛡️ {integrity}%</span>
        </div>
        <div className="flex gap-2.5 items-center text-cyan-400">
          <Hammer className="w-4 h-4 text-cyan-400" />
          <span>SMASH CRATES TO SCORE!</span>
        </div>
        <span className="text-emerald-400">SCORE: {score}</span>
      </div>

      {/* Screen Canvas */}
      <div className="flex-1 relative bg-black">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Start Game screen */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 tracking-wider mb-2 uppercase">ROAD ROLLER SMASH</h3>
            <p className="text-gray-400 text-xs max-w-sm mb-6">Drive the heavy roller left/right. Flatten orange shipping crates and collect cyan diamonds. Avoid hitting red hazard explosive barrels!</p>
            <button
              onClick={handleStartGame}
              className="px-6 py-2 rounded-lg bg-green-500 text-black font-extrabold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Start Smashing
            </button>
          </div>
        )}

        {/* Game Over screen */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-20">
            <AlertTriangle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
            <h3 className="text-3xl font-black text-rose-500 tracking-wider mb-2 uppercase">
              {integrity <= 0 ? "ROLLER DESTROYED" : "ENGINE STALLED"}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {integrity <= 0 ? "You crashed into too many explosive barrels!" : "You ran out of engine fuel!"}
            </p>
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6">
              <p className="text-xs text-gray-400">FINAL SCORE: <span className="text-yellow-400 font-extrabold text-lg">{score}</span></p>
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
                <RotateCcw className="w-4 h-4" /> Restart
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions Footer bar */}
      <div className="bg-slate-950 p-2 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-widest px-4">
        <span>A / D or Arrow keys: Steer Road Roller</span>
        <span>Orange: Smashable | Red: Dangerous | Cyan: Boosts</span>
      </div>
    </div>
  );
}
