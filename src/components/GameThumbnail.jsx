// GameThumbnail.jsx - Procedural animated canvas headers for game cards (Poki-Style)
import React, { useEffect, useRef } from 'react';

export default function GameThumbnail({ game }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let frame = 0;

    // Set canvas dimensions to 180px height to match new Poki card style
    const width = 300;
    const height = 180;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Deterministic hash of the game ID to get unique colors & physics
    const getHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };

    const hashVal = getHash(game.id || game.title);
    const baseHue = hashVal % 360;

    // Generate vibrant neon HSL colors unique to each game
    const colorPrimary = `hsl(${baseHue}, 100%, 55%)`;
    const colorSecondary = `hsl(${(baseHue + 60) % 360}, 100%, 50%)`;
    const colorGlow = `hsla(${baseHue}, 100%, 55%, 0.45)`;

    // Particle pool for ambient dust
    const particles = [];
    const particleCount = 12 + (hashVal % 8);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.2 + Math.random() * 0.8,
        size: 0.6 + Math.random() * 1.4,
        hue: (baseHue + (Math.random() - 0.5) * 30) % 360
      });
    }

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Draw background gradient matching card theme
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#060212');
      grad.addColorStop(0.5, '#0e0624');
      grad.addColorStop(1, '#1b0a3c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient background particles
      particles.forEach(p => {
        p.y += p.speed;
        if (p.y > height) {
          p.y = 0;
          p.x = Math.random() * width;
        }
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, 0.08)`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      // 1. ACTION & RUNNER CATEGORY (Metro Surfer, Temple Escape, Tomb Runner, etc.)
      if (game.category === "Action & Runner" || game.id === "metro-surfer" || game.id === "temple-escape" || game.id === "tomb-runner") {
        // Draw 3D Perspective Subway Tunnel
        ctx.strokeStyle = 'rgba(157, 78, 221, 0.18)';
        ctx.lineWidth = 1.5;
        const archCount = 4;
        for (let i = 0; i < archCount; i++) {
          const archZ = ((frame * 0.8 + i * 45) % 180);
          const r = archZ / 180;
          ctx.beginPath();
          ctx.arc(width / 2, height / 2 - 30 * (1 - r), 40 + r * 140, Math.PI, 0);
          ctx.stroke();
        }

        // Perspective Track Rails
        const horizonY = height / 2 - 20;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 12, horizonY); ctx.lineTo(-40, height);
        ctx.moveTo(width / 2 - 4, horizonY); ctx.lineTo(width / 3 - 15, height);
        ctx.moveTo(width / 2 + 4, horizonY); ctx.lineTo((width / 3) * 2 + 15, height);
        ctx.moveTo(width / 2 + 12, horizonY); ctx.lineTo(width + 40, height);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Scrolling Sleepers (Track Ties)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        const sleeperCount = 6;
        for (let i = 0; i < sleeperCount; i++) {
          const sy = horizonY + Math.pow((frame * 1.5 + i * 30) % 180, 2) / 180;
          if (sy < height) {
            const ratio = (sy - horizonY) / (height - horizonY);
            const sw = 24 + ratio * 240;
            ctx.beginPath();
            ctx.moveTo(width / 2 - sw / 2, sy);
            ctx.lineTo(width / 2 + sw / 2, sy);
            ctx.stroke();
          }
        }

        // Glowing Coins (Spinning gold rings in perspective)
        const coinOffset = (frame * 1.8) % 180;
        const cRatio = coinOffset / 180;
        const cy = horizonY + cRatio * (height - horizonY);
        const cx = width / 2 + (Math.sin(frame * 0.02) * 40 * cRatio);
        const cSize = 4 + cRatio * 20;
        if (cy < height && cy > horizonY) {
          ctx.strokeStyle = '#fff200';
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#fff200';
          ctx.lineWidth = 2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(Math.abs(Math.sin(frame * 0.1)), 1); // spin effect
          ctx.beginPath();
          ctx.arc(0, 0, cSize, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          ctx.shadowBlur = 0;
        }

        // Hoverboarder doing stunt silhouette
        const surferY = height - 50 - Math.abs(Math.sin(frame * 0.08) * 35);
        const surferX = width / 2 + 30 + Math.sin(frame * 0.04) * 20;

        // Neon Hoverboard
        ctx.fillStyle = colorPrimary;
        ctx.shadowColor = colorPrimary;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.roundRect(surferX - 12, surferY + 12, 24, 4, 2);
        ctx.fill();

        // Thruster smoke particles
        ctx.fillStyle = colorSecondary;
        ctx.shadowColor = colorSecondary;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(surferX - 12, surferY + 14, 3, 0, Math.PI * 2);
        ctx.fill();

        // Character silhouette in dynamic pose
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        // Head
        ctx.beginPath();
        ctx.arc(surferX, surferY, 6, 0, Math.PI * 2);
        ctx.fill();
        // Torso
        ctx.fillRect(surferX - 3.5, surferY + 6, 7, 8);
        // Arms
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(surferX - 3.5, surferY + 7);
        ctx.lineTo(surferX - 12, surferY + 3);
        ctx.moveTo(surferX + 3.5, surferY + 7);
        ctx.lineTo(surferX + 11, surferY + 9);
        // Legs
        ctx.moveTo(surferX - 2, surferY + 14);
        ctx.lineTo(surferX - 7, surferY + 13);
        ctx.moveTo(surferX + 2, surferY + 14);
        ctx.lineTo(surferX + 7, surferY + 13);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Speed winds
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const sx = (frame * (4 + i)) % width;
          const sy = 40 + i * 35;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + 30, sy);
          ctx.stroke();
        }
      }

      // 2. RACING & DRIVING (Neon Rider, Turbo Moto, Formula GP, Truck Simulator, etc.)
      else if (game.category === "Racing & Driving" || game.id === "neon-rider" || game.id === "turbo-moto" || game.id === "highway-moto" || game.id === "formula-neon") {
        const cy = height / 2 - 15;

        // Giant Retro Synthwave Sunset
        const sunR = 48;
        const sunX = width / 2;
        const sunY = cy - 8;
        const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY);
        sunGrad.addColorStop(0, '#ff007f');
        sunGrad.addColorStop(0.5, '#ff5500');
        sunGrad.addColorStop(1, '#fffb00');
        ctx.fillStyle = sunGrad;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff007f';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, Math.PI, 0);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Horizontal slices cutting sunset
        ctx.fillStyle = '#060212';
        for (let i = 1; i <= 8; i++) {
          const sliceH = 1.2 + i * 0.8;
          const sliceY = sunY - sunR * (i / 9);
          ctx.fillRect(sunX - sunR - 2, sliceY, sunR * 2 + 4, sliceH);
        }

        // Mountains backdrop
        ctx.fillStyle = '#10072b';
        ctx.beginPath();
        ctx.moveTo(-10, cy);
        ctx.lineTo(width / 3, cy - 25);
        ctx.lineTo(width / 2 - 30, cy);
        ctx.lineTo(width / 2 + 40, cy - 35);
        ctx.lineTo((width / 3) * 2.5, cy);
        ctx.lineTo(width + 10, cy);
        ctx.lineTo(width + 10, height);
        ctx.lineTo(-10, height);
        ctx.closePath();
        ctx.fill();

        // Scrolling Road Guidelines
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1.5;
        for (let i = -5; i <= 5; i++) {
          ctx.beginPath();
          ctx.moveTo(width / 2 + i * 6, cy);
          ctx.lineTo(width / 2 + i * 75, height);
          ctx.stroke();
        }

        // Horizontal scrolling road stripes
        const roadOffset = (frame * 3.2) % 30;
        ctx.strokeStyle = colorSecondary;
        ctx.lineWidth = 1.2;
        for (let y = cy; y < height; y += 15) {
          const dy = y + roadOffset;
          if (dy < height) {
            const ratio = (dy - cy) / (height - cy);
            const wRatio = 140 * ratio;
            ctx.beginPath();
            ctx.moveTo(width / 2 - wRatio, dy);
            ctx.lineTo(width / 2 + wRatio, dy);
            ctx.stroke();
          }
        }

        // Futuristic supercar (Lamborghini Countach silhouette)
        const carX = width / 2 + Math.sin(frame * 0.04) * 55;
        const carY = height - 50;
        const cw = 58;
        const ch = 24;

        ctx.save();
        ctx.translate(carX, carY);

        // Underglow neon shadow
        ctx.fillStyle = colorPrimary;
        ctx.shadowBlur = 20;
        ctx.shadowColor = colorPrimary;
        ctx.fillRect(-cw / 2.2, ch / 2 - 3, cw / 1.1, 5);
        ctx.shadowBlur = 0;

        // Car main body
        ctx.fillStyle = '#0d0628';
        ctx.strokeStyle = colorPrimary;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-cw / 2, ch / 2);
        ctx.lineTo(-cw / 2 + 6, -ch / 2 + 6);
        ctx.lineTo(-cw / 3, -ch / 2);
        ctx.lineTo(cw / 3, -ch / 2);
        ctx.lineTo(cw / 2 - 6, -ch / 2 + 6);
        ctx.lineTo(cw / 2, ch / 2);
        ctx.lineTo(cw / 2 - 10, ch / 2 + 5);
        ctx.lineTo(-cw / 2 + 10, ch / 2 + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing red taillights
        ctx.fillStyle = '#ff003c';
        ctx.shadowColor = '#ff003c';
        ctx.shadowBlur = 12;
        ctx.fillRect(-cw / 2 + 8, ch / 2 - 3, 10, 3.5);
        ctx.fillRect(cw / 2 - 18, ch / 2 - 3, 10, 3.5);

        // Windshield
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-cw / 5, -ch / 6, (cw / 5) * 2, ch / 3.5, 2);
        ctx.fill();

        // Exhaust fire
        if (frame % 12 < 8) {
          ctx.fillStyle = '#fff200';
          ctx.shadowColor = '#fff200';
          ctx.shadowBlur = 10;
          ctx.fillRect(-4, ch / 2 + 4, 8, 6);
        }

        ctx.restore();
      }

      // 3. BOARD & STRATEGY / CONNECT 4 / CHESS ROYALE
      else if (game.category === "Board & Strategy" || game.id === "chess-royale" || game.id === "connect-4" || game.id === "tic-tac-toe" || game.id === "checkers-glow") {
        const boardX = width / 2;
        const boardY = height / 2 + 5;
        const cellW = 22;
        const cellH = 12;

        ctx.save();
        ctx.translate(boardX, boardY);

        // Draw 3D Isometric grid board
        for (let r = -2; r < 2; r++) {
          for (let c = -2; c < 2; c++) {
            const isoX = (c - r) * cellW;
            const isoY = (c + r) * cellH;

            const isDark = (r + c) % 2 === 1;
            ctx.fillStyle = isDark ? 'rgba(74, 20, 140, 0.4)' : 'rgba(0, 240, 255, 0.16)';
            ctx.strokeStyle = 'rgba(157, 78, 221, 0.35)';
            ctx.lineWidth = 1.2;

            ctx.beginPath();
            ctx.moveTo(isoX, isoY - cellH);
            ctx.lineTo(isoX + cellW, isoY);
            ctx.lineTo(isoX, isoY + cellH);
            ctx.lineTo(isoX - cellW, isoY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }

        // Draw holographic glowing chess pieces/chips
        const drawPiece = (px, py, color, pieceH, name) => {
          ctx.save();
          ctx.translate(px, py);
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
          ctx.fillStyle = color;

          // Piece base
          ctx.beginPath();
          ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Piece cylinder body
          ctx.fillRect(-3.5, -pieceH, 7, pieceH);

          // Head sphere
          ctx.beginPath();
          ctx.arc(0, -pieceH, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // Crown cross for King
          if (name === 'king') {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -pieceH - 9); ctx.lineTo(0, -pieceH - 4);
            ctx.moveTo(-2.5, -pieceH - 6.5); ctx.lineTo(2.5, -pieceH - 6.5);
            ctx.stroke();
          }
          ctx.restore();
        };

        const p1X = -cellW * 0.9;
        const p1Y = -cellH * 0.3;
        drawPiece(p1X, p1Y, '#00f0ff', 26, 'king'); // Cyan King

        const p2X = cellW * 0.9;
        const p2Y = cellH * 0.3;
        drawPiece(p2X, p2Y, '#ff007f', 22, 'queen'); // Pink Queen

        // Glowing connection laser line
        if (frame % 24 < 12) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fff';
          ctx.beginPath();
          ctx.moveTo(p1X, p1Y - 22);
          ctx.lineTo(p2X, p2Y - 18);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      }

      // 4. TYPING & WORD (Type Storm, Word Invaders, Type Rush, etc.)
      else if (game.category === "Typing & Word" || game.id === "type-storm" || game.id === "word-invaders") {
        // Binary matrix rain code drops
        ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
        ctx.font = '9px monospace';
        const binaryLetters = "010110NEONTYPESTORM";
        for (let i = 0; i < 9; i++) {
          const char = binaryLetters[(hashVal + i + Math.floor(frame / 15)) % binaryLetters.length];
          const rx = 15 + i * 32;
          const ry = 15 + ((frame * 1.5 + i * 25) % (height - 30));
          ctx.fillText(char, rx, ry);
        }

        // Firing Turret at bottom center
        const turretX = width / 2;
        const turretY = height - 15;

        // Big rocky purple meteorite at top right
        const metX = width - 65 + Math.sin(frame * 0.02) * 15;
        const metY = 45 + Math.cos(frame * 0.025) * 8;
        const metR = 25;

        ctx.save();
        ctx.translate(metX, metY);
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff007f';
        ctx.fillStyle = '#301048';
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // Draw rocky polygon shape
        ctx.moveTo(0, -metR);
        ctx.lineTo(metR * 0.8, -metR * 0.6);
        ctx.lineTo(metR, metR * 0.2);
        ctx.lineTo(metR * 0.5, metR * 0.9);
        ctx.lineTo(-metR * 0.3, metR * 0.8);
        ctx.lineTo(-metR, metR * 0.1);
        ctx.lineTo(-metR * 0.7, -metR * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crater details
        ctx.fillStyle = '#1e0530';
        ctx.beginPath();
        ctx.arc(-8, -4, 4, 0, Math.PI * 2);
        ctx.arc(6, 8, 3.5, 0, Math.PI * 2);
        ctx.arc(10, -8, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.shadowBlur = 0;

        // Electrical lightning laser beams shooting towards target
        if (frame % 20 < 7) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00f0ff';

          ctx.beginPath();
          ctx.moveTo(turretX, turretY - 5);
          
          // Random walk points to form lightning bolt
          let lx;
          let ly;
          const tx = metX;
          const ty = metY;
          const steps = 6;
          for (let i = 1; i < steps; i++) {
            const ratio = i / steps;
            const targetX = turretX + (tx - turretX) * ratio;
            const targetY = turretY + (ty - turretY) * ratio;
            lx = targetX + (Math.random() - 0.5) * 22;
            ly = targetY + (Math.random() - 0.5) * 8;
            ctx.lineTo(lx, ly);
          }
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // Explosion flash on hit
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(tx, ty, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Turret base
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(turretX, turretY + 5, 20, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(turretX - 3, turretY - 12, 6, 12);
      }

      // 5. SPORTS & ARCADE (Snake Neon, Breakout, Pong, space defender, billiards, golf, archery, etc.)
      else {
        // Render classic glowing retro Arcade Cabinet console shell
        const cabX = width / 2 - 35;
        const cabY = height / 2 - 40;

        ctx.save();
        ctx.translate(cabX, cabY);

        // Outer cabinet frame (vector glowing look)
        ctx.strokeStyle = colorPrimary;
        ctx.lineWidth = 3;
        ctx.shadowColor = colorPrimary;
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#070318';

        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(60, 0); // marquee top
        ctx.lineTo(54, 15);
        ctx.lineTo(68, 48); // screen bezel slant
        ctx.lineTo(75, 48);
        ctx.lineTo(75, 60); // controller deck top
        ctx.lineTo(58, 72); // bottom slant
        ctx.lineTo(58, 95); // floor
        ctx.lineTo(12, 95);
        ctx.lineTo(12, 72);
        ctx.lineTo(-2, 60);
        ctx.lineTo(-2, 48);
        ctx.lineTo(5, 48);
        ctx.lineTo(10, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Neon Marquee text
        ctx.fillStyle = colorSecondary;
        ctx.shadowColor = colorSecondary;
        ctx.shadowBlur = 8;
        ctx.fillRect(16, 3, 38, 8);

        // Glowing Screen
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(12, 19, 44, 27);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(12, 19, 44, 27);

        // Scrolling phosphor grid on CRT screen
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(12 + (frame % 44), 19);
        ctx.lineTo(12 + (frame % 44), 46);
        ctx.stroke();

        // Control Panel deck (Joystick & Buttons)
        ctx.fillStyle = '#ef4444'; // Red joystick ball
        ctx.beginPath();
        ctx.arc(15, 54, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(15, 57); ctx.lineTo(15, 60);
        ctx.stroke();

        // Action buttons
        ctx.fillStyle = '#fff200';
        ctx.beginPath();
        ctx.arc(32, 57, 1.8, 0, Math.PI * 2);
        ctx.arc(42, 57, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;

        // Floating arcade entities around cabinet (Space invader, bouncing pong ball)
        const entityY = height / 2 - 10 + Math.sin(frame * 0.05) * 20;

        // Space Invader alien on right
        ctx.fillStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 10;
        ctx.fillRect(width - 65, entityY, 15, 11);
        ctx.fillStyle = '#000000';
        ctx.fillRect(width - 61, entityY + 3, 3, 3);
        ctx.fillRect(width - 53, entityY + 3, 3, 3);
        ctx.shadowBlur = 0;

        // Connecting shooting lasers
        if (frame % 30 < 10) {
          ctx.strokeStyle = '#ff0055';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cabX + 60, cabY + 32);
          ctx.lineTo(width - 65, entityY + 5);
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animId);
  }, [game]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full block pointer-events-none" 
      style={{ opacity: 0.95 }}
    />
  );
}
