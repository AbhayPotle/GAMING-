// MetroSurfer.jsx - Endless vertical 3-lane runner
import React, { useState, useEffect, useRef } from 'react';
import SoundManager from '../components/SoundManager';
import { Sparkles, Play, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function MetroSurfer({ onComplete, onQuit }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [distance, setDistance] = useState(0);

  const stateRef = useRef({
    playerLane: 1, // 0 = Left, 1 = Middle, 2 = Right
    targetLane: 1,
    playerYOffset: 0, // for jumping
    playerHeightOffset: 0, // for sliding
    jumpTimer: 0,
    slideTimer: 0,
    obstacles: [],
    coinsList: [],
    speed: 4,
    lastSpawnTime: 0,
    particles: [],
    distanceCount: 0
  });

  const handleStartGame = () => {
    SoundManager.playClick();
    setIsPlaying(true);
    setScore(0);
    setCoins(0);
    setGameOver(false);
    setDistance(0);

    stateRef.current = {
      playerLane: 1,
      targetLane: 1,
      playerYOffset: 0,
      playerHeightOffset: 0,
      jumpTimer: 0,
      slideTimer: 0,
      obstacles: [],
      coinsList: [],
      speed: 4,
      lastSpawnTime: 0,
      particles: [],
      distanceCount: 0
    };
  };

  // Input Handling
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const handleKeyDown = (e) => {
      const state = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (state.targetLane > 0) {
          state.targetLane -= 1;
          SoundManager.playClick();
        }
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (state.targetLane < 2) {
          state.targetLane += 1;
          SoundManager.playClick();
        }
      }
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && state.jumpTimer === 0 && state.slideTimer === 0) {
        state.jumpTimer = 35; // Frames for jump
        SoundManager.playJump();
      }
      if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && state.jumpTimer === 0 && state.slideTimer === 0) {
        state.slideTimer = 35; // Frames for slide
        SoundManager.playJump(); // slide sound
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  // Game Render Loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    // Adjust canvas resolution for 8K sharp renders
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Obstacle Generator
    const spawnElement = () => {
      const state = stateRef.current;
      const lane = Math.floor(Math.random() * 3);
      const rand = Math.random();

      if (rand < 0.65) {
        // Spawn Obstacle
        const type = Math.random() < 0.5 ? 'barrier' : 'train'; // barrier (must jump), train (must slide or dodge)
        state.obstacles.push({
          id: Date.now() + Math.random(),
          lane,
          y: -50,
          type,
          w: type === 'train' ? 45 : 35,
          h: type === 'train' ? 80 : 30
        });
      } else {
        // Spawn Coins grid
        for (let i = 0; i < 3; i++) {
          state.coinsList.push({
            id: Date.now() + i + Math.random(),
            lane,
            y: -50 - (i * 40)
          });
        }
      }
    };

    const spawnCollectParticles = (x, y) => {
      const state = stateRef.current;
      for (let i = 0; i < 6; i++) {
        state.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          radius: Math.random() * 2 + 1,
          color: '#fff200',
          alpha: 1,
          life: 0.05
        });
      }
    };

    const updatePhysics = () => {
      const state = stateRef.current;
      
      // Update distance and speed
      state.distanceCount += state.speed * 0.05;
      setDistance(Math.floor(state.distanceCount));
      state.speed = 4.5 + (state.distanceCount / 300);

      // Handle Lane interpolation
      const laneDiff = state.targetLane - state.playerLane;
      if (Math.abs(laneDiff) > 0.05) {
        state.playerLane += Math.sign(laneDiff) * 0.15;
      } else {
        state.playerLane = state.targetLane;
      }

      // Handle Jumping
      if (state.jumpTimer > 0) {
        state.jumpTimer--;
        // Parabolic arc for jump
        const jumpProgress = (35 - state.jumpTimer) / 35;
        state.playerYOffset = Math.sin(jumpProgress * Math.PI) * 75;
      } else {
        state.playerYOffset = 0;
      }

      // Handle Sliding
      if (state.slideTimer > 0) {
        state.slideTimer--;
        state.playerHeightOffset = 15; // flatten height
      } else {
        state.playerHeightOffset = 0;
      }

      // Spawn elements
      const now = Date.now();
      if (now - state.lastSpawnTime > Math.max(1000, 2200 - state.speed * 120)) {
        spawnElement();
        state.lastSpawnTime = now;
      }

      // Move obstacles
      state.obstacles.forEach((obs, idx) => {
        obs.y += state.speed;
        
        // Check Collision
        if (obs.y > height - 120 && obs.y < height - 50) {
          const playerLaneInt = Math.round(state.playerLane);
          if (obs.lane === playerLaneInt) {
            // Check vertical collision
            const isJumping = state.playerYOffset > 25;
            const isSliding = state.playerHeightOffset > 0;
            
            let hit = false;
            if (obs.type === 'barrier' && !isJumping) {
              hit = true;
            }
            if (obs.type === 'train' && !isSliding) {
              hit = true;
            }

            if (hit) {
              SoundManager.playHit();
              SoundManager.playGameOver();
              setGameOver(true);
              onComplete(score + coins * 10);
            }
          }
        }

        // Remove out-of-screen
        if (obs.y > height + 100) {
          state.obstacles.splice(idx, 1);
          setScore(prev => prev + 10);
        }
      });

      // Move coins
      state.coinsList.forEach((coin, idx) => {
        coin.y += state.speed;

        // Check collection
        if (coin.y > height - 125 && coin.y < height - 60) {
          const playerLaneInt = Math.round(state.playerLane);
          if (coin.lane === playerLaneInt) {
            // Check vertical range (coins are floating slightly)
            const isJumping = state.playerYOffset > 15;
            if (!isJumping) {
              SoundManager.playClick();
              spawnCollectParticles((width / 3) * coin.lane + (width / 6), coin.y);
              state.coinsList.splice(idx, 1);
              setCoins(prev => prev + 1);
            }
          }
        }

        // Remove out-of-screen
        if (coin.y > height + 100) {
          state.coinsList.splice(idx, 1);
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
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const state = stateRef.current;

      // Draw background (cyberpunk grid tunnel)
      ctx.fillStyle = '#060212';
      ctx.fillRect(0, 0, width, height);

      // Track Lanes Lines (Perspective styling)
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 3;
      
      const horizonY = 150; // vanishing point height
      const horizonX = width / 2;

      // Lanes division
      const laneWidths = [
        { startX: 0, endX: 0 },
        { startX: width / 3, endX: width / 6 },
        { startX: (width / 3) * 2, endX: width - (width / 6) },
        { startX: width, endX: width }
      ];

      // Draw 3 lanes with perspective
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        // bottom coordinates
        const bx = (width / 3) * i;
        // top coordinates
        const tx = horizonX + ((i - 1.5) * (width / 12));
        
        ctx.moveTo(tx, horizonY);
        ctx.lineTo(bx, height);
        ctx.stroke();
      }

      // Draw glowing railway ties
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.15)';
      ctx.lineWidth = 2;
      const tieCount = 12;
      const offset = (state.distanceCount % 40);
      for (let i = 0; i < tieCount; i++) {
        const y = horizonY + Math.pow(i / tieCount, 1.8) * (height - horizonY) + offset * (i / tieCount);
        if (y < height) {
          ctx.beginPath();
          // Find width at y
          const ratio = (y - horizonY) / (height - horizonY);
          const lx = horizonX - (horizonX * 0.9 * ratio);
          const rx = horizonX + (horizonX * 0.9 * ratio);
          ctx.moveTo(lx, y);
          ctx.lineTo(rx, y);
          ctx.stroke();
        }
      }

      // Draw Coins
      state.coinsList.forEach(coin => {
        const ratio = (coin.y - horizonY) / (height - horizonY);
        if (ratio <= 0) return;
        
        // Find x center based on perspective
        const startX = (width / 3) * coin.lane + (width / 6);
        const bx = startX;
        const tx = horizonX + ((coin.lane - 1.0) * (width / 10));
        const px = tx + (bx - tx) * ratio;
        const size = Math.max(4, 20 * ratio);

        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fff200';
        ctx.fillStyle = '#fff200';
        ctx.beginPath();
        ctx.arc(px, coin.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Obstacles
      state.obstacles.forEach(obs => {
        const ratio = (obs.y - horizonY) / (height - horizonY);
        if (ratio <= 0) return;

        const startX = (width / 3) * obs.lane + (width / 6);
        const bx = startX;
        const tx = horizonX + ((obs.lane - 1.0) * (width / 10));
        const px = tx + (bx - tx) * ratio;

        const ow = Math.max(8, obs.w * ratio);
        const oh = Math.max(12, obs.h * ratio);

        ctx.shadowBlur = 10;
        ctx.shadowColor = obs.type === 'train' ? '#00f0ff' : '#ff007f';

        if (obs.type === 'train') {
          // Cyber Train
          ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2;
          ctx.fillRect(px - ow / 2, obs.y - oh, ow, oh);
          ctx.strokeRect(px - ow / 2, obs.y - oh, ow, oh);
          
          // Headlights
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(px - ow / 4, obs.y - oh + 15, 3 * ratio, 0, Math.PI * 2);
          ctx.arc(px + ow / 4, obs.y - oh + 15, 3 * ratio, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Energy Barrier
          ctx.fillStyle = 'rgba(255, 0, 127, 0.3)';
          ctx.strokeStyle = '#ff007f';
          ctx.lineWidth = 2;
          ctx.fillRect(px - ow / 2, obs.y - oh, ow, oh);
          ctx.strokeRect(px - ow / 2, obs.y - oh, ow, oh);
          
          // Danger symbol lines
          ctx.beginPath();
          ctx.moveTo(px - ow / 2, obs.y - oh);
          ctx.lineTo(px + ow / 2, obs.y);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      });

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

      // Draw Player surfer
      const playerLaneX = (width / 3) * state.playerLane + (width / 6);
      const playerY = height - 100 - state.playerYOffset;
      const playerHeight = 50 - state.playerHeightOffset;
      const playerWidth = 26;

      ctx.shadowBlur = 20;
      ctx.shadowColor = '#39ff14';

      // Draw hoverboard sparks
      ctx.fillStyle = 'rgba(57, 255, 20, 0.4)';
      ctx.fillRect(playerLaneX - 16, height - 90, 32, 5);

      // Player body
      ctx.fillStyle = '#39ff14';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      
      // Draw a retro glowing runner box/capsule
      ctx.beginPath();
      ctx.roundRect(playerLaneX - playerWidth / 2, playerY - playerHeight, playerWidth, playerHeight, 8);
      ctx.fill();
      ctx.stroke();

      // Draw visor
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(playerLaneX - 8, playerY - playerHeight + 8, 16, 6);

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
      {/* HUD Stats */}
      <div className="bg-slate-950 px-4 py-2 border-b border-white/10 flex justify-between items-center text-xs font-bold text-gray-400">
        <div className="flex gap-4">
          <span className="text-yellow-400">COINS: 🪙 {coins}</span>
          <span className="text-cyan-400">DISTANCE: 🏃 {distance}m</span>
        </div>
        <div className="flex gap-4">
          <span className="text-pink-500">SPEED: {Math.round(stateRef.current.speed * 10) / 10}x</span>
          <span className="text-emerald-400">SCORE: {score + coins * 10}</span>
        </div>
      </div>

      {/* Main Track screen */}
      <div className="flex-1 relative bg-black">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Start Game Modal */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <Sparkles className="w-12 h-12 text-green-400 mb-4 animate-spin" />
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 tracking-wider mb-2 uppercase">METRO SURFER</h3>
            <p className="text-gray-400 text-xs max-w-sm mb-6">Use left/right arrows to dodge obstacles. Press UP to jump over barriers, and DOWN to slide under gates!</p>
            <button
              onClick={handleStartGame}
              className="px-6 py-2.5 rounded-lg bg-green-500 text-black font-extrabold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Start Surfing
            </button>
          </div>
        )}

        {/* Game Over Modal */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-20">
            <ShieldAlert className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
            <h3 className="text-3xl font-black text-rose-500 tracking-wider mb-2 uppercase">SURFER CRASHED</h3>
            <p className="text-gray-400 text-sm mb-4">You hit a subway obstacle!</p>
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6 flex gap-6">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Distance</p>
                <p className="text-white font-extrabold text-lg">{distance}m</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Coins</p>
                <p className="text-yellow-400 font-extrabold text-lg">🪙 {coins}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Final Score</p>
                <p className="text-cyan-400 font-extrabold text-lg">{score + coins * 10}</p>
              </div>
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
                className="px-5 py-2 rounded-lg bg-green-500 text-black text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" /> Restart Run
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions Footer bar */}
      <div className="bg-slate-950 p-2 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-widest px-4">
        <span>A / D or Arrow keys: Shift lanes</span>
        <span>W / ArrowUp: Jump</span>
        <span>S / ArrowDown: Slide</span>
      </div>
    </div>
  );
}
