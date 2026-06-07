// Chess.jsx - Cyber Chess Royale (Local PVP / AI Mode)
import React, { useState, useEffect } from 'react';
import SoundManager from '../components/SoundManager';
import { Play, RotateCcw, Award, Shield, Cpu, User } from 'lucide-react';

const INITIAL_BOARD = [
  ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
  ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
  ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
];

const PIECE_SYMBOLS = {
  br: '♜', bn: '♞', bb: '♝', bq: '♛', bk: '♚', bp: '♟',
  wr: '♖', wn: '♘', wb: '♗', wq: '♕', wk: '♔', wp: '♙'
};

const PIECE_NAMES = {
  r: 'Rook', n: 'Knight', b: 'Bishop', q: 'Queen', k: 'King', p: 'Pawn'
};

// Helper defined outside component to satisfy React purity check rules
const getRandomItem = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export default function Chess({ onComplete, onQuit }) {
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [selected, setSelected] = useState(null); // { r, c }
  const [validMoves, setValidMoves] = useState([]); // [{ r, c }]
  const [turn, setTurn] = useState('w'); // 'w' = white, 'b' = black
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState('ai'); // 'ai' or 'pvp'
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Your turn! Command your holo-army.");
  const [isShaking, setIsShaking] = useState(false);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };


  const handleStartGame = (mode) => {
    SoundManager.playClick();
    setBoard(INITIAL_BOARD);
    setSelected(null);
    setValidMoves([]);
    setTurn('w');
    setGameMode(mode);
    setGameOver(false);
    setWinner(null);
    setStatusMessage(mode === 'ai' ? "Your turn! Defeat the Cyber CPU." : "White's turn. Duel your companion!");
    setIsPlaying(true);
    setIsShaking(false);

  };

  // Check if a cell is inside board bounds
  const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  // Simple moves calculations (non-comprehensive checkmate checks, but validates block paths and basic movement rules)
  const calculateMoves = (r, c, currentBoard) => {
    const piece = currentBoard[r][c];
    if (!piece) return [];
    const color = piece[0];
    const type = piece[1];
    const moves = [];

    const addMove = (nr, nc) => {
      if (!inBounds(nr, nc)) return false;
      const target = currentBoard[nr][nc];
      if (!target) {
        moves.push({ r: nr, c: nc });
        return true; // continue checking direction
      } else if (target[0] !== color) {
        moves.push({ r: nr, c: nc });
        return false; // enemy blocked, stop checking direction
      }
      return false; // friend blocked, stop checking direction
    };

    if (type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      // Normal single step forward
      if (inBounds(r + dir, c) && !currentBoard[r + dir][c]) {
        moves.push({ r: r + dir, c });
        // Double step forward from starting rank
        const startRank = color === 'w' ? 6 : 1;
        if (r === startRank && !currentBoard[r + dir * 2][c]) {
          moves.push({ r: r + dir * 2, c });
        }
      }
      // Diagonal captures
      [-1, 1].forEach((dc) => {
        if (inBounds(r + dir, c + dc)) {
          const target = currentBoard[r + dir][c + dc];
          if (target && target[0] !== color) {
            moves.push({ r: r + dir, c: c + dc });
          }
        }
      });
    }

    if (type === 'r' || type === 'q') {
      // Straight lines directions
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      dirs.forEach(([dr, dc]) => {
        let step = 1;
        while (addMove(r + dr * step, c + dc * step)) {
          step++;
        }
      });
    }

    if (type === 'b' || type === 'q') {
      // Diagonals
      const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      dirs.forEach(([dr, dc]) => {
        let step = 1;
        while (addMove(r + dr * step, c + dc * step)) {
          step++;
        }
      });
    }

    if (type === 'n') {
      const jumps = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      jumps.forEach(([dr, dc]) => {
        addMove(r + dr, c + dc);
      });
    }

    if (type === 'k') {
      const dirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];
      dirs.forEach(([dr, dc]) => {
        addMove(r + dr, c + dc);
      });
    }

    return moves;
  };

  // Perform a move
  const makeMove = (fromR, fromC, toR, toC) => {
    const updatedBoard = board.map(row => [...row]);
    const piece = updatedBoard[fromR][fromC];
    const targetPiece = updatedBoard[toR][toC];

    updatedBoard[toR][toC] = piece;
    updatedBoard[fromR][fromC] = null;

    if (targetPiece) {
      SoundManager.playExplosion();
      triggerShake();
    } else {
      SoundManager.playClick();
    }


    // Check if King was captured
    if (targetPiece && targetPiece[1] === 'k') {
      setWinner(piece[0]);
      setGameOver(true);
      onComplete(200); // Trigger reward!
      return;
    }

    setBoard(updatedBoard);
    setSelected(null);
    setValidMoves([]);

    const nextTurn = turn === 'w' ? 'b' : 'w';
    setTurn(nextTurn);

    if (gameMode === 'ai' && nextTurn === 'b') {
      setStatusMessage("CPU is thinking...");
      setTimeout(() => triggerAiMove(updatedBoard), 750);
    } else {
      setStatusMessage(nextTurn === 'w' ? "White's turn." : "Black's turn.");
    }
  };

  // Basic bot move generator
  const triggerAiMove = (currentBoard) => {
    // Find all black pieces and their moves
    const allMoves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (currentBoard[r][c] && currentBoard[r][c][0] === 'b') {
          const moves = calculateMoves(r, c, currentBoard);
          moves.forEach(m => {
            allMoves.push({ from: { r, c }, to: m, target: currentBoard[m.r][m.c] });
          });
        }
      }
    }

    if (allMoves.length === 0) {
      setWinner('w');
      setGameOver(true);
      onComplete(200);
      return;
    }

    // Heuristic: Prefer captures, especially King captures, else pick random
    const captures = allMoves.filter(m => m.target !== null);
    const kingCaptures = captures.filter(m => m.target[1] === 'k');
    
    let chosenMove;
    if (kingCaptures.length > 0) {
      chosenMove = kingCaptures[0];
    } else if (captures.length > 0) {
      // Pick random capture
      chosenMove = getRandomItem(captures);
    } else {
      chosenMove = getRandomItem(allMoves);
    }

    const updatedBoard = currentBoard.map(row => [...row]);
    const piece = updatedBoard[chosenMove.from.r][chosenMove.from.c];
    const targetPiece = updatedBoard[chosenMove.to.r][chosenMove.to.c];

    updatedBoard[chosenMove.to.r][chosenMove.to.c] = piece;
    updatedBoard[chosenMove.from.r][chosenMove.from.c] = null;

    if (targetPiece) {
      SoundManager.playExplosion();
      triggerShake();
    } else {
      SoundManager.playLaser(); // bot sound
    }


    if (targetPiece && targetPiece[1] === 'k') {
      setWinner('b');
      setGameOver(true);
      return;
    }

    setBoard(updatedBoard);
    setTurn('w');
    setStatusMessage("Your turn! Command your holo-army.");
  };

  const handleCellClick = (r, c) => {
    if (gameOver || !isPlaying) return;
    if (gameMode === 'ai' && turn === 'b') return; // wait for computer

    const cellPiece = board[r][c];
    
    // Select piece
    if (cellPiece && cellPiece[0] === turn) {
      SoundManager.playClick();
      setSelected({ r, c });
      setValidMoves(calculateMoves(r, c, board));
    } else if (selected) {
      // Check if click cell is a valid move destination
      const isValid = validMoves.some(m => m.r === r && m.c === c);
      if (isValid) {
        makeMove(selected.r, selected.c, r, c);
      } else {
        setSelected(null);
        setValidMoves([]);
      }
    }
  };

  return (
    <div className={`absolute inset-0 flex flex-col bg-[#070314] overflow-hidden select-none font-display ${isShaking ? 'screen-shake' : ''}`}>

      {/* Game Header Bar */}
      <div className="bg-slate-950 px-5 py-3 border-b border-white/10 flex justify-between items-center text-xs">
        <div className="flex items-center gap-3 text-cyan-400">
          {gameMode === 'ai' ? (
            <span className="flex items-center gap-1"><Cpu className="w-4 h-4 text-cyan-400" /> HUMAN VS CYBER AI</span>
          ) : (
            <span className="flex items-center gap-1"><User className="w-4 h-4 text-pink-400" /> LOCAL PVP CO-OP</span>
          )}
        </div>
        <div className="text-yellow-400 font-extrabold uppercase tracking-widest">{statusMessage}</div>
      </div>

      {/* Main Board Arena */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {!isPlaying ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-8 text-center z-10">
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-600 tracking-wider mb-2 uppercase">CHESS ROYALE</h3>
            <p className="text-gray-400 text-xs max-w-sm mb-6">Play standard Chess on a glowing digital board. Defeat the enemy king to earn coin and experience rewards!</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleStartGame('ai')}
                className="px-6 py-2.5 rounded-lg bg-cyan-500 text-black font-extrabold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Cpu className="w-4 h-4" /> PLAY CYBER CPU
              </button>
              <button
                onClick={() => handleStartGame('pvp')}
                className="px-6 py-2.5 rounded-lg bg-pink-500 text-white font-extrabold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <User className="w-4 h-4" /> LOCAL DOCK DUEL
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[420px] aspect-square bg-black border-4 border-violet-500/30 rounded-xl overflow-hidden shadow-[0_0_35px_rgba(157,78,221,0.2)] p-2">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full bg-[#12082b]">
              {board.map((row, r) => 
                row.map((piece, c) => {
                  const isDark = (r + c) % 2 === 1;
                  const isSelected = selected && selected.r === r && selected.c === c;
                  const isValidDest = validMoves.some(m => m.r === r && m.c === c);

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative flex items-center justify-center cursor-pointer border transition-all duration-200 ${
                        isDark ? 'bg-black/40' : 'bg-transparent'
                      } ${
                        isSelected 
                          ? 'border-cyan-400 bg-cyan-500/10 shadow-[inset_0_0_10px_rgba(0,240,255,0.3)]' 
                          : 'border-white/5 hover:border-violet-400/40'
                      }`}
                    >
                      {/* Piece Icon */}
                      {piece && (
                        <span className={`text-3xl font-normal select-none ${
                          piece[0] === 'w' 
                            ? 'text-cyan-400 filter drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]' 
                            : 'text-pink-500 filter drop-shadow-[0_0_8px_rgba(255,0,127,0.7)]'
                        }`}>
                          {PIECE_SYMBOLS[piece]}
                        </span>
                      )}

                      {/* Move helper dot */}
                      {isValidDest && (
                        <div className="absolute w-3.5 h-3.5 rounded-full bg-green-400/50 border border-green-400 shadow-[0_0_8px_rgba(57,255,20,0.5)] animate-pulse"></div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Game Over screen */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-20">
            <Award className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
            <h3 className="text-3xl font-black text-white tracking-wider mb-2 uppercase">CHECKMATE</h3>
            <p className="text-gray-400 text-sm mb-4">
              {winner === 'w' ? 'Congratulations! White captured the enemy king.' : 'Defeat! Black holo-army captured your king.'}
            </p>
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6">
              <p className="text-xs text-gray-400">WINNER: <span className="text-yellow-400 font-extrabold text-lg uppercase">{winner === 'w' ? 'White' : 'Black'}</span></p>
              <p className="text-xs text-gray-400">XP REWARD: <span className="text-amber-500 font-extrabold">⭐+160 XP</span></p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={onQuit}
                className="px-5 py-2 rounded-lg border border-white/10 text-gray-300 text-xs font-bold uppercase transition-all"
              >
                Quit Cabin
              </button>
              <button
                onClick={() => handleStartGame(gameMode)}
                className="px-5 py-2 rounded-lg bg-pink-500 text-white text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" /> Rematch
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rules Footer */}
      <div className="bg-slate-950 p-2.5 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-widest px-6">
        <span>Click piece to see valid holo-moves</span>
        <span>Local PVP mode can be played with two players</span>
      </div>
    </div>
  );
}
