// GameThumbnail.jsx - Procedural animated canvas headers for game cards
import React, { useEffect, useRef } from 'react';

export default function GameThumbnail({ game }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let frame = 0;

    // Set canvas dimensions
    const width = 300;
    const height = 96; // matches card header height (h-24)
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
    const colorSecondary = `hsl(${(baseHue + 50) % 360}, 100%, 50%)`;
    const colorGlow = `hsla(${baseHue}, 100%, 55%, 0.4)`;

    const speedMultiplier = 0.6 + (hashVal % 8) * 0.12;
    const waveFrequency = 0.025 + (hashVal % 6) * 0.008;

    // Particle pool for ambient dust
    const particles = [];
    const particleCount = 10 + (hashVal % 10);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.3 + Math.random() * 1.2,
        size: 0.8 + Math.random() * 1.8
      });
    }

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Draw background gradient matching card theme
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#060214');
      grad.addColorStop(1, '#110729');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient background particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      particles.forEach(p => {
        p.y += p.speed;
        if (p.y > height) {
          p.y = 0;
          p.x = Math.random() * width;
        }
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      // Specific games overrides
      let customDrawn = false;

      // 1. METRO SURFER
      if (game.id === "metro-surfer") {
        customDrawn = true;
        // Draw 3-lane tracks in perspective
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width / 2, 25);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(width / 2 - 15, 25);
        ctx.lineTo(0, height);
        ctx.moveTo(width / 2 + 15, 25);
        ctx.lineTo(width, height);
        ctx.stroke();

        // Moving trains in lanes
        const trainOffset = (frame * 1.8) % 150;
        ctx.fillStyle = colorPrimary;
        ctx.shadowBlur = 12;
        ctx.shadowColor = colorPrimary;
        // Draw a train on left lane
        const trainX = width / 2 - 25 - (trainOffset * 0.4);
        const trainY = 25 + (trainOffset * 0.4);
        const trainW = 10 + (trainOffset * 0.25);
        const trainH = 8 + (trainOffset * 0.15);
        if (trainY < height) {
          ctx.fillRect(trainX - trainW / 2, trainY - trainH, trainW, trainH);
          ctx.fillStyle = '#fff';
          ctx.fillRect(trainX - trainW / 3, trainY - trainH + 2, trainW * 0.6, 2); // windows
        }

        // Hoverboarder in center/right lane
        const surferY = height - 25 - Math.max(0, Math.sin(frame * 0.08) * 15);
        const surferX = width / 2 + 25 + Math.sin(frame * 0.03) * 15;
        // Board
        ctx.fillStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.fillRect(surferX - 6, surferY + 6, 12, 2);
        // Surfer body
        ctx.fillStyle = colorSecondary;
        ctx.shadowColor = colorSecondary;
        ctx.beginPath();
        ctx.arc(surferX, surferY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. TEMPLE ESCAPE
      else if (game.id === "temple-escape") {
        customDrawn = true;
        // Ancient zig-zag corridor in perspective
        ctx.strokeStyle = colorPrimary;
        ctx.shadowColor = colorPrimary;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(width / 2 - 10, 20);
        ctx.lineTo(width / 2 + 10, 20);
        ctx.lineTo(width / 2 + 35, 45);
        ctx.lineTo(width / 2 - 5, 45);
        ctx.lineTo(width / 2 - 40, height);
        ctx.lineTo(width / 2 + 10, height);
        ctx.stroke();

        // Runner fleeing
        const runnerX = width / 2 - 15 + Math.sin(frame * 0.05) * 10;
        const runnerY = height - 20 - Math.abs(Math.sin(frame * 0.15)) * 6;
        ctx.fillStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.beginPath();
        ctx.arc(runnerX, runnerY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Big scary red eyes chasing from behind
        const monsterY = height - 55 + Math.sin(frame * 0.05) * 5;
        ctx.fillStyle = '#ff003c';
        ctx.shadowColor = '#ff003c';
        ctx.beginPath();
        ctx.arc(width / 2 - 30, monsterY, 3, 0, Math.PI * 2);
        ctx.arc(width / 2 - 10, monsterY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. NEON RIDER
      else if (game.id === "neon-rider") {
        customDrawn = true;
        // Sunset and racing grid
        const cy = 35;
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(width / 2, cy, 18, Math.PI, 0);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let i = -4; i <= 4; i++) {
          ctx.beginPath();
          ctx.moveTo(width / 2 + i * 8, cy);
          ctx.lineTo(width / 2 + i * 60, height);
          ctx.stroke();
        }

        // Horizontal lines scrolling
        const offset = (frame * 1.5) % 15;
        ctx.strokeStyle = colorSecondary;
        for (let y = cy; y < height; y += 12) {
          const dy = y + offset;
          if (dy < height) {
            ctx.beginPath();
            const r = (dy - cy) / (height - cy);
            ctx.moveTo(width/2 - 120 * r, dy);
            ctx.lineTo(width/2 + 120 * r, dy);
            ctx.stroke();
          }
        }

        // Cyber car
        const carX = width / 2 + Math.sin(frame * 0.04) * 35;
        const carY = height - 22;
        ctx.fillStyle = colorPrimary;
        ctx.fillRect(carX - 10, carY, 20, 8);
        ctx.fillStyle = '#fff';
        ctx.fillRect(carX - 7, carY + 2, 14, 2); // windshield
        ctx.fillStyle = '#ff0000'; // brake lights
        ctx.fillRect(carX - 9, carY + 6, 3, 2);
        ctx.fillRect(carX + 6, carY + 6, 3, 2);
      }

      // 4. TURBO MOTO / HIGHWAY MOTO
      else if (game.id === "turbo-moto" || game.id === "highway-moto") {
        customDrawn = true;
        // Fast highway
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height - 35);
        ctx.lineTo(width, height - 35);
        ctx.stroke();

        // Grid stripes
        ctx.strokeStyle = colorPrimary;
        const stripeOffset = (frame * 6) % 40;
        ctx.beginPath();
        for (let x = width; x >= -40; x -= 40) {
          ctx.moveTo(x + stripeOffset, height - 35);
          ctx.lineTo(x + stripeOffset - 15, height);
        }
        ctx.stroke();

        // Cyber bike wheelie
        const bikeX = 70;
        const bikeY = height - 25 + Math.sin(frame * 0.1) * 2;
        ctx.save();
        ctx.translate(bikeX, bikeY);
        ctx.rotate(-0.15); // Wheelie lift
        ctx.fillStyle = colorSecondary;
        ctx.fillRect(-12, -4, 24, 6); // body
        // Wheels
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-10, 2, 4, 0, Math.PI * 2); // rear wheel
        ctx.arc(10, 0, 4, 0, Math.PI * 2); // front wheel
        ctx.stroke();
        // Thruster sparks
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(-18, -2, 4, 2);
        ctx.restore();
      }

      // 5. CHESS ROYALE / CHECKERS GLOW / REVERSI
      else if (game.id === "chess-royale" || game.id === "checkers-glow" || game.id === "reversi") {
        customDrawn = true;
        // Chessboard grid perspective
        const cy = 20;
        ctx.strokeStyle = 'rgba(157, 78, 221, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 8; i++) {
          // grid vertical lines
          ctx.beginPath();
          ctx.moveTo(width / 2 - 50 + i * 12.5, cy);
          ctx.lineTo(width / 2 - 100 + i * 25, height);
          ctx.stroke();
        }
        for (let i = 0; i <= 6; i++) {
          const dy = cy + (i / 6) * (height - cy);
          ctx.beginPath();
          ctx.moveTo(width/2 - 50 - i * 8, dy);
          ctx.lineTo(width/2 + 50 + i * 8, dy);
          ctx.stroke();
        }

        // Two glowing chess pieces battling
        const px1 = width / 2 - 25;
        const px2 = width / 2 + 25;
        const py = height - 28;

        // Piece 1 (Rook/Pawn)
        ctx.fillStyle = colorPrimary;
        ctx.shadowColor = colorPrimary;
        ctx.shadowBlur = 10;
        ctx.fillRect(px1 - 6, py - 12, 12, 16);
        ctx.fillRect(px1 - 8, py + 2, 16, 4);

        // Piece 2 (King/Knight)
        ctx.fillStyle = colorSecondary;
        ctx.shadowColor = colorSecondary;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(px2, py - 14);
        ctx.lineTo(px2 - 7, py + 4);
        ctx.lineTo(px2 + 7, py + 4);
        ctx.closePath();
        ctx.fill();

        // Laser connection/beam
        if (frame % 30 < 15) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px1, py - 4);
          ctx.lineTo(px2, py - 4);
          ctx.stroke();
        }
      }

      // 6. CARROM CLASH
      else if (game.id === "carrom-clash") {
        customDrawn = true;
        // Round carrom board pocket
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width - 25, 25, 12, 0, Math.PI * 2);
        ctx.stroke();

        // Center circle pattern
        ctx.strokeStyle = colorPrimary;
        ctx.beginPath();
        ctx.arc(50, height - 20, 25, 0, Math.PI * 2);
        ctx.stroke();

        // Moving pucks
        const strikeOffset = (frame * 1.5) % 90;
        const ballX = 50 + strikeOffset;
        const ballY = (height - 20) - (strikeOffset * 0.3);

        // Target pucks at collision point
        const colX = 110;
        const colY = (height - 20) - (60 * 0.3);

        ctx.fillStyle = colorSecondary;
        ctx.shadowColor = colorSecondary;
        ctx.shadowBlur = 8;
        
        if (strikeOffset < 60) {
          // Striker moving towards pucks
          ctx.beginPath();
          ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
          ctx.fill();

          // Stationary pucks clustered
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(colX, colY, 5, 0, Math.PI * 2);
          ctx.arc(colX + 8, colY - 5, 5, 0, Math.PI * 2);
          ctx.arc(colX + 5, colY + 8, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // After collision - striker stops, pucks scatter
          ctx.beginPath();
          ctx.arc(colX, colY, 8, 0, Math.PI * 2);
          ctx.fill();

          const scatter = strikeOffset - 60;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(colX + 8 + scatter * 0.8, colY - 5 - scatter * 0.5, 5, 0, Math.PI * 2);
          ctx.arc(colX + 5 - scatter * 0.3, colY + 8 + scatter * 0.7, 5, 0, Math.PI * 2);
          ctx.arc(colX - 12 - scatter * 0.5, colY - scatter * 0.2, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. TYPING / WORD CATEGORY
      else if (game.category === "Typing & Word") {
        customDrawn = true;
        // Binary rain / letter grid background
        ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
        ctx.font = '10px Courier New';
        const cols = ["N", "E", "O", "N", "T", "Y", "P", "E", "S", "T", "O", "R", "M"];
        for (let i = 0; i < 6; i++) {
          const char = cols[(i + Math.floor(frame / 30)) % cols.length];
          const rx = 30 + i * 50;
          const ry = 25 + ((frame * (1 + i % 2)) % (height - 30));
          ctx.fillText(char, rx, ry);
        }

        if (game.id === "type-storm") {
          // Laser battery shooting up lightning
          ctx.strokeStyle = colorPrimary;
          ctx.shadowColor = colorPrimary;
          ctx.shadowBlur = 12;
          ctx.lineWidth = 2.5;

          const cx = width / 2;
          ctx.fillStyle = '#1e1145';
          ctx.fillRect(cx - 15, height - 12, 30, 12);

          // Sparking laser
          if (frame % 20 < 6) {
            ctx.beginPath();
            ctx.moveTo(cx, height - 12);
            let lx = cx;
            let ly = height - 12;
            while (ly > 15) {
              ly -= 10;
              lx += (Math.random() - 0.5) * 15;
              ctx.lineTo(lx, ly);
            }
            ctx.stroke();

            // Word explosion at top
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(lx, ly, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (game.id === "word-invaders") {
          // Alien invaders labels
          const ax = width / 2 + Math.sin(frame * 0.03) * 40;
          ctx.fillStyle = colorSecondary;
          ctx.font = 'bold 9px sans-serif';
          ctx.shadowColor = colorSecondary;
          ctx.shadowBlur = 8;
          ctx.fillText("WORD", ax - 25, 25);
          ctx.fillText("SHIP", ax + 25, 35);

          // Space defender ship below
          ctx.fillStyle = '#39ff14';
          ctx.fillRect(width / 2 - 8, height - 16, 16, 8);
          
          if (frame % 25 < 5) {
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(width / 2, height - 16);
            ctx.lineTo(width / 2, 30);
            ctx.stroke();
          }
        } else {
          // General typing/word games: render linking letter bubbles
          ctx.strokeStyle = colorPrimary;
          ctx.lineWidth = 1.5;
          const cx1 = width / 2 - 30;
          const cx2 = width / 2 + 30;
          const cy1 = height / 2;
          ctx.beginPath();
          ctx.arc(cx1, cy1, 12, 0, Math.PI * 2);
          ctx.arc(cx2, cy1, 12, 0, Math.PI * 2);
          ctx.stroke();

          // Link line
          ctx.beginPath();
          ctx.moveTo(cx1 + 12, cy1);
          ctx.lineTo(cx2 - 12, cy1);
          ctx.stroke();

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText("A", cx1, cy1);
          ctx.fillText("B", cx2, cy1);
          ctx.textAlign = 'left'; // reset
        }
      }

      // 8. CONNECT 4
      else if (game.id === "connect-4") {
        customDrawn = true;
        // Connect 4 vertical grid layout
        const gx = width / 2 - 35;
        const gy = 12;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(gx, gy, 70, 70);
        
        ctx.strokeStyle = colorPrimary;
        ctx.lineWidth = 2;
        ctx.strokeRect(gx, gy, 70, 70);

        // Drop chips
        for (let col = 0; col < 5; col++) {
          for (let row = 0; row < 5; row++) {
            const cx = gx + 7 + col * 14;
            const cy = gy + 7 + row * 14;
            
            // Draw empty grid slot
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.stroke();

            // Some filled chips
            const fillHash = (col * 3 + row * 7) % 5;
            if (fillHash === 1) {
              ctx.fillStyle = '#ff0055';
              ctx.beginPath();
              ctx.arc(cx, cy, 4, 0, Math.PI * 2);
              ctx.fill();
            } else if (fillHash === 2) {
              ctx.fillStyle = '#fffb00';
              ctx.beginPath();
              ctx.arc(cx, cy, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 9. TIC-TAC-TOE
      else if (game.id === "tic-tac-toe" || game.id === "tic-tac-toe-neon") {
        customDrawn = true;
        // 3x3 grid
        const gx = width / 2 - 25;
        const gy = height / 2 - 25;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(gx + 16, gy); ctx.lineTo(gx + 16, gy + 48);
        ctx.moveTo(gx + 32, gy); ctx.lineTo(gx + 32, gy + 48);
        ctx.moveTo(gx, gy + 16); ctx.lineTo(gx + 48, gy + 16);
        ctx.moveTo(gx, gy + 32); ctx.lineTo(gx + 48, gy + 32);
        ctx.stroke();

        // Neon symbols
        ctx.lineWidth = 2;
        // Draw X
        ctx.strokeStyle = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(gx + 4, gy + 4); ctx.lineTo(gx + 12, gy + 12);
        ctx.moveTo(gx + 12, gy + 4); ctx.lineTo(gx + 4, gy + 12);
        ctx.stroke();

        // Draw O
        ctx.strokeStyle = '#ff007f';
        ctx.beginPath();
        ctx.arc(gx + 24, gy + 24, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Draw X
        ctx.strokeStyle = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(gx + 36, gy + 36); ctx.lineTo(gx + 44, gy + 44);
        ctx.moveTo(gx + 44, gy + 36); ctx.lineTo(gx + 36, gy + 44);
        ctx.stroke();

        // Win Line crossing diagonally
        if (frame % 40 < 25) {
          ctx.strokeStyle = '#39ff14';
          ctx.shadowColor = '#39ff14';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + 48, gy + 48);
          ctx.stroke();
        }
      }

      // 10. SNAKE NEON
      else if (game.id === "snake-neon") {
        customDrawn = true;
        // Draw green grid boundaries
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.08)';
        ctx.strokeRect(20, 10, width - 40, height - 20);

        // Snake blocks path
        const pts = [
          {x: 40, y: 30},
          {x: 55, y: 30},
          {x: 55, y: 50},
          {x: 75, y: 50},
          {x: 75, y: Math.min(height - 20, 50 + (frame % 30) * 0.8)}
        ];

        ctx.strokeStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // Draw glowing fruit
        ctx.fillStyle = '#ff003c';
        ctx.shadowColor = '#ff003c';
        ctx.beginPath();
        ctx.arc(width - 50, height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 11. BREAKOUT GLOW
      else if (game.id === "breakout-glow") {
        customDrawn = true;
        // Bricks at top
        const brickW = 20;
        const brickH = 6;
        const colors = ['#ff0055', '#00f0ff', '#39ff14', '#fffb00'];
        for (let row = 0; row < 3; row++) {
          ctx.fillStyle = colors[row];
          ctx.shadowColor = colors[row];
          ctx.shadowBlur = 6;
          for (let col = 0; col < 10; col++) {
            if ((col + row) % 3 !== 0) {
              ctx.fillRect(25 + col * 25, 12 + row * 8, brickW, brickH);
            }
          }
        }

        // Bouncing ball
        const bx = width / 2 + Math.sin(frame * 0.05) * 60;
        const by = height - 25 - Math.abs(Math.sin(frame * 0.09)) * 30;
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Paddle moving at bottom
        const px = width / 2 + Math.sin(frame * 0.05) * 50;
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.fillRect(px - 15, height - 12, 30, 4);
      }

      // 12. CYBER PONG / PING PONG
      else if (game.id === "cyber-pong" || game.id === "ping-pong" || game.id === "table-tennis") {
        customDrawn = true;
        // Dotted net in middle
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Left paddle
        const p1y = height / 2 - 12 + Math.sin(frame * 0.06) * 15;
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(15, p1y, 4, 24);

        // Right paddle
        const p2y = height / 2 - 12 + Math.cos(frame * 0.06) * 15;
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.fillRect(width - 19, p2y, 4, 24);

        // Ball bouncing
        const ballX = width / 2 + Math.sin(frame * 0.06) * (width / 2 - 35);
        const ballY = height / 2 + Math.cos(frame * 0.12) * 20;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ballX, ballY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 13. SPACE DEFENDER
      else if (game.id === "space-defender") {
        customDrawn = true;
        // Space Defender Ship at bottom
        const shipX = width / 2 + Math.sin(frame * 0.04) * 40;
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(shipX, height - 20);
        ctx.lineTo(shipX - 10, height - 8);
        ctx.lineTo(shipX + 10, height - 8);
        ctx.closePath();
        ctx.fill();

        // Twin lasers shooting up
        if (frame % 20 < 7) {
          ctx.strokeStyle = '#ff0055';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(shipX - 5, height - 20); ctx.lineTo(shipX - 5, 15);
          ctx.moveTo(shipX + 5, height - 20); ctx.lineTo(shipX + 5, 15);
          ctx.stroke();
        }

        // Space Invaders at top
        const ix = width / 2 + Math.sin(frame * 0.02) * 20;
        ctx.fillStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(ix - 45 + i * 25, 15 + Math.sin(frame * 0.05 + i) * 3, 10, 8);
        }
      }

      // 14. FLAPPY NEON
      else if (game.id === "flappy-neon") {
        customDrawn = true;
        // Pipe obstacles moving left
        const pipeX1 = (width - (frame * 1.5) % (width + 40));
        const pipeX2 = (width - (frame * 1.5 + 160) % (width + 40));

        ctx.fillStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 8;
        
        // Draw pipe pair 1
        ctx.fillRect(pipeX1, 0, 15, 30);
        ctx.fillRect(pipeX1, 60, 15, height - 60);

        // Draw pipe pair 2
        ctx.fillRect(pipeX2, 0, 15, 42);
        ctx.fillRect(pipeX2, 72, 15, height - 72);

        // Flappy bird
        const birdY = height / 2 + Math.sin(frame * 0.1) * 12;
        ctx.fillStyle = '#fffb00';
        ctx.shadowColor = '#fffb00';
        ctx.beginPath();
        ctx.arc(45, birdY, 5, 0, Math.PI * 2);
        ctx.fill();
        // Little wing flapping
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(38, birdY - (frame % 15 < 7 ? 4 : 0), 4, 3);
      }

      // 15. FRUIT SLASHER
      else if (game.id === "fruit-slasher") {
        customDrawn = true;
        // Floating fruit
        const fx = width / 2;
        const fy = height / 2 + Math.sin(frame * 0.04) * 8;

        // Blade slash line crossing center
        if (frame % 40 > 12 && frame % 40 < 18) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fff';
          ctx.beginPath();
          ctx.moveTo(fx - 40, fy + 20);
          ctx.lineTo(fx + 40, fy - 20);
          ctx.stroke();
        }

        ctx.shadowBlur = 10;
        if (frame % 80 < 40) {
          // Intact watermelon circle
          ctx.fillStyle = '#39ff14';
          ctx.shadowColor = '#39ff14';
          ctx.beginPath();
          ctx.arc(fx, fy, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ff0055';
          ctx.beginPath();
          ctx.arc(fx, fy, 8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Slashed fruit halves flying apart
          const split = (frame % 80 - 40) * 0.8;
          ctx.fillStyle = '#39ff14';
          ctx.shadowColor = '#39ff14';
          ctx.beginPath();
          ctx.arc(fx - split, fy - split * 0.5, 10, Math.PI * 0.75, Math.PI * 1.75);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(fx + split, fy + split * 0.5, 10, Math.PI * 1.75, Math.PI * 0.75);
          ctx.fill();
        }
      }

      // 16. PACMAN
      else if (game.id === "pacman") {
        customDrawn = true;
        // Maze walls
        ctx.strokeStyle = '#0055ff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(20, 10, width - 40, height - 20);
        ctx.beginPath();
        ctx.moveTo(width / 2 - 30, height / 2);
        ctx.lineTo(width / 2 + 30, height / 2);
        ctx.stroke();

        // Pacman swallowing dots
        const px = 40 + (frame * 1.2) % (width - 80);
        ctx.fillStyle = '#fffb00';
        ctx.shadowColor = '#fffb00';
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        const mouthAngle = 0.2 + Math.abs(Math.sin(frame * 0.2)) * 0.35;
        ctx.arc(px, height / 2, 7, mouthAngle, Math.PI * 2 - mouthAngle);
        ctx.lineTo(px, height / 2);
        ctx.closePath();
        ctx.fill();

        // Ghost chasing pacman
        const gx = px - 25;
        if (gx > 20) {
          ctx.fillStyle = '#ff0033';
          ctx.shadowColor = '#ff0033';
          ctx.beginPath();
          ctx.arc(gx, height / 2 - 2, 6, Math.PI, 0);
          ctx.lineTo(gx + 6, height / 2 + 5);
          ctx.lineTo(gx - 6, height / 2 + 5);
          ctx.closePath();
          ctx.fill();
        }
      }

      // 17. BUBBLE SHOOTER
      else if (game.id === "bubble-shooter") {
        customDrawn = true;
        // Packed bubble clusters at top
        const colors = ['#ff0055', '#00f0ff', '#39ff14', '#fffb00', '#9d4edd'];
        for (let col = 0; col < 8; col++) {
          const bx = 30 + col * 32;
          ctx.fillStyle = colors[col % colors.length];
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(bx, 15, 6, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = colors[(col + 2) % colors.length];
          ctx.beginPath();
          ctx.arc(bx + 16, 25, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Firing arrow/bubble
        const fireOffset = (frame * 1.8) % 110;
        const bby = height - 12 - (fireOffset * 0.6);
        const bbx = width / 2 + (Math.sin(frame * 0.01) * 30 * (1 - fireOffset / 110));

        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(bbx, bby, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 18. TOWER BUILDER / STACK JUMP
      else if (game.id === "tower-builder" || game.id === "stack-jump") {
        customDrawn = true;
        // Tower blocks stacked in middle
        const bx = width / 2;
        const blockW = 28;
        const blockH = 10;
        const sway = Math.sin(frame * 0.05) * 3;

        ctx.lineWidth = 1.5;
        // Draw 3 layers of tower
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = colorPrimary;
          ctx.shadowColor = colorPrimary;
          ctx.shadowBlur = 8;
          ctx.fillRect(bx - blockW / 2 + (i * sway * 0.4), height - 12 - i * 11, blockW, blockH);
          ctx.strokeStyle = '#fff';
          ctx.strokeRect(bx - blockW / 2 + (i * sway * 0.4), height - 12 - i * 11, blockW, blockH);
        }

        if (game.id === "tower-builder") {
          // Swinging crane rope with block
          const cx = width / 2 + Math.sin(frame * 0.06) * 45;
          ctx.strokeStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(width / 2, 0);
          ctx.lineTo(cx, 25);
          ctx.stroke();

          ctx.fillStyle = colorSecondary;
          ctx.shadowColor = colorSecondary;
          ctx.fillRect(cx - blockW / 2, 25, blockW, blockH);
        }
      }

      // 19. BILLIARDS
      else if (game.id === "billiards" || game.id === "billiards-8ball") {
        customDrawn = true;
        // Draw table corners
        ctx.fillStyle = '#065f46';
        ctx.fillRect(15, 10, width - 30, height - 20);
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 3;
        ctx.strokeRect(15, 10, width - 30, height - 20);

        // Cue stick aiming
        const stickAngle = 0.2 + Math.sin(frame * 0.03) * 0.15;
        ctx.save();
        ctx.translate(width / 2 - 25, height / 2 + 10);
        ctx.rotate(stickAngle);
        ctx.fillStyle = '#b45309'; // wood
        ctx.fillRect(-45, -2, 40, 4);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-5, -2, 5, 4);
        ctx.restore();

        // White Cue Ball and 8-ball colliding
        const collision = (frame * 1.5) % 120;
        const ball1x = width / 2 - 20 + Math.min(25, collision);
        const ball1y = height / 2 + 5 - Math.min(6, collision * 0.24);

        ctx.shadowBlur = 8;
        // White ball
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball1x, ball1y, 5, 0, Math.PI * 2);
        ctx.fill();

        // 8 ball
        const b2x = width / 2 + 10 + (collision > 25 ? (collision - 25) * 0.8 : 0);
        const b2y = height / 2 + (collision > 25 ? (collision - 25) * 0.2 : 0);
        ctx.fillStyle = '#111827'; // black
        ctx.shadowColor = '#111827';
        ctx.beginPath();
        ctx.arc(b2x, b2y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 20. GOLF
      else if (game.id === "golf" || game.id === "golf-master") {
        customDrawn = true;
        // Green hills layout
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.quadraticCurveTo(width / 3, height - 30, width * 0.6, height - 12);
        ctx.quadraticCurveTo(width * 0.8, height - 2, width, height - 18);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Flag pin
        const flagX = width * 0.7;
        const flagY = height - 15;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(flagX, flagY);
        ctx.lineTo(flagX, flagY - 32);
        ctx.stroke();

        // Flag triangle
        ctx.fillStyle = '#ff003c';
        ctx.beginPath();
        ctx.moveTo(flagX, flagY - 32);
        ctx.lineTo(flagX - 12, flagY - 26);
        ctx.lineTo(flagX, flagY - 20);
        ctx.closePath();
        ctx.fill();

        // Rolling golf ball
        const ballX = 30 + (frame * 1.2) % (flagX - 35);
        const ballY = (height - 2) - Math.abs(Math.sin(frame * 0.08)) * 3;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ballX, ballY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 21. ARCHERY
      else if (game.id === "archery" || game.id === "archery-hero") {
        customDrawn = true;
        // Archery target board centered on right
        const tx = width - 45;
        const ty = height / 2;
        const rings = [18, 14, 10, 6];
        const colors = ['#fff', '#00f0ff', '#ff003c', '#fffb00'];
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = colors[i];
          ctx.beginPath();
          ctx.arc(tx, ty, rings[i], 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1e1b4b';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Flying Arrow entering from left
        const arrowOffset = (frame * 3.5) % 160;
        const ax = Math.min(tx - 2, 10 + arrowOffset);
        const ay = ty + Math.sin(frame * 0.05) * 2 * (ax < tx - 10 ? 1 : 0);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ax - 20, ay);
        ctx.lineTo(ax, ay);
        ctx.stroke();

        // Arrow fletching
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(ax - 20, ay - 3);
        ctx.lineTo(ax - 25, ay - 5);
        ctx.lineTo(ax - 25, ay + 5);
        ctx.lineTo(ax - 20, ay + 3);
        ctx.fill();
      }

      // 22. SOCCER
      else if (game.id === "soccer" || game.id === "penalty-shootout") {
        customDrawn = true;
        // Soccer net crossbar
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 3.5;
        const nx = width / 2;
        const ny = 12;
        ctx.strokeRect(nx - 45, ny, 90, height - 12);

        // Goalie gloves moving
        const gx = nx + Math.sin(frame * 0.08) * 35;
        const gy = ny + 20 + Math.cos(frame * 0.04) * 8;
        ctx.fillStyle = colorPrimary;
        ctx.fillRect(gx - 10, gy - 4, 8, 8);
        ctx.fillRect(gx + 2, gy - 4, 8, 8);

        // Ball flying towards top corner
        const shot = (frame * 2.2) % 100;
        const ballX = nx - 35 + (shot * 0.5);
        const ballY = height - 10 - (shot * 0.65);
        
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 23. BOWLING
      else if (game.id === "bowling" || game.id === "bowling-alley") {
        customDrawn = true;
        // Lane outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 15, 0); ctx.lineTo(width / 2 - 45, height);
        ctx.moveTo(width / 2 + 15, 0); ctx.lineTo(width / 2 + 45, height);
        ctx.stroke();

        // Pins standing at the end
        const px = width / 2;
        const py = 20;

        const pinCollision = (frame * 1.5) % 120;
        ctx.shadowBlur = 6;
        if (pinCollision < 45) {
          ctx.fillStyle = '#fff';
          ctx.shadowColor = '#fff';
          // Draw triangle of pins
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.arc(px - 6, py - 4, 2.5, 0, Math.PI * 2);
          ctx.arc(px + 6, py - 4, 2.5, 0, Math.PI * 2);
          ctx.arc(px - 12, py - 8, 2.5, 0, Math.PI * 2);
          ctx.arc(px, py - 8, 2.5, 0, Math.PI * 2);
          ctx.arc(px + 12, py - 8, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Ball rolling up
          ctx.fillStyle = colorPrimary;
          ctx.shadowColor = colorPrimary;
          ctx.beginPath();
          ctx.arc(px - 10 + pinCollision * 0.22, height - 12 - pinCollision * 1.4, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Pins flying apart
          const dist = (pinCollision - 45) * 1.2;
          ctx.fillStyle = '#fff';
          ctx.shadowColor = '#fff';
          ctx.beginPath();
          ctx.arc(px - dist * 0.4, py - dist * 0.2, 2.5, 0, Math.PI * 2);
          ctx.arc(px + dist * 0.5, py - dist * 0.3, 2.5, 0, Math.PI * 2);
          ctx.arc(px - 6 - dist * 0.8, py - 4 - dist * 0.5, 2.5, 0, Math.PI * 2);
          ctx.arc(px + 6 + dist * 0.7, py - 4 + dist * 0.1, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Ball continues rolling
          ctx.fillStyle = colorPrimary;
          ctx.beginPath();
          ctx.arc(px, py - 10 - (pinCollision - 45) * 0.3, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 24. SUDOKU / MINESWEEPER / BLOCK PUZZLE
      else if (game.id === "sudoku" || game.id === "minesweeper" || game.id === "block-puzzle") {
        customDrawn = true;
        // Grid boxes
        const gx = width / 2 - 24;
        const gy = height / 2 - 24;
        ctx.strokeStyle = colorPrimary;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
          ctx.beginPath();
          ctx.moveTo(gx + i * 12, gy); ctx.lineTo(gx + i * 12, gy + 48);
          ctx.moveTo(gx, gy + i * 12); ctx.lineTo(gx + 48, gy + i * 12);
          ctx.stroke();
        }

        if (game.id === "minesweeper") {
          // Draw a small red flag and a black bomb
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(gx + 16, gy + 14);
          ctx.lineTo(gx + 22, gy + 17);
          ctx.lineTo(gx + 16, gy + 20);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(gx + 16, gy + 14);
          ctx.lineTo(gx + 16, gy + 28);
          ctx.stroke();
        } else if (game.id === "sudoku") {
          // Draw numbers
          ctx.fillStyle = '#39ff14';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText("5", gx + 4, gy + 10);
          ctx.fillText("9", gx + 16, gy + 22);
          ctx.fillText("3", gx + 40, gy + 34);
          ctx.fillText("1", gx + 28, gy + 46);
        } else {
          // Block puzzle shapes dropping
          ctx.fillStyle = colorSecondary;
          ctx.fillRect(gx + 2, gy + 2, 20, 20);
          ctx.fillStyle = colorPrimary;
          ctx.fillRect(gx + 26, gy + 14, 20, 10);
        }
      }

      // 25. LUDO
      else if (game.id === "ludo") {
        customDrawn = true;
        const gx = width / 2 - 25;
        const gy = height / 2 - 25;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeRect(gx, gy, 50, 50);

        // Ludo quadrants
        ctx.fillStyle = '#ef4444'; ctx.fillRect(gx, gy, 20, 20);
        ctx.fillStyle = '#3b82f6'; ctx.fillRect(gx + 30, gy, 20, 20);
        ctx.fillStyle = '#10b981'; ctx.fillRect(gx, gy + 30, 20, 20);
        ctx.fillStyle = '#eab308'; ctx.fillRect(gx + 30, gy + 30, 20, 20);

        // A bouncing dice in center
        const diceY = height / 2 + Math.sin(frame * 0.1) * 6;
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 8;
        ctx.fillRect(width / 2 - 5, diceY - 5, 10, 10);
        ctx.fillStyle = '#000';
        ctx.fillRect(width / 2 - 2, diceY - 2, 4, 4); // dice dot
      }

      // ============ 26. GENERAL PROCEDURAL FALLBACKS (30+ Games) ============
      if (!customDrawn) {
        // RACING & DRIVING
        if (game.category === "Racing & Driving") {
          const cy = 20 + (hashVal % 15);
          ctx.strokeStyle = `hsla(${baseHue}, 100%, 55%, 0.15)`;
          ctx.lineWidth = 1;
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(width / 2 + i * 10, cy);
            ctx.lineTo(width / 2 + i * 70, height);
            ctx.stroke();
          }
          // Horizontal scrolling lines
          ctx.strokeStyle = colorPrimary;
          const offset = (frame * speedMultiplier) % 16;
          for (let y = cy; y < height; y += 12) {
            const dy = y + offset;
            if (dy < height) {
              const r = (dy - cy) / (height - cy);
              ctx.beginPath();
              ctx.moveTo(width / 2 - 100 * r, dy);
              ctx.lineTo(width / 2 + 100 * r, dy);
              ctx.stroke();
            }
          }
          // Drawing floating obstacles
          const obsX = width / 2 + Math.sin(frame * waveFrequency) * 35;
          const obsY = height - 25;
          ctx.fillStyle = colorSecondary;
          ctx.fillRect(obsX - 5, obsY, 10, 6);
        }
        
        // ACTION & RUNNER
        else if (game.category === "Action & Runner") {
          // Scrolling terrain waves
          ctx.fillStyle = `hsla(${baseHue}, 100%, 55%, 0.1)`;
          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 10) {
            const y = height - 20 + Math.sin(x * waveFrequency + frame * 0.05) * 10;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fill();

          // Obstacles passing
          const obsX = width - ((frame * 2.2 * speedMultiplier) % (width + 40));
          ctx.fillStyle = colorPrimary;
          ctx.fillRect(obsX, height - 25, 12, 12);

          // Player avatar jumping
          const avY = height - 25 - Math.max(0, Math.sin(frame * 0.08) * 20);
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(50, avY, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // BOARD & STRATEGY
        else if (game.category === "Board & Strategy") {
          // Glowing grid pattern
          ctx.strokeStyle = `hsla(${baseHue}, 100%, 55%, 0.1)`;
          ctx.lineWidth = 1;
          const gSize = 20 + (hashVal % 10);
          for (let x = 0; x < width; x += gSize) {
            for (let y = 0; y < height; y += gSize) {
              ctx.strokeRect(x, y, gSize, gSize);
            }
          }

          // Glowing central shape rotating
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.rotate(frame * 0.015 * speedMultiplier);
          ctx.fillStyle = colorPrimary;
          ctx.shadowBlur = 12;
          ctx.shadowColor = colorPrimary;
          
          if (hashVal % 2 === 0) {
            ctx.fillRect(-8, -8, 16, 16);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // TYPING & WORD
        else if (game.category === "Typing & Word") {
          // Matrix code rain falling
          ctx.fillStyle = `hsla(${baseHue}, 100%, 55%, 0.6)`;
          ctx.font = '9px monospace';
          const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          for (let i = 0; i < 8; i++) {
            const char = letters[(hashVal + i + Math.floor(frame / 20)) % letters.length];
            const rx = 20 + i * 35;
            const ry = 15 + ((frame * 1.2 * speedMultiplier + i * 20) % (height - 25));
            ctx.fillText(char, rx, ry);
          }
        }

        // SPORTS & ARCADE (AND DEFAULT)
        else {
          // Concentric pulsing rings
          const cx = width / 2;
          const cy = height / 2;
          ctx.strokeStyle = `hsla(${baseHue}, 100%, 55%, 0.2)`;
          ctx.lineWidth = 1.5;
          for (let r = 10; r <= 50; r += 15) {
            const dr = r + (frame * 0.3) % 15;
            ctx.beginPath();
            ctx.arc(cx, cy, dr, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Bouncing neon circles inside
          const bx = cx + Math.sin(frame * waveFrequency) * 40;
          const by = cy + Math.cos(frame * waveFrequency * 1.5) * 20;
          ctx.fillStyle = colorPrimary;
          ctx.shadowBlur = 10;
          ctx.shadowColor = colorPrimary;
          ctx.beginPath();
          ctx.arc(bx, by, 6, 0, Math.PI * 2);
          ctx.fill();
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
      style={{ opacity: 0.95 }} // Bumped opacity slightly for richer pop!
    />
  );
}
