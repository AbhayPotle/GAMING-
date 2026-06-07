// GameThumbnail.jsx - Procedural animated canvas headers for game cards (Poki-Style)
import React, { useEffect, useRef } from 'react';

export default function GameThumbnail({ game, isHovered }) {
  const canvasRef = useRef(null);
  const isHoveredRef = useRef(isHovered);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

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
    const particleCount = 15 + (hashVal % 10);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.15 + Math.random() * 0.65,
        size: 0.8 + Math.random() * 1.5,
        hue: (baseHue + (Math.random() - 0.5) * 40) % 360,
        alpha: 0.1 + Math.random() * 0.25
      });
    }

    const draw = () => {
      frame++;
      const hovered = isHoveredRef.current;
      ctx.clearRect(0, 0, width, height);

      // Draw background gradient matching card theme
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#04010b');
      grad.addColorStop(0.5, '#0a031a');
      grad.addColorStop(1, '#15062e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient background particles (move faster when hovered)
      const particleSpeedMult = hovered ? 2.5 : 1.0;
      particles.forEach(p => {
        p.y += p.speed * particleSpeedMult;
        if (p.y > height) {
          p.y = 0;
          p.x = Math.random() * width;
        }
        ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${hovered ? p.alpha * 1.6 : p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      // 1. ACTION & RUNNER CATEGORY (Metro Surfer, Temple Escape, Tomb Runner, etc.)
      if (game.category === "Action & Runner" || game.id === "metro-surfer" || game.id === "temple-escape" || game.id === "tomb-runner" || game.id === "road-roller") {
        const speedFactor = hovered ? 2.5 : 1.0;
        const horizonY = height / 2 - 20;

        // Draw neon space portal at the horizon
        ctx.save();
        ctx.fillStyle = `hsla(${(baseHue + 180) % 360}, 100%, 55%, 0.15)`;
        ctx.shadowColor = `hsl(${(baseHue + 180) % 360}, 100%, 55%)`;
        ctx.shadowBlur = hovered ? 25 : 10;
        ctx.beginPath();
        ctx.arc(width / 2, horizonY, 12 + Math.sin(frame * 0.08) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3D Perspective Subway Tunnel Arches
        ctx.strokeStyle = 'rgba(157, 78, 221, 0.22)';
        ctx.lineWidth = 1.5;
        const archCount = 4;
        for (let i = 0; i < archCount; i++) {
          const archZ = ((frame * 0.8 * speedFactor + i * 45) % 180);
          const r = archZ / 180;
          ctx.beginPath();
          ctx.arc(width / 2, horizonY - 30 * (1 - r), 40 + r * 140, Math.PI, 0);
          ctx.stroke();
        }

        // Perspective Track Rails
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
        ctx.shadowBlur = hovered ? 15 : 8;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 14, horizonY); ctx.lineTo(-40, height);
        ctx.moveTo(width / 2 - 5, horizonY); ctx.lineTo(width / 3 - 15, height);
        ctx.moveTo(width / 2 + 5, horizonY); ctx.lineTo((width / 3) * 2 + 15, height);
        ctx.moveTo(width / 2 + 14, horizonY); ctx.lineTo(width + 40, height);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Scrolling Sleepers (Track Ties)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.2;
        const sleeperCount = 6;
        for (let i = 0; i < sleeperCount; i++) {
          const sy = horizonY + Math.pow((frame * 1.5 * speedFactor + i * 30) % 180, 2) / 180;
          if (sy < height) {
            const ratio = (sy - horizonY) / (height - horizonY);
            const sw = 28 + ratio * 240;
            ctx.beginPath();
            ctx.moveTo(width / 2 - sw / 2, sy);
            ctx.lineTo(width / 2 + sw / 2, sy);
            ctx.stroke();
          }
        }

        // Glowing Coins (Spinning gold rings in perspective)
        const coinOffset = (frame * 1.8 * speedFactor) % 180;
        const cRatio = coinOffset / 180;
        const cy = horizonY + cRatio * (height - horizonY);
        const cx = width / 2 + (Math.sin(frame * 0.02) * 55 * cRatio);
        const cSize = 4 + cRatio * 22;
        if (cy < height && cy > horizonY) {
          ctx.strokeStyle = '#fff200';
          ctx.shadowBlur = hovered ? 18 : 10;
          ctx.shadowColor = '#fff200';
          ctx.lineWidth = 2.2;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(Math.abs(Math.sin(frame * 0.08)), 1); // spin effect
          ctx.beginPath();
          ctx.arc(0, 0, cSize, 0, Math.PI * 2);
          ctx.stroke();

          // Coin reflection line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-cSize * 0.7, cSize * 0.7);
          ctx.lineTo(cSize * 0.7, -cSize * 0.7);
          ctx.stroke();
          ctx.restore();
          ctx.shadowBlur = 0;
        }

        // Hoverboarder doing stunt silhouette
        const surferY = height - 52 - Math.abs(Math.sin(frame * 0.07) * 38);
        const surferX = width / 2 + 35 + Math.sin(frame * 0.03) * 25;

        // Particle stream from hoverboard exhaust (lots of particles when hovered)
        const jetCount = hovered ? 6 : 3;
        for (let k = 0; k < jetCount; k++) {
          const px = surferX - 16 - k * (hovered ? 9 : 5);
          const py = surferY + 12 + Math.sin(frame * 0.15 + k) * 3;
          const pSize = (jetCount - k) * (hovered ? 1.5 : 1.0);
          ctx.fillStyle = `hsla(${(baseHue + 40) % 360}, 100%, 65%, ${(jetCount - k) / jetCount})`;
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Neon Hoverboard
        ctx.fillStyle = colorPrimary;
        ctx.shadowColor = colorPrimary;
        ctx.shadowBlur = hovered ? 18 : 10;
        ctx.beginPath();
        ctx.roundRect(surferX - 14, surferY + 11, 28, 4, 2);
        ctx.fill();

        // Character silhouette in dynamic pose
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = hovered ? 16 : 8;
        // Head / Helmet Visor
        ctx.beginPath();
        ctx.arc(surferX, surferY, 6, 0, Math.PI * 2);
        ctx.fill();
        // Helmet visor glow
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(surferX + 2, surferY - 2, 4, 3);

        // Torso
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(surferX - 3.5, surferY + 6, 7, 8);
        // Arms
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(surferX - 3.5, surferY + 7);
        ctx.lineTo(surferX - 14, surferY + 2);
        ctx.moveTo(surferX + 3.5, surferY + 7);
        ctx.lineTo(surferX + 12, surferY + 9);
        // Legs
        ctx.moveTo(surferX - 2, surferY + 14);
        ctx.lineTo(surferX - 8, surferY + 12);
        ctx.moveTo(surferX + 2, surferY + 14);
        ctx.lineTo(surferX + 8, surferY + 12);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Speed winds (drawn faster when hovered)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        const windCount = hovered ? 6 : 4;
        for (let i = 0; i < windCount; i++) {
          const sx = (frame * (hovered ? 8 : 4) + i * 80) % width;
          const sy = 30 + i * 28;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + 35, sy);
          ctx.stroke();
        }
      }

      // 2. RACING & DRIVING (Neon Rider, Turbo Moto, Formula GP, Truck Simulator, etc.)
      else if (game.category === "Racing & Driving" || game.id === "neon-rider" || game.id === "turbo-moto" || game.id === "highway-moto" || game.id === "formula-neon") {
        const cy = height / 2 - 15;
        const speedFactor = hovered ? 2.5 : 1.0;

        // Giant Retro Synthwave Sunset (pulses when hovered)
        const sunR = hovered ? (48 + Math.sin(frame * 0.08) * 6) : 48;
        const sunX = width / 2;
        const sunY = cy - 8;
        const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY);
        sunGrad.addColorStop(0, '#ff007f');
        sunGrad.addColorStop(0.5, '#ff5500');
        sunGrad.addColorStop(1, '#fffb00');
        ctx.fillStyle = sunGrad;
        ctx.shadowBlur = hovered ? 35 : 20;
        ctx.shadowColor = '#ff007f';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, Math.PI, 0);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Horizontal slices cutting sunset
        ctx.fillStyle = '#04010b';
        for (let i = 1; i <= 8; i++) {
          const sliceH = 1.2 + i * 0.8;
          const sliceY = sunY - sunR * (i / 9);
          ctx.fillRect(sunX - sunR - 4, sliceY, sunR * 2 + 8, sliceH);
        }

        // Mountains backdrop
        ctx.fillStyle = '#0d0426';
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
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = hovered ? 8 : 0;
        ctx.shadowColor = '#00f0ff';
        for (let i = -5; i <= 5; i++) {
          ctx.beginPath();
          ctx.moveTo(width / 2 + i * 6, cy);
          ctx.lineTo(width / 2 + i * 75, height);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Horizontal scrolling road stripes
        const roadOffset = (frame * 3.2 * speedFactor) % 30;
        ctx.strokeStyle = colorSecondary;
        ctx.lineWidth = 1.5;
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

        // Futuristic supercar
        const carX = width / 2 + Math.sin(frame * 0.04) * 65;
        const carY = height - 48;
        const cw = 58;
        const ch = 24;

        ctx.save();
        ctx.translate(carX, carY);

        // Underglow neon shadow
        ctx.fillStyle = colorPrimary;
        ctx.shadowBlur = hovered ? 25 : 15;
        ctx.shadowColor = colorPrimary;
        ctx.fillRect(-cw / 2.2, ch / 2 - 3, cw / 1.1, 5);
        ctx.shadowBlur = 0;

        // Car main body
        ctx.fillStyle = '#09031c';
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

        // Windshield reflection
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-cw / 5, -ch / 6, (cw / 5) * 2, ch / 3.5, 2);
        ctx.fill();

        // Exhaust flame particle trails
        if (frame % 8 < 6) {
          ctx.fillStyle = hovered ? '#00f0ff' : '#fff200';
          ctx.shadowColor = hovered ? '#00f0ff' : '#fff200';
          ctx.shadowBlur = hovered ? 18 : 8;
          ctx.beginPath();
          ctx.moveTo(-5, ch / 2 + 3);
          ctx.lineTo(0, ch / 2 + (hovered ? 18 : 10));
          ctx.lineTo(5, ch / 2 + 3);
          ctx.closePath();
          ctx.fill();
        }

        // Tires sparks on hover (drifting)
        if (hovered) {
          ctx.fillStyle = '#ff9f00';
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#ff9f00';
          for (let k = 0; k < 4; k++) {
            const sx1 = -cw / 2.2 + (Math.random() - 0.5) * 6;
            const sy1 = ch / 2 + Math.random() * 8;
            const sx2 = cw / 2.2 + (Math.random() - 0.5) * 6;
            const sy2 = ch / 2 + Math.random() * 8;
            ctx.fillRect(sx1, sy1, 2, 2);
            ctx.fillRect(sx2, sy2, 2, 2);
          }
        }

        ctx.restore();
        ctx.shadowBlur = 0;
      }

      // 3. BOARD & STRATEGY / CONNECT 4 / CHESS ROYALE
      else if (game.category === "Board & Strategy" || game.id === "chess-royale" || game.id === "connect-4" || game.id === "tic-tac-toe" || game.id === "checkers-glow") {
        const boardX = width / 2;
        const boardY = height / 2 + 5;
        const cellW = 24;
        const cellH = 13;

        ctx.save();
        ctx.translate(boardX, boardY);

        // Draw 3D Isometric grid board
        for (let r = -2; r < 2; r++) {
          for (let c = -2; c < 2; c++) {
            const isoX = (c - r) * cellW;
            const isoY = (c + r) * cellH;

            const isDark = (r + c) % 2 === 1;
            // Pulsing highlight
            const hoverPulse = hovered ? Math.sin(frame * 0.1 + (r + c)) * 0.15 : 0;
            ctx.fillStyle = isDark ? `rgba(74, 20, 140, ${0.45 + hoverPulse})` : `rgba(0, 240, 255, ${0.18 + hoverPulse})`;
            ctx.strokeStyle = 'rgba(157, 78, 221, 0.4)';
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

        // Draw holographic glowing chess pieces
        const drawPiece = (px, py, color, pieceH, name) => {
          ctx.save();
          // Piece floats slightly
          const floatOffset = Math.sin(frame * 0.06 + (name === 'king' ? 0 : Math.PI)) * (hovered ? 6 : 3);
          ctx.translate(px, py - floatOffset);
          
          ctx.shadowBlur = hovered ? 22 : 12;
          ctx.shadowColor = color;
          ctx.fillStyle = color;

          // Piece base
          ctx.beginPath();
          ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Piece body
          ctx.fillRect(-4, -pieceH, 8, pieceH);

          // Head sphere
          ctx.beginPath();
          ctx.arc(0, -pieceH, 5, 0, Math.PI * 2);
          ctx.fill();

          // Crown cross for King
          if (name === 'king') {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -pieceH - 9); ctx.lineTo(0, -pieceH - 4);
            ctx.moveTo(-3, -pieceH - 6.5); ctx.lineTo(3, -pieceH - 6.5);
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

        // Lightning zap connector between pieces
        if (frame % 20 < 12) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#00f0ff';
          
          const float1 = Math.sin(frame * 0.06) * (hovered ? 6 : 3);
          const float2 = Math.sin(frame * 0.06 + Math.PI) * (hovered ? 6 : 3);

          ctx.beginPath();
          ctx.moveTo(p1X, p1Y - 26 - float1);
          
          if (hovered) {
            // Jagged line for hover
            const targetX = p2X;
            const targetY = p2Y - 22 - float2;
            const midX = (p1X + targetX) / 2;
            const midY = ((p1Y - 26 - float1) + targetY) / 2;
            ctx.lineTo(midX + (Math.random() - 0.5) * 12, midY + (Math.random() - 0.5) * 12);
            ctx.lineTo(targetX, targetY);
          } else {
            ctx.lineTo(p2X, p2Y - 22 - float2);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Particle sparkles rising from board
        if (hovered && frame % 4 === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 20 - 10, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        ctx.shadowBlur = 0;
      }

      // 4. TYPING & WORD (Type Storm, Word Invaders, Type Rush, etc.)
      else if (game.category === "Typing & Word" || game.id === "type-storm" || game.id === "word-invaders") {
        const speedFactor = hovered ? 2.2 : 1.0;

        // Binary matrix rain code drops
        ctx.fillStyle = hovered ? 'rgba(0, 240, 255, 0.16)' : 'rgba(0, 240, 255, 0.08)';
        ctx.font = '9px monospace';
        const binaryLetters = "010110NEONTYPESTORM";
        for (let i = 0; i < 9; i++) {
          const char = binaryLetters[(hashVal + i + Math.floor(frame / 12)) % binaryLetters.length];
          const rx = 15 + i * 32;
          const ry = 15 + ((frame * 1.5 * speedFactor + i * 25) % (height - 30));
          ctx.fillText(char, rx, ry);
        }

        // Firing Turret at bottom center
        const turretX = width / 2;
        const turretY = height - 15;

        // Big rocky purple meteorite at top right
        const metX = width - 65 + Math.sin(frame * 0.02) * 15;
        const metY = 45 + Math.cos(frame * 0.025) * 8;
        const metR = 25;

        // Draw dual small helper asteroid
        const smMetX = metX - 45 + Math.sin(frame * 0.05) * 12;
        const smMetY = metY + 20 + Math.cos(frame * 0.05) * 12;
        const smMetR = 9;

        ctx.save();
        ctx.translate(smMetX, smMetY);
        ctx.fillStyle = '#220b36';
        ctx.strokeStyle = '#ff00aa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, smMetR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(metX, metY);
        ctx.shadowBlur = hovered ? 28 : 15;
        ctx.shadowColor = '#ff007f';
        ctx.fillStyle = '#32124d';
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // Rocky polygon shape
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
        ctx.fillStyle = '#1c0530';
        ctx.beginPath();
        ctx.arc(-8, -4, 4, 0, Math.PI * 2);
        ctx.arc(6, 8, 3.5, 0, Math.PI * 2);
        ctx.arc(10, -8, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.shadowBlur = 0;

        // Recoil and Aim calculation for Turret on Hover
        let recoilY = 0;
        let turretAngle = 0;
        if (hovered) {
          recoilY = Math.abs(Math.sin(frame * 0.4)) * 4;
          // Look like it's tracking the meteor
          const dx = metX - turretX;
          const dy = metY - turretY;
          turretAngle = Math.atan2(dy, dx) + Math.PI / 2;
        }

        // Electrical lightning laser beams shooting towards target
        const laserTrigger = hovered ? (frame % 8 < 5) : (frame % 20 < 7);
        if (laserTrigger) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = hovered ? 3.5 : 2.2;
          ctx.shadowBlur = hovered ? 22 : 12;
          ctx.shadowColor = '#00f0ff';

          ctx.beginPath();
          // Start laser at turret tip (recoiled and angled)
          const tipX = turretX + Math.sin(turretAngle) * (12 - recoilY);
          const tipY = turretY - Math.cos(turretAngle) * (12 - recoilY);
          ctx.moveTo(tipX, tipY);
          
          // Random walk points to form lightning bolt
          let lx;
          let ly;
          const tx = metX;
          const ty = metY;
          const steps = 6;
          for (let i = 1; i < steps; i++) {
            const ratio = i / steps;
            const targetX = tipX + (tx - tipX) * ratio;
            const targetY = tipY + (ty - tipY) * ratio;
            lx = targetX + (Math.random() - 0.5) * 26;
            ly = targetY + (Math.random() - 0.5) * 10;
            ctx.lineTo(lx, ly);
          }
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // Explosion blast ring on hit
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = hovered ? 25 : 12;
          ctx.beginPath();
          ctx.arc(tx, ty, hovered ? 12 : 7, 0, Math.PI * 2);
          ctx.fill();
          
          // Extra sparks
          if (hovered) {
            ctx.fillStyle = '#00f0ff';
            for (let k = 0; k < 6; k++) {
              ctx.fillRect(tx + (Math.random() - 0.5) * 30, ty + (Math.random() - 0.5) * 30, 2.5, 2.5);
            }
          }
          ctx.shadowBlur = 0;
        }

        // Turret base
        ctx.save();
        ctx.translate(turretX, turretY + 5);
        ctx.rotate(turretAngle);

        ctx.fillStyle = '#0b0f1a';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.2;
        ctx.shadowBlur = hovered ? 12 : 0;
        ctx.shadowColor = '#00f0ff';
        
        ctx.beginPath();
        ctx.arc(0, 0, 18, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        
        // Barrel
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-3, -12 + recoilY, 6, 12);
        ctx.restore();
        ctx.shadowBlur = 0;
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
        ctx.lineWidth = 3.2;
        ctx.shadowColor = colorPrimary;
        ctx.shadowBlur = hovered ? 20 : 12;
        ctx.fillStyle = '#050212';

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
        ctx.shadowBlur = 0;

        // Neon Marquee text (blinks on hover)
        const marqueeBlink = hovered && frame % 15 < 5;
        ctx.fillStyle = marqueeBlink ? colorPrimary : colorSecondary;
        ctx.shadowColor = marqueeBlink ? colorPrimary : colorSecondary;
        ctx.shadowBlur = 8;
        ctx.fillRect(16, 3, 38, 8);

        // Glowing Screen
        ctx.fillStyle = '#100c3a';
        ctx.fillRect(12, 19, 44, 27);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(12, 19, 44, 27);

        // Render mini-game animation on cabinet screen
        const gameSelect = hashVal % 2;
        if (gameSelect === 0) {
          // Snake game: draw a glowing snake body crawling
          ctx.fillStyle = '#00f0ff';
          const snakePos = [
            { x: 16, y: 32 },
            { x: 20, y: 32 },
            { x: 24, y: 32 },
            { x: 24, y: 28 },
            { x: 28, y: 28 }
          ];
          const offset = Math.floor(frame / 6) % snakePos.length;
          for (let j = 0; j < 4; j++) {
            const seg = snakePos[(offset + j) % snakePos.length];
            ctx.fillRect(seg.x, seg.y, 3.5, 3.5);
          }
          // Apple
          ctx.fillStyle = '#ff0033';
          ctx.fillRect(36, 24, 3, 3);
        } else {
          // Pong: draw paddles and ball
          ctx.fillStyle = '#ffffff';
          const p1Y = 22 + Math.abs(Math.sin(frame * 0.08)) * 14;
          const p2Y = 22 + Math.cos(frame * 0.08) * 14;
          // Paddles
          ctx.fillRect(14, p1Y, 2, 7);
          ctx.fillRect(52, p2Y, 2, 7);
          // Ball
          const ballX = 16 + Math.abs(Math.sin(frame * 0.04)) * 34;
          const ballY = 25 + Math.sin(frame * 0.12) * 12;
          ctx.fillRect(ballX, ballY, 2, 2);
        }

        // CRT horizontal scanline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const scanY = 19 + ((frame * 0.4) % 27);
        ctx.moveTo(12, scanY);
        ctx.lineTo(56, scanY);
        ctx.stroke();

        // Control Panel deck (Joystick moves on hover)
        const joyOffset = hovered ? Math.sin(frame * 0.2) * 2.5 : 0;
        ctx.fillStyle = '#ef4444'; // Red joystick ball
        ctx.beginPath();
        ctx.arc(15 + joyOffset, 54, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(15 + joyOffset, 54); ctx.lineTo(15, 60);
        ctx.stroke();

        // Action buttons (blink when hovered)
        ctx.fillStyle = (hovered && frame % 10 < 5) ? '#00ff44' : '#fff200';
        ctx.beginPath();
        ctx.arc(32, 57, 2, 0, Math.PI * 2);
        ctx.arc(42, 57, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Floating space invader alien on right (dances and shoots)
        const alienY = height / 2 - 10 + Math.sin(frame * 0.04) * 22;
        ctx.fillStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = hovered ? 15 : 8;
        ctx.beginPath();
        // Draw detailed retro alien pixel grid silhouette
        const ax = width - 68;
        const ay = alienY;
        ctx.fillRect(ax + 3, ay, 9, 3);
        ctx.fillRect(ax, ay + 3, 15, 3);
        ctx.fillRect(ax, ay + 6, 15, 3);
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(ax + 3, ay + 3, 3, 3);
        ctx.fillRect(ax + 9, ay + 3, 3, 3);
        ctx.shadowBlur = 0;

        // Connecting shooting lasers on hover
        const laserBlink = hovered ? (frame % 20 < 12) : (frame % 40 < 10);
        if (laserBlink) {
          ctx.strokeStyle = '#ff0055';
          ctx.lineWidth = hovered ? 2.5 : 1.5;
          ctx.shadowBlur = hovered ? 12 : 5;
          ctx.shadowColor = '#ff0055';
          ctx.beginPath();
          ctx.moveTo(cabX + 60, cabY + 32);
          ctx.lineTo(ax, ay + 4);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // UNIVERSAL: Cybernetic Title Badge Overlay (Top Left)
      ctx.save();
      const pulse = Math.sin(frame * 0.05) * 0.12 + 0.88; // subtle pulse
      const glowAmount = hovered ? 18 : 8;
      const hoverScale = hovered ? 1.05 : 1.0;

      // Translate to top-left and scale slightly
      ctx.translate(14, 14);
      ctx.scale(hoverScale, hoverScale);

      // Glassmorphic translucent backing
      ctx.fillStyle = 'rgba(6, 2, 16, 0.78)';
      ctx.strokeStyle = hovered ? colorSecondary : colorPrimary;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = hovered ? colorSecondary : colorPrimary;
      ctx.shadowBlur = glowAmount * pulse;

      // Draw rounded rect pill for the game title
      ctx.beginPath();
      const titleText = (game.title || "PLAY GAME").toUpperCase();
      ctx.font = '900 11px "Outfit", "Inter", "Arial Black", sans-serif';
      const textW = ctx.measureText(titleText).width;
      ctx.roundRect(0, 0, textW + 16, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow glow for clean text render

      // Tech brackets at corners (sci-fi HUD theme)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      // Top-Left bracket
      ctx.beginPath();
      ctx.moveTo(3, 0); ctx.lineTo(0, 0); ctx.lineTo(0, 3);
      ctx.stroke();
      // Bottom-Right bracket
      ctx.beginPath();
      ctx.moveTo(textW + 13, 22); ctx.lineTo(textW + 16, 22); ctx.lineTo(textW + 16, 19);
      ctx.stroke();

      // Text inside the pill
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(titleText, 8, 11);
      ctx.restore();

      // Cinematic Vignette Overlay (Dark edges for high production value look)
      const vignette = ctx.createRadialGradient(width / 2, height / 2, width / 4, width / 2, height / 2, width / 1.3);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // Neon Highlight card border outline (pulses on hover)
      if (hovered) {
        ctx.strokeStyle = colorSecondary;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = colorSecondary;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        ctx.shadowBlur = 0;
      }

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
