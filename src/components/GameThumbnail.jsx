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

    // Color definitions
    const isPink = game.color.includes('pink') || game.color.includes('rose');
    const isGreen = game.color.includes('green') || game.color.includes('emerald') || game.color.includes('lime');
    const isYellow = game.color.includes('yellow') || game.color.includes('amber');
    const isPurple = game.color.includes('purple') || game.color.includes('violet') || game.color.includes('indigo');
    const colorPrimary = isPink ? '#ff007f' : isGreen ? '#39ff14' : isYellow ? '#fff200' : isPurple ? '#9d4edd' : '#00f0ff';
    const colorSecondary = isPink ? '#f43f5e' : isGreen ? '#10b981' : isYellow ? '#f59e0b' : isPurple ? '#6366f1' : '#3b82f6';

    // Particle pool for animations
    const particles = [];
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.5 + Math.random() * 1.5,
        size: 1 + Math.random() * 2
      });
    }

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Draw background gradient matching card theme
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#060212');
      grad.addColorStop(1, '#13092b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient background particles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      particles.forEach(p => {
        p.y += p.speed;
        if (p.y > height) {
          p.y = 0;
          p.x = Math.random() * width;
        }
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      ctx.shadowBlur = 10;
      ctx.shadowColor = colorPrimary;

      // ============ 1. RACING / DRIVING SCENE ============
      if (game.category === "Racing & Driving") {
        // Perspective road grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        const horizonY = 30;
        const cx = width / 2;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * 12, horizonY);
          ctx.lineTo(cx + i * 80, height);
          ctx.stroke();
        }

        // Horizontal scrolling stripes
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1.5;
        const offset = (frame * 1.5) % 15;
        for (let y = horizonY; y < height; y += 15) {
          const dy = y + offset;
          if (dy < height) {
            ctx.beginPath();
            const ratio = (dy - horizonY) / (height - horizonY);
            ctx.moveTo(cx - 100 * ratio, dy);
            ctx.lineTo(cx + 100 * ratio, dy);
            ctx.stroke();
          }
        }

        // Wireframe Sunset
        ctx.fillStyle = colorPrimary;
        ctx.beginPath();
        ctx.arc(cx, horizonY, 15, Math.PI, 0);
        ctx.fill();

        // Player micro-car sliding
        const carX = cx + Math.sin(frame * 0.04) * 25;
        const carY = height - 25;
        ctx.fillStyle = colorPrimary;
        ctx.fillRect(carX - 8, carY, 16, 10);
        ctx.fillStyle = '#fff';
        ctx.fillRect(carX - 5, carY + 2, 10, 4); // wind shield
      }

      // ============ 2. ACTION / RUNNER SCENE ============
      else if (game.category === "Action & Runner") {
        // Running perspective walls
        ctx.strokeStyle = colorPrimary;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height - 30);
        ctx.lineTo(width, height - 30);
        ctx.stroke();

        // Moving obstacle blocks
        const blockX = width - ((frame * 2) % (width + 60));
        ctx.fillStyle = '#ff007f';
        ctx.fillRect(blockX, height - 50, 16, 20);

        // Player micro-character jumping
        const jumpY = height - 42 - Math.max(0, Math.sin(frame * 0.08) * 28);
        ctx.fillStyle = '#39ff14';
        ctx.beginPath();
        ctx.arc(45, jumpY, 7, 0, Math.PI * 2);
        ctx.fill();

        // Hoverboard trail
        ctx.fillStyle = 'rgba(57,255,20,0.3)';
        ctx.fillRect(30, jumpY + 7, 30, 2);
      }

      // ============ 3. BOARD / STRATEGY SCENE ============
      else if (game.category === "Board & Strategy") {
        // Glowing chessboard grid
        ctx.strokeStyle = 'rgba(157, 78, 221, 0.1)';
        ctx.lineWidth = 1;
        const gridSize = 16;
        for (let x = 0; x < width; x += gridSize) {
          for (let y = 0; y < height; y += gridSize) {
            ctx.strokeRect(x, y, gridSize, gridSize);
          }
        }

        // Micro-chess figures pulsing
        const centerCellX = width / 2;
        const centerCellY = height / 2;

        ctx.fillStyle = colorPrimary;
        ctx.beginPath();
        // crown shape
        ctx.moveTo(centerCellX - 12, centerCellY + 8);
        ctx.lineTo(centerCellX - 12, centerCellY - 4);
        ctx.lineTo(centerCellX - 6, centerCellY + 2);
        ctx.lineTo(centerCellX, centerCellY - 10);
        ctx.lineTo(centerCellX + 6, centerCellY + 2);
        ctx.lineTo(centerCellX + 12, centerCellY - 4);
        ctx.lineTo(centerCellX + 12, centerCellY + 8);
        ctx.closePath();
        ctx.fill();
      }

      // ============ 4. TYPING / WORD SCENE ============
      else if (game.category === "Typing & Word") {
        // Laser cannon base
        ctx.fillStyle = '#11082b';
        ctx.strokeStyle = colorPrimary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, height - 10, 18, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // Laser turret pointing at falling meteor
        const targetX = width / 2 + Math.sin(frame * 0.05) * 50;
        const targetY = 22;
        const angle = Math.atan2(targetY - (height - 10), targetX - (width / 2));
        
        ctx.save();
        ctx.translate(width / 2, height - 10);
        ctx.rotate(angle);
        ctx.fillStyle = colorPrimary;
        ctx.fillRect(0, -3, 20, 6);
        ctx.restore();

        // Laser beam shooting at intervals
        if (frame % 45 < 8) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(width / 2, height - 10);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();
        }

        // Falling meteor
        ctx.fillStyle = colorSecondary;
        ctx.beginPath();
        ctx.arc(targetX, targetY, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // ============ 5. SPORTS / ARCADE SCENE ============
      else {
        // Ping pong paddle bouncing ball
        const paddleY = height / 2 - 12 + Math.sin(frame * 0.08) * 15;
        ctx.fillStyle = colorPrimary;
        ctx.fillRect(15, paddleY, 5, 24);

        // Bouncing ball physics animation
        const bx = 30 + Math.abs(Math.sin(frame * 0.035)) * (width - 60);
        const by = height / 2 + Math.cos(frame * 0.06) * 20;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fill();
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
      style={{ opacity: 0.8 }}
    />
  );
}
