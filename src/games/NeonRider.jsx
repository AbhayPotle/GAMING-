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
    let frame = 0;

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

      const horizonY = 160;
      const laneWidth = width / 4;

      // 1. Draw Horizon Neon Sunset & Starry Space Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#04010a');
      skyGrad.addColorStop(0.5, '#250831');
      skyGrad.addColorStop(1, '#65093e');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY);

      // Starfield background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 40; i++) {
        const sx = (Math.sin(i * 99.9) * 0.5 + 0.5) * width;
        const sy = (Math.cos(i * 33.3) * 0.5 + 0.5) * (horizonY - 20);
        const size = Math.abs(Math.sin(frame * 0.04 + i)) * 1.5 + 0.5;
        ctx.fillRect(sx, sy, size, size);
      }

      // Parallax wireframe synthwave mountains
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const x = (width / 8) * i;
        const h1 = 30 + Math.sin(i * 1.5 + state.distanceCount * 0.005) * 20;
        if (i === 0) ctx.moveTo(x, horizonY - h1);
        else ctx.lineTo(x, horizonY - h1);
      }
      ctx.stroke();

      // Cyber Sun with horizontal scanning lines (retro-outrun visual)
      const sunR = 48;
      const sunX = width / 2;
      const sunY = horizonY;

      ctx.save();
      const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY);
      sunGrad.addColorStop(0, '#fffb00');
      sunGrad.addColorStop(0.5, '#ff007f');
      sunGrad.addColorStop(1, '#3b0625');
      ctx.fillStyle = sunGrad;
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#ff007f';

      // Draw sun shape with cut slices
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, Math.PI, 0);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw horizontal slicing strips to block out parts of the sun
      ctx.fillStyle = '#04010a';
      for (let i = 0; i < 6; i++) {
        const sh = 1.5 + i * 1.2;
        const syOffset = horizonY - sunR + 10 + i * 8;
        if (syOffset < horizonY) {
          ctx.fillRect(sunX - sunR - 10, syOffset, sunR * 2 + 20, sh);
        }
      }
      ctx.restore();

      // 2. Draw Track Street and Metallic Sides
      ctx.fillStyle = '#080415';
      ctx.beginPath();
      ctx.moveTo(width / 4, horizonY);
      ctx.lineTo(width - width / 4, horizonY);
      ctx.lineTo(width - 20, height);
      ctx.lineTo(20, height);
      ctx.closePath();
      ctx.fill();

      // Shiny glowing borders of the highway
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(width / 4, horizonY);
      ctx.lineTo(20, height);
      ctx.moveTo(width - width / 4, horizonY);
      ctx.lineTo(width - 20, height);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 3. Draw Lane division lines in perspective
      ctx.strokeStyle = 'rgba(157, 78, 221, 0.25)';
      ctx.lineWidth = 2;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        const bx = laneWidth * i;
        const tx = width / 2 + (i - 2) * (width / 12);
        ctx.moveTo(tx, horizonY);
        ctx.lineTo(bx, height);
        ctx.stroke();
      }

      // Scrolling street dashes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.setLineDash([25, 35]);
      ctx.lineDashOffset = -state.distanceCount * 4;
      
      for (let i = 1.5; i <= 2.5; i += 1.0) {
        ctx.beginPath();
        const bx = laneWidth * i;
        const tx = width / 2 + (i - 2) * (width / 12);
        ctx.moveTo(tx, horizonY);
        ctx.lineTo(bx, height);
        ctx.stroke();
      }
      ctx.setLineDash([]); // clear

      // 4. Draw Nitros (Glowing battery canisters)
      state.nitroList.forEach(nitro => {
        const ratio = (nitro.y - horizonY) / (height - horizonY);
        if (ratio <= 0 || ratio > 1.2) return;

        const bx = nitro.x;
        const tx = width / 2 + ((nitro.x / laneWidth) - 2) * (width / 12);
        const px = tx + (bx - tx) * ratio;
        const size = Math.max(6, nitro.w * ratio);

        ctx.save();
        ctx.translate(px, nitro.y);
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f0ff';

        // Cylinder body gradient
        const cylGrad = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        cylGrad.addColorStop(0, '#00ffff');
        cylGrad.addColorStop(0.5, '#ffffff');
        cylGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = cylGrad;
        
        // Draw cylinder shape
        ctx.beginPath();
        ctx.roundRect(-size / 2, -size / 1.5, size, size * 1.3, 4 * ratio);
        ctx.fill();

        // Metallic copper caps
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-size / 2, -size / 1.5, size, 2 * ratio + 1);
        ctx.fillRect(-size / 2, size * 0.6, size, 2 * ratio + 1);

        // Core lightning bolts/plus symbol
        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${Math.max(5, 10 * ratio)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', 0, 0);

        ctx.restore();
      });

      // 5. Draw Traffic Cars (3 distinct styles: Cyber Sports, Sedan, Heavy Cargo Truck)
      state.traffic.forEach(car => {
        const ratio = (car.y - horizonY) / (height - horizonY);
        if (ratio <= 0 || ratio > 1.2) return;

        const bx = car.x;
        const tx = width / 2 + ((car.x / laneWidth) - 2) * (width / 12);
        const px = tx + (bx - tx) * ratio;

        const cw = Math.max(10, car.w * ratio * 1.1);
        const ch = Math.max(14, car.h * ratio * 1.1);

        ctx.save();
        ctx.translate(px, car.y);
        ctx.shadowBlur = 12;
        ctx.shadowColor = car.color;

        // Choose vehicle design based on speed/ID
        const carType = Math.abs(Math.floor(car.id)) % 3;

        if (carType === 0) {
          // Cyber sports car
          ctx.fillStyle = car.color;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1 * ratio + 0.3;
          ctx.beginPath();
          ctx.roundRect(-cw / 2, -ch / 2, cw, ch, 6 * ratio);
          ctx.fill();
          ctx.stroke();

          // Windshield glass
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-cw / 2.8, -ch / 5, (cw / 2.8) * 2, ch / 4);

          // Headlights and Rear Spoiler
          ctx.fillStyle = '#fff';
          ctx.fillRect(-cw/2, -ch/2 + 2, 2 * ratio + 1, 3 * ratio);
          ctx.fillRect(cw/2 - (2*ratio+1), -ch/2 + 2, 2 * ratio + 1, 3 * ratio);

          // Brake lights
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-cw / 2.8, ch / 2 - 3, 2 * ratio + 1, 2);
          ctx.fillRect(cw / 2.8 - (2 * ratio + 1), ch / 2 - 3, 2 * ratio + 1, 2);
        }
        else if (carType === 1) {
          // Cyber sedan
          ctx.fillStyle = car.color;
          ctx.beginPath();
          ctx.roundRect(-cw / 2.2, -ch / 2, cw / 1.1, ch, 3 * ratio);
          ctx.fill();

          // Windshield (front) and rear window
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-cw / 3, -ch / 4, (cw / 3) * 2, ch / 5);
          ctx.fillRect(-cw / 3, ch / 4, (cw / 3) * 2, ch / 6);

          // Glowing side stripes
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(-cw / 2.2, -ch / 3, 1, ch / 1.5);
          ctx.fillRect(cw / 2.2 - 1, -ch / 3, 1, ch / 1.5);
        }
        else {
          // Cyber Cargo Truck
          ctx.fillStyle = '#334155'; // metal grey cabin
          ctx.fillRect(-cw / 2.2, -ch / 2, cw / 1.1, ch / 3);

          // Glowing neon container
          ctx.fillStyle = car.color;
          ctx.shadowBlur = 15;
          ctx.shadowColor = car.color;
          ctx.fillRect(-cw / 1.9, -ch / 6, cw * 1.05, ch / 1.5);
          
          // Container lines
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let l = 0; l < 4; l++) {
            ctx.beginPath();
            ctx.moveTo(-cw / 1.9, -ch / 6 + l * (ch / 6));
            ctx.lineTo(cw / 1.9, -ch / 6 + l * (ch / 6));
            ctx.stroke();
          }
        }

        ctx.restore();
      });

      // 6. Draw Particles
      state.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 7. Draw Player Sports Car (Lamborghini/DeLorean style)
      const px = state.playerX;
      const py = height - 100;
      const pw = 30;
      const ph = 52;

      ctx.save();
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#39ff14';

      // Rocket Exhaust Flame Sparks behind the vehicle
      if (frame % 2 === 0) {
        state.particles.push({
          x: px - 6 + (Math.random() - 0.5) * 4,
          y: py + ph / 2 + 2,
          vx: (Math.random() - 0.5) * 1,
          vy: 3 + Math.random() * 2,
          radius: Math.random() * 2.5 + 0.5,
          color: '#39ff14',
          alpha: 0.9,
          life: 0.04
        });
        state.particles.push({
          x: px + 6 + (Math.random() - 0.5) * 4,
          y: py + ph / 2 + 2,
          vx: (Math.random() - 0.5) * 1,
          vy: 3 + Math.random() * 2,
          radius: Math.random() * 2.5 + 0.5,
          color: '#39ff14',
          alpha: 0.9,
          life: 0.04
        });
      }

      // Exhaust flame plume gradients
      const plume = ctx.createLinearGradient(px, py + ph / 2, px, py + ph / 2 + 18);
      plume.addColorStop(0, '#39ff14');
      plume.addColorStop(0.3, '#00ffff');
      plume.addColorStop(1, 'transparent');
      ctx.fillStyle = plume;
      ctx.fillRect(px - 8, py + ph / 2, 4, 16);
      ctx.fillRect(px + 4, py + ph / 2, 4, 16);

      // Cyber tires with glowing rims
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 1.5;
      // Front tires
      ctx.fillRect(px - pw / 2 - 2, py - ph / 2.5, 3, 10);
      ctx.strokeRect(px - pw / 2 - 2, py - ph / 2.5, 3, 10);
      ctx.fillRect(px + pw / 2 - 1, py - ph / 2.5, 3, 10);
      ctx.strokeRect(px + pw / 2 - 1, py - ph / 2.5, 3, 10);
      // Rear tires
      ctx.fillRect(px - pw / 2 - 3, py + ph / 5, 4, 12);
      ctx.strokeRect(px - pw / 2 - 3, py + ph / 5, 4, 12);
      ctx.fillRect(px + pw / 2 - 1, py + ph / 5, 4, 12);
      ctx.strokeRect(px + pw / 2 - 1, py + ph / 5, 4, 12);

      // Shaded futuristic supercar body (Countach style)
      const carGrad = ctx.createLinearGradient(px - pw/2, py - ph/2, px + pw/2, py + ph/2);
      carGrad.addColorStop(0, '#090518');
      carGrad.addColorStop(0.5, '#190a36');
      carGrad.addColorStop(1, '#04010b');
      ctx.fillStyle = carGrad;
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2.5;
      
      // Draw angular car shell
      ctx.beginPath();
      ctx.moveTo(px - pw / 3, py - ph / 2); // front center nose
      ctx.lineTo(px + pw / 3, py - ph / 2);
      ctx.lineTo(px + pw / 2, py - ph / 3); // front right corner
      ctx.lineTo(px + pw / 2, py + ph / 3); // rear right side
      ctx.lineTo(px + pw / 2 - 2, py + ph / 2); // rear right corner
      ctx.lineTo(px - pw / 2 + 2, py + ph / 2); // rear left corner
      ctx.lineTo(px - pw / 2, py + ph / 3); // rear left side
      ctx.lineTo(px - pw / 2, py - ph / 3); // front left corner
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Visor cockpit windshield
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.roundRect(px - pw / 3.2, py - ph / 6, (pw / 3.2) * 2, ph / 4, 2);
      ctx.fill();
      
      // Cockpit reflections
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(px - pw / 4, py - ph / 6);
      ctx.lineTo(px - pw / 6, py + ph / 12);
      ctx.lineTo(px - pw / 4, py + ph / 12);
      ctx.closePath();
      ctx.fill();

      // Spoiler wing winglets
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(px - pw / 2 - 4, py + ph / 2 - 6, pw + 8, 4);

      // Tail lights
      ctx.fillStyle = '#ff003c';
      ctx.fillRect(px - pw / 2 + 2, py + ph / 2 - 3, 5, 2);
      ctx.fillRect(px + pw / 2 - 7, py + ph / 2 - 3, 5, 2);

      ctx.restore();
    };

    const loop = () => {
      frame++;
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
