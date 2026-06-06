// Carrom.jsx - Physics-based striker Carrom board game
import React, { useState, useEffect, useRef } from 'react';
import SoundManager from '../components/SoundManager';
import { Target, Play, RotateCcw, Award, Zap } from 'lucide-react';

export default function Carrom({ onComplete, onQuit }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [pockets, setPockets] = useState(0); // number of pocketed pieces
  const [gameOver, setGameOver] = useState(false);
  const [aimAngle, setAimAngle] = useState(0);
  const [strikerX, setStrikerX] = useState(200);
  const [power, setPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);

  const stateRef = useRef({
    striker: { x: 200, y: 340, vx: 0, vy: 0, r: 15, mass: 2.5, color: '#00f0ff', isStriker: true },
    pieces: [],
    friction: 0.985,
    pocketsList: [],
    boardSize: 400,
    isAiming: true
  });

  const handleStartGame = () => {
    SoundManager.playClick();
    setIsPlaying(true);
    setScore(0);
    setPockets(0);
    setGameOver(false);
    setPower(0);
    setIsCharging(false);

    const size = stateRef.current.boardSize;
    stateRef.current.striker = { x: size / 2, y: size - 60, vx: 0, vy: 0, r: 16, mass: 3, color: '#00f0ff', isStriker: true };
    setStrikerX(size / 2);

    // Initialize carrom pieces in center ring
    const center = size / 2;
    const r = 9;
    const tempPieces = [];

    // Red Queen in center
    tempPieces.push({ x: center, y: center, vx: 0, vy: 0, r, mass: 1, color: '#ff007f', isQueen: true });

    // Inner circle of pieces (6 white, 6 black alternating)
    const count = 12;
    const radius = 22;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const px = center + Math.cos(angle) * radius;
      const py = center + Math.sin(angle) * radius;
      const isWhite = i % 2 === 0;
      tempPieces.push({
        x: px, y: py, vx: 0, vy: 0, r, mass: 1.1,
        color: isWhite ? '#fff200' : '#a0aec0',
        isWhite
      });
    }

    stateRef.current.pieces = tempPieces;
    stateRef.current.isAiming = true;
  };

  // Physics loop
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

    const size = rect.width;
    stateRef.current.boardSize = size;
    
    // Set pocket coordinates (4 corners)
    const pd = 25; // pocket offset from corner
    stateRef.current.pocketsList = [
      { x: pd, y: pd, r: 22 },
      { x: size - pd, y: pd, r: 22 },
      { x: pd, y: size - pd, r: 22 },
      { x: size - pd, y: size - pd, r: 22 }
    ];

    const checkCollisions = () => {
      const state = stateRef.current;
      const allObjects = [state.striker, ...state.pieces];

      // Handle Wall Bounces
      allObjects.forEach(obj => {
        if (!obj) return;
        const limit = size - 15; // border padding
        
        // Bounce Left / Right
        if (obj.x - obj.r < 15) {
          obj.x = 15 + obj.r;
          obj.vx = -obj.vx * 0.85;
          if (Math.abs(obj.vx) > 0.5) SoundManager.playClick();
        } else if (obj.x + obj.r > limit) {
          obj.x = limit - obj.r;
          obj.vx = -obj.vx * 0.85;
          if (Math.abs(obj.vx) > 0.5) SoundManager.playClick();
        }

        // Bounce Top / Bottom
        if (obj.y - obj.r < 15) {
          obj.y = 15 + obj.r;
          obj.vy = -obj.vy * 0.85;
          if (Math.abs(obj.vy) > 0.5) SoundManager.playClick();
        } else if (obj.y + obj.r > limit) {
          obj.y = limit - obj.r;
          obj.vy = -obj.vy * 0.85;
          if (Math.abs(obj.vy) > 0.5) SoundManager.playClick();
        }
      });

      // Elastic circle-circle collisions
      for (let i = 0; i < allObjects.length; i++) {
        for (let j = i + 1; j < allObjects.length; j++) {
          const o1 = allObjects[i];
          const o2 = allObjects[j];
          if (!o1 || !o2) continue;

          const dx = o2.x - o1.x;
          const dy = o2.y - o1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = o1.r + o2.r;

          if (dist < minDist) {
            // Overlap resolution
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            o1.x -= nx * overlap * 0.5;
            o1.y -= ny * overlap * 0.5;
            o2.x += nx * overlap * 0.5;
            o2.y += ny * overlap * 0.5;

            // Elastic bounce velocities calculations
            const kx = o1.vx - o2.vx;
            const ky = o1.vy - o2.vy;
            const p = 2 * (nx * kx + ny * ky) / (o1.mass + o2.mass);

            o1.vx -= p * o2.mass * nx;
            o1.vy -= p * o2.mass * ny;
            o2.vx += p * o1.mass * nx;
            o2.vy += p * o1.mass * ny;

            if (Math.abs(o1.vx) + Math.abs(o1.vy) > 0.4) {
              SoundManager.playClick();
            }
          }
        }
      }
    };

    const updatePhysics = () => {
      const state = stateRef.current;
      const allObjects = [state.striker, ...state.pieces];

      let anyMoving = false;

      // Apply Friction & Move
      allObjects.forEach(obj => {
        if (!obj) return;
        obj.x += obj.vx;
        obj.y += obj.vy;

        obj.vx *= state.friction;
        obj.vy *= state.friction;

        // stop completely if moving slowly
        if (Math.abs(obj.vx) < 0.05) obj.vx = 0;
        if (Math.abs(obj.vy) < 0.05) obj.vy = 0;

        if (obj.vx !== 0 || obj.vy !== 0) {
          anyMoving = true;
        }
      });

      // Check Pocket falls
      state.pieces.forEach((piece, index) => {
        state.pocketsList.forEach(p => {
          const dx = piece.x - p.x;
          const dy = piece.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < p.r) {
            // Pocketed!
            SoundManager.playPowerup();
            state.pieces.splice(index, 1);
            setPockets(prev => prev + 1);
            setScore(prev => prev + (piece.isQueen ? 100 : 50));
          }
        });
      });

      // Reset striker if it lands in pocket
      state.pocketsList.forEach(p => {
        const dx = state.striker.x - p.x;
        const dy = state.striker.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < p.r) {
          SoundManager.playHit();
          state.striker.vx = 0;
          state.striker.vy = 0;
          state.striker.x = size / 2;
          state.striker.y = size - 60;
          state.isAiming = true;
        }
      });

      // If everything stops, return to aiming state
      if (!anyMoving && !state.isAiming) {
        state.isAiming = true;
        state.striker.x = strikerX;
        state.striker.y = size - 60;
        state.striker.vx = 0;
        state.striker.vy = 0;
      }

      // Check win condition
      if (state.pieces.length === 0) {
        SoundManager.playLevelUp();
        setGameOver(true);
        onComplete(score + 150);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const state = stateRef.current;

      // Draw Wood Neon Board
      ctx.fillStyle = '#060212';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#9d4edd';
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 0, size, size);

      // Inner thin cyan border
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(15, 15, size - 30, size - 30);

      // Pockets
      state.pocketsList.forEach(p => {
        ctx.fillStyle = '#000';
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Center Circle & Concentric Rings
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ff007f';
      ctx.fill();

      // Baselines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1.5;
      // bottom baseline
      ctx.beginPath();
      ctx.moveTo(50, size - 60);
      ctx.lineTo(size - 50, size - 60);
      ctx.stroke();

      // Baseline knobs
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(50, size - 60, 6, 0, Math.PI * 2);
      ctx.arc(size - 50, size - 60, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw Aim Assist Line
      if (state.isAiming) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(state.striker.x, state.striker.y);
        const aimLength = 100;
        const ax = state.striker.x + Math.cos(aimAngle) * aimLength;
        const ay = state.striker.y + Math.sin(aimAngle) * aimLength;
        ctx.lineTo(ax, ay);
        ctx.stroke();
        ctx.setLineDash([]); // clear
      }

      // Draw Pieces
      state.pieces.forEach(p => {
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Draw Striker
      const stk = state.striker;
      ctx.shadowBlur = 15;
      ctx.shadowColor = stk.color;
      ctx.fillStyle = stk.color;
      ctx.beginPath();
      ctx.arc(stk.x, stk.y, stk.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw small striker core crosshair
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(stk.x - 5, stk.y);
      ctx.lineTo(stk.x + 5, stk.y);
      ctx.moveTo(stk.x, stk.y - 5);
      ctx.lineTo(stk.x, stk.y + 5);
      ctx.stroke();
    };

    const loop = () => {
      checkCollisions();
      updatePhysics();
      draw();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gameOver, aimAngle, strikerX, score]);

  // Adjust striker baseline slider
  const handleXSlider = (e) => {
    const newX = parseFloat(e.target.value);
    setStrikerX(newX);
    if (stateRef.current.isAiming) {
      stateRef.current.striker.x = newX;
    }
  };

  // Charging controls
  const handleAimMouseDown = () => {
    if (!stateRef.current.isAiming || gameOver) return;
    setIsCharging(true);
    setPower(0);
  };

  useEffect(() => {
    let interval;
    if (isCharging) {
      interval = setInterval(() => {
        setPower(prev => {
          if (prev >= 10) {
            return 0; // wrap around
          }
          return prev + 0.8;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isCharging]);

  const handleShoot = () => {
    if (!isCharging) return;
    setIsCharging(false);
    
    // Shoot the striker
    const state = stateRef.current;
    state.isAiming = false;
    
    const force = Math.max(2, power) * 1.5;
    state.striker.vx = Math.cos(aimAngle) * force;
    state.striker.vy = Math.sin(aimAngle) * force;
    
    SoundManager.playLaser(); // shoot sound
    setPower(0);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#070314] overflow-hidden select-none font-display">
      {/* Game Header Bar */}
      <div className="bg-slate-950 px-5 py-3 border-b border-white/10 flex justify-between items-center text-xs">
        <div className="flex gap-4 items-center">
          <span className="text-yellow-400">POCKETED: 🔘 {pockets}</span>
        </div>
        <div className="text-cyan-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
          <Target className="w-4 h-4 text-cyan-400" />
          {stateRef.current.isAiming ? "PLACE STRIKER & FIRE!" : "WAIT FOR PIECES TO SETTLE"}
        </div>
        <div className="text-pink-500 font-bold uppercase tracking-wider">SCORE: {score}</div>
      </div>

      {/* Main Board Arena */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {!isPlaying ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-8 text-center z-10">
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-600 tracking-wider mb-2 uppercase">CARROM CLASH</h3>
            <p className="text-gray-400 text-xs max-w-sm mb-6">Aim the striker, hold click to charge energy, and release to shoot the pocket pieces. Clear the board to score!</p>
            <button
              onClick={handleStartGame}
              className="px-8 py-2.5 rounded-lg bg-teal-500 text-black font-extrabold text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              PLAY GAME
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-[380px]">
            {/* Board Canvas */}
            <div className="w-full aspect-square bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            {/* Controls Drawer */}
            {stateRef.current.isAiming && (
              <div className="w-full space-y-3 bg-white/5 border border-white/5 p-3 rounded-xl">
                {/* Horizontal Baseline position */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 w-16">Position</span>
                  <input 
                    type="range"
                    min={55}
                    max={325}
                    value={strikerX}
                    onChange={handleXSlider}
                    className="flex-1 accent-cyan-400 cursor-pointer h-1 rounded"
                  />
                </div>

                {/* Aim direction angle */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 w-16">Aim Angle</span>
                  <input 
                    type="range"
                    min={-Math.PI + 0.15}
                    max={-0.15}
                    step={0.05}
                    value={aimAngle}
                    onChange={(e) => setAimAngle(parseFloat(e.target.value))}
                    className="flex-1 accent-pink-500 cursor-pointer h-1 rounded"
                  />
                </div>

                {/* Shoot button with holding bar */}
                <div className="flex items-center gap-3 pt-1">
                  {/* Power indicator */}
                  <div className="w-20 h-8 bg-black rounded border border-white/10 p-1 flex gap-0.5 items-end justify-center">
                    {Array(10).fill(0).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 rounded-t ${
                          power > i ? 'bg-gradient-to-t from-pink-500 to-rose-400 shadow-[0_0_4px_rgba(255,0,127,0.4)]' : 'bg-white/5'
                        }`}
                        style={{ height: `${(i + 1) * 10}%` }}
                      ></div>
                    ))}
                  </div>

                  <button
                    onMouseDown={handleAimMouseDown}
                    onMouseUp={handleShoot}
                    onMouseLeave={() => { if (isCharging) handleShoot(); }}
                    className="flex-1 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold uppercase tracking-widest text-xs transition-all hover:scale-[1.01]"
                  >
                    {isCharging ? "RELEASE TO FIRE" : "HOLD TO CHARGE & SHOOT"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game Over screen */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-20">
            <Award className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
            <h3 className="text-3xl font-black text-white tracking-wider mb-2 uppercase">BOARD CLEARED</h3>
            <p className="text-gray-400 text-sm mb-4">You pocketed all the carrom men!</p>
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6">
              <p className="text-xs text-gray-400">FINAL SCORE: <span className="text-yellow-400 font-extrabold text-lg">{score}</span></p>
              <p className="text-xs text-gray-400">POCKETS: <span className="text-cyan-400 font-extrabold">{pockets} coins</span></p>
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

      {/* Rules Footer */}
      <div className="bg-slate-950 p-2.5 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-widest px-6">
        <span>Position striker, adjust angle slider, hold shoot button to power strike</span>
        <span>Pocket red queen coin for 100 bonus points</span>
      </div>
    </div>
  );
}
