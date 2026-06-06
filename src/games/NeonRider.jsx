// NeonRider.jsx - Synthwave Car/Bike Traffic Racer
import React, { useState, useEffect, useRef } from 'react';
import SoundManager from '../components/SoundManager';
import { Shield, Play, RotateCcw, AlertTriangle, BatteryCharging } from 'lucide-react';

export default function NeonRider({ onComplete, onQuit }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [speed, setSpeed] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const stateRef = useRef({
    playerX: 200,
    targetX: 200,
    playerY: 0,
    traffic: [],
    nitroList: [],
    speedLevel: 5,
    distanceCount: 0,
    fuelAmount: 100,
    lastSpawnTime: 0,
    particles: []
  });

  const handleStartGame = () => {
    SoundManager.playClick();
    setIsPlaying(true);
    setScore(0);
    setFuel(100);
    setSpeed(0);
    setGameOver(false);

    stateRef.current = {
      playerX: 200,
      targetX: 200,
      playerY: 0,
      traffic: [],
      nitroList: [],
      speedLevel: 5,
      distanceCount: 0,
      fuelAmount: 100,
      lastSpawnTime: 0,
      particles: []
    };
  };

  // Input listeners
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const handleKeyDown = (e) => {
      const state = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.targetX = Math.max(80, state.targetX - 70);
        SoundManager.playClick();
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.targetX = Math.min(320, state.targetX + 70);
        SoundManager.playClick();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        state.speedLevel = Math.min(10, state.speedLevel + 1);
        SoundManager.playClick();
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        state.speedLevel = Math.max(3, state.speedLevel - 1);
        SoundManager.playClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  // Render Loop
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

    // Set initial playerX centered on layout
    if (stateRef.current.playerX === 200) {
      stateRef.current.playerX = width / 2;
      stateRef.current.targetX = width / 2;
    }

    const spawnTraffic = () => {
      const state = stateRef.current;
      const laneWidth = width / 4;
      const lane = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
      const x = laneWidth * lane;
      
      const rand = Math.random();
      if (rand < 0.7) {
        state.traffic.push({
          id: Date.now() + Math.random(),
          x,
          y: -60,
          speed: 1.5 + Math.random() * 2,
          color: ['#ff007f', '#ffaa00', '#9d4edd'][Math.floor(Math.random() * 3)],
          w: 30,
          h: 50
        });
      } else {
        state.nitroList.push({
          id: Date.now() + Math.random(),
          x,
          y: -40,
          w: 18,
          h: 18
        });
      }
    };

    const spawnSparks = (x, y, color) => {
      const state = stateRef.current;
      for (let i = 0; i < 8; i++) {
        state.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          radius: Math.random() * 2 + 1,
          color,
          alpha: 1,
          life: 0.04
        });
      }
    };

    const updatePhysics = () => {
      const state = stateRef.current;
      
      // Interpolate Player steer
      const xDiff = state.targetX - state.playerX;
      if (Math.abs(xDiff) > 1) {
        state.playerX += xDiff * 0.15;
      }

      // Fuel consumption
      state.fuelAmount = Math.max(0, state.fuelAmount - (state.speedLevel * 0.012));
      setFuel(Math.round(state.fuelAmount));

      if (state.fuelAmount <= 0) {
        SoundManager.playGameOver();
        setGameOver(true);
        onComplete(score);
        return;
      }

      // Speed configuration
      setSpeed(state.speedLevel * 15);
      state.distanceCount += state.speedLevel * 0.08;
      setScore(Math.floor(state.distanceCount));

      // Spawning
      const now = Date.now();
      if (now - state.lastSpawnTime > Math.max(800, 2000 - state.speedLevel * 100)) {
        spawnTraffic();
        state.lastSpawnTime = now;
      }

      // Move traffic
      state.traffic.forEach((car, index) => {
        car.y += state.speedLevel * 0.7 + car.speed;

        // Collision Check
        const px = state.playerX;
        const py = height - 100;
        const pw = 28;
        const ph = 50;

        if (
          Math.abs(car.x - px) < (car.w / 2 + pw / 2) &&
          Math.abs(car.y - py) < (car.h / 2 + ph / 2)
        ) {
          // Boom!
          SoundManager.playHit();
          SoundManager.playGameOver();
          setGameOver(true);
          onComplete(score);
        }

        // Out-of-screen remove
        if (car.y > height + 80) {
          state.traffic.splice(index, 1);
        }
      });

      // Move nitros
      state.nitroList.forEach((nitro, index) => {
        nitro.y += state.speedLevel * 0.7;

        // Collection Check
        const px = state.playerX;
        const py = height - 100;
        const pw = 28;
        const ph = 50;

        if (
          Math.abs(nitro.x - px) < (nitro.w / 2 + pw / 2) &&
          Math.abs(nitro.y - py) < (nitro.h / 2 + ph / 2)
        ) {
          SoundManager.playPowerup();
          spawnSparks(nitro.x, nitro.y, '#00f0ff');
          state.fuelAmount = Math.min(100, state.fuelAmount + 25);
          state.nitroList.splice(index, 1);
        }

        if (nitro.y > height + 80) {
          state.nitroList.splice(index, 1);
        }
      });

      // Particles
      state.particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.life;
        if (p.alpha <= 0) {
          state.particles.splice(index, 1);
        }
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const state = stateRef.current;

      // Draw Retro background
      ctx.fillStyle = '#060212';
      ctx.fillRect(0, 0, width, height);

      // Draw Horizon Neon Sunset
      const horizonY = 160;
      const sunset = ctx.createLinearGradient(0, 0, 0, horizonY);
      sunset.addColorStop(0, '#060212');
      sunset.addColorStop(0.5, '#51113f');
      sunset.addColorStop(1, '#9b0e52');
      ctx.fillStyle = sunset;
      ctx.fillRect(0, 0, width, horizonY);

      // Sunset sun
      ctx.fillStyle = '#ff007f';
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#ff007f';
      ctx.beginPath();
      ctx.arc(width / 2, horizonY, 50, Math.PI, 0);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Sunset grid stripes
      ctx.fillStyle = '#060212';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(0, horizonY - 45 + i * 10, width, 2 + i * 0.5);
      }

      // Draw Track Street
      ctx.fillStyle = '#0d0720';
      ctx.beginPath();
      ctx.moveTo(width / 4, horizonY);
      ctx.lineTo(width - width / 4, horizonY);
      ctx.lineTo(width - 40, height);
      ctx.lineTo(40, height);
      ctx.closePath();
      ctx.fill();

      // Draw Lane Lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 2;
      const laneWidth = width / 4;

      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        // bottom coordinate
        const bx = laneWidth * i;
        // top coordinate (perspective)
        const tx = width / 2 + (i - 2) * (width / 12);
        
        ctx.moveTo(tx, horizonY);
        ctx.lineTo(bx, height);
        ctx.stroke();
      }

      // Street lines dash animations
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 30]);
      ctx.lineDashOffset = -state.distanceCount * 2;
      
      for (let i = 1.5; i <= 2.5; i += 1.0) {
        ctx.beginPath();
        const bx = laneWidth * i;
        const tx = width / 2 + (i - 2) * (width / 12);
        ctx.moveTo(tx, horizonY);
        ctx.lineTo(bx, height);
        ctx.stroke();
      }
      ctx.setLineDash([]); // clear

      // Draw Nitros (battery canisters)
      state.nitroList.forEach(nitro => {
        const ratio = (nitro.y - horizonY) / (height - horizonY);
        if (ratio <= 0) return;

        const bx = nitro.x;
        const tx = width / 2 + ((nitro.x / laneWidth) - 2) * (width / 12);
        const px = tx + (bx - tx) * ratio;
        const size = Math.max(5, nitro.w * ratio);

        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f0ff';
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(px - size / 2, nitro.y - size / 2, size, size);

        // Core glow
        ctx.fillStyle = '#fff';
        ctx.fillRect(px - size / 4, nitro.y - size / 4, size / 2, size / 2);
        ctx.shadowBlur = 0;
      });

      // Draw Traffic Cars
      state.traffic.forEach(car => {
        const ratio = (car.y - horizonY) / (height - horizonY);
        if (ratio <= 0) return;

        const bx = car.x;
        const tx = width / 2 + ((car.x / laneWidth) - 2) * (width / 12);
        const px = tx + (bx - tx) * ratio;

        const cw = Math.max(8, car.w * ratio);
        const ch = Math.max(12, car.h * ratio);

        ctx.shadowBlur = 10;
        ctx.shadowColor = car.color;

        ctx.fillStyle = car.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(px - cw / 2, car.y - ch / 2, cw, ch, 4 * ratio);
        ctx.fill();
        ctx.stroke();

        // Tail lights
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(px - cw / 3, car.y + ch / 3, 2 * ratio, 0, Math.PI * 2);
        ctx.arc(px + cw / 3, car.y + ch / 3, 2 * ratio, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
      });

      // Draw Particles
      state.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Player Sports Car
      const px = state.playerX;
      const py = height - 100;
      const pw = 30;
      const ph = 52;

      ctx.shadowBlur = 25;
      ctx.shadowColor = '#39ff14';

      // Engine Thruster Glow
      const thrusterGrad = ctx.createLinearGradient(px, py + ph / 2, px, py + ph / 2 + 15);
      thrusterGrad.addColorStop(0, '#39ff14');
      thrusterGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = thrusterGrad;
      ctx.fillRect(px - 6, py + ph / 2, 12, 15);

      // Car Body
      ctx.fillStyle = '#060212';
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, 8);
      ctx.fill();
      ctx.stroke();

      // Spoiler wing
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(px - pw / 2 - 4, py + ph / 2 - 6, pw + 8, 4);

      // Cockpit windshield
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.roundRect(px - pw / 3, py - ph / 4, (pw / 3) * 2, ph / 4, 3);
      ctx.fill();

      // Neon headlight decals
      ctx.fillStyle = '#fff';
      ctx.fillRect(px - pw / 3, py - ph / 2 + 4, 4, 4);
      ctx.fillRect(px + pw / 3 - 4, py - ph / 2 + 4, 4, 4);

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
      {/* Racer HUD Dashboard */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-white/10 flex justify-between items-center text-xs font-bold text-gray-400">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <BatteryCharging className="w-4 h-4 text-cyan-400" />
            <span>FUEL: {fuel}%</span>
          </div>
          <div className="w-24 h-2.5 bg-black rounded-full overflow-hidden border border-white/5 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${fuel > 30 ? 'bg-cyan-400' : 'bg-rose-500 animate-pulse'}`}
              style={{ width: `${fuel}%` }}
            ></div>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="text-yellow-400">SPEED: {speed} MPH</span>
          <span className="text-pink-500">SCORE: {score}</span>
        </div>
      </div>

      {/* Track Canvas Screen */}
      <div className="flex-1 relative bg-black">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Start Screen */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-400 border-b-transparent animate-spin mb-4"></div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-wider mb-2 uppercase">NEON RIDER</h3>
            <p className="text-gray-400 text-xs max-w-sm mb-6">Drive the grid highway. Steer left/right to dodge traffic. Collect blue batteries to recharge fuel. Accelerate using UP arrow.</p>
            <button
              onClick={handleStartGame}
              className="px-6 py-2 rounded-lg bg-gradient-to-tr from-cyan-400 to-blue-500 text-black font-extrabold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Start Engines
            </button>
          </div>
        )}

        {/* Game Over screen */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-20">
            <AlertTriangle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
            <h3 className="text-3xl font-black text-rose-500 tracking-wider mb-2 uppercase">
              {fuel <= 0 ? "OUT OF FUEL" : "VEHICLE CRASHED"}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {fuel <= 0 ? "You ran out of cyber energy cells!" : "You hit a slow moving highway vehicle!"}
            </p>
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6">
              <p className="text-xs text-gray-400">FINAL SCORE: <span className="text-yellow-400 font-extrabold text-lg">{score}</span></p>
              <p className="text-xs text-gray-400">PEAK SPEED: <span className="text-cyan-400 font-extrabold">{speed} MPH</span></p>
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

      {/* Instructions Footer bar */}
      <div className="bg-slate-950 p-2 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-widest px-4">
        <span>A / D or ArrowLeft/Right: Steer</span>
        <span>W / ArrowUp: Accelerate</span>
        <span>S / ArrowDown: Decelerate</span>
      </div>
    </div>
  );
}
