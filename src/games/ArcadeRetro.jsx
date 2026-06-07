// ArcadeRetro.jsx - Mini Emulator Console for classic retro game systems
import React, { useState, useEffect, useRef } from 'react';
import SoundManager from '../components/SoundManager';
import { Play, RotateCcw, Monitor, RefreshCw, X, Circle } from 'lucide-react';

export default function ArcadeRetro({ onComplete, onQuit }) {
  const [selectedSubGame, setSelectedSubGame] = useState(null); // 'snake', 'pong', 'breakout', 'space', 'flappy'
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Shared state references for subgames
  const stateRef = useRef({
    subGame: null,
    // Snake state
    snake: [],
    dx: 15,
    dy: 0,
    food: { x: 0, y: 0 },
    // Pong state
    pongBall: { x: 200, y: 150, vx: 2, vy: 2, r: 8 },
    p1Paddle: 120,
    cpuPaddle: 120,
    p1Score: 0,
    cpuScore: 0,
    // Breakout state
    breakoutBall: { x: 200, y: 260, vx: 2.5, vy: -2.5, r: 8 },
    breakoutPaddleX: 160,
    bricks: [],
    // Space Defender state
    shipX: 180,
    bullets: [],
    aliens: [],
    lastAlienShoot: 0,
    // Flappy state
    birdY: 150,
    birdVelocity: 0,
    pipes: [],
    distanceCount: 0
  });

  const selectGame = (gameKey) => {
    SoundManager.playClick();
    setSelectedSubGame(gameKey);
    setIsPlaying(false);
    setGameOver(false);
    setScore(0);
  };

  const handleStartGame = () => {
    SoundManager.playClick();
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);

    const canvas = canvasRef.current;
    const width = canvas ? canvas.getBoundingClientRect().width : 400;
    const height = canvas ? canvas.getBoundingClientRect().height : 350;

    const state = stateRef.current;
    state.subGame = selectedSubGame;

    if (selectedSubGame === 'snake') {
      state.snake = [
        { x: 90, y: 120 },
        { x: 75, y: 120 },
        { x: 60, y: 120 }
      ];
      state.dx = 15;
      state.dy = 0;
      // place food
      state.food = { 
        x: Math.floor(Math.random() * (width / 15 - 4) + 2) * 15,
        y: Math.floor(Math.random() * (height / 15 - 4) + 2) * 15
      };
    } else if (selectedSubGame === 'pong') {
      state.pongBall = { x: width / 2, y: height / 2, vx: 3, vy: 2, r: 8 };
      state.p1Paddle = height / 2 - 25;
      state.cpuPaddle = height / 2 - 25;
      state.p1Score = 0;
      state.cpuScore = 0;
    } else if (selectedSubGame === 'breakout') {
      state.breakoutBall = { x: width / 2, y: height - 60, vx: 2.5, vy: -3, r: 8 };
      state.breakoutPaddleX = width / 2 - 40;
      // Init bricks
      const cols = 7;
      const rows = 4;
      const bList = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          bList.push({
            x: 25 + c * 50,
            y: 40 + r * 20,
            w: 42,
            h: 12,
            intact: true,
            color: ['#ff007f', '#00f0ff', '#39ff14', '#fff200'][r]
          });
        }
      }
      state.bricks = bList;
    } else if (selectedSubGame === 'space') {
      state.shipX = width / 2;
      state.bullets = [];
      // Init aliens
      const aList = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
          aList.push({
            x: 50 + c * 50,
            y: 40 + r * 30,
            w: 30,
            h: 20,
            color: '#ef4444'
          });
        }
      }
      state.aliens = aList;
    } else if (selectedSubGame === 'flappy') {
      state.birdY = 120;
      state.birdVelocity = 0;
      state.pipes = [];
      state.distanceCount = 0;
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const handleKeyDown = (e) => {
      const state = stateRef.current;
      const key = e.key;

      if (selectedSubGame === 'snake') {
        if ((key === 'ArrowLeft' || key === 'a') && state.dx === 0) { state.dx = -15; state.dy = 0; }
        if ((key === 'ArrowRight' || key === 'd') && state.dx === 0) { state.dx = 15; state.dy = 0; }
        if ((key === 'ArrowUp' || key === 'w') && state.dy === 0) { state.dx = 0; state.dy = -15; }
        if ((key === 'ArrowDown' || key === 's') && state.dy === 0) { state.dx = 0; state.dy = 15; }
      }

      if (selectedSubGame === 'pong') {
        if (key === 'ArrowUp' || key === 'w') state.p1Paddle = Math.max(10, state.p1Paddle - 20);
        if (key === 'ArrowDown' || key === 's') state.p1Paddle = Math.min(240, state.p1Paddle + 20);
      }

      if (selectedSubGame === 'breakout') {
        if (key === 'ArrowLeft' || key === 'a') state.breakoutPaddleX = Math.max(10, state.breakoutPaddleX - 25);
        if (key === 'ArrowRight' || key === 'd') state.breakoutPaddleX = Math.min(310, state.breakoutPaddleX + 25);
      }

      if (selectedSubGame === 'space') {
        if (key === 'ArrowLeft' || key === 'a') state.shipX = Math.max(25, state.shipX - 18);
        if (key === 'ArrowRight' || key === 'd') state.shipX = Math.min(375, state.shipX + 18);
        if (key === ' ' || key === 'Spacebar') {
          SoundManager.playLaser();
          state.bullets.push({ x: state.shipX, y: 280, vy: -5 });
        }
      }

      if (selectedSubGame === 'flappy') {
        if (key === ' ' || key === 'ArrowUp' || key === 'w') {
          state.birdVelocity = -5.2;
          SoundManager.playJump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, selectedSubGame]);

  // Canvas update/render loop
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

    let ticker = 0;

    const updateGame = () => {
      const state = stateRef.current;
      ticker++;

      // ============ SNAKE GAME ============
      if (selectedSubGame === 'snake') {
        if (ticker % 7 === 0) { // throttle speed
          // move head
          const head = { x: state.snake[0].x + state.dx, y: state.snake[0].y + state.dy };
          
          // collision checks
          if (head.x < 15 || head.x >= width - 15 || head.y < 15 || head.y >= height - 15) {
            SoundManager.playHit();
            SoundManager.playGameOver();
            setGameOver(true);
            onComplete(score);
            return;
          }

          // tail collision
          for (let i = 0; i < state.snake.length; i++) {
            if (state.snake[i].x === head.x && state.snake[i].y === head.y) {
              SoundManager.playHit();
              SoundManager.playGameOver();
              setGameOver(true);
              onComplete(score);
              return;
            }
          }

          state.snake.unshift(head);

          // eat food check
          if (Math.abs(head.x - state.food.x) < 5 && Math.abs(head.y - state.food.y) < 5) {
            SoundManager.playPowerup();
            setScore(prev => prev + 50);
            state.food = {
              x: Math.floor(Math.random() * (width / 15 - 4) + 2) * 15,
              y: Math.floor(Math.random() * (height / 15 - 4) + 2) * 15
            };
          } else {
            state.snake.pop();
          }
        }
      }

      // ============ PONG GAME ============
      if (selectedSubGame === 'pong') {
        const ball = state.pongBall;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall bounce top/bottom
        if (ball.y - ball.r < 15 || ball.y + ball.r > height - 15) {
          ball.vy = -ball.vy;
          SoundManager.playClick();
        }

        // Steer AI paddle
        if (ball.y > state.cpuPaddle + 25) state.cpuPaddle = Math.min(height - 65, state.cpuPaddle + 2);
        else if (ball.y < state.cpuPaddle + 25) state.cpuPaddle = Math.max(15, state.cpuPaddle - 2);

        // Player paddle bounce
        if (ball.x - ball.r <= 35 && ball.x - ball.r >= 20) {
          if (ball.y >= state.p1Paddle && ball.y <= state.p1Paddle + 50) {
            ball.vx = -ball.vx * 1.05; // speedup
            ball.x = 36 + ball.r;
            SoundManager.playClick();
            setScore(prev => prev + 10);
          }
        }

        // CPU paddle bounce
        if (ball.x + ball.r >= width - 35 && ball.x + ball.r <= width - 20) {
          if (ball.y >= state.cpuPaddle && ball.y <= state.cpuPaddle + 50) {
            ball.vx = -ball.vx * 1.05;
            ball.x = width - 36 - ball.r;
            SoundManager.playClick();
          }
        }

        // Scores checks
        if (ball.x < 10) {
          state.cpuScore++;
          SoundManager.playHit();
          if (state.cpuScore >= 3) {
            SoundManager.playGameOver();
            setGameOver(true);
            onComplete(score);
          } else {
            // reset
            ball.x = width / 2;
            ball.y = height / 2;
            ball.vx = 2.5;
          }
        } else if (ball.x > width - 10) {
          state.p1Score++;
          SoundManager.playPowerup();
          setScore(prev => prev + 100);
          if (state.p1Score >= 3) {
            SoundManager.playGameOver();
            setGameOver(true);
            onComplete(score + 100);
          } else {
            ball.x = width / 2;
            ball.y = height / 2;
            ball.vx = -2.5;
          }
        }
      }

      // ============ BREAKOUT GAME ============
      if (selectedSubGame === 'breakout') {
        const ball = state.breakoutBall;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // wall bounces
        if (ball.x - ball.r < 15 || ball.x + ball.r > width - 15) {
          ball.vx = -ball.vx;
          SoundManager.playClick();
        }
        if (ball.y - ball.r < 15) {
          ball.vy = -ball.vy;
          SoundManager.playClick();
        }

        // paddle bounce
        if (ball.y + ball.r >= height - 40 && ball.y - ball.r <= height - 30) {
          if (ball.x >= state.breakoutPaddleX && ball.x <= state.breakoutPaddleX + 80) {
            ball.vy = -Math.abs(ball.vy);
            SoundManager.playClick();
          }
        }

        // brick collisions
        state.bricks.forEach(b => {
          if (!b.intact) return;
          if (
            ball.x + ball.r >= b.x &&
            ball.x - ball.r <= b.x + b.w &&
            ball.y + ball.r >= b.y &&
            ball.y - ball.r <= b.y + b.h
          ) {
            b.intact = false;
            ball.vy = -ball.vy;
            SoundManager.playExplosion();
            setScore(prev => prev + 40);
          }
        });

        // Floor trigger
        if (ball.y > height) {
          SoundManager.playHit();
          SoundManager.playGameOver();
          setGameOver(true);
          onComplete(score);
        }

        // win check
        if (state.bricks.every(b => !b.intact)) {
          SoundManager.playLevelUp();
          setGameOver(true);
          onComplete(score + 200);
        }
      }

      // ============ SPACE DEFENDER GAME ============
      if (selectedSubGame === 'space') {
        // move bullets
        state.bullets.forEach((b, bIdx) => {
          b.y += b.vy;
          if (b.y < 0) state.bullets.splice(bIdx, 1);

          // hit alien check
          state.aliens.forEach((al, aIdx) => {
            if (
              b.x >= al.x && b.x <= al.x + al.w &&
              b.y >= al.y && b.y <= al.y + al.h
            ) {
              state.bullets.splice(bIdx, 1);
              state.aliens.splice(aIdx, 1);
              SoundManager.playExplosion();
              setScore(prev => prev + 50);
            }
          });
        });

        // Alien descents
        if (ticker % 80 === 0) {
          state.aliens.forEach(al => {
            al.y += 12;
            if (al.y > 260) {
              setGameOver(true);
              SoundManager.playGameOver();
              onComplete(score);
            }
          });
        }

        if (state.aliens.length === 0) {
          SoundManager.playLevelUp();
          setGameOver(true);
          onComplete(score + 150);
        }
      }

      // ============ FLAPPY NEON GAME ============
      if (selectedSubGame === 'flappy') {
        state.birdVelocity += 0.22; // gravity
        state.birdY += state.birdVelocity;

        // boundary checks
        if (state.birdY < 15 || state.birdY > height - 15) {
          SoundManager.playHit();
          SoundManager.playGameOver();
          setGameOver(true);
          onComplete(score);
          return;
        }

        // Spawn pipes
        if (ticker % 90 === 0) {
          const gap = 85;
          const topH = 30 + Math.random() * (height - 180);
          state.pipes.push({
            x: width + 20,
            topH,
            bottomY: topH + gap,
            w: 30,
            passed: false
          });
        }

        // Move pipes
        state.pipes.forEach((p, idx) => {
          p.x -= 2;

          // Collision check
          const bx = 60;
          const by = state.birdY;
          const br = 8;

          if (
            (bx + br >= p.x && bx - br <= p.x + p.w && by - br <= p.topH) ||
            (bx + br >= p.x && bx - br <= p.x + p.w && by + br >= p.bottomY)
          ) {
            SoundManager.playHit();
            SoundManager.playGameOver();
            setGameOver(true);
            onComplete(score);
          }

          // Score check
          if (p.x < bx && !p.passed) {
            p.passed = true;
            SoundManager.playPowerup();
            setScore(prev => prev + 100);
          }

          // Delete out
          if (p.x < -40) {
            state.pipes.splice(idx, 1);
          }
        });
      }
    };

    const drawGame = () => {
      ctx.clearRect(0, 0, width, height);
      const state = stateRef.current;

      // Draw standard inner console grid border
      ctx.fillStyle = '#050210';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(15, 15, width - 30, height - 30);

      // ============ DRAW SNAKE ============
      if (selectedSubGame === 'snake') {
        // Draw food gem
        ctx.fillStyle = '#ff007f';
        ctx.beginPath();
        ctx.arc(state.food.x + 7.5, state.food.y + 7.5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw snake
        state.snake.forEach((seg, idx) => {
          ctx.fillStyle = idx === 0 ? '#39ff14' : 'rgba(57, 255, 20, 0.6)';
          ctx.strokeStyle = '#000';
          ctx.fillRect(seg.x, seg.y, 14, 14);
          ctx.strokeRect(seg.x, seg.y, 14, 14);
        });
      }

      // ============ DRAW PONG ============
      if (selectedSubGame === 'pong') {
        // Draw paddles
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(25, state.p1Paddle, 10, 50);

        ctx.fillStyle = '#ff007f';
        ctx.fillRect(width - 35, state.cpuPaddle, 10, 50);

        // Ball
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(state.pongBall.x, state.pongBall.y, state.pongBall.r, 0, Math.PI * 2);
        ctx.fill();

        // Center line
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ============ DRAW BREAKOUT ============
      if (selectedSubGame === 'breakout') {
        // Paddle
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(state.breakoutPaddleX, height - 40, 80, 10);

        // Bricks
        state.bricks.forEach(b => {
          if (!b.intact) return;
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.w, b.h);
        });

        // Ball
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(state.breakoutBall.x, state.breakoutBall.y, state.breakoutBall.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ============ DRAW SPACE DEFENDER ============
      if (selectedSubGame === 'space') {
        // Draw Defender Ship
        ctx.fillStyle = '#39ff14';
        ctx.beginPath();
        ctx.moveTo(state.shipX, 280);
        ctx.lineTo(state.shipX - 12, 300);
        ctx.lineTo(state.shipX + 12, 300);
        ctx.closePath();
        ctx.fill();

        // Draw Bullets
        ctx.fillStyle = '#ff007f';
        state.bullets.forEach(b => {
          ctx.fillRect(b.x - 2, b.y, 4, 10);
        });

        // Draw Aliens
        state.aliens.forEach(al => {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(al.x, al.y, al.w, al.h);
          ctx.fillStyle = '#000';
          ctx.fillRect(al.x + 6, al.y + 5, 4, 4);
          ctx.fillRect(al.x + 20, al.y + 5, 4, 4);
        });
      }

      // ============ DRAW FLAPPY ============
      if (selectedSubGame === 'flappy') {
        // Draw bird
        ctx.fillStyle = '#fff200';
        ctx.beginPath();
        ctx.arc(60, state.birdY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(63, state.birdY - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw pipes
        state.pipes.forEach(p => {
          ctx.fillStyle = 'rgba(57, 255, 20, 0.3)';
          ctx.strokeStyle = '#39ff14';
          ctx.lineWidth = 2;
          
          // Top pipe
          ctx.fillRect(p.x, 15, p.w, p.topH - 15);
          ctx.strokeRect(p.x, 15, p.w, p.topH - 15);

          // Bottom pipe
          ctx.fillRect(p.x, p.bottomY, p.w, height - p.bottomY - 15);
          ctx.strokeRect(p.x, p.bottomY, p.w, height - p.bottomY - 15);
        });
      }
    };

    const loop = () => {
      updateGame();
      drawGame();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, gameOver, selectedSubGame, score]);

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050210] overflow-hidden select-none font-display">
      {/* Console Stats Banner */}
      <div className="bg-slate-950 px-5 py-2.5 border-b border-white/10 flex justify-between items-center text-xs">
        <div className="flex gap-4">
          <span className="text-cyan-400 font-extrabold uppercase">
            {selectedSubGame ? `${selectedSubGame.toUpperCase()} MODE` : "RETRO SECTOR"}
          </span>
        </div>
        {selectedSubGame && isPlaying && (
          <button 
            onClick={() => selectGame(null)}
            className="text-[10px] font-extrabold text-rose-400 hover:text-white px-2 py-0.5 rounded border border-rose-500/20 hover:bg-rose-500/10 transition-all uppercase"
          >
            ← Console Menu
          </button>
        )}
        <span className="text-yellow-400 font-extrabold">SCORE: {score}</span>
      </div>

      {/* Screen Canvas Area */}
      <div className="flex-1 relative">
        {selectedSubGame === null ? (
          /* Select Subgame Selector Console Screen */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Monitor className="w-12 h-12 text-cyan-400 animate-pulse" />
            <h3 className="text-xl font-black text-white tracking-widest uppercase text-glow-cyan">SELECT RETRO CORE:</h3>
            <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
              {[
                { key: 'snake', label: '🐍 Snake Neon' },
                { key: 'pong', label: '🏓 Cyber Pong' },
                { key: 'breakout', label: '🧱 Breakout Glow' },
                { key: 'space', label: '🚀 Space Defender' },
                { key: 'flappy', label: '🎈 Flappy Neon' }
              ].map(g => (
                <button
                  key={g.key}
                  onClick={() => selectGame(g.key)}
                  className="py-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/50 text-xs font-bold text-gray-300 hover:text-cyan-400 transition-all transform hover:scale-[1.03]"
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Subgame gameplay canvas */
          <div className="w-full h-full relative overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full block" />
            
            {/* CRT Screen Scanline Overlay Filter */}
            <div className="absolute inset-0 pointer-events-none crt-scanlines opacity-20"></div>

            {/* Play overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-10">
                <p className="text-xs text-gray-400 mb-4">
                  {selectedSubGame === 'snake' && "Use WASD/Arrow keys to eat gems. Avoid borders & tail!"}
                  {selectedSubGame === 'pong' && "Use W/S or Arrow keys to move paddle. Defeat CPU!"}
                  {selectedSubGame === 'breakout' && "Use A/D or Arrow keys to steer paddle. Smash all bricks!"}
                  {selectedSubGame === 'space' && "Use A/D or Arrow keys to steer. SPACE key fires lasers!"}
                  {selectedSubGame === 'flappy' && "Press SPACE or W or Up arrow to flap wings through gates!"}
                </p>
                <button
                  onClick={handleStartGame}
                  className="px-6 py-2 rounded-lg bg-cyan-500 text-black font-extrabold text-xs uppercase tracking-widest hover:scale-105 transition-all"
                >
                  Start Game
                </button>
              </div>
            )}

            {/* GameOver overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center z-10">
                <h3 className="text-2xl font-black text-rose-500 tracking-wider mb-2 uppercase">GAME OVER</h3>
                <p className="text-xs text-gray-400 mb-4">Retro core cycle complete.</p>
                <div className="bg-white/5 border border-white/5 p-3 rounded-lg mb-6 text-xs text-yellow-400 font-bold">
                  FINAL SCORE: {score}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => selectGame(null)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 text-xs font-bold uppercase transition-all"
                  >
                    Console Menu
                  </button>
                  <button
                    onClick={handleStartGame}
                    className="px-4 py-2 rounded-lg bg-pink-500 text-white text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Replay
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Footer */}
      <div className="bg-slate-950 p-2 border-t border-white/10 text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">
        {selectedSubGame === 'snake' && "Use Arrow Keys or WASD"}
        {selectedSubGame === 'pong' && "Use ArrowUp / ArrowDown / W / S"}
        {selectedSubGame === 'breakout' && "Use ArrowLeft / ArrowRight / A / D"}
        {selectedSubGame === 'space' && "Use Arrow Keys + SPACE to Shoot"}
        {selectedSubGame === 'flappy' && "Press SPACE to Flap Up"}
        {!selectedSubGame && "Select a retro core card above"}
      </div>
    </div>
  );
}
